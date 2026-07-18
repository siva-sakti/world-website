// Creates the single owner account (SPEC §9 auth, D-002). Idempotent.
// Run once after `supabase start`:  node scripts/create-owner.mjs
// Reads .env.local — no dotenv dependency, just a tiny loader.

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

function loadEnv(path) {
  try {
    for (const line of readFileSync(path, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
    }
  } catch {
    // no .env.local — rely on the ambient environment
  }
}
loadEnv(new URL("../.env.local", import.meta.url));

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.OWNER_EMAIL;
const password = process.env.OWNER_PASSWORD;

if (!url || !key || !email || !password) {
  console.error(
    "Missing env. Need NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OWNER_EMAIL, OWNER_PASSWORD.",
  );
  process.exit(1);
}

const admin = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data, error } = await admin.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
});

if (error) {
  if (String(error.message).toLowerCase().includes("already")) {
    console.log(`Owner ${email} already exists — nothing to do.`);
    process.exit(0);
  }
  console.error("Failed to create owner:", error.message);
  process.exit(1);
}

console.log("Owner created:", data.user?.email);
