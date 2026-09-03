import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { signedUrls } from "@/lib/storage";
import { pagedRows } from "@/lib/db/paged";
import { EXPORTED_TABLES } from "@/lib/db/exported-tables";

export const dynamic = "force-dynamic";

// Export everything you own (I-G1, the "I own all of it" floor). Every stored
// record kind as JSON, plus a signed URL per stored file so the images can be
// pulled too. RLS scopes it to the owner. (A single zip that bundles the image
// bytes is the next refinement; this already lets you download all your data.)
// The table list lives in lib/db/exported-tables.ts, where a test can import it:
// `exported-tables.test.mjs` reads the migration directory and asserts set-equality,
// because the comment that used to guard this list failed four times (source,
// reference, and `opening`). Add a table to the schema and the suite goes red.

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // PAGED per table (review H2): PostgREST caps a bare select at 1000 rows and
  // truncates SILENTLY — "your complete data" must actually be complete. .order("id")
  // gives the pagination a stable spine (unordered pages can repeat/drop rows).
  const tables: Record<string, Record<string, unknown>[]> = {};
  try {
    for (const t of EXPORTED_TABLES) {
      tables[t] = await pagedRows<Record<string, unknown>>((from, to) =>
        supabase.from(t).select("*").order("id").range(from, to),
      );
    }
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "export read failed" }, { status: 500 });
  }

  // A signed URL per stored file — AND per captured card image (a link bit's
  // thumb_path is captured-once truth, not refetchable; review M6). Batched
  // signing (createSignedUrls) — the per-file loop was thousands of round-trips.
  const wanted: { path: string; bit_id: string }[] = [];
  for (const b of tables.bit ?? []) {
    const storagePath = b.storage_path as string | null;
    const thumbPath = b.thumb_path as string | null;
    if (storagePath) wanted.push({ path: storagePath, bit_id: b.id as string });
    if (!storagePath && thumbPath) wanted.push({ path: thumbPath, bit_id: b.id as string });
  }
  const urlByPath = await signedUrls(supabase, wanted.map((w) => w.path));
  const files = wanted.map((w) => ({ ...w, url: urlByPath.get(w.path) ?? null }));

  const payload = {
    exportedAt: new Date().toISOString(),
    owner: user.email,
    note: "Your complete data. `files` holds signed download links (valid ~1 hour) for your stored files — images, recordings, PDFs, and link-card images.",
    tables,
    files,
  };

  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="world-export-${stamp}.json"`,
    },
  });
}
