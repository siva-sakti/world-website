-- ============================================================================
-- storage-boundary-check.sql — the file boundary's probe (security review #2).
-- READ-ONLY. Paste into the Supabase SQL Editor any time (especially after ANY
-- dashboard change to Storage, and before/after accounts arrive). It asserts the
-- shape the repo believes is live; a NOTICE per check, an exception on a breach.
--
-- The storage layer can't be proven on the throwaway Postgres (no `storage`
-- schema), so this is its regression test — run by hand, deliberately.
-- ============================================================================

\set ON_ERROR_STOP on

do $$
declare n int; pub boolean;
begin
  -- ST-1 · `anon` must have NO storage policy: a logged-out visitor reaches no file.
  --   (The app's own reads go through short-lived signed URLs, which bypass policies
  --   by design — that is the intended and only public read path.)
  select count(*) into n from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and 'anon' = any (roles);
  if n > 0 then raise exception 'ST-1 BREACH: anon has % storage policy(ies)', n; end if;
  raise notice 'OK ST-1 anon has no storage policy (logged-out reaches no file)';

  -- ST-2 · the `private` bucket is NOT public (else its objects are world-readable
  --   by URL, and every image/recording/PDF/link-card in the app lives there).
  select public into pub from storage.buckets where id = 'private';
  if pub is null then raise exception 'ST-2 BREACH: the private bucket does not exist'; end if;
  if pub then raise exception 'ST-2 BREACH: the private bucket is PUBLIC'; end if;
  raise notice 'OK ST-2 the private bucket is non-public (signed URLs only)';

  -- ST-3 · the authenticated policy exists (without it the owner cannot upload).
  select count(*) into n from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'owner_all_objects';
  if n <> 1 then raise exception 'ST-3 BREACH: owner_all_objects missing or duplicated (found %)', n; end if;
  raise notice 'OK ST-3 owner_all_objects present (the owner can read/write files)';

  -- ST-4 · ACCOUNTS TRIPWIRE — this is the check that must CHANGE before a second
  --   account exists. Today's policy scopes by BUCKET only, so every authenticated
  --   user can read/delete every other user's files (table rows are per-row owned;
  --   files are not). While there is exactly one account this is sound; the day
  --   accounts ship, this must become an owner-scoped (path-prefix) policy and this
  --   check must be rewritten to assert THAT.
  select count(*) into n from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'owner_all_objects'
      and qual like '%auth.uid()%';
  if n = 0 then
    raise notice 'NOTE ST-4 storage is bucket-scoped, NOT owner-scoped — correct for one account, MUST change before accounts (see 20260902000003)';
  else
    raise notice 'OK ST-4 storage policy references auth.uid() — owner-scoped';
  end if;
end $$;

\echo 'storage-boundary-check: complete (read-only — nothing changed)'
