import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  // Not logged in — redirect to login
  if (!user) {
    if (pathname.startsWith("/main") || pathname.startsWith("/onboarding")) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return supabaseResponse;
  }

  // Logged in — check onboarding status
  const { data: profile } = await supabase
    .from("users")
    .select("phone, alias")
    .eq("id", user.id)
    .single();

  // No profile yet — send to whatsapp verification
  if (!profile && !pathname.startsWith("/onboarding/whatsapp")) {
    return NextResponse.redirect(new URL("/onboarding/whatsapp", request.url));
  }

  // Has profile but no phone — send to whatsapp
  if (profile && !profile.phone && !pathname.startsWith("/onboarding/whatsapp")) {
    return NextResponse.redirect(new URL("/onboarding/whatsapp", request.url));
  }

  // Has phone but no alias — send to alias picker
  if (profile && profile.phone && !profile.alias && !pathname.startsWith("/onboarding/alias")) {
    return NextResponse.redirect(new URL("/onboarding/alias", request.url));
  }

  // Fully onboarded but trying to access onboarding — send to main
  if (profile && profile.phone && profile.alias && pathname.startsWith("/onboarding")) {
    return NextResponse.redirect(new URL("/main", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/main/:path*", "/onboarding/:path*"],
};