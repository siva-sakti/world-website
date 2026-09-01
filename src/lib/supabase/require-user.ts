import type { SupabaseClient } from "@supabase/supabase-js";

// In-action auth (security review #1): server actions are POST endpoints, and the
// middleware redirect is their ONLY wall today — middleware-bypass has real precedent,
// and the first public/guest route would silently open every action in its tree.
// Every mutating/fetching action calls this first (login/logout excluded — they must
// run unauthenticated). Honest cost: getUser() is a network call to the Auth server
// (~doubles the per-request auth spend — acceptable single-owner; getClaims() is the
// cheap local-verification upgrade when it matters).
export async function requireUser(supabase: SupabaseClient): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("not signed in");
}
