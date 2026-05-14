import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { action } = await request.json();

  if (!["initiate", "confirm"].includes(action)) {
    return NextResponse.json({ error: "invalid_action" }, { status: 400 });
  }

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Get transaction
  const { data: transaction, error } = await supabase
    .from("transactions")
    .select("id, status, buyer_id, seller_id, listing_id, cancel_initiated_by")
    .eq("id", params.id)
    .single();

  if (error || !transaction) {
    return NextResponse.json({ error: "transaction_not_found" }, { status: 404 });
  }

  const isParty =
    user.id === transaction.buyer_id || user.id === transaction.seller_id;

  if (!isParty) {
    return NextResponse.json({ error: "not_authorized" }, { status: 403 });
  }

  if (transaction.status === "completed") {
    return NextResponse.json({ error: "already_completed" }, { status: 400 });
  }

  if (action === "initiate") {
    // First party requests cancel
    await supabase
      .from("transactions")
      .update({
        status: "cancel_requested",
        cancel_initiated_by: user.id,
      })
      .eq("id", params.id);

    // Broadcast to other party
    await supabase.channel(`transaction:${params.id}`).send({
      type: "broadcast",
      event: "transaction_update",
      payload: { type: "mutual_cancel", initiator_id: user.id },
    });

    return NextResponse.json({ success: true, status: "cancel_requested" });
  }

  if (action === "confirm") {
    // Second party confirms — must not be the initiator
    if (transaction.cancel_initiated_by === user.id) {
      return NextResponse.json(
        { error: "cannot_confirm_own_cancel" },
        { status: 400 }
      );
    }

    // Cancel transaction + reset listing
    await supabase
      .from("transactions")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
      .eq("id", params.id);

    await supabase
      .from("listings")
      .update({ status: "active" })
      .eq("id", transaction.listing_id);

    // Broadcast confirmed
    await supabase.channel(`transaction:${params.id}`).send({
      type: "broadcast",
      event: "transaction_update",
      payload: { type: "cancel_confirmed" },
    });

    return NextResponse.json({ success: true, status: "cancelled" });
  }
}