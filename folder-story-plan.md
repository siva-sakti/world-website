# The folder story — plan

**Status:** planned → building. UI wiring + presentation only — **no schema change** (`group_id`
exists on bit/board; `/group/[id]` page already exists, currently orphaned — nothing links to it).
Owner-ruled interaction (2026-08-31), after the FolderPicker conversion misfired (name styled as a
link that wasn't one; no menu on click; tiny target caused accidental navigation into the bit page).

## The rule (owner-approved)
**A folder's name, anywhere it's shown, is a link to the folder's page. Changing a bit/board's
folder is a separate ▾ menu beside it.** The display never morphs into a text box — typing lives
INSIDE the opened menu.

## The control (FolderPicker, same props, new interaction)
- In a folder: **name** (link → `/group/[id]`) + **▾** (opens the menu). No folder: one quiet grey
  trigger "no folder ▾" (not a link — nowhere to go).
- The menu (portaled under the trigger, like the pickers): a search line at top (autofocused) ·
  "no folder" row (when in one) · the folders, current ✓ · a `create "…"` row when the typed text
  matches nothing exactly (replaces the old prompt dialog). Arrows/Enter pick · Esc/click-away close.
- Busy (a write in flight) disables the trigger.

## Pieces
1. **Extract the shared menu** (`src/components/picker-menu.tsx`): the portaled positioned row-menu
   (position by anchor rect · highlight · mousedown-pick · close on scroll/resize/outside) used by
   BOTH SearchablePicker and the new FolderPicker — one menu, two triggers (input vs name+▾), so
   they can't drift apart. SearchablePicker's behavior is unchanged (the owner approved it).
2. **Rework `folder-picker.tsx`** to the rule above. Same props (`value/groups/busy/title/onPick/
   onNew`) → all three call sites (bits cards, bits rows, home rows) get it automatically.
3. **Bit detail page shows its folder** (`bit/[id]/page.tsx`): a quiet `folder · <control>` line in
   the meta area; fetch `listGroups`; reuse the existing `GroupPicker` client wrapper (note-card.tsx —
   it owns the setBitGroup/createGroup writes + refresh). Add `group_id` to the `Bit` type (the row
   already returns it — `select("*")`).
4. **Home folder headers**: the name keeps its accordion (expand-in-place is the container behavior
   there); add a quiet `→` link beside it to the folder's page. `/bits` + bit-page folder names link
   per the rule.
5. **The folder page** (`/group/[id]`): now reachable; sweep its stray "group" copy → "folder"
   (UI word is folder everywhere; code identifiers stay `group`).

## Edge trace
First folder created from the menu (create row) → filed + display updates · duplicate name typed →
exact match means no create row (pick the existing) · folder deleted elsewhere → member bits show
"no folder" (stale id finds no name) · select-mode on /bits captures card clicks, so the control is
inert there (correct) · menu closes on scroll so it never drifts from its trigger.

## Verify
tsc + lint + build green; owner feel-test: click name → folder page · ▾ → menu · type new name →
create files it · bit page shows the folder line · home → into a folder page.
