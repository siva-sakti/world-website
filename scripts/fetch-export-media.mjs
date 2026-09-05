// Make the export a REAL backup (item 0, D-149): download every file the export's
// signed links point at — inside their hour. Usage:
//   node scripts/fetch-export-media.mjs <export.json> [outDir]
// Writes each file under outDir preserving its storage path; prints a manifest.
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const [jsonPath, outDir = "export-media"] = process.argv.slice(2);
if (!jsonPath) { console.error("usage: node scripts/fetch-export-media.mjs <export.json> [outDir]"); process.exit(1); }
const payload = JSON.parse(readFileSync(jsonPath, "utf8"));
const files = payload.files ?? [];
if (files.length === 0) { console.log("export lists no files — nothing to fetch."); process.exit(0); }

let ok = 0, failed = 0;
for (const f of files) {
  if (!f.url) { console.error(`✗ no url for ${f.path} (bit ${f.bit_id})`); failed++; continue; }
  try {
    const res = await fetch(f.url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const bytes = Buffer.from(await res.arrayBuffer());
    const dest = join(outDir, f.path);
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, bytes);
    ok++;
  } catch (e) {
    console.error(`✗ ${f.path}: ${e.message}`); failed++;
  }
}
console.log(`\n${ok} of ${files.length} files saved under ${outDir}/ · ${failed} failed`);
if (failed > 0) { console.error("FAILURES ABOVE — links expire ~1h after export; re-export and re-run if stale."); process.exit(1); }
