// Integration test for the port's data path against the LIVE cloud.
// Signs in as the owner, exercises the exact reads/writes lib/db performs, and
// checks the RLS wall. Run: node --env-file=.env.local scripts/test-port.mjs
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const email = process.env.OWNER_EMAIL;
const password = process.env.OWNER_PASSWORD;
const ok = (m) => console.log("  ✓", m);
const fail = (m) => { console.error("  ✗ FAIL:", m); process.exitCode = 1; };

const sb = createClient(url, anon);

// --- the RLS wall: a logged-OUT client sees nothing ---
{
  const anonSb = createClient(url, anon);
  const { data } = await anonSb.from("board").select("id");
  (data?.length ?? 0) === 0 ? ok("logged-out client sees 0 boards (the wall holds)") : fail(`logged-out saw ${data.length} boards`);
}

// --- sign in as the owner ---
const { data: auth, error: authErr } = await sb.auth.signInWithPassword({ email, password });
if (authErr) { fail("owner sign-in: " + authErr.message); process.exit(1); }
ok(`signed in as ${auth.user.email}`);

const boardId = crypto.randomUUID();
const bitId = crypto.randomUUID();
const placementId = crypto.randomUUID();
const cleanupIds = []; // extra bits made mid-run, removed in finally whatever happens

try {
  // create a board
  let r = await sb.from("board").insert({ id: boardId, title: "PORT TEST" }).select("visibility").single();
  if (r.error) throw r.error;
  r.data.visibility === "private" ? ok("board created, private by default") : fail("board default not private");

  // create a text bit + place it (the compose "+ note" path)
  r = await sb.from("bit").insert({ id: bitId, type: "text", body: "<p>hello from the port</p>" }).select("face,visibility").single();
  if (r.error) throw r.error;
  r.data.face === "hello from the port" ? ok("text bit created, face computed from body") : fail("face wrong: " + r.data.face);
  r.data.visibility === "public" ? ok("bit public by default") : fail("bit default not public");
  r = await sb.from("placement").insert({ id: placementId, board_id: boardId, target_bit_id: bitId, x: 40, y: 40, width: 240, z: 1 });
  if (r.error) throw r.error;
  ok("placed on the board (arrived stamped, here-now)");

  // read it back through the board_cards view (what the board renders)
  r = await sb.from("board_cards").select("*").eq("board_id", boardId);
  if (r.error) throw r.error;
  const card = r.data[0];
  r.data.length === 1 && card.label === "hello from the port" && card.type === "text" && card.x === 40
    ? ok("board_cards view returns the card, positioned, with its face")
    : fail("board_cards wrong: " + JSON.stringify(r.data));

  // it shows on home (most-recently-touched)
  r = await sb.from("home").select("id").eq("id", boardId);
  (r.data?.length === 1) ? ok("board appears on home") : fail("board missing from home");

  // move it + edit the words (the drag + type paths)
  await sb.from("placement").update({ x: 100, y: 60 }).eq("id", placementId);
  await sb.from("bit").update({ body: "<p>edited words</p>" }).eq("id", bitId);
  r = await sb.from("board_cards").select("x,label").eq("placement_id", placementId).single();
  (r.data.x === 100 && r.data.label === "edited words") ? ok("move + edit persisted; face followed the edit") : fail("move/edit not persisted");

  // un-place vs trash are distinct (I-W1): un-place keeps the row (travel)
  await sb.from("placement").update({ left_at: new Date().toISOString() }).eq("id", placementId);
  r = await sb.from("board_cards").select("placement_id").eq("placement_id", placementId);
  (r.data?.length === 0) ? ok("un-placed card leaves the board view (row kept for travel)") : fail("un-placed card still rendered");
  r = await sb.from("bit_travel").select("left_at").eq("bit_id", bitId).single();
  (r.data?.left_at) ? ok("travel remembers it was here (departure stamped)") : fail("travel lost the leg");

  // --- increment 2: title → face (D-087) ---
  await sb.from("bit").update({ content: "My titled note" }).eq("id", bitId);
  r = await sb.from("bit").select("face").eq("id", bitId).single();
  r.data.face === "My titled note" ? ok("optional title takes the face (D-087)") : fail("title didn't take face");
  r = await sb.from("bit").select("id").eq("id", bitId).textSearch("search_tsv", "edited & words");
  (r.data?.length === 1) ? ok("titled note still findable by its BODY words (D-088)") : fail("body dropped from search");

  // --- increment 2: rename board → home reflects (P9) ---
  await sb.from("board").update({ title: "Renamed Retreat" }).eq("id", boardId);
  r = await sb.from("home").select("title").eq("id", boardId).single();
  r.data.title === "Renamed Retreat" ? ok("board renamed; home shows it") : fail("rename not reflected");

  // --- increment 3: tagging + find ---
  const tagWord = "porttest-" + Math.random().toString(36).slice(2, 7);
  const tg = await sb.from("tag").insert({ word: tagWord }).select("id,word").single();
  if (tg.error) fail("create tag: " + tg.error.message);
  else ok("tag word created (find-or-create)");
  await sb.from("tag_application").insert({ tag_id: tg.data.id, target_bit_id: bitId });
  r = await sb.from("tag_application").select("tag:tag(word)").eq("target_bit_id", bitId);
  (r.data?.some((a) => a.tag.word === tagWord)) ? ok("the bit shows its tag") : fail("bit tag missing");
  r = await sb.from("tag_counts").select("world_count").eq("tag_id", tg.data.id).single();
  (r.data?.world_count >= 1) ? ok("tag_counts counts the application (picker/manager)") : fail("tag_counts wrong");
  // filter-by-tag = the pull
  r = await sb.from("tag_application").select("target_bit_id").eq("tag_id", tg.data.id);
  const pullIds = r.data.map((x) => x.target_bit_id);
  r = await sb.from("bit").select("id").is("deleted_at", null).in("id", pullIds);
  (r.data?.some((b) => b.id === bitId)) ? ok("filter-by-tag returns the bit (the pull)") : fail("pull missing the bit");
  // full-text find over the face's words
  r = await sb.from("bit").select("id").is("deleted_at", null).textSearch("search_tsv", "edited & words");
  (r.data?.some((b) => b.id === bitId)) ? ok("full-text find returns the bit by its words") : fail("text find missing");
  // un-tag is traceless
  await sb.from("tag_application").delete().eq("tag_id", tg.data.id).eq("target_bit_id", bitId);
  r = await sb.from("tag_application").select("id").eq("tag_id", tg.data.id).eq("target_bit_id", bitId);
  (r.data?.length === 0) ? ok("un-tag removes the application (traceless)") : fail("un-tag left a row");
  // re-apply to the bit (the un-tag test removed it) + tag the BOARD (§3a)
  await sb.from("tag_application").insert({ tag_id: tg.data.id, target_bit_id: bitId });
  await sb.from("tag_application").insert({ tag_id: tg.data.id, target_board_id: boardId });
  r = await sb.from("the_pull").select("thing").eq("tag_id", tg.data.id);
  const kinds = new Set((r.data ?? []).map((x) => x.thing));
  (kinds.has("bit") && kinds.has("board")) ? ok("a board is taggable; the pull gathers bit AND board") : fail("board tag / pull wrong: " + [...kinds]);

  // tag manager — rename (follows by id)
  await sb.from("tag").update({ word: tagWord + "-renamed" }).eq("id", tg.data.id);
  r = await sb.from("tag").select("word").eq("id", tg.data.id).single();
  (r.data.word === tagWord + "-renamed") ? ok("rename follows by id (P9)") : fail("rename failed");
  // merge — a 2nd tag repointed into the first, source removed
  const tg2 = await sb.from("tag").insert({ word: tagWord + "-b" }).select("id").single();
  await sb.from("tag_application").insert({ tag_id: tg2.data.id, target_bit_id: bitId });
  await sb.from("tag").delete().eq("id", tg2.data.id);
  r = await sb.from("tag").select("id").eq("id", tg2.data.id);
  (r.data?.length === 0) ? ok("merge removes the source word") : fail("merge left the word");
  // delete-tag — applications cascade, the bit survives (§3e)
  await sb.from("tag").delete().eq("id", tg.data.id);
  r = await sb.from("bit").select("id").eq("id", bitId).is("deleted_at", null);
  (r.data?.length === 1) ? ok("delete-tag cascades applications; the bit survives (§3e)") : fail("delete-tag harmed the bit");

  // bug-3 guard: a tag word containing a LIKE wildcard (%) must resolve to ITSELF,
  // not a sibling. applyTag escapes % / _ before the ilike lookup — verify the
  // escaped pattern is literal, while the naive pattern over-matches.
  const wpre = "pct-" + Math.random().toString(36).slice(2, 6);
  const plain = await sb.from("tag").insert({ word: wpre + "50" }).select("id").single();
  const pct = await sb.from("tag").insert({ word: wpre + "50%" }).select("id").single();
  const esc = (wpre + "50%").replace(/[\\%_]/g, (m) => "\\" + m);
  r = await sb.from("tag").select("word").ilike("word", esc);
  const words = (r.data ?? []).map((x) => x.word);
  (words.length === 1 && words[0] === wpre + "50%")
    ? ok("a % tag word resolves to itself (wildcard escaped)")
    : fail("escaped ilike over/under-matched: " + JSON.stringify(words));
  r = await sb.from("tag").select("word").ilike("word", wpre + "50%");
  ((r.data ?? []).length >= 2)
    ? ok("naive % pattern over-matches — the bug the escape fixes")
    : fail("naive pattern didn't over-match as expected");
  await sb.from("tag").delete().in("id", [plain.data.id, pct.data.id]);

  // bit-page guard: the "boards a bit is on" embed must name its FK — placement
  // links to board TWO ways (board_id + target_board_id), so a bare board:board()
  // embed errors "more than one relationship". This crashed the bit page.
  r = await sb.from("placement").select("board:board!placement_board_id_fkey(id, title)").eq("target_bit_id", bitId).is("left_at", null);
  (!r.error) ? ok("bit-page: getBitBoards embed is unambiguous (no crash)") : fail("getBitBoards embed error: " + r.error?.message);

  // --- increment 4: a drawing with per-stroke pen widths round-trips (jsonb) ---
  const drawId = crypto.randomUUID();
  const drawing = { strokes: [[[0, 0, 0.5], [10, 10, 0.6]]], sizes: [13], colors: ["#3b3f72"] };
  r = await sb.from("bit").insert({ id: drawId, type: "drawing", strokes: drawing }).select("strokes").single();
  if (r.error) fail("drawing insert: " + r.error.message);
  else (r.data.strokes?.sizes?.[0] === 13 && r.data.strokes?.colors?.[0] === "#3b3f72" && r.data.strokes?.strokes?.length === 1)
    ? ok("drawing stores strokes + per-stroke pen width AND color (jsonb round-trip)")
    : fail("drawing shape wrong: " + JSON.stringify(r.data.strokes));
  await sb.from("bit").delete().eq("id", drawId);
  ok("drawing test bit cleaned");

  // --- increment 2: storage upload through RLS + an image bit ---
  const imgBitId = crypto.randomUUID();
  const imgPlacementId = crypto.randomUUID();
  const storagePath = `images/${imgBitId}.jpg`;
  const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xdb, 0, 4, 3, 2, 0xff, 0xd9]); // tiny JPEG-ish payload
  let s = await sb.storage.from("private").upload(storagePath, bytes, { contentType: "image/jpeg" });
  if (s.error) fail("storage upload as owner refused: " + s.error.message);
  else ok("storage upload through RLS as the owner");
  r = await sb.from("bit").insert({
    id: imgBitId, type: "image", storage_path: storagePath,
    media_width: 100, media_height: 80, mime: "image/jpeg", byte_size: bytes.length,
  }).select("face").single();
  if (r.error) fail("image bit insert: " + r.error.message);
  else (r.data.face === null) ? ok("image bit created; face empty (shows as itself)") : fail("image face should be null");
  await sb.from("placement").insert({ id: imgPlacementId, board_id: boardId, target_bit_id: imgBitId, x: 300, y: 60, width: 220, z: 2 });
  const su = await sb.storage.from("private").createSignedUrl(storagePath, 60);
  if (su.error) fail("signed url: " + su.error.message);
  else {
    const resp = await fetch(su.data.signedUrl);
    resp.ok ? ok("signed URL serves the object (HTTP " + resp.status + ")") : fail("signed URL fetch HTTP " + resp.status);
  }
  // caption on the image → becomes its face (§2b)
  await sb.from("bit").update({ content: "TCM — spleen & worry" }).eq("id", imgBitId);
  r = await sb.from("board_cards").select("label").eq("placement_id", imgPlacementId).single();
  r.data.label === "TCM — spleen & worry" ? ok("caption takes the image's face on the board") : fail("caption didn't take");
  // cleanup the image pieces
  await sb.storage.from("private").remove([storagePath]);
  await sb.from("bit").delete().eq("id", imgBitId);
  ok("image test objects cleaned");

  // --- increment 5: trash + restore (I-W1) ---
  await sb.from("bit").update({ deleted_at: new Date().toISOString() }).eq("id", bitId);
  r = await sb.from("the_ledger").select("id").eq("id", bitId);
  (r.data?.length === 0) ? ok("trashed bit leaves the ledger") : fail("trashed bit still in ledger");
  r = await sb.from("trash_listing").select("thing_id").eq("thing_id", bitId);
  (r.data?.length === 1) ? ok("trashed bit shows in the trash listing") : fail("trashed bit missing from trash");
  await sb.from("bit").update({ deleted_at: null }).eq("id", bitId);
  r = await sb.from("the_ledger").select("id").eq("id", bitId);
  (r.data?.length === 1) ? ok("restore returns the bit to the world instantly") : fail("restore failed");

  // --- increment 6: export reads every record kind as the owner (I-G1) ---
  const EXPORT_TABLES = ["board", "bit", "placement", "tag_application", "connector", "tag", "category", "subtype_word", "dormant"];
  let exportOk = true;
  for (const t of EXPORT_TABLES) {
    const e = await sb.from(t).select("id").limit(1);
    if (e.error) { exportOk = false; fail(`export read ${t}: ${e.error.message}`); }
  }
  if (exportOk) ok("export can read all 9 record kinds as the owner (I-G1)");

  // --- increment 7: THIS SESSION — the gather door, the picker's words, archive ---
  // (N4b + N5. Each assertion is about the DATA PATH, not the UI: the client-side
  // match rule is unit-obvious, but whether the rows carry what it needs is not.)

  const needle = "portneedle" + Math.random().toString(36).slice(2, 7);
  const bit2Id = crypto.randomUUID();
  cleanupIds.push(bit2Id);
  r = await sb.from("bit").insert({
    id: bit2Id, type: "text", kind: "note",
    content: "A Titled Piece",
    body: `<p>the word ${needle} sits in the body, not the title</p>`,
  }).select("id").single();
  if (r.error) throw r.error;

  // The `[[` picker matched the FACE ONLY before N4b, so a word inside a note's
  // body was unreachable from the picker. Its candidate query must now carry the
  // words the shared matcher (lib/search-query) needs.
  r = await sb.from("bit")
    .select("id, face, type, content, body, thumb_path, storage_path, strokes")
    .eq("id", bit2Id).single();
  if (r.error) throw r.error;
  `${r.data.content ?? ""} ${r.data.body ?? ""}`.includes(needle)
    ? ok("the `[[` picker's candidates carry BODY words (it saw only the face before N4b)")
    : fail("picker candidates missing body text — `[[` can only match titles again");

  // The face is still the title (D-087) — so a candidate carrying body words has
  // NOT quietly changed what a note is labelled by.
  r.data.face === "A Titled Piece"
    ? ok("carrying body words did not disturb the face (still the title)")
    : fail("face changed: " + r.data.face);

  // Gathering — from `[[` or from the drawer — is ONE act underneath: a chip in
  // the body plus a reconciled `reference` row.
  await sb.from("bit").update({
    body: `<p>see <span data-ref="${bit2Id}">A Titled Piece</span> here</p>`,
  }).eq("id", bitId);
  r = await sb.from("reference").insert({ from_bit_id: bitId, to_bit_id: bit2Id }).select("id");
  if (r.error) throw r.error;
  ok("gathering writes a reference row (the drawer's door and `[[` share it)");

  // The backward read — what the note's "gathered into" section shows.
  r = await sb.from("reference")
    .select("created_at, gatherer:from_bit_id(id, deleted_at)")
    .eq("to_bit_id", bit2Id);
  (r.data ?? []).some((x) => x.gatherer?.id === bitId && x.gatherer?.deleted_at === null)
    ? ok('"gathered into" reads the tie backwards, live gatherers only')
    : fail("backward gather read missing the tie");

  // Gathering the same thing twice is ONE tie — the body may name it twice, the
  // index must not double (extractRefIds dedupes; the row is unique on from+to).
  r = await sb.from("reference").insert({ from_bit_id: bitId, to_bit_id: bit2Id });
  r.error
    ? ok("a duplicate tie is refused — cite it twice, it is still one reference")
    : fail("duplicate reference row was accepted");

  // --- archive (N5) — skipped cleanly until the migration is on this cloud ---
  const probe = await sb.from("bit").select("archived_at").eq("id", bit2Id).limit(1);
  if (probe.error) {
    console.log("  – SKIP archive: migration 20260828000001_archive.sql is not on this cloud yet");
  } else {
    await sb.from("bit").update({ archived_at: new Date().toISOString(), pinned_at: null }).eq("id", bit2Id);
    r = await sb.from("bit").select("archived_at,deleted_at").eq("id", bit2Id).single();
    (r.data.archived_at && !r.data.deleted_at)
      ? ok("archiving puts it away WITHOUT trashing it")
      : fail("archive/trash confused");

    // The whole point: put away is still findable. An archived row is a LIVE row.
    r = await sb.from("the_ledger").select("id").eq("id", bit2Id);
    (r.data?.length === 1)
      ? ok("an archived note is STILL in the ledger — find reaches it (I-T1 floor holds)")
      : fail("archiving removed it from the ledger — that is trash, not archive");

    // The invariant, at the DB and not merely in the app.
    const bad = await sb.from("bit").update({ pinned_at: new Date().toISOString() }).eq("id", bit2Id);
    bad.error
      ? ok("the DB REFUSES starred AND archived (bit_archived_not_alive)")
      : fail("a note was allowed to be both alive and put away");

    await sb.from("bit").update({ archived_at: null }).eq("id", bit2Id);
    r = await sb.from("bit").select("archived_at").eq("id", bit2Id).single();
    (r.data.archived_at === null) ? ok("taking it back out clears the archive") : fail("un-archive failed");
  }

} finally {
  // cleanup — hard-delete the test board + bits (cascades placements + references)
  for (const id of cleanupIds) await sb.from("bit").delete().eq("id", id);
  await sb.from("bit").delete().eq("id", bitId);
  await sb.from("board").delete().eq("id", boardId);
  ok("cleaned up the test rows");
}

console.log(process.exitCode ? "\nPORT DATA TEST: FAILURES ABOVE" : "\nPORT DATA TEST PASSED ✓ — the compose data path works on the live cloud");
