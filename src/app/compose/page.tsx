import { ComposeBoard } from "./compose-board";

export const metadata = { title: "compose" };

// Prototype compose surface — client-side + localStorage, no Supabase (so it
// runs with just `pnpm dev`, no cloud). Reachable without auth (see proxy).
export default function ComposePage() {
  return <ComposeBoard />;
}
