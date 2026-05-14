import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const DisputeSchema = z.object({
  category:    z.enum(["item_not_as_described", "seller_no_show", "buyer_no_show", "payment_issue", "other"]),
  description: z.string().min(20).max(500),
  evidence_urls: z.array(z.string().url()).max(4).default([]),
});

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = DisputeSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { category, description, evidence_urls } = parsed.data;

  // Get transaction
  const { data: transaction, error: txError } = await supabase
    .from("transactions")
    .select("id, status, buyer_id, seller_id, listing_id, payment_captured, code_confirmed")
    .eq("id", params.id)
    .single();

  if (txError || !transaction) {
    return NextResponse.json({ error: "transaction_not_found" }, { status: 404 });
  }

  // Must be buyer
  if (transaction.buyer_id !== user.id) {
    return NextResponse.json({ error: "only_buyer_can_dispute" }, { status: 403 });
  }

  // Payment must be captured
  if (!transaction.payment_captured) {
    return NextResponse.json({ error: "payment_not_captured" }, { status: 400 });
  }

  // Code must not be confirmed yet
  if (transaction.code_confirmed) {
    return NextResponse.json({ error: "handoff_already_confirmed" }, { status: 400 });
  }

  // Check no existing dispute
  const { data: existing } = await supabase
    .from("disputes")
    .select("id")
    .eq("transaction_id", params.id)
    .single();

  if (existing) {
    return NextResponse.json({ error: "dispute_already_filed" }, { status: 409 });
  }

  // Create dispute + freeze transaction
  const { data: dispute, error: disputeError } = await supabase
    .from("disputes")
    .insert({
      transaction_id: params.id,
      filed_by:       user.id,
      category,
      description,
      evidence_urls,
      status:         "open",
    })
    .select()
    .single();

  if (disputeError) {
    return NextResponse.json({ error: "insert_failed" }, { status: 500 });
  }

  // Freeze transaction
  await supabase
    .from("transactions")
    .update({ status: "disputed" })
    .eq("id", params.id);

  // Broadcast to both parties
  await supabase.channel(`transaction:${params.id}`).send({
    type:    "broadcast",
    event:   "transaction_update",
    payload: { type: "dispute_filed", by: user.id },
  });

  return NextResponse.json({ success: true, dispute_id: dispute.id });
}