"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";

// A text bit's content: a Tiptap editor. Editable only while its card is in
// edit mode; otherwise it's static text the card drags around.
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
    extensions: [StarterKit],
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

  return <EditorContent editor={editor} className="tiptap" />;
}
