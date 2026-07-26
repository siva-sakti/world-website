-- ============================================================================
-- gather — the reference table (Gather Stage G1, gather-build-plan.md)
-- ============================================================================
-- Adds ONE table, `reference`: the materialized index of the gather-ties a
-- writer expresses inside their bodies. Typing `[[` inside a text bit and
-- picking another bit drops a chip into the writing; on save the app derives a
-- `reference` row from that chip. Standing on the gathered bit, "gathered into"
-- is then a fast read instead of scanning every body.
--
-- Additive on the proven schema (20260721000001_init.sql); nothing upstream is
-- touched. Re-proved locally before it touches the cloud (verification/
-- gather-proofs.sql + run-gather-native.sh).
--
-- WHY IT IS ITS OWN TABLE, DIRECTED (gather-build-plan.md "reconciliation"):
--   • DIRECTED. A tie goes FROM the writing TO the bit reached for. Forward
--     ("what this thought gathers") and backward ("gathered into") are ONE row
--     seen from both ends — the backward view is a free read, never authored by
--     hand. So (from,to) is ordered: B→A is a DIFFERENT tie from A→B.
--   • NOT the dormant ninth table. `dormant` (§6) was built for a SYMMETRIC
--     pair-tie ("these two relate", no direction — parked A2). Gather is a
--     different, directed relationship, so it gets its own table and `dormant`
--     KEEPS SLEEPING (still meaningful for the rare A2 case gather can't reach:
--     two non-text bits that relate, with no writing involved). Recorded, not
--     silent drift — the §6 supersession is drafted for owner sign-off at
--     Gather-Checkpoint A (gather-g1-checkpoint-A.md).
--   • A DERIVED INDEX, not an act. Rows are reconciled FROM the body on save,
--     never independently authored. The BODY is the source of truth (P6 /
--     I-G2); these rows exist only so "gathered into" (and the future graph)
--     are fast reads. Consequence: there is NO "delete a reference" act — you
--     delete the chip in your writing and save; the row falls away, traceless,
--     like un-tagging. This is the FIRST derived index in the model — it fits
--     no existing family (things / acts / vocabulary); it lives in storage
--     layer A but is layer-E-natured (rebuildable from bodies), and is exported
--     for completeness (I-G1) exactly because it cannot be silently rebuilt on
--     someone else's machine.
--   • THE CACHE CARVES PRINCIPLE 9. The chip also caches the target's full
--     face as its visible text (`<span data-ref="id">fire doodle</span>`), so
--     list-labels read naturally AND notes are findable by what they reference
--     (Postgres FTS indexes each row's OWN words — a referencing note can only
--     be found by "fire doodle" if those words sit in its own body). That is a
--     KNOWING exception to Principle 9 ("renames are free — nothing stores a
--     bit's spelling"): a gathered bit's face is now copied into referencing
--     bodies, the price of search-by-referenced-words. The copy self-heals
--     lazily on the note's next save/view — NO rename fan-out (gather-build-plan
--     Open decision #1). This lives in the body/search columns, not here; noted
--     so this table's rationale is complete.
--
-- NOTE — "FROM MUST BE A TEXT BIT" IS AN APP-LAYER GUARD, DELIBERATELY NOT A DB
-- CONSTRAINT HERE. Only writing originates a tie, so the source must be a text
-- bit. A DB CHECK cannot see another row's `type` without a trigger, and the
-- schema rules EXACTLY ONE trigger — updated_at stamping — and nothing else
-- (strategy §4.7, "a database with no secrets"). So this rule is kept in the
-- one write door (the I-R1 precedent) with a proof that attacks it, at G2 when
-- app code exists. It is NOT enforced below on purpose; gather-proofs.sql shows
-- the DB accepting a non-text source, making this boundary honest and visible.
-- ============================================================================

create table reference (
  id          uuid primary key default gen_random_uuid(),
      -- the row's own id (P9 plumbing); the tie's identity is really its
      -- (from,to) pair — see reference_once below
  from_bit_id uuid not null references bit(id) on delete cascade,
      -- the writing — a TEXT bit (app-guarded, see NOTE above). Destroying the
      -- source bit takes its outgoing ties (cascade, like every bit-owned row)
  to_bit_id   uuid not null references bit(id) on delete cascade,
      -- the bit reached for — ANY kind (text, drawing, image, bookmark).
      -- Destroying the target takes its incoming ties too, so "gathered into"
      -- never points at a ghost. The FK is also what makes derive-on-save safe:
      -- an id whose bit no longer exists is REJECTED, so the reconciler can
      -- simply skip dead ids (proven in gather-proofs.sql §5)
  created_at  timestamptz not null default now(),
      -- one clock (P4 / I-G3); no updated_at — a reference is never edited, only
      -- born (on save) or gone (chip removed → reconcile). No set_updated_at
      -- trigger for the same reason (the ONE trigger, §4.7, is updated_at only)
  constraint reference_not_self check (from_bit_id <> to_bit_id),
      -- a bit cannot gather itself
  constraint reference_once     unique (from_bit_id, to_bit_id)
      -- one tie per ORDERED pair; mentioning the same target twice in one body
      -- reconciles to ONE row (both chips still render). Directed, so B→A is a
      -- distinct tie and is allowed alongside A→B
);
create index reference_from on reference (from_bit_id);   -- forward: what this thought gathers
create index reference_to   on reference (to_bit_id);     -- backward: "gathered into" — the payoff read

-- ----------------------------------------------------------------------------
-- RLS — owner-scoped, the D-094 shape (20260723000001_owner_scoped_rls.sql).
-- Every table is locked to the single owner's uid: a second identity (even a
-- stranger who signs up) can neither read (USING) nor write (WITH CHECK) a row;
-- logged-out (auth.uid() is null) sees nothing. The owner uid is the same
-- constant D-094 resolved from auth.users. New tables born after D-094 carry
-- the owner clause from birth (rather than shipping `using (true)` and being
-- re-tightened by a follow-up ALTER, as the nine original tables were).
-- Re-scope when a second identity ever becomes legitimate (the privacy gradient).
-- ----------------------------------------------------------------------------
alter table reference enable row level security;
create policy reference_owner_all on reference for all to authenticated
  using (auth.uid() = '298fbf29-39c8-4738-96d0-3348f0e59fd0')
  with check (auth.uid() = '298fbf29-39c8-4738-96d0-3348f0e59fd0');
