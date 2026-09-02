"use client";

import { useCallback, useEffect, useRef } from "react";
import type { CardVM } from "./card-vm";

// THE GEOMETRY REGISTRY (geometry-registry-plan.md; D-135 phase 2) — one ledger
// of every mounted card's TRUE rendered size, replacing four ad-hoc DOM measurers
// (tidy · fit · marquee · find-a-clear-spot). A ref-held map: nothing re-renders
// on a measure; consumers read at act time. x/y stay in card state — the ledger
// never copies what state already owns (derive, don't duplicate).
//
// THE TWO ANTAGONIST RULES THAT SHAPE THIS FILE:
//  · SEED SYNCHRONOUSLY in the ref callback (ResizeObserver's first delivery is
//    async; fitView runs in a mount effect — without the seed, board-open races
//    and sometimes frames phantom 60px text cards).
//  · STABLE callback identity per placementId (an inline callback would detach +
//    re-attach every card on every render — a 60fps observe storm during drags).
//
// The fallback when a card isn't in the ledger (state w/h) is LOAD-BEARING, not
// decorative: a pre-rename placementId reads null → fallback → exactly today's
// behavior. World units come free: offsetWidth/borderBoxSize are layout px,
// untouched by the camera's CSS transform.

export function useGeometry() {
  const sizes = useRef(new Map<string, { w: number; h: number }>());
  const observer = useRef<ResizeObserver | null>(null);
  const observedIds = useRef(new WeakMap<Element, string>());
  const callbacks = useRef(new Map<string, (el: HTMLElement | null) => void | (() => void)>());

  function ro(): ResizeObserver {
    if (!observer.current) {
      observer.current = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const pid = observedIds.current.get(entry.target);
          if (!pid) continue;
          const bb = entry.borderBoxSize?.[0];
          if (bb) sizes.current.set(pid, { w: bb.inlineSize, h: bb.blockSize });
          else {
            const el = entry.target as HTMLElement;
            sizes.current.set(pid, { w: el.offsetWidth, h: el.offsetHeight });
          }
        }
      });
    }
    return observer.current;
  }

  /** The ref-callback for a card's inner (data-pid) element — STABLE per
   *  placementId (cached), seeding synchronously, cleaning up on detach.
   *  (The Rnd root and the inner div are the same size — verified: inner is
   *  100%×100% border-box and the root adds no padding/border.) */
  const measure = useCallback((placementId: string) => {
    let cb = callbacks.current.get(placementId);
    if (!cb) {
      cb = (el: HTMLElement | null) => {
        if (!el) return; // React <19 null-call path; cleanup below handles 19+
        sizes.current.set(placementId, { w: el.offsetWidth, h: el.offsetHeight }); // the seed
        observedIds.current.set(el, placementId);
        ro().observe(el, { box: "border-box" });
        return () => {
          ro().unobserve(el);
          sizes.current.delete(placementId);
          callbacks.current.delete(placementId);
        };
      };
      callbacks.current.set(placementId, cb);
    }
    return cb;
  }, []);

  /** True size, or null (unmeasured / pre-rename id) — callers fall back to state. */
  const sizeOf = useCallback(
    (placementId: string) => sizes.current.get(placementId) ?? null,
    [],
  );

  /** The measured boxes in tidyPatches' exact input shape — state x/y zipped with
   *  ledger sizes, state w/h fallback where unmeasured. */
  const read = useCallback(
    (cards: CardVM[]): { card: CardVM; w: number; h: number }[] =>
      cards.map((card) => {
        const m = sizes.current.get(card.placementId);
        return { card, w: m?.w ?? card.w, h: m?.h ?? card.h };
      }),
    [],
  );

  // Dev-only probe handle (the stage-2 gate: ledger vs offsetWidth in a real
  // browser — owner-run). Same NODE_ENV gate as the undo readout; never ships.
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      (window as unknown as { __geo?: Map<string, { w: number; h: number }> }).__geo = sizes.current;
    }
  }, []);

  return { measure, sizeOf, read };
}
