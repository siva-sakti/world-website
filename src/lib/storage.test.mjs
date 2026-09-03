import { test } from "node:test";
import assert from "node:assert/strict";
import { copyPathsFor } from "./storage.ts";

// Every bit type, traced. Duplicating must give the COPY its own files — the owner's
// ruling — so these check the copy's paths are derived from ITS id, never the original's.

test("text and drawing carry no file at all", () => {
  assert.deepEqual(copyPathsFor("text", "NEW", {}), { storage: null, thumb: null });
  assert.deepEqual(copyPathsFor("drawing", "NEW", {}), { storage: null, thumb: null });
});

test("an image copies both the full object and its thumbnail", () => {
  assert.deepEqual(
    copyPathsFor("image", "NEW", { storage_path: "images/OLD.jpg", thumb_path: "thumbs/OLD.jpg" }),
    { storage: "images/NEW.jpg", thumb: "thumbs/NEW.jpg" },
  );
});

test("a pdf copies the document, and its page-1 thumb only if there was one", () => {
  assert.deepEqual(
    copyPathsFor("pdf", "NEW", { storage_path: "pdfs/OLD.pdf", thumb_path: "thumbs/OLD.jpg" }),
    { storage: "pdfs/NEW.pdf", thumb: "thumbs/NEW.jpg" },
  );
  assert.deepEqual(
    copyPathsFor("pdf", "NEW", { storage_path: "pdfs/OLD.pdf", thumb_path: null }),
    { storage: "pdfs/NEW.pdf", thumb: null },
    "an unrenderable pdf had no thumb — the copy must not invent one",
  );
});

test("audio keeps whatever extension the file actually was", () => {
  assert.equal(copyPathsFor("audio", "NEW", { storage_path: "audio/OLD.m4a" }).storage, "audio/NEW.m4a");
  assert.equal(copyPathsFor("audio", "NEW", { storage_path: "audio/OLD.mp3" }).storage, "audio/NEW.mp3");
  assert.equal(copyPathsFor("audio", "NEW", { storage_path: "audio/OLD.ogg" }).storage, "audio/NEW.ogg");
});

test("a link has a stored card image but no file of its own", () => {
  assert.deepEqual(
    copyPathsFor("link", "NEW", { storage_path: null, thumb_path: "thumbs/OLD.jpg" }),
    { storage: null, thumb: "thumbs/NEW.jpg" },
  );
  assert.deepEqual(
    copyPathsFor("link", "NEW", { storage_path: null, thumb_path: null }),
    { storage: null, thumb: null },
    "a link whose page had no image copies nothing",
  );
});

test("the copy's paths never contain the ORIGINAL's id", () => {
  for (const [type, src] of [
    ["image", { storage_path: "images/OLD.jpg", thumb_path: "thumbs/OLD.jpg" }],
    ["pdf", { storage_path: "pdfs/OLD.pdf", thumb_path: "thumbs/OLD.jpg" }],
    ["audio", { storage_path: "audio/OLD.m4a" }],
    ["link", { thumb_path: "thumbs/OLD.jpg" }],
  ]) {
    const r = copyPathsFor(type, "NEW", src);
    for (const p of [r.storage, r.thumb]) {
      if (p) assert.ok(!p.includes("OLD"), `${type}: ${p} still points at the original`);
    }
  }
});
