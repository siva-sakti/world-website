# Resurfacing while you write — future ideation

> ## STATUS · 2026-09-02 · 🟠 IDEATION · **V2, owner-loved** (*"I love that — definitely a v2"*)
> The beginning of the thinking, per the owner's ask. Not a spec, not scheduled.

## The idea
You're deep in a piece. A quiet section of the drawer — working name *"from your world"* — keeps pace with your writing: things you caught months ago that share ground with the paragraph you're typing, sitting ready in the periphery. **Never interrupts. Never suggests. Just has them ready when you glance.** Your past self as a collaborator — the knowledge layer made active *during* creation, which nothing in the category does.

## The design constraints (from the settled philosophy — these are hard lines)
- **Pull, not push.** It's a place you glance, never a popup, never a nudge mid-sentence.
- **Ignorable and hideable.** A section you can collapse forever; the writing surface stays sovereign.
- **No algorithm curating you.** It shows matches, ranked by nothing cleverer than overlap and recency; the owner's hand does all meaning-making.
- ⚠ **The never-list check:** "no AI features" is standing. Tiers 1–2 below are search, not AI. Tier 3 crosses the line and would need the owner to re-rule the list — flagged, not assumed.

## Implementation sketches — three tiers, first one buildable today
**Tier 1 · word overlap (no new anything).** As the current paragraph changes (debounced ~2s), extract its salient words (drop stopwords), run them through the existing search machinery (`lib/search` client-side over already-loaded bits, or `search_tsv` server-side). Top 3–5 non-already-pulled bits appear in the drawer section. *All existing parts: the pull's logic pointed at the paragraph instead of a tag.*
**Tier 2 · overlap + shared tags + shared boards.** Boost matches that also share a tag with the piece, or sit on a board the piece is placed on. Still pure record-arithmetic; noticeably smarter feel.
**Tier 3 · semantic match (embeddings).** "Attention" surfacing a bit about "focus." This is the real intelligence layer the owner sensed — and the never-list gate. Park until she rules; tiers 1–2 may be plenty.

## Open questions when this wakes
Does it run in the floater too, or page-only? · does glancing at it feel like a gift or noise **in real use** (feel-test on tier 1 before any tier 2) · what the section is called (naming session).
