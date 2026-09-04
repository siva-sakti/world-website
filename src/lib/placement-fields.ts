// THE PLACEMENT FIELDS — the one list of what a card's position IS.
//
// A card's spot on a board lives in six columns. Three separate hand-kept lists used to
// name them: the queue's patch type, the queue's CardVM→column copy, and bits.ts's `Pos`.
// A field missing from any one of them was silently dropped on its way to the database —
// the act worked for the session and vanished on reload, with no error anywhere. That is
// not hypothetical: `angle` was accepted by two of the three lists and written by none,
// so rotation survived until you reloaded.
//
// Deriving all of them from here makes adding a field ONE edit, and makes half-adding one
// impossible. Deliberately dependency-free so every layer can import it.

/** CardVM's key → the database column it is stored in. The ONLY place this is stated. */
export const CARD_TO_COLUMN = {
  x: "x",
  y: "y",
  w: "width",
  h: "height",
  z: "z",
  angle: "angle",
} as const;

/** The CardVM keys that describe a position ("x" | "y" | "w" | "h" | "z" | "angle"). */
export type CardPosKey = keyof typeof CARD_TO_COLUMN;

/** The database columns ("x" | "y" | "width" | "height" | "z" | "angle"). */
export type PlacementColumn = (typeof CARD_TO_COLUMN)[CardPosKey];

export const CARD_POS_KEYS = Object.keys(CARD_TO_COLUMN) as CardPosKey[];
export const PLACEMENT_COLUMNS = Object.values(CARD_TO_COLUMN) as PlacementColumn[];

/** A partial position, as the queue writes it. */
export type PlacementPatch = Partial<Record<PlacementColumn, number>>;

/** A partial position as the insert paths take it — nullable, because an unset column
 *  is a real state there (a card with no stored size). */
export type Pos = Partial<Record<PlacementColumn, number | null>>;
