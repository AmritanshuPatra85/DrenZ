import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { code } = await request.json();

  if (!code) {
    return NextResponse.json({ error: "code_required" }, { status: 400 });
  }

  // Get transaction
  const { data: transaction, error } = await supabase
    .from("transactions")
    .select("id, status, handoff_code_hash, code_attempts, buyer_id, seller_id, listing_id")
    .eq("id", params.id)
    .single();

  if (error || !transaction) {
    return NextResponse.json({ error: "transaction_not_found" }, { status: 404 });
  }

  if (transaction.status === "completed") {
    return NextResponse.json({ error: "already_completed" }, { status: 400 });
  }

  if (transaction.code_attempts >= 5) {
    return NextResponse.json({ error: "locked_out" }, { status: 403 });
  }

  // Compare code
  const valid = await bcrypt.compare(code, transaction.handoff_code_hash);

  if (!valid) {
    await supabase
      .from("transactions")
      .update({ code_attempts: transaction.code_attempts + 1 })
      .eq("id", params.id);

    const attempts_remaining = 4 - transaction.code_attempts;

    if (attempts_remaining <= 0) {
      return NextResponse.json({ error: "locked_out" }, { status: 403 });
    }

    return NextResponse.json(
      { error: "invalid_code", attempts_remaining },
      { status: 400 }
    );
  }

  // Code correct — complete transaction
  const { data: completed } = await supabase
    .from("transactions")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", params.id)
    .select()
    .single();

  // Mark listing as sold
  await supabase
    .from("listings")
    .update({ status: "sold" })
    .eq("id", transaction.listing_id);

  // Fetch listing title
  const { data: listing } = await supabase
    .from("listings")
    .select("title")
    .eq("id", transaction.listing_id)
    .single();

  // Fetch transaction amount
  const { data: txnDetails } = await supabase
    .from("transactions")
    .select("amount")
    .eq("id", params.id)
    .single();

  const listingTitle = listing?.title ?? "your item";
  const amount = txnDetails?.amount ? `₹${txnDetails.amount / 100}` : "your payment";

  // Notify buyer
  await supabase.from("notifications").insert({
    user_id: transaction.buyer_id,
    type: "handoff_complete",
    title: "Handoff Complete!",
    body: `You've successfully received "${listingTitle}". Enjoy your purchase!`,
    data: { transaction_id: params.id },
  });

  // Notify seller — ask them to send UPI QR
  await supabase.from("notifications").insert({
    user_id: transaction.seller_id,
    type: "payout_pending",
    title: "Sale Complete — Claim Your Payment!",
    body: `"${listingTitle}" has been handed off. Send your UPI QR to +91 6372806696 on WhatsApp to receive ${amount}.`,
    data: { transaction_id: params.id },
  });

  // Broadcast via Realtime
  await supabase.channel(`transaction:${params.id}`).send({
    type: "broadcast",
    event: "transaction_update",
    payload: { type: "code_validated" },
  });

  return NextResponse.json({ success: true, transaction: completed });
}