import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const ALLOWED_DOMAINS = ["kiit.ac.in"];

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

  if (!ALLOWED_DOMAINS.includes(domain)) {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/login?error=invalid_domain`);
  }

  const { data: existingUser } = await supabase
    .from("users")
    .select("id, phone, alias")
    .eq("id", data.user.id)
    .single();

  if (!existingUser || !existingUser.phone) {
    const r = NextResponse.redirect(`${origin}/verify-whatsapp`);
    cookiesToSet(response, r);
    return r;
  }

  if (!existingUser.alias) {
    const r = NextResponse.redirect(`${origin}/onboarding`);
    cookiesToSet(response, r);
    return r;
  }

  return response;
}

function cookiesToSet(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach(({ name, value }) => {
    to.cookies.set(name, value);
  });
}