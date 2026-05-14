import { NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"

export async function GET(
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
    .select(
      "id, listing_id, buyer_id, seller_id, amount, status, created_at, handoff_code, handoff_confirmed_at"
    )
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

  const { data: listing } = transaction.listing_id
    ? await supabase
        .from("listings")
        .select("id, title, images")
        .eq("id", transaction.listing_id)
        .maybeSingle()
    : { data: null }

  const participantIds = [transaction.buyer_id, transaction.seller_id].filter(
    (id): id is string => Boolean(id)
  )

  const { data: participants } = participantIds.length
    ? await supabase
        .from("users")
        .select("id, alias, student_id_url")
        .in("id", participantIds)
    : { data: null }

  const buyer = participants?.find((participant) => participant.id === transaction.buyer_id)
  const seller = participants?.find((participant) => participant.id === transaction.seller_id)

  const isBuyer = user.id === transaction.buyer_id
  const counterparty = isBuyer ? seller : buyer

  const { data: conversation } =
    transaction.listing_id && transaction.buyer_id && transaction.seller_id
      ? await supabase
          .from("conversations")
          .select("id")
          .eq("listing_id", transaction.listing_id)
          .eq("buyer_id", transaction.buyer_id)
          .eq("seller_id", transaction.seller_id)
          .maybeSingle()
      : { data: null }

  const { data: dispute } = await supabase
    .from("disputes")
    .select("id, reason, status, evidence_urls, resolution_note, created_at")
    .eq("transaction_id", transaction.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  return NextResponse.json({
    transaction: {
      id: transaction.id,
      amountPaid: Number(transaction.amount),
      status: transaction.status,
      createdAt: transaction.created_at,
      handoffConfirmedAt: transaction.handoff_confirmed_at,
      viewerRole: isBuyer ? "buyer" : "seller",
      handoffCode: isBuyer ? transaction.handoff_code ?? null : null,
      listing: {
        id: listing?.id ?? transaction.listing_id,
        title: listing?.title ?? "Listing",
        imageUrl: listing?.images?.[0] ?? null,
      },
      counterparty: {
        alias: counterparty?.alias ?? "Counterparty",
        photoUrl: counterparty?.student_id_url ?? null,
      },
      conversationId: conversation?.id ?? null,
      dispute: dispute
        ? {
            id: dispute.id,
            category: dispute.reason,
            status: dispute.status,
            evidence: dispute.evidence_urls ?? [],
            resolutionNote: dispute.resolution_note,
            createdAt: dispute.created_at,
          }
        : null,
    },
  })
}
