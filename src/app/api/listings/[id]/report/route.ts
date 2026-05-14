import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const ReportSchema = z.object({
  reason:      z.enum(["fake_item", "wrong_price", "spam", "inappropriate", "scam", "other"]),
  description: z.string().max(300).optional(),
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
  const parsed = ReportSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Check listing exists
  const { data: listing } = await supabase
    .from("listings")
    .select("id, seller_id")
    .eq("id", params.id)
    .single();

  if (!listing) {
    return NextResponse.json({ error: "listing_not_found" }, { status: 404 });
  }

  // Can't report your own listing
  if (listing.seller_id === user.id) {
    return NextResponse.json({ error: "cannot_report_own_listing" }, { status: 400 });
  }

  // Check already reported
  const { data: existing } = await supabase
    .from("reports")
    .select("id")
    .eq("reporter_id", user.id)
    .eq("target_type", "listing")
    .eq("target_id", params.id)
    .single();

  if (existing) {
    return NextResponse.json({ error: "already_reported" }, { status: 409 });
  }

  const { data: report, error } = await supabase
    .from("reports")
    .insert({
      reporter_id:  user.id,
      target_type:  "listing",
      target_id:    params.id,
      reason:       parsed.data.reason,
      description:  parsed.data.description ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "insert_failed" }, { status: 500 });
  }

  // Auto-flag listing if 3+ reports
  const { count } = await supabase
    .from("reports")
    .select("id", { count: "exact" })
    .eq("target_type", "listing")
    .eq("target_id", params.id);

  if (count && count >= 3) {
    await supabase
      .from("listings")
      .update({ is_flagged: true })
      .eq("id", params.id);
  }

  return NextResponse.json({ success: true, report_id: report.id });
}