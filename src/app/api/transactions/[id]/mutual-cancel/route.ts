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

  if (transaction.status === "completed") {
    return NextResponse.json(
      { error: "Completed transactions cannot be cancelled" },
      { status: 409 }
    )
  }

  const { data: updated, error: updateError } = await supabase
    .from("transactions")
    .update({ status: "refunded" })
    .eq("id", params.id)
    .select("id, status")
    .single()

  if (updateError || !updated) {
    return NextResponse.json(
      { error: "Failed to cancel transaction" },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    transaction: updated,
    message: "Order cancelled successfully.",
  })
}
