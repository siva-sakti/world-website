# Product concept — the people and their flows

> ## STATUS · 2026-08-30
> **🟢 SETTLED**
> · **teach with cases and examples, not definitions**
> · **invitation, never mandate** — a board alone can be the whole value
> · **one persona per medium is too coarse** — a video essayist ≠ a novelist ≠ a magazine writer
> · people move in **either direction** (board→composition and composition→board)
>
> **🔵 CLAUDE'S FRAMING** (offered, liked, not adopted as the owner's)
> · the flow **template** · the "must land one seam" rule · the identity-question opening
>
> **⚪ OPEN — the big one**
> · **the personas themselves are unwritten.** ⚑ **The owner writes the characters.** Standing rule: no AI-written user-facing voice.
> · what onboarding actually shows on first run
>
> **Nothing here is enacted.** Onboarding (N7) is unbuilt and unscheduled.

**Related:** `product-concept-promise.md` (what we're promising them) · `product-concept-language.md` (the words we use) · `user-flows.md` Arc 0 (the technical mechanism, downstream) · `vision-and-language.md` (the phrase bank).

---

## 1 · Who it's for

**The starting picture** (from `vision-and-language.md`, Aug 25): **the multi-mind** — someone with many interests running at once (reading, astrology, economics, drawing) who's never had one home that holds the visual side, the knowledge side, and the writing side without making them choose which kind of person they are.

**The picture deepened** (Aug 30): not just someone with many interests — **someone with a practice**, which is much bigger than the thing they produce. See `product-concept-promise.md` §2 and §2b.

**⛔ REJECTED by the owner (2026-08-30):** Claude proposed narrowing to *"the creative person with no infrastructure"* — someone with a serious practice and no gallery/agent doing the surround for them. **The owner rejected it as too narrow:** *"it doesn't have to be people with no infrastructure — I think people even **with** infrastructure want their own spaces for it."*

**🟡 The owner's direction instead — broader identities, not a narrower niche:** *"not just a creative person. I think even a **student** can do it… someone who is creating things — a **creator**, a **scholar** — things like this, broader identities."* Plus **multi-mind**, which they still like.

⚪ **Still open, per the owner** (*"I still think we need to think through this a little bit"*): what actually unites creator · scholar · student · multi-mind? Candidate: **anyone with more threads running than one tool holds** — but that's Claude's phrasing, untested. The answer changes who every persona flow is written for.

## 2 · Why we show instead of define 🟢

**You cannot define a creative tool into someone's head.** Show them someone like them moving through it and they recognise themselves — and recognition does what a definition never can.

> **Definitions describe; flows invite.**

The owner arrived here themselves, via Sruthi, and named the shift: *"this is where I'm feeling like this is so much better… I'm loving this way more than trying to define it in a literal way."*

**Three birds, one stone:** the flows are the **onboarding** *and* the **positioning** *and* raw material for the **philosophy voice**. That's also why they should be written as real onboarding content rather than as a strategy artifact — a doc that ships can't rot.

## 3 · The rules for a flow 🔵

1. **Show the arc** — catch, hold, shape, in whatever order that person actually works.
2. **Land at least one seam** — one *"wait, it all lives together here?"* beat. **That beat is the pitch.**
3. **Invitation, never mandate** 🟢 — a board alone can be a finished thing. No required last step.
4. **Any direction** 🟢 — some scatter then write; others write then arrange.
5. **Medium-agnostic, never medium-forced** — support visual gathering richly (many creatives think in images) but never require it (a writer may have zero).
6. **Reach past the making** — the strongest flows touch the surround (chasing exhibitions, writing the statement, finding which publications to pitch). That's where "home base" gets *proven* rather than asserted.

## 4 · The template 🔵

> **[Name], a [maker], making [a thing].**
> → what they catch (mixed bits)
> → where they spread it (a board)
> → **the seam** (the crossing — the hero moment)
> → what they shape / offer

## 5 · The way in 🔵

Open with an **identity question** — *"what do you make?"* / *"who are you creatively?"* — then show a **range** of flows, not one rigid path. **People see themselves in pieces of several**, which is the point; the range is doing the work, not any single story.

⚪ **Open:** is the identity question a real screen, or just the shape of the copy? Asking someone to self-classify before they've seen anything is a known onboarding risk.

## 6 · The persona set — ⚑ EMPTY. The owner writes these.

The frame stays consistent; the craft is the owner's.

**The seed that started it — Sruthi**, in the owner's words: a musician who *"loves to have drafts of song ideas written out but also next to that hand-doodles things, and an outfit she wants to wear while performing"* — her ideas live in notes, then come together on an **album-idea board**, with **album art as one corner of that board, or its own board linked from it.**

Notice what her story is already doing: **every magic beat in it is a seam.** The doodle beside the draft · the board reaching another board · the notes becoming an album board. That's why the seam rule exists.

### ⭐ THE TWO LEVELS — the owner's distinction, 2026-08-30 (read this before the cut below)

> *"There's two levels, right. One is actually what we're using to **inform the features** we're building. The other is **how do we frame it to people** once it's built, to help them onboard and use the product."*

**This is the organising idea for the whole file, and it resolves the two-axis question below.** The same persona work serves two jobs that should not be run together:

| | **LEVEL 1 — informing the build** | **LEVEL 2 — framing it for people** |
|---|---|---|
| **the question it answers** | what should we make? | how do they recognise themselves? |
| **the axis that serves it** | **how their mind moves** | **the work they do** (their identity) |
| **the audience** | us | them |
| **where it lands** | `organize-phase-plan.md` — the build queue | onboarding · the landing · the flows |
| **how many categories** | few — 4–6 motions is plenty | many — as granular as recognition needs |

⚠ **And the reason to keep them apart is protective, not tidy.** **Conflating them is exactly how you end up building domain modules** — the thing the positioning rule forbids. "Fashion designer" read as a *build* input suggests a fashion-designer feature. Read as a *framing* input it suggests nothing but a story. **Identity belongs at level 2 only.**

---

### Level 1 · What each mind-motion actually asks the app for 🔵

*(Developing this rather than just naming it — the motions are only worth having if they change the build. Claude's analysis; unchecked.)*

| the motion | what it demands of the app | already there? |
|---|---|---|
| **gathers first, shapes later** | frictionless capture · a board that holds a lot without becoming a mess · genuinely good re-finding | mostly — capture is good; phone capture isn't built |
| **drafts first, arranges after** | writing as a first-class room · **a way to break a draft into pieces and put them on a board** | ⚠ **half** — `/write` exists; there's no "explode this into bits" move |
| **works from a question**, not from material | the question itself has to be a thing you can hold and return to — a board *about* a question, not about a topic | ⚪ **nothing.** A board has a title, not a stance |
| **never converges** — the board *is* the output | the board must be a legitimate **endpoint**: presentable, shareable, finishable | ⚠ blocked on privacy/publishing |
| **holds many projects at once** | folders · alive/the desk · fast context-switching | ✅ largely built (D-116/D-117/D-119) |

**What this table is for:** it turns "different minds work differently" from a nice sentence into a **build input**. Two of the five motions are underserved and one is unserved entirely — and none of that is visible from a feature list.

⚪ **Open:** is "works from a question" real, or Claude's invention? It's the one with no evidence behind it.

---

### ⚠ The motions were TOO HIGH-LEVEL — the owner's correction

> *"'Gathering first and shaping later' — what does that even mean? What are the **actual steps** that people do? I think that's a much better way to ground it."*

**Accepted.** A motion is a *shape*, not a description of anybody's day. It only earns its place once it's broken into the real steps — and the steps are where the gaps show up. The table above says "gathers first, shapes later ✅ mostly." **Grounded in actual steps, that turns out to be false.** See below.

**Also ruled by the owner: several scenarios per person, not one.** *"It'd be nice to have several ideas for the same type of person — how they might work, different points and projects. A songwriter is also posting content… they're ideating, they're collecting, they're gathering, they're writing, they're having different albums."*

> **The structure is: one kind of person × several real situations.** One story per persona makes the app look narrow. **The same person across five situations is what proves "the whole process."**

**And the division of labour, following the two levels:**
- **the steps and the gaps** = analysis, build-informing → **Claude's job** (level 1)
- **the character, the story, the words** = ⚑ **the owner's job** (level 2)

---

### Worked example — the songwriter, five situations (LEVEL 1 analysis only)

*Building on the owner's Sruthi seed. These are the steps, not the story.*

**① Writing one song — the "gathers first" motion, actually broken down**

| # | the real step | what it needs | do we have it? |
|---|---|---|---|
| 1 | a melody arrives walking / driving / in the shower | **capture audio in seconds, on a phone** | ❌ **no audio bits at all. No phone capture.** |
| 2 | a lyric fragment occurs to her | jot from anywhere | ⚠️ jot exists; **phone capture doesn't** |
| 3 | she sees something carrying the mood — a film still, a line in a book | clip / screenshot with its source | ✅ built (and source auto-titles) |
| 4 | weeks pass; it sits in three different apps | **one place it all lands** | ✅ *this is the core promise* |
| 5 | she sits down and tries to remember what she had | re-finding; seeing it at once | ✅ boards · find · the pull |
| 6 | she pulls the pieces together and sees a through-line | **the board** | ✅ **the strongest thing we have** |
| 7 | she drafts lyrics, reaching for the fragments | **gather (`[[`)** | ✅ built |
| 8 | she records a demo against the draft | audio beside the words | ❌ no audio |

> ⚠ **The finding: her very FIRST step is a voice memo, and the app has no audio.** The motion table said "gathers first, shapes later — mostly ✅." Grounded in steps, **the entry point of the whole flow is missing.** This is exactly what the owner meant by "too high-level."

**①b — MORE SONGWRITER SCENARIOS (owner-asked 2026-08-30 — Sruthi was one quick idea, not the range).** Candidates, skeletal level-1 — ⚑ the stories stay the owner's:
- **the lyrics-first writer** — writes poems/fragments, sets them to music later. The composition-first direction, in this persona.
- **the producer type** — collects samples, field recordings, sonic references; arranges an *audio moodboard*. Hits the audio gap hardest of anything yet.
- **the covers performer** — learning songs: chord charts, technique clips, practice notes. **The learning area, inside a musician's life.**
- **release week** — the surround at full pressure: content, dates, links, coordination. (dates gap again.)
- **the merch / visual-identity run** — posters, merch, album art direction. The craft/design crossover inside music.
Each is a different **entry door** into the same home; together they prove range *within* one identity — the owner's point that one story per person makes the app look narrow.

**② Developing an album** — many songs at different stages · a mood for the whole · art direction · **track sequencing**.
→ ✅ a board per album; songs as compositions; a moodboard for the art. ⚠ **sequencing is ORDERED and a board is spatial** — expressible, but nothing supports "this is the order."

**③ Posting content** — post ideas · clips · captions · a rough schedule.
→ ✅ bits + a board. ❌ **no date you set**, so "when am I posting this" has no home. *(Same gap as `tables-and-structured-data.md`.)*

**④ Preparing to perform** — setlist (ordered) · outfit · run of show · gear.
→ ✅ the owner's own Sruthi detail (the outfit) lands here. ⚠ **ordered lists again.**

**⑤ Pitching & submitting** — playlists · labels · sync licensing · who she's contacted · deadlines.
→ ❌ **this is the surround, and it's the structured-data gap.**

### What the five situations expose, together

Three gaps, each showing up in more than one situation — which is the test of whether a gap is real:

| gap | appears in | note |
|---|---|---|
| **audio bits** | ①, ② | a musician's *first* capture; `lexicon.md` already lists `audio` as a planned bit type |
| **ordered lists** | ②, ④ | sequencing and setlists. Boards are spatial; nothing says "this order" |
| **a date you set** | ③, ⑤ | posting schedule, deadlines. → `tables-and-structured-data.md` |

---

## ⭐ THE WRITER PASS (drafted 2026-08-31 — ⚑ AWAITING THE OWNER'S CORRECTIONS FROM LIFE)

**Why this persona first:** the owner *is* one, and the house method is *scenarios-from-life-never-from-plans*. This is the only persona with a live oracle attached. **Claude drafted the steps; the owner corrects them.** Everything below is 🔵 until she does.

### ① Writing an essay

| # | the step | needs | have it? |
|---|---|---|---|
| 1 | an idea nags — a half-thought while reading something else | jot, from wherever she is | ⚠️ jot ✅ · **phone capture ❌** |
| 2 | over weeks she notices things that belong to it — a quote, a screenshot, a line from a podcast | catch + tag as belonging | ✅ bits · tags · source |
| 3 | it reaches critical mass and she decides to write it | **something that says "you have 12 things about this"** | ⚠️ `tag_counts` exists but nothing *surfaces* accumulation to her |
| 4 | she finds everything she caught for it | the pull · find | ✅ built |
| 5 | she spreads them out to see the shape — what's the argument? | the board | ✅ **the strongest thing we have** |
| 6 | she drafts, reaching for quotes as she writes | gather (`[[`) | ✅ built |
| 7 | she restructures — moves whole sections around, cuts, reorders | **moving CHUNKS of a long text spatially** | ❌ a composition is one text body; this is *document mode* (parked) |
| 8 | she checks a source she half-remembers | the source page | ✅ built |
| 9 | it's finished and goes out into the world | **somewhere finished work lives** | ⚪ → **pieces** (proposed, unbuilt) |

### ② Pitching publications *(the owner's own founding example)*

| # | the step | needs | have it? |
|---|---|---|---|
| 1 | she reads a piece she admires and notes where it ran | catch with source | ✅ |
| 2 | she looks up submission guidelines — a URL, a window, a fee | a link + **a date** | ⚠️ source ✅ · **date ❌** |
| 3 | she keeps a running list of candidates | a list that's also spreadable | ⚪ → `tables-and-structured-data.md` |
| 4 | she matches a finished piece to a publication | seeing both at once | ✅ **adjacency — the whole argument** |
| 5 | she writes the pitch, **often reusing a previous pitch** | **a composition built from other compositions** | ❌ **notes-in-notes is UNDECIDED in the model** |
| 6 | she sends it and records that she did | status | ⚠️ tags approximate it |
| 7 | she follows up; a response comes back | date + status again | ❌ |

### ③ Researching something that may never become anything

| # | the step | needs | have it? |
|---|---|---|---|
| 1 | curiosity strikes — she starts reading about Gzhel pottery | catch, with no project attached | ✅ **a bit needs nothing to exist** |
| 2 | she collects images, articles, a video, quotes | mixed media in one place | ✅ (video ❌) |
| 3 | she doesn't know if this is going anywhere | **a home that doesn't demand an output** | ✅ — *this is the seventh area, and the app already allows it* |
| 4 | it sits, accumulating, for months | nothing needed | ✅ |
| 5 | **six months later, how does she find her way back?** | it isn't *alive*; she may not recall the word | ❌ **the wander-back surface — the browse/feed, deliberately deferred** |
| 6 | it ends up feeding a different piece entirely | one bit in many constellations | ✅ tags + many boards |

### ④ Prepping a talk, a speech, or a hard conversation

| # | the step | needs | have it? |
|---|---|---|---|
| 1 | the occasion is known | — | — |
| 2 | she gathers what she wants to say — points, stories, quotes | ✅ | ✅ |
| 3 | **she puts them in order** — this, then this | **ordered sequence** | ❌ **ordered lists** *(same gap as the setlist)* |
| 4 | she condenses to something glanceable in the moment | **a second, compact rendering of the same content** | ❌ |
| 5 | afterward, what she actually said differs from the plan | catch the aftermath | ✅ jot |

### ⑤ The commonplace thread *(the one that just accumulates)*

| # | the step | needs | have it? |
|---|---|---|---|
| 1 | she reads constantly and marks lines that strike her | **capture from where she reads** — book, Kindle, article | ❌ phone/highlight capture (parked, Phase 5) |
| 2 | no project — pure accumulation | ✅ | ✅ |
| 3 | months later a line resurfaces and seeds something | **rediscovery by wandering, not searching** | ❌ **the browse surface again** |
| 4 | she sometimes browses it just for pleasure | a surface worth visiting | ❌ *(`philosophy.md`: "wander back the way I used to wander through my own Tumblr")* |

### What the writer pass exposes — six gaps

| gap | appears in | status |
|---|---|---|
| **ordered lists** | ④ *(+ songwriter ②④)* | 🔴 **confirmed across two personas — the strongest signal so far** |
| **a date you set** | ② *(+ songwriter ③⑤)* | 🔴 **confirmed across two personas** |
| **the wander-back surface** (browse/feed) | ③, ⑤ | 🔴 **twice in one persona** — and `philosophy.md` names it as the point. Deliberately deferred; **this pass is the evidence to re-open it** |
| **composition → composition gather** (notes-in-notes) | ② | 🆕 **NEW, and it's a live model question** — `parked` lists notes-in-notes as *undecided*. Pitching needs it |
| **capture from where you read** (highlights) | ⑤ | parked (Phase 5) — now with a named use |
| **restructuring long text spatially** | ① | *document mode* — parked, own design round |

**Two observations worth the owner's eye:**
1. **③ is the persona's happiest scenario and needs almost nothing built** — the app already allows curiosity with no output. That's evidence the *wide door* (§Finding 1) is real and mostly already true, not aspirational.
2. **The one thing ③ and ⑤ both fail on is the same thing:** coming back by wandering rather than searching. Return was demoted to "amplifier" — correctly, as a *differentiator*. But as a **gap in the writer's actual week it shows up twice**, and `philosophy.md` still calls it the point. ⚑ Worth the owner's reconciliation: *not the pitch, but maybe still the build.*

---

### The run order for the remaining passes (proposed 2026-08-30)

1. **The writer — FIRST.** The owner *is* one; the house method is scenarios-from-life-never-from-plans, and this is the only persona with a live oracle attached. Situations to walk: writing an essay · pitching publications (the owner's own founding example) · researching a topic that may never become anything · prepping a talk · the commonplace thread that just accumulates.
2. **The collector-thinker — SECOND.** The no-output person (arguably the median Are.na user). This pass tests two claims at once: whether the Are.na market is really takeable, and whether *invitation-not-mandate* is **structurally** true — does the app hold up for someone who never converges at all? Also the persona that carries the proposed seventh area (learning/thinking for its own sake — see `product-concept-promise.md` §2, Finding 1).
3. **Visual artist, then video essayist** — each will likely surface a different three gaps, the way the songwriter surfaced audio · ordered lists · a date you set.

**Division of labour every pass:** Claude drafts the situations and steps (level 1); ⚑ the owner corrects them from life and later writes the characters (level 2).

⚑ **This is the "are we being comprehensive" check the owner asked for, run once properly.** Running the same five-situation pass on a writer, a visual artist and a video essayist would likely surface a different three — **that's the next real piece of work here**, and it produces build inputs rather than opinions.

---

### 🟡 THE CUT — two axes, not one (worked 2026-08-30)

**⛔ Claude's first proposal was half-right and got corrected.** I proposed dropping the *medium* axis entirely and cutting only by how the mind moves. The owner: *"I definitely agree we should be specific about job titles — are you creating content on social media? are you doing video essays? are you writing? We should definitely break these things out."*

*(Also: **"medium" was jargon** — it meant *the material you work in*: music, paint, film, words. Dropped as a word; say "the work they do.")*

**The reconciliation — each persona carries BOTH:**

| axis | what it does | example |
|---|---|---|
| **the work they do** (specific, not a category) | **recognition** — the door. *"that's me."* Must be granular: not "a writer" but *a magazine writer* / *a video essayist* / *someone making social content*. 🟡 The owner: hold it as **their identity**, "for data / understanding" — i.e. **level 2 only**, and possibly something a person tells us at onboarding. | *a video essayist* |
| **how their mind moves** | **the demonstration** — what the app is actually showing about itself | *gathers first, shapes later* |

> **The job title is the door; the motion is the content.** Cutting by title alone gives five look-alike stories. Cutting by motion alone means nobody recognises themselves. **Both, in every persona.**

**The motions worth spanning** 🔵 *(Claude's list — unchecked):*
- gathers first, shapes later
- drafts first, arranges after
- works from a **question**, not from material
- **never converges** — the board *is* the output
- holds **many projects at once**

**⭐ THE OWNER'S IDENTITY LIST (2026-08-30 — the internal list, level 2 / "for data & understanding"):**
**artist · musician · writer · video maker · craftsperson · scholar · builder** *(builder = technology)*. ⚠ *"craftsperson" is Claude's read of a dictation garble ("class person") — confirmed by the owner's own jewelry/makeup-brand example landing in "craft"; ⚑ owner confirms the word.*

**The owner's two open placements, with Claude's thinking:**
- **Designer** (home · digital/graphic · fashion — the owner listed four kinds with no home): 🔵 **its own identity, not a sub-case.** "I'm a designer" is among the strongest self-identifications there is; let the kinds be flavors inside it.
- **The small-brand owner** (the makeup brand, the jewelry maker): 🔵 **don't place them — let them place themselves.** "I make jewelry" walks through the craftsperson door; "I run a brand" walks through builder. Both doors lead in.

**The principle that falls out** 🔵: **identities should be what people actually call themselves** — the job is *recognition*, so the taxonomy is tested against real self-descriptions, never engineered. **And let people pick SEVERAL:** the multi-mind choosing three identities at onboarding *is* the multi-mind being seen — the product's first promise kept on its first screen.

**Candidate additions** ⚪: **photographer** (large, strongly self-identified) · possibly **performer** (dancer · actor). Stop before chef/gardener — every row must earn its place. *(Earlier granular roles — video essayist · magazine writer · social-content creator — sit INSIDE these identities as situations, not beside them.)*

**The roles worth spanning** — ⚑ *the owner's comprehensiveness check, explicitly NOT a build list:* video essayist · novelist · magazine writer · social-content creator · musician · painter · **fashion / clothing designer** · scholar · student · founder/designer. The owner: *"I don't know what we'll exactly do with that information, I don't wanna get into details — I was using it to check **are we being comprehensive here**."*

🟡 **And the owner is open to inventing our own framing:** *"maybe we make up our own way to think about this."* The two-axis cut above is a candidate, not a conclusion.

| # | maker | the seam it should land | written? |
|---|---|---|---|
| 1 | **musician** — *Sruthi* | mixed media in one space · notes → board · board → board | 🔲 |
| 2 | **writer / essayist** | composition-first → board to arrange the argument | 🔲 |
| 3 | **painter / visual artist** | board-heavy: references + studies → a statement in the corner | 🔲 |
| 4 | **filmmaker / video essayist** | a shot board ↔ a script, crossing constantly | 🔲 |
| 5 | **founder / designer** — "creative in the world" | a moodboard, a pitch, a plan | 🔲 |

⚑ **Granularity warning from the owner:** one persona per medium is too coarse. *"Someone making video essays is going to be different than a writer of a book or a writer of a magazine article."* The range may need to be finer than five.

## 7 · What this means for onboarding

Currently **N7 in `organize-phase-plan.md`**, scheduled last, unbuilt. `user-flows.md` Arc 0 holds the old curriculum: a progressive 1-2-3 — catch a bit → put it on a board → write a note → mark something alive.

⚠ **That curriculum is now suspect** (not yet changed — `user-flows.md` is a settled doc): it teaches a **pipeline**, and the surfaces are peers in either order. Teaching order-of-operations would teach the wrong thing on first contact.

⚪ **Open — what replaces it?** The candidate: identity question → a range of flows → let people find their own path. Not decided.

**The technical mechanism is already sketched** (Arc 0): detect first-run = *this owner has 0 boards and 0 bits* → either a seeded starter board or a guided intro → persist an `onboarded` flag. That part is unaffected by any of this.

## 8 · Open questions

1. ⚪ **The characters themselves** — the whole file waits on them. Nothing downstream (onboarding, the landing surface, the pitch) can be written first.
2. ✅ ~~**Multi-mind vs. creative-practitioner** — same person or two?~~ **ANSWERED by the owner, 2026-08-30: don't unify.** *"For the market it's really nice to say these different personas and make people feel seen and understand how different minds work."* **The range IS the answer** — stop hunting for the single defining trait. *(Claude had proposed philosophy's "I take in more than I keep" as the unifier; the owner rejected it as personal, not positional.)*
3. ⚪ **Is the identity question a screen or just a tone?** Asking someone to self-classify before they've seen anything is a known onboarding risk.
4. ⚪ **How many personas, and how many situations each?** The structure is now *one kind of person × several real situations* — so the count is two-dimensional. The songwriter took five situations. ⚑ Is five the right depth, and how many people?
5. ⚪ **Does the range accidentally exclude someone?** The set assumes people who *make*. **A person who only collects and thinks — no output — is a real user of tools like this** (and arguably the median Are.na user), and no flow covers them. ⚠ This one sharpened once Are.na became the market precedent.
