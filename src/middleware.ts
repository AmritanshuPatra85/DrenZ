import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const ADMIN_EMAIL = "amritanshupatra01@gmail.com";

const protectedRoutes = [
  "/home",
  "/search",
  "/sell",
  "/messages",
  "/profile",
  "/listing",
  "/chat",
  "/checkout",
  "/my-listings",
  "/my-purchases",
  "/dispute",
  "/meetup",
  "/pre-meetup",
  "/rating",
  "/user",
];

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

  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));
  const isOnboarding = pathname.startsWith("/onboarding");

  // Not logged in
  if (!user) {
    if (isProtected || isOnboarding) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return supabaseResponse;
  }

  // Admin bypasses all onboarding checks
  if (user.email === ADMIN_EMAIL) {
    if (isOnboarding) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return supabaseResponse;
  }

  // Fetch profile
  const { data: profile } = await supabase
    .from("users")
    .select("phone, alias")
    .eq("id", user.id)
    .single();

  const onboardingWhatsapp = pathname.startsWith("/onboarding/whatsapp") || pathname === "/verify-whatsapp";
  const onboardingAlias = pathname.startsWith("/onboarding/alias") || pathname.startsWith("/alias-picker");

  // No phone — send to whatsapp verification (but don't redirect if already there)
  if ((!profile || !profile.phone) && !onboardingWhatsapp) {
    return NextResponse.redirect(new URL("/onboarding/whatsapp", request.url));
  }

  // Has phone but no alias — send to alias picker (but don't redirect if already there)
  if (profile?.phone && !profile.alias && !onboardingAlias && !onboardingWhatsapp) {
    return NextResponse.redirect(new URL("/onboarding/alias", request.url));
  }

  // Fully onboarded but on onboarding page — send to home
  if (profile?.phone && profile?.alias && isOnboarding) {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/home/:path*",
    "/search/:path*",
    "/sell/:path*",
    "/messages/:path*",
    "/profile/:path*",
    "/listing/:path*",
    "/chat/:path*",
    "/checkout/:path*",
    "/my-listings/:path*",
    "/my-purchases/:path*",
    "/dispute/:path*",
    "/meetup/:path*",
    "/pre-meetup/:path*",
    "/rating/:path*",
    "/user/:path*",
    "/onboarding/:path*",
    "/admin/:path*",
    "/admin",
  ],
};