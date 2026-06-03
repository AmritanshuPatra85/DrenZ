import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { notify } from "@/lib/notify";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const listingId = params.id;

  // Check if already liked
  const { data: existing } = await supabase
    .from("likes")
    .select("id")
    .eq("listing_id", listingId)
    .eq("user_id", user.id)
    .single();

  if (existing) {
    // Unlike
    await supabase.from("likes").delete().eq("id", existing.id);
    await supabase.from("listings")
      .update({ likes_count: supabase.rpc("decrement", { x: 1 }) })
      .eq("id", listingId);
    return NextResponse.json({ liked: false });
  }

  // Like
  await supabase.from("likes").insert({ listing_id: listingId, user_id: user.id });
  await supabase.from("listings")
    .update({ likes_count: supabase.rpc("increment", { x: 1 }) })
    .eq("id", listingId);

  // Get listing details for notification
  const { data: listing } = await supabase
    .from("listings")
    .select("title, seller_id")
    .eq("id", listingId)
    .single();

  // Notify seller — but not if they liked their own listing
  if (listing && listing.seller_id !== user.id) {
    await notify({
      userId: listing.seller_id,
      type:   "listing_liked",
      title:  "Someone liked your listing",
      body:   `Your listing "${listing.title}" got a new like!`,
      data:   { listing_id: listingId },
    });
  }

  return NextResponse.json({ liked: true });
}