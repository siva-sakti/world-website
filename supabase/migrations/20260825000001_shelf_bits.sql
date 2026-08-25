-- ============================================================================
-- THE SHELF, FINISHED (O1b): folders cut across boards AND notes — the owner's
-- original ask ("boards and notes are both assembled"). A bit can sit in a
-- shelf group exactly like a board does. Same physics: one group per thing,
-- deleting a section strands nothing (set null).
-- ============================================================================
alter table bit add column group_id uuid references shelf_group(id) on delete set null;
create index bit_group on bit (group_id);
