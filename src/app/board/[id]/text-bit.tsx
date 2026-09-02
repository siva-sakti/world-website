"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { listGatherCandidates, type BitHit } from "@/lib/db/references";
import { BitRef } from "./bitref";
import { GatherPicker } from "./gather-picker";
import { promptText } from "@/components/confirm";

// A text bit's words: a Tiptap editor (stored as the bit's `body`). Rich text —
// bold · italic · lists · quote · link — one typeface, no headings/color (plan §6).
// Editable only while its card/workspace is in edit mode; the quiet toolbar shows
// then. Reused on the board card, the bit workspace, and later intake — so it stays
// self-contained. StarterKit bundles Link in v3, so we disable its copy and add our
// own configured one (openOnClick off in-editor, safe rel/target, autolink on).
//
// GATHER (G2): typing `[[` opens a picker of your bits; tap one and a `BitRef` chip
// drops into the sentence (the id is truth, its face the visible cache). Reconcile
// happens on save in the persistence layer via extractRefIds — TextBit only creates
// the chip. Tap-to-select is the primary gesture (touch-first, the Daylight).

type TiptapEditor = NonNullable<ReturnType<typeof useEditor>>;

/** The minimum a thing must offer to be gathered — satisfied by both the `[[`
 *  picker's BitHit and the drawer's PanelBit. */
export type GatherTarget = { id: string; face: string | null; type: string };

/** The chip's cache/fallback label (the visible thumbnail comes from the NodeView).
 *  A faceless doodle/screenshot caches its KIND, not "untitled" — cleaner search
 *  text and a better fallback if the thumbnail can't load. ONE rule, both callers
 *  (`[[` and the drawer) — they cannot drift. */
function chipLabel(t: GatherTarget): string {
  return t.face || (t.type === "drawing" ? "drawing" : t.type === "image" ? "image" : "untitled");
}

// The open `[[` picker: what was typed, the doc range to replace, and the caret's
// screen box (top+bottom so the dropdown can float below — or flip above when low).
type Picker = { query: string; from: number; to: number; left: number; caretTop: number; caretBottom: number };

export function TextBit({
  html,
  editing,
  selected = false,
  onChange,
  selfBitId,
  onReady,
}: {
  html: string;
  editing: boolean;
  /** Board cards pass their selection so a resting link needs TWO clicks: the
   *  first selects the card (arrangement first), the second opens — in a NEW tab.
   *  A plain click on an in-text anchor used to navigate the whole board away
   *  mid-drag-attempt (soak finding, 2026-09-01). */
  selected?: boolean;
  onChange: (html: string) => void;
  selfBitId?: string; // excluded from the picker — you can't gather the note you're writing
  // Hands the parent a way to gather from OUTSIDE the editor (N4b — the note
  // page's drawer). Optional and additive: board cards pass nothing.
  onReady?: (api: { gather: (t: GatherTarget) => void }) => void;
}) {
  const [supabase] = useState(() => createClient());
  const [picker, setPicker] = useState<Picker | null>(null);
  const [candidates, setCandidates] = useState<BitHit[] | null>(null);

  // Detect / insert live in refs so the editor's config closures always call the
  // latest (they capture render-time values otherwise).
  const detectRef = useRef<(ed: TiptapEditor) => void>(() => {});
  const insertRef = useRef<(hit: BitHit) => void>(() => {});

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ link: false }),
      Link.configure({
        openOnClick: false, // don't navigate while editing
        autolink: true, // pasted / typed URLs linkify
        HTMLAttributes: { rel: "noopener noreferrer nofollow", target: "_blank" },
      }),
      BitRef,
    ],
    content: html || "<p></p>",
    editable: editing,
    immediatelyRender: false, // Next.js hydration safety
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
      detectRef.current(editor);
    },
    onSelectionUpdate: ({ editor }) => detectRef.current(editor),
  });

  // Watch the text just before the cursor for a `[[…` still-open trigger. A closing
  // bracket or a cursor move away drops it (the pattern stops matching), so the
  // picker closes itself in the common cases — no separate dismiss needed.
  // eslint-disable-next-line react-hooks/refs -- latest-callback ref: the editor's one-time config closure must call the current handler
  detectRef.current = (ed) => {
    try {
      const { selection, doc } = ed.state;
      const { $from, empty } = selection;
      if (!empty) return setPicker(null);
      const before = doc.textBetween($from.start(), $from.pos, "\n", "\0");
      const m = /\[\[([^[\]\n]*)$/.exec(before);
      if (!m) return setPicker(null);
      const from = $from.pos - m[0].length;
      const coords = ed.view.coordsAtPos(from);
      setPicker({
        query: m[1],
        from,
        to: $from.pos,
        left: coords.left,
        caretTop: coords.top,
        caretBottom: coords.bottom,
      });
    } catch {
      setPicker(null); // a detection hiccup must NEVER break normal typing
    }
  };

  // eslint-disable-next-line react-hooks/refs -- latest-callback ref (see detectRef above)
  insertRef.current = (hit) => {
    try {
      if (!editor || !picker) return;
      let to = picker.to;
      // Eat an auto-closed `]]` the keyboard may have inserted right after the query.
      const end = editor.state.doc.content.size;
      const after = editor.state.doc.textBetween(to, Math.min(to + 2, end), "\n", "\0");
      if (after === "]]") to += 2;
      const label = chipLabel(hit); // the one rule, shared with drawer-gather
      editor
        .chain()
        .focus()
        .insertContentAt(
          { from: picker.from, to },
          { type: "bitRef", attrs: { refId: hit.id, label } },
        )
        .insertContent(" ") // land the cursor after the chip so you keep writing
        .run();
    } catch {
      /* an insertion hiccup leaves your text untouched */
    } finally {
      setPicker(null);
    }
  };

  // GATHER FROM OUTSIDE (N4b). Deliberately NOT insertRef: that one replaces the
  // typed `[[query` range and needs an open picker. This one replaces nothing and
  // lands at the CURRENT selection — the drawer's row keeps the caret alive by
  // preventing mousedown's blur, and TextBit focuses "end" on mount, so a caret
  // always exists (worst case the chip lands at the end, never nowhere).
  const gatherRef = useRef<(t: GatherTarget) => void>(() => {});
  // eslint-disable-next-line react-hooks/refs -- latest-callback ref (see detectRef above)
  gatherRef.current = (t) => {
    try {
      if (!editor) return;
      editor
        .chain()
        .focus()
        .insertContent({ type: "bitRef", attrs: { refId: t.id, label: chipLabel(t) } })
        .insertContent(" ") // land the cursor after the chip so you keep writing
        .run();
    } catch {
      /* an insertion hiccup leaves your text untouched */
    }
  };

  // Hand the gather door up once the editor exists (through a ref, so an inline
  // parent callback can't re-fire it).
  const onReadyRef = useRef(onReady);
  // eslint-disable-next-line react-hooks/refs -- latest-callback ref (see detectRef above)
  onReadyRef.current = onReady;
  useEffect(() => {
    if (!editor) return;
    onReadyRef.current?.({ gather: (t) => gatherRef.current(t) });
  }, [editor]);

  // Load the candidate list once, the first time a picker opens.
  useEffect(() => {
    if (!picker || candidates !== null) return;
    let alive = true;
    listGatherCandidates(supabase, selfBitId)
      .then((c) => alive && setCandidates(c))
      .catch(() => alive && setCandidates([]));
    return () => {
      alive = false;
    };
  }, [picker, candidates, supabase, selfBitId]);

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(editing);
    if (editing) editor.commands.focus("end");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- clear the transient picker when the editor leaves edit mode
    else setPicker(null);
  }, [editing, editor]);

  return (
    <>
      {editing && editor && <Toolbar editor={editor} />}
      <EditorContent
        editor={editor}
        className="tiptap"
        onClickCapture={(e) => {
          // The resting-link click grammar (soak finding, 2026-09-01): a plain
          // click on an in-text anchor used to navigate the WHOLE TAB away mid-
          // arrangement. Now: first click = select the card (never navigate);
          // second click (already selected) = open in a NEW tab, board preserved.
          if (editing) return; // in the editor, openOnClick:false already rules
          const a = (e.target as HTMLElement).closest?.("a");
          const href = a?.getAttribute("href");
          if (!a || !href) return;
          e.preventDefault();
          if (selected) {
            e.stopPropagation(); // the open click must not ALSO enter edit mode
            window.open(href, "_blank", "noopener,noreferrer");
          }
        }}
      />
      {editing && picker && candidates !== null && (
        <GatherPicker
          supabase={supabase}
          candidates={candidates}
          query={picker.query}
          anchor={{ left: picker.left, caretTop: picker.caretTop, caretBottom: picker.caretBottom }}
          onPick={(hit) => insertRef.current(hit)}
        />
      )}
    </>
  );
}

// The quiet formatting row — shown only while editing. Buttons keep the editor's
// selection (mousedown preventDefault) so a mark applies to what's highlighted.
function Toolbar({ editor }: { editor: TiptapEditor }) {
  function btn(active: boolean, label: React.ReactNode, run: () => void, title: string) {
    return (
      <button
        type="button"
        className={`rt-btn${active ? " is-on" : ""}`}
        title={title}
        onMouseDown={(e) => e.preventDefault()}
        onClick={run}
      >
        {label}
      </button>
    );
  }
  return (
    <div className="rt-toolbar" onPointerDown={(e) => e.stopPropagation()}>
      {btn(editor.isActive("bold"), <b>B</b>, () => editor.chain().focus().toggleBold().run(), "bold")}
      {btn(editor.isActive("italic"), <i>I</i>, () => editor.chain().focus().toggleItalic().run(), "italic")}
      {btn(editor.isActive("bulletList"), "•", () => editor.chain().focus().toggleBulletList().run(), "bullet list")}
      {btn(editor.isActive("orderedList"), "1.", () => editor.chain().focus().toggleOrderedList().run(), "numbered list")}
      {btn(editor.isActive("blockquote"), "❝", () => editor.chain().focus().toggleBlockquote().run(), "quote")}
      {btn(editor.isActive("link"), "🔗", () => toggleLink(editor), "hyperlink")}
      {/* Gather by button (O3): inserts the `[[` trigger at the caret — the same
          watcher that handles typed `[[` opens the picker, so touch/stylus (the
          Daylight) reaches gather without a keyboard mode-switch. One code path. */}
      {btn(false, "[[", () => editor.chain().focus().insertContent("[[").run(), "gather a bit into your writing")}
    </div>
  );
}

async function toggleLink(editor: TiptapEditor) {
  if (editor.isActive("link")) {
    editor.chain().focus().unsetLink().run();
    return;
  }
  const prev = (editor.getAttributes("link").href as string | undefined) ?? "";
  const url = await promptText({ message: "Link URL", initial: prev, placeholder: "https://…" });
  if (url === null) return; // cancelled
  if (url.trim() === "") {
    editor.chain().focus().unsetLink().run();
    return;
  }
  editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
}
