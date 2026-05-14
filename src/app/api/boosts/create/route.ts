import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import Razorpay from "razorpay";

const BoostSchema = z.object({
  listing_id: z.string().uuid(),
  duration:   z.enum(["24hr", "48hr"]),
});

const BOOST_PRICES: Record<string, number> = {
  "24hr": 4900,
  "48hr": 8900,
};

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(request: Request) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = BoostSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { listing_id, duration } = parsed.data;

  // Validate listing exists, is active, owned by user
  const { data: listing, error: listingError } = await supabase
    .from("listings")
    .select("id, status, seller_id, is_flagged")
    .eq("id", listing_id)
    .single();

  if (listingError || !listing) {
    return NextResponse.json({ error: "listing_not_found" }, { status: 404 });
  }

  if (listing.seller_id !== user.id) {
    return NextResponse.json({ error: "not_owner" }, { status: 403 });
  }

  if (listing.status !== "active") {
    return NextResponse.json({ error: "listing_not_active" }, { status: 400 });
  }

  if (listing.is_flagged) {
    return NextResponse.json({ error: "listing_flagged" }, { status: 400 });
  }

  // Create Razorpay order
  const amount = BOOST_PRICES[duration];

  const order = await razorpay.orders.create({
    amount,
    currency: "INR",
    notes: { listing_id, duration, user_id: user.id },
  });

  return NextResponse.json({
    success:    true,
    order_id:   order.id,
    amount,
    currency:   "INR",
    key:        process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    listing_id,
    duration,
  });
}