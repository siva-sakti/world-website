"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { useEffect } from "react";

// A text bit's words: a Tiptap editor (stored as the bit's `body`). Rich text —
// bold · italic · lists · quote · link — one typeface, no headings/color (plan §6).
// Editable only while its card/workspace is in edit mode; the quiet toolbar shows
// then. Reused on the board card, the bit workspace, and later intake — so it stays
// self-contained. StarterKit bundles Link in v3, so we disable its copy and add our
// own configured one (openOnClick off in-editor, safe rel/target, autolink on).

type TiptapEditor = NonNullable<ReturnType<typeof useEditor>>;

export function TextBit({
  html,
  editing,
  onChange,
}: {
  html: string;
  editing: boolean;
  onChange: (html: string) => void;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ link: false }),
      Link.configure({
        openOnClick: false, // don't navigate while editing
        autolink: true, // pasted / typed URLs linkify
        HTMLAttributes: { rel: "noopener noreferrer nofollow", target: "_blank" },
      }),
    ],
    content: html || "<p></p>",
    editable: editing,
    immediatelyRender: false, // Next.js hydration safety
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(editing);
    if (editing) editor.commands.focus("end");
  }, [editing, editor]);

  return (
    <>
      {editing && editor && <Toolbar editor={editor} />}
      <EditorContent editor={editor} className="tiptap" />
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
