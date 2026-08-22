// Row + view types matching supabase/migrations/20260721000001_init.sql (the
// proven schema). Hand-written; can be replaced with `supabase gen types` later.
// The eight record kinds live in three families (agreements §7); v1 UI touches
// bit · board · placement directly and reads the board_cards / home views.

export type Visibility = "public" | "private"; // "shared" joins later (§2a)
export type BitType = "text" | "drawing" | "image"; // bookmark retired (D-102); pdf·audio later
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
  url: string | null; // a bookmark's saved URL
  captured_title: string | null; // a bookmark's page title, read once (§2b)
  storage_path: string | null;
  thumb_path: string | null;
  media_width: number | null;
  media_height: number | null;
  file_name: string | null;
  mime: string | null;
  byte_size: number | null;
  visibility: Visibility;
  deleted_at: string | null; // trash = a freeze (§2g)
  created_at: string;
  updated_at: string;
  face: string | null; // computed headline (read-only)
  pinned_at: string | null; // the shelf (O1): pinned floats atop notes; null = unpinned
};

export type Board = {
  id: string;
  title: string | null;
  visibility: Visibility;
  group_id: string | null; // the shelf (O1): which home section this board sits in
  pinned_at: string | null; // pinned floats to the top of the shelf; null = unpinned
  deleted_at: string | null;
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
  source_name: string | null; // "from …" — the bit's source travels with it (P8)
  source_url: string | null; // the source's optional clickable link
};
