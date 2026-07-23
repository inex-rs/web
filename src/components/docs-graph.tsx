// Positions written imperatively (refs/setAttribute) each tick, not via Solid reactivity — d3 mutates plain node objects Solid won't track.

import {
  type Component,
  createEffect,
  createMemo,
  createResource,
  createSignal,
  For,
  onCleanup,
  onMount,
} from "solid-js";
import { useNavigate } from "@solidjs/router";
import { createEventListener } from "@solid-primitives/event-listener";
import {
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from "d3-force";
import { DOCS, stripFrontmatter } from "../lib/docs.ts";

type Edge = [number, number];

let edgeCache: Promise<Edge[]> | undefined;
async function loadEdges(): Promise<Edge[]> {
  const idx = new Map(DOCS.map((d, i) => [d.slug, i]));
  const seen = new Set<string>();
  await Promise.all(DOCS.map(async (d) => {
    if (!d.file) return;
    const res = await fetch(`/docs/${d.file}`);
    if (!res.ok) return;
    const text = stripFrontmatter(await res.text());
    const i = idx.get(d.slug)!;
    for (const m of text.matchAll(/\]\(\/docs\/([a-z0-9/-]+)\)/g)) {
      const j = idx.get(m[1]);
      if (j !== undefined && j !== i) {
        seen.add(i < j ? `${i}:${j}` : `${j}:${i}`);
      }
    }
  }));
  return [...seen].map((k) => k.split(":").map(Number) as Edge);
}

type GNode = SimulationNodeDatum & { i: number };

const PAD = 14;
const LINK_DISTANCE = 46;
const CENTER_STRENGTH = 0.06;

export const DocsGraph: Component<{ current: string }> = (props) => {
  const navigate = useNavigate();
  const [edges] = createResource(() => (edgeCache ??= loadEdges()));
  const [hover, setHover] = createSignal(-1);

  const n = DOCS.length;
  const nodes: GNode[] = DOCS.map((_, i) => ({ i }));
  let W = 280, H = 240;

  let svg!: SVGSVGElement;
  const lineEls: SVGLineElement[] = [];
  const dotEls: SVGCircleElement[] = [];
  let labelEl: SVGTextElement | undefined;

  const seed = () => {
    for (let i = 0; i < n; i++) {
      const a = i * 2.399963; // golden angle
      const r = Math.min(W, H) * (0.16 + 0.32 * Math.sqrt(i / n));
      nodes[i].x = W / 2 + r * Math.cos(a);
      nodes[i].y = H / 2 + r * Math.sin(a);
      nodes[i].vx = 0;
      nodes[i].vy = 0;
    }
  };

  const degree = createMemo(() => {
    const deg = new Array(n).fill(0);
    for (const [a, b] of edges() ?? []) {
      deg[a]++;
      deg[b]++;
    }
    return deg;
  });
  const radius = (i: number) => 3 + Math.min(4, (degree()[i] ?? 0) * 0.7);

  const currentIdx = () => DOCS.findIndex((d) => d.slug === props.current);
  const linkedToHover = createMemo(() => {
    const h = hover();
    const set = new Set<number>();
    if (h < 0) return set;
    for (const [a, b] of edges() ?? []) {
      if (a === h) set.add(b);
      if (b === h) set.add(a);
    }
    return set;
  });

  const sim = forceSimulation<GNode>(nodes).stop();

  const draw = () => {
    const es = edges() ?? [];
    for (let e = 0; e < es.length; e++) {
      const el = lineEls[e];
      if (!el) continue;
      const [a, b] = es[e];
      el.setAttribute("x1", nodes[a].x!.toFixed(1));
      el.setAttribute("y1", nodes[a].y!.toFixed(1));
      el.setAttribute("x2", nodes[b].x!.toFixed(1));
      el.setAttribute("y2", nodes[b].y!.toFixed(1));
    }
    for (let i = 0; i < n; i++) {
      const el = dotEls[i];
      if (!el) continue;
      el.setAttribute("cx", nodes[i].x!.toFixed(1));
      el.setAttribute("cy", nodes[i].y!.toFixed(1));
    }
    const li = hover() >= 0 ? hover() : currentIdx();
    if (labelEl) {
      if (li >= 0) {
        labelEl.textContent = DOCS[li].title;
        labelEl.setAttribute(
          "x",
          Math.max(34, Math.min(W - 34, nodes[li].x!)).toFixed(1),
        );
        labelEl.setAttribute(
          "y",
          Math.max(12, nodes[li].y! - radius(li) - 6).toFixed(1),
        );
        labelEl.setAttribute("visibility", "visible");
      } else {
        labelEl.setAttribute("visibility", "hidden");
      }
    }
  };

  createEffect(() => {
    hover();
    currentIdx();
    draw();
  });
  createEffect(() => {
    const es = edges();
    if (!es) return;
    sim.force(
      "link",
      forceLink<GNode, SimulationLinkDatum<GNode>>(
        es.map(([a, b]) => ({ source: a, target: b })),
      ).distance(LINK_DISTANCE),
    );
    sim.force("collide", forceCollide<GNode>((d) => radius(d.i) + 1.5));
    sim.alpha(1).restart();
  });

  onMount(() => {
    const r = svg.getBoundingClientRect();
    if (r.width > 40 && r.height > 40) {
      W = Math.round(r.width);
      H = Math.round(r.height);
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    }
    seed();
    sim
      .force("charge", forceManyBody<GNode>().strength(-40).distanceMax(150))
      .force("x", forceX<GNode>(W / 2).strength(CENTER_STRENGTH))
      .force("y", forceY<GNode>(H / 2).strength(CENTER_STRENGTH))
      .on("tick", () => {
        for (const nd of nodes) {
          nd.x = Math.max(PAD, Math.min(W - PAD, nd.x!));
          nd.y = Math.max(PAD, Math.min(H - PAD, nd.y!));
        }
        draw();
      });
    draw();

    let t: ReturnType<typeof setTimeout> | undefined;
    const ro = new ResizeObserver(([e]) => {
      const nw = Math.round(e.contentRect.width);
      const nh = Math.round(e.contentRect.height);
      if (nw < 40 || nh < 40 || (nw === W && nh === H)) return;
      clearTimeout(t);
      t = setTimeout(() => {
        const sx = nw / W, sy = nh / H;
        for (const nd of nodes) {
          nd.x! *= sx;
          nd.y! *= sy;
        }
        W = nw;
        H = nh;
        svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
        sim
          .force("x", forceX<GNode>(W / 2).strength(CENTER_STRENGTH))
          .force("y", forceY<GNode>(H / 2).strength(CENTER_STRENGTH));
        draw();
        sim.alpha(0.2).restart();
      }, 150);
    });
    ro.observe(svg);

    let dragging = -1;
    let downAt: { x: number; y: number } | null = null;
    const toLocal = (e: PointerEvent) => {
      const b = svg.getBoundingClientRect();
      return {
        x: ((e.clientX - b.left) / b.width) * W,
        y: ((e.clientY - b.top) / b.height) * H,
      };
    };
    const onMove = (e: PointerEvent) => {
      if (dragging < 0) return;
      const p = toLocal(e);
      nodes[dragging].fx = Math.max(PAD, Math.min(W - PAD, p.x));
      nodes[dragging].fy = Math.max(PAD, Math.min(H - PAD, p.y));
    };
    const onUp = (e: PointerEvent) => {
      if (dragging < 0) return;
      const i = dragging;
      dragging = -1;
      nodes[i].fx = null;
      nodes[i].fy = null;
      sim.alphaTarget(0);
      if (downAt) {
        const moved = Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y);
        if (moved < 5) navigate(`/docs/${DOCS[i].slug}`);
      }
      downAt = null;
    };
    createEventListener(globalThis.window, "pointermove", onMove);
    createEventListener(globalThis.window, "pointerup", onUp);
    onCleanup(() => {
      clearTimeout(t);
      ro.disconnect();
      sim.stop();
    });

    startDrag = (i, e) => {
      dragging = i;
      downAt = { x: e.clientX, y: e.clientY };
      nodes[i].fx = nodes[i].x;
      nodes[i].fy = nodes[i].y;
      sim.alphaTarget(0.3).restart();
    };
  });

  let startDrag = (_i: number, _e: PointerEvent) => {};

  return (
    <svg
      ref={svg}
      viewBox={`0 0 ${W} ${H}`}
      class="w-full h-full select-none touch-none"
      role="navigation"
      aria-label="docs link graph"
    >
      <For each={edges() ?? []}>
        {([a, b], e) => (
          <line
            ref={(el) => (lineEls[e()] = el)}
            stroke={hover() === a || hover() === b
              ? "var(--color-accent)"
              : "color-mix(in oklab, var(--color-ink) 18%, transparent)"}
            stroke-width={hover() === a || hover() === b ? 1.2 : 0.8}
            class="transition-[stroke] duration-150"
          />
        )}
      </For>
      <For each={DOCS}>
        {(d, i) => (
          <g
            class="cursor-pointer"
            onPointerDown={(e) => {
              e.preventDefault();
              startDrag(i(), e);
            }}
            onMouseEnter={() => setHover(i())}
            onMouseLeave={() => setHover(-1)}
          >
            <circle
              ref={(el) => (dotEls[i()] = el)}
              r={i() === currentIdx()
                ? radius(i()) + 1
                : hover() === i()
                ? radius(i()) + 1.5
                : radius(i())}
              fill={i() === currentIdx()
                ? "var(--color-accent)"
                : hover() === i() || linkedToHover().has(i())
                ? "color-mix(in oklab, var(--color-accent) 55%, var(--color-surface))"
                : d.slug.startsWith("crate-")
                ? "color-mix(in oklab, var(--color-accent) 30%, var(--color-surface))"
                : "color-mix(in oklab, var(--color-ink) 32%, var(--color-surface))"}
              stroke={i() === currentIdx()
                ? "color-mix(in oklab, var(--color-accent) 40%, transparent)"
                : "var(--color-surface)"}
              stroke-width={i() === currentIdx() ? 3 : 1}
              class="transition-[fill,r] duration-150"
              pointer-events="all"
            />
          </g>
        )}
      </For>
      <text
        ref={(el) => (labelEl = el)}
        text-anchor="middle"
        font-size="9"
        visibility="hidden"
        class="pointer-events-none font-mono fill-[var(--color-ink)]"
        stroke="var(--color-surface)"
        stroke-width="3"
        paint-order="stroke"
      />
    </svg>
  );
};
