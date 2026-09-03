// Row + view types matching supabase/migrations/20260721000001_init.sql (the
// proven schema). Hand-written; can be replaced with `supabase gen types` later.
// The nine record kinds live in three families (agreements §7; source joined at D-102); v1 UI touches
// bit · board · placement directly and reads the board_cards / home views.

export type Visibility = "public" | "private"; // "shared" joins later (§2a)
export type BitType = "text" | "drawing" | "image" | "audio" | "pdf" | "link"; // link revived as a first-class type (link-bit-plan.md); bookmark stays retired (D-102)
export type DisplaySize = "full" | "small";

// A pen stroke = an ordered list of [x, y, pressure] points (vector, tiny).
export type Point = number[];
export type Stroke = Point[];
// A drawing bit's ink: its strokes + a pen width AND color per stroke (so one
// drawing can mix fine/bold and ink/indigo/etc). Stored in bit.strokes (jsonb).
// Old drawings were a bare Stroke[] or lacked colors — normalizeDrawing() reads
// all shapes (missing width → default; missing color → ink).
export type Drawing = { strokes: Stroke[]; sizes: number[]; colors: string[] };

/** A thing that exists (§7 "things"). */
export type Bit = {
  id: string;
  type: BitType;
  subtype_word_id: string | null;
  source_id: string | null; // the bit's single source — "where from" (§2, FK → source)
  content: string | null; // owner-authored words; on a text bit, the optional title (D-087)
  body: string | null; // a text bit's rich-text words
  strokes: Stroke[] | null; // a drawing's vectors
  url: string | null; // a LINK bit's substance (D-129 revived the D-102-dormant column)
  captured_title: string | null; // a link's page title, read once at save (§2b)
  storage_path: string | null;
  thumb_path: string | null;
  media_width: number | null;
  media_height: number | null;
  file_name: string | null;
  mime: string | null;
  byte_size: number | null;
  visibility: Visibility;
  deleted_at: string | null; // trash = a freeze (§2g)
  archived_at: string | null; // archive = hide-but-keep, its own resting state
  state: "live" | "archived" | "trashed"; // generated: the single source of truth for "in the world"
  created_at: string;
  updated_at: string;
  face: string | null; // computed headline (read-only)
  pinned_at: string | null; // the shelf (O1): pinned floats atop notes; null = unpinned
  group_id: string | null; // the shelf (O1b): a note can sit in a folder, like a board
  kind: "bit" | "note"; // V2 (D-118): a fragment, or a written PIECE (first-class beside boards)
};

export type Board = {
  id: string;
  title: string | null;
  visibility: Visibility;
  group_id: string | null; // the shelf (O1): which home section this board sits in
  pinned_at: string | null; // pinned floats to the top of the shelf; null = unpinned
  description: string | null; // an optional subtitle under the title (B+, 2026-09-01); null = none
  deleted_at: string | null;
  archived_at: string | null; // archive = hide-but-keep, its own resting state
  state: "live" | "archived" | "trashed"; // generated: the single source of truth
  created_at: string;
  updated_at: string;
};

/** One board row from the `home` view (most-recently-touched first). */
export type HomeBoard = Board & { touched_at: string };

/** A bit or board sitting on a board (§7 "acts"). x/y absent = pile mode (§2c). */
export type Placement = {
  id: string;
  board_id: string;
  target_bit_id: string | null;
  target_board_id: string | null;
  x: number | null;
  y: number | null;
  width: number | null;
  height: number | null;
  z: number | null;
  display_size: DisplaySize;
  locked_at: string | null; // locked = position frozen (drag/resize/nudge/tidy skip it); null = unlocked
  arrived_at: string;
  left_at: string | null;
  updated_at: string;
};

/** One rendered card from the `board_cards` view (placement joined to its live target). */
export type BoardCard = {
  placement_id: string;
  board_id: string;
  thing: "bit" | "board";
  target_bit_id: string | null;
  target_board_id: string | null;
  x: number | null;
  y: number | null;
  width: number | null;
  height: number | null;
  z: number | null;
  display_size: DisplaySize;
  arrived_at: string;
  label: string | null; // the face (bit) or title (board)
  type: BitType | null;
  subtype_word_id: string | null;
  body: string | null;
  strokes: Stroke[] | null;
  url: string | null;
  storage_path: string | null;
  thumb_path: string | null;
  target_visibility: Visibility | null;
  source_id: string | null; // the source row's id (the view exposes it beside the name)
  locked_at: string | null; // locked = position frozen (B+)
  angle: number | null; // degrees; null = upright. Per-BOARD arrangement, like x/y/z
  source_name: string | null; // "from …" — the bit's source travels with it (P8)
  source_url: string | null; // the source's optional clickable link
};
