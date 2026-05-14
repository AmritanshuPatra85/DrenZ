import { NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"

export async function POST(
  _request: Request,
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

  const { data: transaction, error: transactionError } = await supabase
    .from("transactions")
    .select("id, buyer_id, seller_id, status")
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

  const { data: dispute, error: disputeError } = await supabase
    .from("disputes")
    .insert({
      transaction_id: transaction.id,
      raised_by: user.id,
      reason: "Issue raised during meetup",
      status: "open",
      evidence_urls: [],
    })
    .select("id, status, created_at")
    .single()

  if (disputeError || !dispute) {
    return NextResponse.json(
      { error: "Failed to raise issue" },
      { status: 500 }
    )
  }

  await supabase
    .from("transactions")
    .update({ status: "disputed" })
    .eq("id", transaction.id)

  return NextResponse.json({
    success: true,
    dispute,
    message: "Issue raised successfully.",
  })
}
