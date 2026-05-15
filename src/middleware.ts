import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  const isProtected = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isOnboarding = pathname.startsWith("/onboarding");

  // Not logged in — redirect to login
  if (!user) {
    if (isProtected || isOnboarding) {
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

  // No profile or no phone — send to whatsapp verification
  if (
    (!profile || !profile.phone) &&
    !pathname.startsWith("/onboarding/whatsapp")
  ) {
    return NextResponse.redirect(
      new URL("/onboarding/whatsapp", request.url)
    );
  }

  // Has phone but no alias — send to alias picker
  if (
    profile &&
    profile.phone &&
    !profile.alias &&
    !pathname.startsWith("/onboarding/alias")
  ) {
    return NextResponse.redirect(new URL("/onboarding/alias", request.url));
  }

  // Fully onboarded but trying to access onboarding — send to home
  if (profile && profile.phone && profile.alias && isOnboarding) {
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
  ],
};