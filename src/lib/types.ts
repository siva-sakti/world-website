// Row + view types matching supabase/migrations/20260721000001_init.sql (the
// proven schema). Hand-written; can be replaced with `supabase gen types` later.
// The eight record kinds live in three families (agreements §7); v1 UI touches
// bit · board · placement directly and reads the board_cards / home views.

export type Visibility = "public" | "private"; // "shared" joins later (§2a)
export type BitType = "text" | "drawing" | "image" | "bookmark"; // pdf·audio later
export type DisplaySize = "full" | "small";

// A pen stroke = an ordered list of [x, y, pressure] points (vector, tiny).
export type Point = number[];
export type Stroke = Point[];
// A drawing bit's ink: its strokes + a pen width per stroke (so one drawing can
// mix fine and bold). Stored in bit.strokes (jsonb). Old drawings were a bare
// Stroke[] — normalizeDrawing() reads both shapes.
export type Drawing = { strokes: Stroke[]; sizes: number[] };

/** A thing that exists (§7 "things"). */
export type Bit = {
  id: string;
  type: BitType;
  subtype_word_id: string | null;
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
};

export type Board = {
  id: string;
  title: string | null;
  visibility: Visibility;
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
};
