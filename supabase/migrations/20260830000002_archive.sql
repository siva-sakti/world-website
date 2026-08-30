-- Archive (Stage 2) — the archived things' one surface, mirroring trash_listing but
-- for state='archived'. Archive is trash's twin: hide-but-keep, its own area, always
-- restorable, NEVER deletes (no destroy path). state='archived' means archived_at set
-- AND not trashed (trash wins), so a thing shows in exactly one listing.
create view archive_listing with (security_invoker = true) as
  select 'bit'::text  as thing, id as thing_id, face  as label, archived_at
  from bit   where state = 'archived'
  union all
  select 'board'::text, id, title, archived_at
  from board where state = 'archived'
  order by archived_at desc;
