"use client";

import { useRef, useState, useMemo, useEffect, useCallback, type ElementType } from "react";
import { useRouter } from "next/navigation";
import type { GraphNode, GraphLink } from "@/lib/db/graph";

// A quiet, warm palette — words are the anchors (amber), bits are the app ink.
const GROUND = "#fffdfa";
const TAG = "#b5791f";
const BIT = "#1c1813";
const LINK = "rgba(28,24,19,0.10)";
const LINK_LIT = "rgba(181,121,31,0.60)";
const LINK_DIM = "rgba(28,24,19,0.03)";

type FGNode = GraphNode & { x?: number; y?: number };
type FGEnd = string | { id?: string };
type FGLink = { source: FGEnd; target: FGEnd };

function radius(kind: "tag" | "bit", degree: number) {
  const base = kind === "tag" ? 4 : 2.6;
  return base + Math.min(6, Math.sqrt(degree)) * (kind === "tag" ? 1.25 : 0.7);
}
const endId = (e: FGEnd) => (typeof e === "object" ? e.id ?? "" : e);

export function WordGraph({ nodes, links }: { nodes: GraphNode[]; links: GraphLink[] }) {
  const router = useRouter();
  const fgRef = useRef<{ zoomToFit: (ms?: number, px?: number) => void } | undefined>(undefined);
  const wrapRef = useRef<HTMLDivElement>(null);
  // react-force-graph is browser-only (canvas/window). Load it after mount so it
  // never runs during SSR, and so the ref reaches the real component (zoom-to-fit).
  const [FG, setFG] = useState<ElementType | null>(null);
  const [dims, setDims] = useState({ w: 800, h: 560 });
  const [hovered, setHovered] = useState<string | null>(null);

  const [loadErr, setLoadErr] = useState(false);
  useEffect(() => {
    let alive = true;
    import("react-force-graph-2d")
      .then((m) => alive && setFG(() => m.default))
      .catch(() => alive && setLoadErr(true)); // a failed chunk-load must not spin "loading" forever
    return () => {
      alive = false;
    };
  }, []);

  // Fresh clones — force-graph mutates nodes/links (adds x/y, resolves source/target).
  const data = useMemo(
    () => ({ nodes: nodes.map((n) => ({ ...n })), links: links.map((l) => ({ ...l })) }),
    [nodes, links],
  );

  // Adjacency, for the hover-to-trace highlight.
  const neighbors = useMemo(() => {
    const m = new Map<string, Set<string>>();
    for (const n of nodes) m.set(n.id, new Set());
    for (const l of links) {
      m.get(l.source)?.add(l.target);
      m.get(l.target)?.add(l.source);
    }
    return m;
  }, [nodes, links]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => setDims({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const isLit = useCallback(
    (id: string) => !hovered || id === hovered || !!neighbors.get(hovered)?.has(id),
    [hovered, neighbors],
  );

  return (
    <div ref={wrapRef} className="graph-canvas">
      {loadErr && <p className="p-4 text-sm text-neutral-500">Couldn&rsquo;t load the graph — reload the page.</p>}
      {FG && (
        <FG
          ref={fgRef}
          width={dims.w}
          height={dims.h}
          graphData={data}
          backgroundColor={GROUND}
          cooldownTicks={90}
          onEngineStop={() => fgRef.current?.zoomToFit(500, 60)}
          nodeLabel={() => ""}
          linkColor={(l: FGLink) =>
            hovered
              ? endId(l.source) === hovered || endId(l.target) === hovered
                ? LINK_LIT
                : LINK_DIM
              : LINK
          }
          linkWidth={(l: FGLink) =>
            hovered && (endId(l.source) === hovered || endId(l.target) === hovered) ? 1.6 : 1
          }
          onNodeHover={(n: FGNode | null) => setHovered(n ? n.id : null)}
          onNodeClick={(n: FGNode) =>
            router.push(n.kind === "tag" ? `/search?tag=${n.refId}` : `/bit/${n.refId}`)
          }
          nodeCanvasObject={(node: FGNode, ctx: CanvasRenderingContext2D, scale: number) => {
            if (node.x == null || node.y == null) return;
            const on = isLit(node.id);
            const isTag = node.kind === "tag";
            const r = radius(node.kind, node.degree);
            ctx.globalAlpha = on ? 1 : 0.1;
            ctx.beginPath();
            ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
            ctx.fillStyle = isTag ? TAG : BIT;
            ctx.fill();
            // Words are always labeled; bits label on focus or when zoomed in.
            const show = isTag || node.id === hovered || (on && !!hovered) || scale > 2.6;
            if (show) {
              const size = Math.max(3.5, (isTag ? 11 : 9.5) / scale);
              ctx.font = `${size}px ui-sans-serif, system-ui, -apple-system, sans-serif`;
              ctx.fillStyle = BIT;
              ctx.globalAlpha = on ? 0.92 : 0.1;
              ctx.textAlign = "center";
              ctx.textBaseline = "top";
              const label = node.label.length > 26 ? node.label.slice(0, 24) + "…" : node.label;
              ctx.fillText(label, node.x, node.y + r + 1.5);
            }
            ctx.globalAlpha = 1;
          }}
          nodePointerAreaPaint={(node: FGNode, color: string, ctx: CanvasRenderingContext2D) => {
            if (node.x == null || node.y == null) return;
            ctx.beginPath();
            ctx.arc(node.x, node.y, radius(node.kind, node.degree) + 2, 0, 2 * Math.PI);
            ctx.fillStyle = color;
            ctx.fill();
          }}
        />
      )}
      <div className="graph-legend">
        <span>
          <i style={{ background: TAG }} /> words
        </span>
        <span>
          <i style={{ background: BIT }} /> bits
        </span>
        <span className="graph-hint">scroll to zoom · drag to move · click a dot to open</span>
      </div>
    </div>
  );
}
