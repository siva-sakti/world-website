// FORMAT EVIDENCE, DOM-free half (storage session). THIS is the script that
// produced format-evidence.out — reconstructed into verification/ after the
// adversarial review caught the original living only in the session scratchpad
// ("committed" had been claimed; it wasn't — fixed 2026-09-03).
// Run from the repo root: node verification/format-evidence.mjs
// The HTML-side tests (generateJSON/generateHTML) CANNOT run headless — tiptap
// throws "no window object available" and no DOM lib is installed (deps are
// owner-gated). That observed throw is itself recorded evidence.
import { getSchema, Node as TNode } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { Node as PMNode } from "@tiptap/pm/model";
const BitRef = TNode.create({
  name: "bitRef", group: "inline", inline: true, atom: true,
  addAttributes() { return { refId: { default: null } }; },
  parseHTML() { return [{ tag: "span[data-ref]" }]; },
  renderHTML({ HTMLAttributes }) { return ["span", HTMLAttributes, "label"]; },
});
const schema = getSchema([StarterKit.configure({ link: false }), Link, BitRef]);
console.log("schema built DOM-free | node types:", Object.keys(schema.nodes).join(","));
console.log("\n== J1: valid doc with a chip — JSON round trip ==");
const good = { type: "doc", content: [
  { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Weekend" }] },
  { type: "paragraph", content: [
    { type: "text", text: "about " },
    { type: "bitRef", attrs: { refId: "abc-123" } },
    { type: "text", text: " mid-sentence" }]},
]};
const n1 = PMNode.fromJSON(schema, good);
console.log("loads:", !!n1, "| refId survives:", JSON.stringify(n1.toJSON()).includes("abc-123"));
console.log("\n== J2: doc containing an UNKNOWN node type ('callout' no longer registered) ==");
const unknown = { type: "doc", content: [
  { type: "paragraph", content: [{ type: "text", text: "fine" }] },
  { type: "callout", content: [{ type: "text", text: "boxed words" }] },
]};
try { PMNode.fromJSON(schema, unknown); console.log("NO THROW — loaded fine"); }
catch (e) { console.log("THREW:", String(e.message).slice(0,100)); }
console.log("\n== J3: known node with an UNKNOWN attribute (headingId before its extension) ==");
const attr = { type: "doc", content: [
  { type: "heading", attrs: { level: 2, headingId: "h-99" }, content: [{ type: "text", text: "t" }] },
]};
try {
  const n = PMNode.fromJSON(schema, attr);
  console.log("NO THROW | attr kept in model?", JSON.stringify(n.toJSON()).includes("h-99"));
} catch (e) { console.log("THREW:", String(e.message).slice(0,100)); }
console.log("\n== J4: UNKNOWN MARK on text ==");
const mk = { type: "doc", content: [
  { type: "paragraph", content: [{ type: "text", text: "hot", marks: [{ type: "highlight" }] }] },
]};
try { PMNode.fromJSON(schema, mk); console.log("NO THROW"); }
catch (e) { console.log("THREW:", String(e.message).slice(0,100)); }
