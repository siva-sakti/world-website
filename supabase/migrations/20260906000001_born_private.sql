-- ============================================================================
-- BORN PRIVATE (visibility-model.md §1, owner-sealed 2026-09-05; rider on the
-- item-0 sitting, owner-ruled 2026-09-06).
--
-- Two corrections in one, both bit-only (board is already born-private):
--   1. The default flips: a new bit is born 'private'. The founding-era
--      public-by-default (D-065) is superseded by the sealed model (I-P1 amended).
--   2. The one-time legacy flip: every existing bit sheds its founding-era
--      public flag. No publish act exists yet, so nothing reachable changes —
--      this makes storage STOP LYING ("switches never lie", model §6): today
--      every bit says 'public' while no visitor can reach anything.
--
-- The count the owner sees before pasting (the model's "counts shown"):
--   select visibility, count(*) from bit group by visibility;
-- ============================================================================

alter table bit alter column visibility set default 'private';

update bit set visibility = 'private' where visibility = 'public';
