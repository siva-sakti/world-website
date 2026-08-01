"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { createClient } from "@/lib/supabase/client";
import { listGatherCandidates, type BitHit } from "@/lib/db/references";
import { BitRef } from "./bitref";

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

// The open `[[` picker: what was typed, the doc range to replace, and where to float.
type Picker = { query: string; from: number; to: number; left: number; top: number };

export function TextBit({
  html,
  editing,
  onChange,
  selfBitId,
}: {
  html: string;
  editing: boolean;
  onChange: (html: string) => void;
  selfBitId?: string; // excluded from the picker — you can't gather the note you're writing
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
      setPicker({ query: m[1], from, to: $from.pos, left: coords.left, top: coords.bottom });
    } catch {
      setPicker(null); // a detection hiccup must NEVER break normal typing
    }
  };

  insertRef.current = (hit) => {
    try {
      if (!editor || !picker) return;
      let to = picker.to;
      // Eat an auto-closed `]]` the keyboard may have inserted right after the query.
      const end = editor.state.doc.content.size;
      const after = editor.state.doc.textBetween(to, Math.min(to + 2, end), "\n", "\0");
      if (after === "]]") to += 2;
      editor
        .chain()
        .focus()
        .insertContentAt(
          { from: picker.from, to },
          { type: "bitRef", attrs: { refId: hit.id, label: hit.face || "untitled" } },
        )
        .insertContent(" ") // land the cursor after the chip so you keep writing
        .run();
    } catch {
      /* an insertion hiccup leaves your text untouched */
    } finally {
      setPicker(null);
    }
  };

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
    else setPicker(null);
  }, [editing, editor]);

  const q = picker?.query.trim().toLowerCase() ?? "";
  const results = (candidates ?? [])
    .filter((c) => !q || c.face.toLowerCase().includes(q))
    .slice(0, 8);

  return (
    <>
      {editing && editor && <Toolbar editor={editor} />}
      <EditorContent editor={editor} className="tiptap" />
      {editing && picker && candidates !== null && typeof document !== "undefined" &&
        createPortal(
          // Portaled to <body> so the board's zoom/pan transform can't shift a
          // position:fixed dropdown off-screen (it'd otherwise anchor to the
          // transformed canvas, not the viewport).
          <div
            className="gather-suggest"
            style={{ position: "fixed", left: picker.left, top: picker.top + 4, zIndex: 60 }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {results.length === 0 ? (
              <div className="gather-suggest-empty">no bits match</div>
            ) : (
              results.map((h) => (
                <button
                  key={h.id}
                  type="button"
                  className="gather-suggest-item"
                  onMouseDown={(e) => e.preventDefault()} // keep the editor's selection
                  onClick={() => insertRef.current(h)}
                  title="gather this bit"
                >
                  <span className="gather-suggest-face">{h.face || "untitled"}</span>
                  <span className="gather-suggest-type">{h.type}</span>
                </button>
              ))
            )}
          </div>,
          document.body,
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
      {btn(editor.isActive("link"), "link", () => toggleLink(editor), "link")}
    </div>
  );
}

function toggleLink(editor: TiptapEditor) {
  if (editor.isActive("link")) {
    editor.chain().focus().unsetLink().run();
    return;
  }
  const prev = (editor.getAttributes("link").href as string | undefined) ?? "https://";
  const url = window.prompt("Link URL", prev);
  if (url === null) return; // cancelled
  if (url.trim() === "") {
    editor.chain().focus().unsetLink().run();
    return;
  }
  editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
}
