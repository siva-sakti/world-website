import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the auth session on every request and guards the app.
 * v1: everything is private, so every route except /login and /auth requires the
 * owner to be signed in. Public-filtered viewing arrives with the privacy tiers.
 */
export async function updateSession(request: NextRequest) {
  const path = request.nextUrl.pathname;
  // v1 is a private notebook: everything requires the owner to be signed in.
  // Only the sign-in flow is public. (The localStorage prototype at /compose is
  // gone — the real compose is /board/[id], behind this wall.)
  if (path === "/login" || path.startsWith("/auth") || path.startsWith("/vendor/")) {
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
