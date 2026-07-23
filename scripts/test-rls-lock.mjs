// Proves the owner-scoped RLS lock (D-094): a SECOND authenticated account can
// neither READ nor WRITE the owner's data. Creates a throwaway user via the
// service role, signs in as them, checks the wall, then deletes them.
// Run: node --env-file=.env.local scripts/test-rls-lock.mjs
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !anon || !service) {
  console.error("missing NEXT_PUBLIC_SUPABASE_URL / ANON_KEY / SERVICE_ROLE_KEY");
  process.exit(1);
}

const ok = (m) => console.log("  ✓", m);
const fail = (m) => { console.error("  ✗ FAIL:", m); process.exitCode = 1; };

const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
const email = `rls-lock-test-${Date.now()}@example.com`;
const password = "Lk-" + Math.random().toString(36).slice(2) + "!Q9";

let createdId = null;
try {
  const { data: created, error: cErr } = await admin.auth.admin.createUser({
    email, password, email_confirm: true,
  });
  if (cErr) throw cErr;
  createdId = created.user.id;
  ok(`created a 2nd account (${email})`);

  const intruder = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: sess, error: sErr } = await intruder.auth.signInWithPassword({ email, password });
  if (sErr || !sess?.session) throw sErr ?? new Error("2nd account could not sign in");
  ok("2nd account signed in (a real authenticated identity)");

  // READ: must see ZERO of the owner's rows.
  const leaked = [];
  for (const table of ["bit", "board", "tag", "placement", "tag_application"]) {
    const { data } = await intruder.from(table).select("id").limit(1);
    if ((data ?? []).length > 0) leaked.push(table);
  }
  leaked.length === 0
    ? ok("2nd account reads ZERO owner rows — viewing is locked")
    : fail("2nd account could READ owner data in: " + leaked.join(", "));

  // WRITE: an insert must be refused (WITH CHECK fails) and nothing lands.
  const { data: wrote, error: wErr } = await intruder
    .from("board").insert({ title: "intruder-should-fail" }).select("id");
  (wErr || !(wrote ?? []).length)
    ? ok("2nd account WRITE refused — editing is locked")
    : fail("2nd account inserted a board — write is NOT locked");

  await intruder.auth.signOut();
} catch (e) {
  fail("unexpected: " + (e?.message ?? String(e)));
} finally {
  if (createdId) {
    const { error } = await admin.auth.admin.deleteUser(createdId);
    error
      ? fail(`could not delete the test account ${createdId} — remove it manually`)
      : ok("test account deleted — no residue");
  }
}

console.log(process.exitCode
  ? "\nRLS LOCK TEST FAILED ✗"
  : "\nRLS LOCK TEST PASSED ✓ — a 2nd account is locked out of both reading and writing");
