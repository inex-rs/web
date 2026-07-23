import { type Component, createSignal, For, Show } from "solid-js";
import { A } from "@solidjs/router";
import { ToggleGroup } from "@ark-ui/solid/toggle-group";
import { MoldHero } from "../components/mold-hero.tsx";
import { BarsMark, type ProductMark } from "../components/logo.tsx";
import { useTitle } from "../lib/title.ts";

const setMark = (m: ProductMark) =>
  globalThis.dispatchEvent(new CustomEvent("inex-mark", { detail: m }));

const PRODUCTS: {
  id: ProductMark;
  blurb: string;
  platforms: string[];
  license: string;
  href: string;
  cta: string;
}[] = [
  {
    id: "inex",
    blurb:
      "inex brings modern development back to classic Nintendo hardware: " +
      "a no_std Rust framework, a desktop studio, and batteries-included " +
      "libraries — the safety, ergonomics, and tooling these systems never had.",
    platforms: ["GB / GBC", "GBA", "NDS", "DSi", "3DS"],
    license: "MPL-2.0",
    href: "/docs",
    cta: "read the docs",
  },
  {
    id: "saros",
    blurb: "Saros hosts and distributes device firmware and delivers updates " +
      "over the air. Publish a build, and connected devkits and devices pull " +
      "it automatically. Self-hostable.",
    platforms: ["OTA", "firmware", "self-hostable"],
    license: "GPL-3.0",
    href: "/saros",
    cta: "browse saros",
  },
  {
    id: "penumbra",
    blurb: "Penumbra is custom firmware for the Nintendo DSi, built on the " +
      "inex framework: a boot patcher, installer, and launcher that open the " +
      "console to homebrew and custom software.",
    platforms: ["DSi", "CFW", "homebrew"],
    license: "GPL-3.0",
    href: "/docs/guides/penumbra",
    cta: "about penumbra",
  },
];

export const Home: Component = () => {
  useTitle(() => "inex — Rust for retro Nintendo hardware");
  const [product, setProduct] = createSignal(PRODUCTS[0]);
  const pick = (p: (typeof PRODUCTS)[number]) => {
    setProduct(p);
    setMark(p.id);
  };
  return (
    <div class="flex-1 flex flex-col min-h-0">
      <section class="relative overflow-hidden bg-term flex-1 flex items-center">
        <MoldHero />
        <div class="absolute inset-0 bg-gradient-to-r from-term via-term/70 to-transparent pointer-events-none" />
        <div class="relative px-4 sm:px-6 max-w-6xl mx-auto w-full py-14">
          <div class="max-w-xl space-y-5">
            <h1 class="text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.1] text-term-ink">
              Rust, all the way down to the{" "}
              <span class="text-accent-hi">cartridge slot</span>.
            </h1>

            <ToggleGroup.Root
              value={[product().id]}
              onValueChange={(d) => {
                const next = PRODUCTS.find((x) => x.id === d.value[0]);
                if (next) pick(next);
              }}
              class="flex flex-wrap gap-2"
              aria-label="product"
            >
              <For each={PRODUCTS}>
                {(p) => (
                  <ToggleGroup.Item
                    value={p.id}
                    class={`flex items-center gap-2 rounded-md border px-3 py-1.5 font-mono text-sm transition-colors cursor-pointer ${
                      product().id === p.id
                        ? "border-accent-hi/70 bg-term/60 text-accent-hi"
                        : "border-term-line bg-term/60 text-term-ink-2 hover:text-term-ink hover:border-term-ink/40"
                    }`}
                  >
                    <BarsMark product={p.id} size={14} />
                    {p.id}
                  </ToggleGroup.Item>
                )}
              </For>
            </ToggleGroup.Root>

            <div class="min-h-28">
              <Show when={product()} keyed>
                {(p) => (
                  <p class="text-term-ink-2 max-w-md leading-relaxed animate-rise">
                    {p.blurb}{" "}
                    <A
                      href={p.href}
                      class="whitespace-nowrap text-accent-hi hover:text-term-ink transition-colors"
                    >
                      {p.cta} →
                    </A>
                  </p>
                )}
              </Show>
            </div>

            <div class="flex flex-wrap gap-2">
              <For each={product().platforms}>
                {(p) => (
                  <span class="rounded border border-term-line px-2.5 py-1 font-mono text-[11px] text-term-ink-2">
                    {p}
                  </span>
                )}
              </For>
              <span class="rounded border border-term-line px-2.5 py-1 font-mono text-[11px] text-term-ink-2">
                {product().license}
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
