#!/usr/bin/env node
// ============================================================================
// find-orphan-files.mjs — READ-ONLY. Lists stored files that no bit points at.
//
// WHY THIS EXISTS (owner-flagged, 2026-09-02): every upload door cleans up after
// itself if it fails, but that cleanup runs IN THE BROWSER. Close the tab, lose
// the connection, or have the phone kill the page between "file uploaded" and
// "row saved", and nothing runs — the file sits in storage with nothing pointing
// at it, forever.
//
// The complete fix is a cleanup that runs on the server. Building one before
// knowing whether orphans actually accumulate would be over-building, so this
// answers the question first:
//
//   nothing found  → the browser-side sweeps are doing their job; park the idea
//   a real pile    → build the collector, on evidence rather than on a guess
//
// IT DELETES NOTHING. It reads the storage listing and the bit table and prints
// the difference. Safe to run against the live project.
//
// Run:  node scripts/find-orphan-files.mjs
// ============================================================================
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

// .env.local, without a dependency — same trick the other scripts use.
for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)\s*=\s*"?(.*?)"?\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false } });

const BUCKET = "private";
const FOLDERS = ["images", "thumbs", "audio", "pdfs"];

/** Every object in one folder, paged (the API caps a listing at 100). */
async function listFolder(folder) {
  const out = [];
  for (let offset = 0; ; offset += 100) {
    const { data, error } = await db.storage.from(BUCKET).list(folder, { limit: 100, offset });
    if (error) throw error;
    if (!data?.length) break;
    out.push(...data.map((o) => `${folder}/${o.name}`));
    if (data.length < 100) break;
  }
  return out;
}

// Every path a LIVE bit claims. Trashed and archived bits still own their files —
// they are restorable, so their objects are NOT orphans.
const { data: bits, error } = await db.from("bit").select("id, storage_path, thumb_path");
if (error) throw error;
const claimed = new Set();
for (const b of bits ?? []) {
  if (b.storage_path) claimed.add(b.storage_path);
  if (b.thumb_path) claimed.add(b.thumb_path);
}

let total = 0;
const orphans = [];
for (const folder of FOLDERS) {
  const files = await listFolder(folder);
  total += files.length;
  for (const path of files) if (!claimed.has(path)) orphans.push(path);
}

console.log(`\nStored files: ${total}`);
console.log(`Claimed by a bit: ${claimed.size}`);
console.log(`ORPHANS (no bit points at them): ${orphans.length}\n`);

if (!orphans.length) {
  console.log("Nothing orphaned. The browser-side cleanup has been doing its job —");
  console.log("no server-side collector needed on this evidence.\n");
} else {
  for (const p of orphans.slice(0, 40)) console.log("  " + p);
  if (orphans.length > 40) console.log(`  … and ${orphans.length - 40} more`);
  console.log("\nNothing was deleted. If this list is real and growing, that is the");
  console.log("evidence for building a server-side collector.\n");
}
