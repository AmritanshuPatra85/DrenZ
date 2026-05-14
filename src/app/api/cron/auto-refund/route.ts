import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createClient();

  // Find transactions expired over 24hrs, payment captured, not completed/cancelled/disputed
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: expired } = await supabase
    .from("transactions")
    .select("id, razorpay_payment_id, listing_id, buyer_id, seller_id")
    .eq("payment_captured", true)
    .eq("status", "reserved")
    .lt("expires_at", cutoff);

  if (!expired || expired.length === 0) {
    return NextResponse.json({ processed: 0 });
  }

  let processed = 0;

  for (const tx of expired) {
    try {
      // Razorpay refund
      await razorpay.payments.refund(tx.razorpay_payment_id, {
        speed: "optimum",
        notes: { reason: "auto_refund_no_meetup", transaction_id: tx.id },
      });

      // Update transaction
      await supabase
        .from("transactions")
        .update({ status: "refunded", refunded_at: new Date().toISOString() })
        .eq("id", tx.id);

      // Reset listing
      await supabase
        .from("listings")
        .update({ status: "active" })
        .eq("id", tx.listing_id);

      // Mark seller no-show
      await supabase
        .from("users")
        .update({ no_show_count: supabase.rpc("increment_no_show", { user_id: tx.seller_id }) })
        .eq("id", tx.seller_id);

      processed++;
    } catch (err) {
      console.error(`Refund failed for transaction ${tx.id}:`, err);
    }
  }

  return NextResponse.json({ processed });
}