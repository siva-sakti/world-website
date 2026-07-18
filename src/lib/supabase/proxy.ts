import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the auth session on every request and guards the app.
 * v1: everything is private, so every route except /login and /auth requires the
 * owner to be signed in. Public-filtered viewing arrives with the privacy tiers.
 */
export async function updateSession(request: NextRequest) {
  const path = request.nextUrl.pathname;
  // Prototype: the compose board is the whole app for now, so the homepage goes
  // straight to it. (Later, "/" becomes the browse/feed home.)
  if (path === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/compose";
    return NextResponse.redirect(url);
  }
  // Public routes skip the auth round-trip entirely. /compose is the localStorage
  // prototype (no Supabase), so it must load without a DB running.
  if (path === "/login" || path.startsWith("/auth") || path.startsWith("/compose")) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

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
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return response;
}
