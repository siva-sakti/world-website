# The composition — the specification

> ## STATUS · in progress, written section by section with the owner (started 2026-09-02)
> **This supersedes `composition-technical-spec.md`** when complete; that file and `composition-base-spec.md` retire to trail-status. Nothing here is invented: every ruling carries its provenance, and anything unruled is marked ⚪ inline rather than smoothed over.

---

# PART I · FOUNDATIONS

## 1 · How to use this document

**Who it's for:** whoever builds this feature — including a future session with no memory of the conversations behind it.

**What it is:** the complete, current specification of the composition — the app's convergent surface. It states what is true, what is ruled, and what is open. **It does not argue.** The reasoning lives in the trail documents (§1.3).

**How to read the marks:**
- **RULED** — the owner decided it. Provenance in *(parentheses italic)*.
- 🔵 — Claude's design proposal, accepted in substance but not separately stamped.
- ⚪ — **genuinely open.** Do not build past a ⚪ without the owner.
- ⛔ — deliberately excluded. Not an oversight; do not "fix" it.

**The three rules for anyone extending this document:**
1. **Amend in place.** Never add a contradicting layer below. *(This rule exists because it was broken — see `aerial-review-findings.md`.)*
2. **Every ruling names its owner.** If you cannot say who decided something, it is ⚪ or 🔵, never RULED.
3. **When a ruling changes, mark what it supersedes** in the same edit.

**1.3 · Where the reasoning lives**
| for | read |
|---|---|
| the concept, in the owner's voice | `composition-definition.md` |
| what a person must learn | `teaching-the-user.md` |
| the moments of use (S1–S13) | `integration-scenes.md` |
| deferred ideas (F-1…F-9) | `future-features.md` |
| the audit that shaped this doc | `aerial-review-findings.md` |
| the historical trail ⚠ contradictory | `composition-base-spec.md` |

## 2 · The concept, in brief

The app serves a **rhythm: diverge → converge → diverge**, never a one-way arrow *(owner, station 1)*. Material is caught as **bits**. It is spread and thought with in space on a **board**. It is synthesized into words in a **composition**.

**Both surfaces are formats with different powers** *(owner, station 1)*: the board is the **spatial format** — free position, arrange anything. The composition is the **linear format** — sequence, structure, a throughline.

**The composition is convergence made legible:** a board's arrangement speaks mostly to its maker; a composition can be read by anyone, including future-you. *(This sentence is teaching material, not a build constraint — `teaching-the-user.md`.)*

**Why it exists at all:** the app built its divergent half well and converged into a text box. The positioning claim — *"we accommodate the process of getting from divergent to convergent"* — rests on this half.

## 3 · The model

**3.1 · The three things**
- **bit** — material. One thing you caught or made: text · image · drawing · voice recording · PDF · link *(candidates: **file** · **video**. ⛔ Not `table` — a table is formatting; a text bit can contain one.)*. **Flat: a bit never references anything.** *(the flatness call)*
- **board** — a spatial surface. Holds material by **placement** (a position).
- **composition** — a linear surface. Holds material by **reference** (pulled into the writing).

**3.2 · The four dimensions** *(the complete model in one frame — station 2)*

| dimension | what it is | for a composition |
|---|---|---|
| **CONTENT** | the things themselves | your words + bits pulled in (one shared roster) |
| **STRUCTURE** | how a surface groups its content | **sequence** — headings, lists, order *(a board's is **position**)* |
| **RELATION** | how things point at each other | references (pulled in) · placements (held by boards) |
| **ORGANIZATION** | how you categorize across everything | tags · one folder · star · search |

Four dimensions, no overlaps. Every feature in this spec belongs to exactly one.

**3.3 · The vocabulary** *(used throughout; the user never meets these words — see `teaching-the-user.md` §4)*

| term | meaning |
|---|---|
| **face** | a bit's computed headline: the owner's caption → else its first words → else nothing (visual bits stand in with a thumbnail) |
| **chip** | the inline pill a pulled-in thing becomes in the writing; shows the target's face. *Shipped Aug 2026.* |
| **peek** | tap a chip → a floating glimpse of the target beside it, with a door to open it. *Shipped Aug 2026.* |
| **block** | a pulled-in thing rendered **in place** in the flow — preview-sized. *Ruled, unbuilt.* ⚑ *the word is overloaded (Notion's paragraph word) — naming session item.* |
| **frame** | ⛔ **not used in this spec.** The word belongs to the board's alignment feature (other track). |

**3.4 · The laws**

| law | statement | source |
|---|---|---|
| **content/structure** | Content is bits — **one roster shared by both surfaces**: anything placeable on a board is pullable into a composition. Structure (headings · lists · checklists · tables) is **formatting** — it lives in the editor and is never a bit. **This is a premise, not dogma** — but an exception requires the owner's explicit ruling, recorded here; a builder never takes one unilaterally. | owner |
| **flatness** | Material is flat; **only compositions weave.** A bit referencing bits would be a composition wearing the wrong label. | owner |
| **direction** | **Boards hold; compositions are held.** A composition never contains or references a board. **Mention is not containment** — a plain hyperlink to a board remains possible: it is an **ordinary editor link** (the link mark that already exists), **not a feature to build**, and it creates **no stored tie, no backlink, no graph line.** | owner |
| **deliberateness** | A composition is **never** auto-created. The board catches material by default; making a composition is always an act. Pasting into writing stays mere content — never auto-minted as a bit. | owner |
| **fixed kind** | A thing's kind is set at birth and never converts: bit ↮ composition ↮ board. | D-121 |
| **silent bit-hood** | In the writing, a pulled-in thing **renders as normal document content** — an image looks like an image, a quote reads as a quote. **Forbidden: badges, borders, icons, or any persistent marker distinguishing pulled-in content from typed content.** Its bit-life (source · tags · where else it lives) appears **only** on tap or hover. | owner |

**3.5 · What a composition IS — the definition**
> A **document you write.** Made of your words, with captured things pulled into the writing. It is **made, never captured** — it can never just happen. It always appears in your compositions list. It can sit on many boards as cards. It is not a bit and never becomes one.

*(§2 gives the concept; this is the operative definition. Where they differ in wording, this one governs.)*

**3.6 · What it is NOT** ⛔
Not material · not a container things are placed *onto* (*"text-forward, like Notion"*) · not convertible to or from a bit · never auto-born · not a task manager — **though it holds facts about its own job** (a word-count target · a due date · who it's for), specified in Part III's lifecycle section *(owner: "that kind of project management layer")*.
