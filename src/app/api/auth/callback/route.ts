import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const ALLOWED_DOMAINS = ["kiit.ac.in", "kiiit.ac.in"];

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
    return NextResponse.redirect(
      `${origin}/login?error=invalid_domain`
    );
  }

  // Check if user exists in public.users
  const { data: existingUser } = await supabase
    .from("users")
    .select("id, alias, is_verified")
    .eq("id", data.user.id)
    .single();

  // New user — redirect to onboarding
  if (!existingUser) {
    return NextResponse.redirect(`${origin}/onboarding/whatsapp`);
  }

  // Existing user but incomplete onboarding
  if (!existingUser.alias) {
    return NextResponse.redirect(`${origin}/onboarding/alias`);
  }

  // Fully onboarded
  return NextResponse.redirect(`${origin}/main`);
}