// Unit test for jot-draft.ts. No dependency — Node's built-in runner.
// From the repo root:  node 'src/app/bits/jot-draft.test.mjs'
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseDraft, isEmptyDraft, loadDraft, saveDraft } from "./jot-draft.ts";

const full = {
  note: "a thought",
  asQuote: false,
  sticky: { name: "Ottessa", url: null },
  draft: "",
  tagWords: ["essay"],
  tagDraft: "half",
};

test("a full draft round-trips through storage", () => {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => void store.set(k, String(v)),
    removeItem: (k) => void store.delete(k),
    clear: () => store.clear(), key: () => null, length: 0,
  };
  saveDraft(full);
  assert.deepEqual(loadDraft(), full);
  // clearing IS emptying the box — there is no separate clear path to drift from this one
  saveDraft({ note: "", asQuote: false, sticky: null, draft: "", tagWords: [], tagDraft: "" });
  assert.equal(loadDraft(), null);
  delete globalThis.localStorage;
});

test("emptiness: the two SUBMITTED input drafts count; asQuote alone does not", () => {
  const base = { note: "", asQuote: false, sticky: null, draft: "", tagWords: [], tagDraft: "" };
  assert.equal(isEmptyDraft(base), true);
  assert.equal(isEmptyDraft({ ...base, asQuote: true }), true, "asQuote alone is still empty");
  // each of these is submitted by the add path, so each makes the draft worth keeping
  assert.equal(isEmptyDraft({ ...base, note: "x" }), false);
  assert.equal(isEmptyDraft({ ...base, draft: "Ottessa" }), false, "a typed source name IS submitted");
  assert.equal(isEmptyDraft({ ...base, tagDraft: "essay" }), false, "a typed tag word IS submitted");
  assert.equal(isEmptyDraft({ ...base, sticky: { name: "s", url: null } }), false);
  assert.equal(isEmptyDraft({ ...base, tagWords: ["t"] }), false);
  assert.equal(isEmptyDraft({ ...base, note: "   " }), true, "whitespace is not content");
});

test("an empty draft REMOVES the key rather than storing a blank", () => {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => void store.set(k, String(v)),
    removeItem: (k) => void store.delete(k),
    clear: () => store.clear(), key: () => null, length: 0,
  };
  saveDraft(full);
  assert.notEqual(loadDraft(), null);
  saveDraft({ note: "", asQuote: true, sticky: null, draft: "", tagWords: [], tagDraft: "" });
  assert.equal(store.size, 0, "the key is gone, not set to an empty draft");
  delete globalThis.localStorage;
});

test("shape validation rejects wrong types — not just bad JSON", () => {
  assert.equal(parseDraft(null), null);
  assert.equal(parseDraft("not json"), null);
  assert.equal(parseDraft("[1,2]"), null);
  // the render-crash case: tagWords must be an array of strings, or .map() explodes
  assert.equal(parseDraft(JSON.stringify({ ...full, tagWords: "essay,art" })), null);
  assert.equal(parseDraft(JSON.stringify({ ...full, tagWords: [1, 2] })), null);
  assert.equal(parseDraft(JSON.stringify({ ...full, note: 42 })), null);
  assert.equal(parseDraft(JSON.stringify({ ...full, asQuote: "yes" })), null);
  assert.equal(parseDraft(JSON.stringify({ ...full, sticky: { name: 1, url: null } })), null);
  assert.equal(parseDraft(JSON.stringify({ ...full, sticky: "Ottessa" })), null);
  // a source with a url is legal
  assert.notEqual(parseDraft(JSON.stringify({ ...full, sticky: { name: "s", url: "https://x" } })), null);
});

test("a stored-but-empty draft reads as no draft", () => {
  assert.equal(parseDraft(JSON.stringify({ note: "", asQuote: true, sticky: null, draft: "", tagWords: [], tagDraft: "" })), null);
});

test("blocked storage throws nothing, in either direction", () => {
  globalThis.localStorage = {
    getItem: () => { throw new Error("SecurityError"); },
    setItem: () => { throw new Error("SecurityError"); },
    removeItem: () => { throw new Error("SecurityError"); },
    clear: () => {}, key: () => null, length: 0,
  };
  assert.equal(loadDraft(), null);
  assert.doesNotThrow(() => saveDraft(full));
  assert.doesNotThrow(() => saveDraft({ note: "", asQuote: false, sticky: null, draft: "", tagWords: [], tagDraft: "" }));
  delete globalThis.localStorage;
});
