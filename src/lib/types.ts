// Row types matching supabase/migrations/*.sql. Hand-written for now; can be
// replaced with `supabase gen types typescript` output once the DB is running.

export type Visibility = "private" | "shared" | "public";
export type BitType = "text" | "image" | "doodle" | "audio" | "link" | "pdf";
export type BitKind = "learned" | "noticed" | "wondered" | "theorized";

export type Board = {
  id: string;
  title: string | null;
  visibility: Visibility;
  is_home: boolean;
  width: number;
  created_at: string;
  updated_at: string;
};

export type Bit = {
  id: string;
  type: BitType;
  text: string;
  storage_path: string | null;
  thumb_path: string | null;
  link_url: string | null;
  image_w: number | null;
  image_h: number | null;
  file_name: string | null;
  mime: string | null;
  byte_size: number | null;
  kind: BitKind | null;
  visibility: Visibility;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
};

// x/y null = collection mode (grouped, unplaced); set = canvas mode (D-019).
export type Placement = {
  id: string;
  board_id: string;
  bit_id: string;
  x: number | null;
  y: number | null;
  w: number;
  h: number;
  z: number;
  created_at: string;
  updated_at: string;
};

export type Tag = {
  id: string;
  name: string;
  created_at: string;
};

/** A placement joined with its live bit — how the board renders. */
export type PlacedBit = Placement & { bit: Bit };
