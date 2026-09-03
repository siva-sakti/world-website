-- ============================================================================
-- The frame (frame-plan.md, owner-ruled 2026-09-01; antagonist-proven 2026-09-01;
-- re-verified against this exact file 2026-09-03).
--
-- A frame is not a thing (bit), not meaning (tag), not membership (placement).
-- It's a property of one board's arrangement — four numbers, pure furniture:
-- an optional page-shaped rectangle a board can carry, giving composition
-- edges to align against (joins the snap-guide candidates once it exists).
-- Null = no frame. One frame per board (owner-ruled; several frames is a
-- different product, additive later, not this).
--
-- x/y stay SIGNED (world coordinates — a frame can sit anywhere, including
-- negative space). w/h must be POSITIVE and FINITE: Postgres float8 orders
-- NaN above every other value, so a naive `w > 0` check alone lets NaN
-- through ('NaN' > 0 is TRUE) — the antagonist's catch. The upper bound
-- excludes Infinity for the same reason.
--
-- All-or-none via num_nulls (returns an integer count, sidesteps the
-- NULL-comparison pitfall a chain of `is null` ORs would have): either all
-- four columns are null (no frame) or all four are set (a frame) — never a
-- partial rectangle.
-- ============================================================================

alter table board
  add column frame_x double precision,
  add column frame_y double precision,
  add column frame_w double precision,
  add column frame_h double precision,
  add constraint board_frame_all_or_none check (
    num_nulls(frame_x, frame_y, frame_w, frame_h) in (0, 4)
  ),
  add constraint board_frame_positive check (
    (frame_w is null or (frame_w > 0 and frame_w < 'Infinity'::float8)) and
    (frame_h is null or (frame_h > 0 and frame_h < 'Infinity'::float8))
  );
