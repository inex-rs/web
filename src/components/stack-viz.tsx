import { type Component, createSignal, For, onMount, Show } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { crateBySlug, STACK } from "../lib/crates.ts";

const K = 1.5, KY = 0.75;
const U = 96, D = 30;
const BOX = 13, GAP = 9;
const EXPLODE = 14, PULLV = 14;

const px = (u: number, v: number) => (u - v) * K;
const py = (u: number, v: number, z: number) => (u + v) * KY - z;
const pt = (u: number, v: number, z: number) =>
  `${px(u, v).toFixed(1)},${py(u, v, z).toFixed(1)}`;

function facePaths(u0: number, u1: number, z: number, v0 = 0, v1 = D) {
  const zt = z + BOX;
  return {
    top: `M${pt(u0, v0, zt)}L${pt(u1, v0, zt)}L${pt(u1, v1, zt)}L${
      pt(u0, v1, zt)
    }Z`,
    left: `M${pt(u0, v1, zt)}L${pt(u1, v1, zt)}L${pt(u1, v1, z)}L${
      pt(u0, v1, z)
    }Z`,
    right: `M${pt(u1, v0, zt)}L${pt(u1, v1, zt)}L${pt(u1, v1, z)}L${
      pt(u1, v0, z)
    }Z`,
    hit: `M${pt(u0, v0, zt)}L${pt(u1, v0, zt)}L${pt(u1, v0, z)}L${
      pt(u1, v1, z)
    }L${pt(u0, v1, z)}L${pt(u0, v1, zt)}Z`,
  };
}

const tierOf = (slug: string) =>
  STACK.findIndex((t) => t.crates.some((c) => c.slug === slug));

export const StackViz: Component<{ active?: string }> = (props) => {
  const navigate = useNavigate();
  const [hover, setHover] = createSignal("");
  const [mounted, setMounted] = createSignal(false);
  onMount(() => requestAnimationFrame(() => setMounted(true)));
  const shown = () => crateBySlug(hover() || props.active || "");

  const activeTier = () => (props.active ? tierOf(props.active) : -1);
  const liftFor = (ti: number) =>
    activeTier() >= 0 && ti > activeTier() ? EXPLODE : 0;

  const tiers = STACK.map((tier, ti) => {
    const z = ti * (BOX + GAP);
    const w = U / tier.crates.length;
    return {
      name: tier.name,
      ti,
      edgeX: px(0, D),
      labelY: py(0, D, z + BOX / 2) + 3,
      blocks: tier.crates.map((c, ci) => {
        const u0 = ci * w + (ci ? 1.2 : 0), u1 = (ci + 1) * w;
        return {
          crate: c,
          ci,
          faces: facePaths(u0, u1, z),
          shade: `M${pt(u0 - 2, PULLV - 2, -4)}L${pt(u1 + 2, PULLV - 2, -4)}L${
            pt(u1 + 2, D + PULLV + 2, -4)
          }L${pt(u0 - 2, D + PULLV + 2, -4)}Z`,
        };
      }),
    };
  });

  const shadow = `M${pt(-5, -5, -4)}L${pt(U + 7, -5, -4)}L${
    pt(U + 7, D + 7, -4)
  }L${pt(-5, D + 7, -4)}Z`;

  return (
    <div class="h-full flex flex-col gap-3 select-none">
      <svg
        viewBox="-136 -168 292 300"
        class="w-full flex-1 min-h-0"
        role="navigation"
        aria-label="framework stack"
      >
        <defs>
          <filter id="stack-soft" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="4" />
          </filter>
        </defs>

        <g class="pointer-events-none">
          <path
            d={shadow}
            fill="var(--color-ink)"
            opacity="0.1"
            filter="url(#stack-soft)"
          />
          <For each={tiers}>
            {(tier) => (
              <g
                class="transition-transform duration-300 ease-out"
                style={{
                  transform: liftFor(tier.ti)
                    ? `translateY(-${liftFor(tier.ti)}px)`
                    : "translateY(0)",
                  "transition-delay": liftFor(tier.ti)
                    ? `${(tier.ti - activeTier() - 1) * 25}ms`
                    : "0ms",
                }}
              >
                <text
                  x={tier.edgeX - 28}
                  y={tier.labelY}
                  text-anchor="end"
                  class="fill-[var(--color-muted)] font-mono stack-rise"
                  style={{ "animation-delay": `${tier.ti * 70}ms` }}
                  font-size="8.5"
                >
                  {tier.name}
                </text>
                <line
                  x1={tier.edgeX - 25}
                  y1={tier.labelY - 3}
                  x2={tier.edgeX - 4}
                  y2={tier.labelY - 3}
                  stroke="var(--color-line)"
                  stroke-width="1"
                  class="stack-rise"
                  style={{ "animation-delay": `${tier.ti * 70}ms` }}
                />
                <For each={tier.blocks}>
                  {(b) => {
                    const isActive = () => props.active === b.crate.slug;
                    const isHover = () => hover() === b.crate.slug;
                    const base = tier.ti % 2 === 0
                      ? "var(--color-panel)"
                      : "var(--color-panel-2)";
                    const top = () =>
                      isHover()
                        ? `color-mix(in oklab, var(--color-accent) 30%, ${base})`
                        : base;
                    const side = (amt: number) =>
                      `color-mix(in oklab, ${
                        isHover()
                          ? `color-mix(in oklab, var(--color-accent) 25%, ${base})`
                          : base
                      } ${100 - amt}%, var(--color-ink))`;
                    const stroke =
                      "color-mix(in oklab, var(--color-panel) 65%, var(--color-ink))";
                    const faceCls =
                      "transition-[fill,stroke] duration-200 ease-out";
                    return (
                      <g
                        class="stack-rise"
                        style={{
                          "animation-delay": `${tier.ti * 70 + b.ci * 40}ms`,
                        }}
                      >
                        <path
                          d={b.shade}
                          class="transition-opacity duration-300"
                          fill="var(--color-ink)"
                          opacity={isActive() ? 0.07 : 0}
                          filter="url(#stack-soft)"
                        />
                        <g
                          class="transition-transform duration-300 ease-out"
                          style={{
                            transform: isActive() && mounted()
                              ? `translate(${-PULLV * K}px, ${PULLV * KY}px)`
                              : "translate(0, 0)",
                          }}
                        >
                          <g class={isActive() ? "stack-breathe" : ""}>
                            <path
                              d={b.faces.left}
                              class={faceCls}
                              fill={isActive()
                                ? "color-mix(in oklab, var(--color-accent) 78%, var(--color-ink))"
                                : side(22)}
                              stroke={isActive()
                                ? "var(--color-accent)"
                                : stroke}
                              stroke-width="0.5"
                            />
                            <path
                              d={b.faces.right}
                              class={faceCls}
                              fill={isActive()
                                ? "color-mix(in oklab, var(--color-accent) 62%, var(--color-ink))"
                                : side(38)}
                              stroke={isActive()
                                ? "var(--color-accent)"
                                : stroke}
                              stroke-width="0.5"
                            />
                            <path
                              d={b.faces.top}
                              class={faceCls}
                              fill={isActive() ? "var(--color-accent)" : top()}
                              stroke={isActive()
                                ? "var(--color-accent)"
                                : stroke}
                              stroke-width="0.7"
                            />
                          </g>
                        </g>
                      </g>
                    );
                  }}
                </For>
              </g>
            )}
          </For>
        </g>

        <For each={tiers}>
          {(tier) => (
            <For each={tier.blocks}>
              {(b) => (
                <path
                  d={b.faces.hit}
                  fill="transparent"
                  class="cursor-pointer focus:outline-none"
                  tabindex="0"
                  role="link"
                  aria-label={b.crate.name}
                  onClick={() => navigate(`/docs/${b.crate.slug}`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      navigate(`/docs/${b.crate.slug}`);
                    }
                  }}
                  onMouseEnter={() => setHover(b.crate.slug)}
                  onMouseLeave={() => setHover("")}
                  onFocus={() => setHover(b.crate.slug)}
                  onBlur={() => setHover("")}
                />
              )}
            </For>
          )}
        </For>
      </svg>
      <div class="shrink-0 h-18 rounded-md border border-line bg-panel px-3 py-2 overflow-hidden">
        <Show
          when={shown()}
          fallback={
            <p class="text-[11px] text-muted leading-snug">
              The framework, layer by layer — click a block to read about that
              crate.
            </p>
          }
        >
          {(c) => (
            <>
              <p class="font-mono text-xs text-accent font-semibold">
                {c().name}
              </p>
              <p class="mt-0.5 text-[11px] text-muted leading-snug">
                {c().blurb}
              </p>
            </>
          )}
        </Show>
      </div>
    </div>
  );
};
