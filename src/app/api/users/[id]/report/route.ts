import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const ReportSchema = z.object({
  reason:      z.enum(["harassment", "fake_profile", "scam", "spam", "other"]),
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

  if (user.id === params.id) {
    return NextResponse.json({ error: "cannot_report_yourself" }, { status: 400 });
  }

  const body = await request.json();
  const parsed = ReportSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Check already reported
  const { data: existing } = await supabase
    .from("reports")
    .select("id")
    .eq("reporter_id", user.id)
    .eq("target_type", "user")
    .eq("target_id", params.id)
    .single();

  if (existing) {
    return NextResponse.json({ error: "already_reported" }, { status: 409 });
  }

  const { data: report, error } = await supabase
    .from("reports")
    .insert({
      reporter_id:  user.id,
      target_type:  "user",
      target_id:    params.id,
      reason:       parsed.data.reason,
      description:  parsed.data.description ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "insert_failed" }, { status: 500 });
  }

  return NextResponse.json({ success: true, report_id: report.id });
}