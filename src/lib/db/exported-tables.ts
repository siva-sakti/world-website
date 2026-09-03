// EVERY owner-scoped table the export must carry (I-G1's completeness floor).
//
// It lives here, not inside the export route, for one reason: it is a fact about the
// SCHEMA, not about an HTTP handler — and a plain module can be imported by a test,
// where a Next route cannot. The comment that used to guard this list failed four
// times (source, reference, and `opening` on 2026-09-03 — found by review, not by the
// comment). `exported-tables.test.mjs` now reads the migration directory and asserts
// set-equality, so a migration that adds a table and forgets this list turns the suite
// red instead of silently shipping an incomplete "export everything you own".
export const EXPORTED_TABLES = [
  "shelf_group",
  "board",
  "bit",
  "placement",
  "tag_application",
  "connector",
  "reference",
  "tag",
  "category",
  "subtype_word",
  "source",
  "dormant",
  "opening", // the recent trail (D-134) — missed at its own migration, caught 2026-09-03
] as const;
