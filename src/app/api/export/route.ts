import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PRIVATE_BUCKET } from "@/lib/storage";

export const dynamic = "force-dynamic";

// Export everything you own (I-G1, the "I own all of it" floor). Every stored
// record kind as JSON, plus a signed URL per stored file so the images can be
// pulled too. RLS scopes it to the owner. (A single zip that bundles the image
// bytes is the next refinement; this already lets you download all your data.)
const TABLES = [
  "board",
  "bit",
  "placement",
  "tag_application",
  "connector",
  "tag",
  "category",
  "subtype_word",
  "dormant",
] as const;

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const tables: Record<string, Record<string, unknown>[]> = {};
  for (const t of TABLES) {
    const { data, error } = await supabase.from(t).select("*");
    if (error) {
      return NextResponse.json({ error: `${t}: ${error.message}` }, { status: 500 });
    }
    tables[t] = (data ?? []) as Record<string, unknown>[];
  }

  // A signed URL per stored file (image bytes live in Storage, §7 layer B).
  const files: { path: string; bit_id: string; url: string | null }[] = [];
  for (const b of tables.bit ?? []) {
    const path = b.storage_path as string | null;
    if (!path) continue;
    let url: string | null = null;
    try {
      const { data } = await supabase.storage.from(PRIVATE_BUCKET).createSignedUrl(path, 3600);
      url = data?.signedUrl ?? null;
    } catch {
      url = null;
    }
    files.push({ path, bit_id: b.id as string, url });
  }

  const payload = {
    exportedAt: new Date().toISOString(),
    owner: user.email,
    note: "Your complete data. `files` holds signed download links (valid ~1 hour) for your images.",
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
