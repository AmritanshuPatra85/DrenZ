import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const ALLOWED_DOMAINS = ["kiit.ac.in"];
const ADMIN_EMAILS = ["amritanshupatra01@gmail.com", "rsrs5012@gmail.com"];

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`);
  }

  const response = NextResponse.redirect(`${origin}/home`);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  const email = data.user.email ?? "";
  const domain = email.split("@")[1];
  const isAdmin = ADMIN_EMAILS.includes(email);

  if (!isAdmin && !ALLOWED_DOMAINS.includes(domain)) {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/login?error=invalid_domain`);
  }

  // Admin goes straight to admin page
  if (isAdmin) {
    const r = NextResponse.redirect(`${origin}/admin`);
    response.cookies.getAll().forEach(({ name, value }) => {
      r.cookies.set(name, value);
    });
    return r;
  }

  // Regular user — check onboarding status
  const { data: existingUser } = await supabase
    .from("users")
    .select("id, alias")
    .eq("id", data.user.id)
    .single();

  if (!existingUser || !existingUser.alias) {
    const r = NextResponse.redirect(`${origin}/onboarding/alias`);
    response.cookies.getAll().forEach(({ name, value }) => {
      r.cookies.set(name, value);
    });
    return r;
  }

  return response;
}