// Prototype types for the compose surface (localStorage-backed; ports to the
// real bits/placements schema when we wire Supabase).

export type PBitType = "text" | "image" | "doodle";
export type Rect = { x: number; y: number; w: number; h: number };

// A pen stroke = an ordered list of [x, y, pressure] points (vector, tiny).
export type Point = number[];
export type Stroke = Point[];

export type PBit = {
  id: string;
  type: PBitType;
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  html?: string; // text
  fontSize?: number; // text: base font size in px, set by corner-scale (default 16)
  src?: string; // image (task 2)
  crop?: Rect; // image (task 2)
  strokes?: Stroke[]; // doodle: strokes relative to the bit's top-left
};

export type BoardState = { bits: PBit[] };
