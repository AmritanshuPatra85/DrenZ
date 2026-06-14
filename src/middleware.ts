import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const ADMIN_EMAILS = ["amritanshupatra01@gmail.com", "rsrs5012@gmail.com"];

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

  if (!user) {
    if (isProtected || isOnboarding) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return supabaseResponse;
  }

  if (ADMIN_EMAILS.includes(user.email ?? "")) {
    if (isOnboarding) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return supabaseResponse;
  }

  const { data: profile } = await supabase
    .from("users")
    .select("phone, alias")
    .eq("id", user.id)
    .single();

  const { data: userRecord } = await supabase
    .from("users")
    .select("is_banned")
    .eq("id", user.id)
    .single();

  if (userRecord?.is_banned) {
    await supabase.auth.signOut();
    const redirectResponse = NextResponse.redirect(
      new URL("/login?error=banned", request.url)
    );
    supabaseResponse.cookies.getAll().forEach(({ name, value, ...options }) => {
      redirectResponse.cookies.set(name, value, options);
    });
    return redirectResponse;
  }

  const onboardingAlias = pathname.startsWith("/onboarding/alias") || pathname.startsWith("/alias-picker");

  if (!profile?.alias && !onboardingAlias) {
    return NextResponse.redirect(new URL("/onboarding/alias", request.url));
  }

  if (profile?.alias && isOnboarding) {
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