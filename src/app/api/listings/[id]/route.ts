import { NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { createListingSchema } from "@/lib/validations";

const patchListingBodySchema = createListingSchema
  .omit({ college: true })
  .extend({
    price: z.coerce.number(),
    images: z.array(z.string().url()).min(1).max(4),
  })
  .partial()
  .refine((val) => Object.keys(val).length > 0, {
    message: "At least one field is required",
  });

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: listing, error: listingError } = await supabase
    .from("listings")
    .select("*")
    .eq("id", params.id)
    .single();

  if (listingError || !listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  if (listing.seller_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (listing.status !== "active") {
    return NextResponse.json(
      { error: "Listing is not active" },
      { status: 409 }
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = patchListingBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const updates = parsed.data;

  const { data: updated, error: updateError } = await supabase
    .from("listings")
    .update({
      title: updates.title,
      description: updates.description ?? undefined,
      price: updates.price,
      category: updates.category,
      condition: updates.condition,
      images: updates.images,
    })
    .eq("id", params.id)
    .select("*")
    .single();

  if (updateError || !updated) {
    return NextResponse.json(
      { error: "Failed to update listing" },
      { status: 500 }
    );
  }

  return NextResponse.json(updated);
}

