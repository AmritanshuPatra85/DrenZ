import { NextResponse } from "next/server"
import { z } from "zod"

import { createClient } from "@/lib/supabase/server"

const createDisputeSchema = z.object({
  category: z.enum([
    "Wrong item",
    "Not as described",
    "Item damaged",
    "No show",
  ]),
  description: z.string().trim().min(10).max(600),
  evidence: z.array(z.string()).max(4).default([]),
})

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = createDisputeSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { data: transaction, error: transactionError } = await supabase
    .from("transactions")
    .select("id, buyer_id, seller_id")
    .eq("id", params.id)
    .maybeSingle()

  if (transactionError || !transaction) {
    return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
  }

  const isParticipant =
    transaction.buyer_id === user.id || transaction.seller_id === user.id
  if (!isParticipant) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { data: existingDispute } = await supabase
    .from("disputes")
    .select("id")
    .eq("transaction_id", transaction.id)
    .limit(1)
    .maybeSingle()

  if (existingDispute?.id) {
    return NextResponse.json(
      { error: "A dispute already exists for this transaction" },
      { status: 409 }
    )
  }

  const composedReason = `${parsed.data.category}: ${parsed.data.description}`

  const { data: dispute, error: disputeError } = await supabase
    .from("disputes")
    .insert({
      transaction_id: transaction.id,
      raised_by: user.id,
      reason: composedReason,
      status: "under_review",
      evidence_urls: parsed.data.evidence,
      resolution_note: null,
    })
    .select("id, status, reason, evidence_urls, created_at, resolution_note")
    .single()

  if (disputeError || !dispute) {
    return NextResponse.json(
      { error: "Failed to file dispute" },
      { status: 500 }
    )
  }

  await supabase
    .from("transactions")
    .update({ status: "disputed" })
    .eq("id", transaction.id)

  return NextResponse.json({
    success: true,
    dispute: {
      id: dispute.id,
      status: dispute.status,
      category: parsed.data.category,
      description: parsed.data.description,
      evidence: dispute.evidence_urls ?? [],
      createdAt: dispute.created_at,
      resolutionNote: dispute.resolution_note,
    },
  })
}
