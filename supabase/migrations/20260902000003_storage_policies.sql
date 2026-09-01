-- ============================================================================
-- STORAGE, CAPTURED (security review #2, owner-authorized hygiene 2026-09-02).
--
-- The buckets and the storage.objects policy were created BY HAND in the Supabase
-- dashboard (scripts/apply-to-cloud.sh makes the buckets; the policy existed only
-- in the dashboard). That made the file boundary the ONE security layer with no
-- source of truth in the repo, no version history, and no probe — against this
-- project's own doctrine. This file is that source of truth, transcribed VERBATIM
-- from the live database (pg_policies dump, 2026-09-02):
--
--   owner_all_objects | ALL | {authenticated}
--     using / with check:  bucket_id = ANY (ARRAY['public','private'])
--
-- It is deliberately a TRANSCRIPT, not an improvement — capturing reality is the
-- hygiene task; changing the shape is a separate, owner-ruled decision (below).
--
-- ⚠ WHAT THIS POLICY MEANS, HONESTLY:
--   TODAY (single owner) it is sound: `anon` has NO storage policy at all, so a
--   logged-out visitor can reach nothing; the `private` bucket is non-public, so
--   the app's signed URLs are the only read path. Correct for the guest door.
--   AT ACCOUNTS it is NOT sufficient: this grants EVERY authenticated user full
--   read/write/delete over EVERY object in both buckets. Table rows are per-row
--   owner-scoped (20260728000001); FILES ARE NOT. A second account could read and
--   delete the first account's images. → the before-accounts list, and note that
--   the standard fix (path-prefixed ownership, `{owner_id}/...`) also implies a
--   PATH-CONVENTION change, which is cheap now and expensive once there are many
--   files (today's shapes: images/ · thumbs/ · audio/ · pdfs/ + `{bitId}.ext`).
--
-- The `public` bucket is created but UNUSED by the app (nothing in src/ writes to
-- it); it is world-readable by construction. Kept as-is here to match reality —
-- dropping it is a separate call.
--
-- GUARDED: the throwaway-Postgres proof runs (verification/run-*-native.sh) apply
-- every migration to a plain PG17 that has no Supabase `storage` schema, so the
-- whole body no-ops there. On cloud it is idempotent.
-- ============================================================================

do $$
begin
  if not exists (select 1 from information_schema.schemata where schema_name = 'storage') then
    raise notice 'no storage schema (plain Postgres) — skipping storage policy capture';
    return;
  end if;

  -- The two buckets (apply-to-cloud.sh creates these via the Storage API; recorded
  -- here so a rebuild-from-migrations lands the same shape).
  insert into storage.buckets (id, name, public)
  values ('private', 'private', false), ('public', 'public', true)
  on conflict (id) do nothing;

  -- The one object policy, as it exists in the live database.
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'owner_all_objects'
  ) then
    execute $p$
      create policy owner_all_objects on storage.objects
        for all to authenticated
        using      (bucket_id = any (array['public', 'private']))
        with check (bucket_id = any (array['public', 'private']))
    $p$;
  end if;
end $$;
