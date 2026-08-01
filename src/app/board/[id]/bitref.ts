import { Node } from "@tiptap/react";

// The gather chip — a `[[`-inserted reference to another bit, living INSIDE a text
// note's body (gather-build-plan.md G2). An inline ATOM: one indivisible token you
// place, select, and backspace as a unit, never editing it character-by-character.
// It carries the TRUTH (`data-ref` = the target bit's id, read back by
// extractRefIds on save) and a CACHE (its visible text = the target's face), so the
// note is searchable by what it references (the P9 carve) and reads naturally.
// No React NodeView in G2 — it renders as styled text; tap-to-peek is G3.

export const BitRef = Node.create({
  name: "bitRef",
  group: "inline",
  inline: true,
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      // the truth — the target bit's id, on data-ref
      refId: {
        default: null as string | null,
        parseHTML: (el) => (el as HTMLElement).getAttribute("data-ref"),
        renderHTML: (attrs) => (attrs.refId ? { "data-ref": attrs.refId } : {}),
      },
      // the cache — the target's face, kept AS the chip's visible text (not an
      // attribute), so HTML-stripped search indexes it and labels read naturally.
      label: {
        default: "",
        parseHTML: (el) => (el as HTMLElement).textContent ?? "",
        renderHTML: () => ({}),
      },
    };
  },

  parseHTML() {
    return [{ tag: "span[data-ref]" }];
  },

  renderHTML({ node, HTMLAttributes }) {
    return ["span", { ...HTMLAttributes, class: "gather-chip" }, node.attrs.label || "?"];
  },

  renderText({ node }) {
    return node.attrs.label || "";
  },
});
