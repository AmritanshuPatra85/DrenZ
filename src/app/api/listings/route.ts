import { NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { createListingSchema } from "@/lib/validations";

const createListingBodySchema = createListingSchema
  .omit({ college: true })
  .extend({
    price: z.coerce.number(),
    images: z.array(z.string().url()).min(1).max(4),
  });

export async function POST(request: Request) {
  const supabase = createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createListingBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const now = new Date();
  const startOfUtcDay = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0)
  );

  const { count: todaysCount, error: countError } = await supabase
    .from("listings")
    .select("id", { count: "exact", head: true })
    .eq("seller_id", user.id)
    .gte("created_at", startOfUtcDay.toISOString());

  if (countError) {
    return NextResponse.json(
      { error: "Failed to check rate limit" },
      { status: 500 }
    );
  }

  if ((todaysCount ?? 0) >= 5) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      { status: 429 }
    );
  }

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("college")
    .eq("id", user.id)
    .single();

  if (profileError || !profile?.college) {
    return NextResponse.json(
      { error: "User profile missing college" },
      { status: 400 }
    );
  }

  const { title, description, price, category, condition, images } = parsed.data;

  const { data: inserted, error: insertError } = await supabase
    .from("listings")
    .insert({
      seller_id: user.id,
      title,
      description: description ?? null,
      price,
      category,
      condition,
      images,
      college: profile.college,
      status: "active",
    })
    .select("id")
    .single();

  if (insertError || !inserted?.id) {
    return NextResponse.json(
      { error: "Failed to create listing" },
      { status: 500 }
    );
  }

  return NextResponse.json({ id: inserted.id }, { status: 201 });
}

