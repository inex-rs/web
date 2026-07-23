import { type Component, createMemo, Show } from "solid-js";

const W = 100;
const H = 36;
const PAD = 4;

export const Sparkline: Component<{ values: number[]; class?: string }> = (
  props,
) => {
  const geom = createMemo(() => {
    const vs = props.values;
    const n = vs.length;
    if (n === 0) return null;

    const min = Math.min(...vs);
    const max = Math.max(...vs);
    const range = max - min;
    const innerH = H - PAD * 2;
    const x = (i: number) => (n === 1 ? W : (i / (n - 1)) * W);
    const y = (v: number) =>
      range === 0 ? H / 2 : PAD + innerH * (1 - (v - min) / range);

    const pts = n === 1
      ? [{ px: 0, py: H / 2 }, { px: W, py: H / 2 }]
      : vs.map((v, i) => ({ px: x(i), py: y(v) }));

    const line = pts
      .map((p, i) => `${i ? "L" : "M"}${p.px} ${p.py}`)
      .join(" ");
    const area = `M${pts[0].px} ${H} ` +
      pts.map((p) => `L${p.px} ${p.py}`).join(" ") +
      ` L${pts[pts.length - 1].px} ${H} Z`;

    return { line, area, lastY: pts[pts.length - 1].py };
  });

  return (
    <div class={`relative ${props.class ?? ""}`}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        class="block h-full w-full"
        aria-hidden="true"
      >
        <line
          x1="0"
          y1={H - 0.5}
          x2={W}
          y2={H - 0.5}
          stroke="var(--color-line)"
          stroke-width="1"
          vector-effect="non-scaling-stroke"
        />
        <Show when={geom()} keyed>
          {(g) => (
            <>
              <path d={g.area} fill="var(--color-accent)" fill-opacity="0.1" />
              <path
                d={g.line}
                fill="none"
                stroke="var(--color-accent)"
                stroke-width="2"
                stroke-linejoin="round"
                stroke-linecap="round"
                vector-effect="non-scaling-stroke"
              />
            </>
          )}
        </Show>
      </svg>
      <Show when={geom()} keyed>
        {(g) => (
          <span
            class="pointer-events-none absolute right-0 size-2 -translate-y-1/2 rounded-full bg-accent ring-2 ring-panel"
            style={{ top: `${(g.lastY / H) * 100}%` }}
          />
        )}
      </Show>
    </div>
  );
};
