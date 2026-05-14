import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const ReviewSchema = z.object({
  transaction_id: z.string().uuid(),
  rating:         z.number().int().min(1).max(5),
  tags:           z.array(z.string()).max(6).default([]),
  comment:        z.string().max(140).optional(),
});

export async function POST(request: Request) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = ReviewSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { transaction_id, rating, tags, comment } = parsed.data;

  // Validate transaction exists and is completed
  const { data: transaction, error: txError } = await supabase
    .from("transactions")
    .select("id, status, buyer_id, seller_id")
    .eq("id", transaction_id)
    .single();

  if (txError || !transaction) {
    return NextResponse.json({ error: "transaction_not_found" }, { status: 404 });
  }

  if (transaction.status !== "completed") {
    return NextResponse.json(
      { error: "transaction_not_completed" },
      { status: 400 }
    );
  }

  // Must be buyer or seller
  const isParty =
    user.id === transaction.buyer_id || user.id === transaction.seller_id;

  if (!isParty) {
    return NextResponse.json({ error: "not_authorized" }, { status: 403 });
  }

  // Check already reviewed
  const { data: existing } = await supabase
    .from("reviews")
    .select("id")
    .eq("transaction_id", transaction_id)
    .eq("reviewer_id", user.id)
    .single();

  if (existing) {
    return NextResponse.json({ error: "already_reviewed" }, { status: 409 });
  }

  // Determine who is being reviewed
  const reviewee_id =
    user.id === transaction.buyer_id
      ? transaction.seller_id
      : transaction.buyer_id;

  // Insert review
  const { data: review, error: reviewError } = await supabase
    .from("reviews")
    .insert({
      transaction_id,
      reviewer_id: user.id,
      reviewee_id,
      rating,
      tags,
      comment: comment ?? null,
    })
    .select()
    .single();

  if (reviewError) {
    return NextResponse.json({ error: "insert_failed" }, { status: 500 });
  }

  return NextResponse.json({ success: true, review_id: review.id });
}