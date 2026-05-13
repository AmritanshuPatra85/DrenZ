import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const ALLOWED_DOMAINS = ["kiit.ac.in"];

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`);
  }

  const supabase = createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  const email = data.user.email ?? "";
  const domain = email.split("@")[1];

  if (!ALLOWED_DOMAINS.includes(domain)) {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/login?error=invalid_domain`);
  }

  const { data: existingUser } = await supabase
    .from("users")
    .select("id, alias")
    .eq("id", data.user.id)
    .single();

  if (!existingUser) {
    return NextResponse.redirect(`${origin}/onboarding/whatsapp`);
  }

  if (!existingUser.alias) {
    return NextResponse.redirect(`${origin}/onboarding/alias`);
  }

  return NextResponse.redirect(`${origin}/home`);
}