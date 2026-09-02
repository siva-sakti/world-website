# The four remove paths — what must stay true through the collapse

| Aspect | unplaceSelected | trashSelected | bulkUnplace | bulkTrash | Unified? |
|---|---|---|---|---|---|
| confirm | none | trashOneConfirm(this bit's board count) | none | trashManyConfirm(n, shared) | stays at the DOOR, not in the runner |
| optimistic filter | placementId | bitId | selectedIds | selectedIds | all identify the SAME card: placement_bit_once |
| DB leg | settled→flush→unplaceBit→forget | settled→flush→trashBit→forget | same as singular | same as singular | one removeLeg(kind, card) |
| loose refresh | once, after landing | none | 1st landed + again at end if landed>1 | none | n=1 ⇒ 1st landed fires once, end-clause false ⇒ IDENTICAL |
| entry.settled | record()'s 5th arg = act | same | allSettled(legs) assigned after | same | allSettled([leg]) ≡ act for n=1 |
| fail(entry) | on any failure | on any failure | when failedLegs === chosen.length | same | n=1 ⇒ 1===1 ⇒ IDENTICAL |
| undo | reviveOne | restoreBit+re-add | runLegs(live→reviveOne) | runLegs(live→restore) | runLegs over 1 leg ≡ the leg |
| redo | unplaceOne | inline trash-redo | runLegs(live→unplaceOne) | runLegs(live→trash-redo) | extract trashOne/restoreOne |
| J1 landedSet | absent (single) | absent | present | present | harmless at n=1 |
| clear selection on EMPTY | n/a | n/a | still clears | early-return clears | runner clears BEFORE the empty check |

## The ONE genuine behaviour change (not identical — flagged, not hidden)

Today, if the card is NOT in local state, `snap` is undefined: the entry is null but the
DB write STILL FIRES (a blind un-place/trash against that placementId). After the
collapse, an empty `chosen` means the gesture no-ops.

Reachable? The button lives on the selected card's own bar / the toolbar over a live
selection, so the card must be on screen to press it. Judged unreachable via the UI.
Not preserved, because preserving it means writing code for a case that cannot happen —
which the house rules forbid ("no handling for errors that can't happen").

## Order-of-effects note
Original: setCards(filter) → clearSelection() → setEditingId(null).
New:      clearSelection() → setEditingId(null) → setCards(filter).
React batches these; the committed state is identical.
