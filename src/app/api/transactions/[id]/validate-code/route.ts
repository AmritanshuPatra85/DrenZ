import { NextResponse } from "next/server"
import { z } from "zod"

import { createClient } from "@/lib/supabase/server"

const validateCodeSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^\d{4}$/, "Code must be exactly 4 digits"),
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

  const parsed = validateCodeSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { data: transaction, error: transactionError } = await supabase
    .from("transactions")
    .select("id, buyer_id, seller_id, handoff_code, status")
    .eq("id", params.id)
    .maybeSingle()

  if (transactionError || !transaction) {
    return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
  }

  if (user.id !== transaction.seller_id) {
    return NextResponse.json(
      { error: "Only the seller can validate handoff code" },
      { status: 403 }
    )
  }

  if (transaction.status === "completed") {
    return NextResponse.json({
      valid: true,
      alreadyValidated: true,
    })
  }

  if (!transaction.handoff_code) {
    return NextResponse.json(
      { error: "No handoff code found for this transaction" },
      { status: 409 }
    )
  }

  if (parsed.data.code !== transaction.handoff_code) {
    return NextResponse.json(
      { valid: false, error: "Incorrect handoff code" },
      { status: 400 }
    )
  }

  const nowIso = new Date().toISOString()
  const { data: updated, error: updateError } = await supabase
    .from("transactions")
    .update({
      status: "completed",
      handoff_confirmed_at: nowIso,
    })
    .eq("id", params.id)
    .select("id, status, handoff_confirmed_at")
    .single()

  if (updateError || !updated) {
    return NextResponse.json(
      { error: "Failed to confirm handoff" },
      { status: 500 }
    )
  }

  return NextResponse.json({
    valid: true,
    transaction: updated,
  })
}
