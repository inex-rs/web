import { type Component, For } from "solid-js";
import { A, useLocation } from "@solidjs/router";
import { Clipboard } from "@ark-ui/solid/clipboard";
import { useTitle } from "../lib/title.ts";

const DIGITS: Record<string, string[]> = {
  "4": ["101", "101", "111", "001", "001"],
  "0": ["111", "101", "101", "101", "111"],
};

function cells(): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = [];
  let ox = 0;
  for (const ch of "404") {
    DIGITS[ch].forEach((row, y) => {
      [...row].forEach((bit, x) => {
        if (bit === "1") out.push({ x: ox + x, y });
      });
    });
    ox += 4; // 3 wide + 1 gap
  }
  return out;
}

function regs(path: string): string[] {
  let h = 0x9e3779b9;
  for (let i = 0; i < path.length; i++) {
    h = (h ^ path.charCodeAt(i)) * 0x01000193 >>> 0;
  }
  const r = (n: number) =>
    "0x" + ((h * (n + 3) * 2654435761) >>> 0).toString(16).padStart(8, "0");
  return [r(1), r(2), r(3)];
}

export const NotFound: Component = () => {
  useTitle(() => "404 · inex");
  const loc = useLocation();
  const [r1, r2, r3] = regs(loc.pathname);

  return (
    <div class="flex-1 grid place-items-center px-4 py-16">
      <div class="w-full max-w-xl rounded-lg overflow-hidden border border-line bg-panel shadow-lg animate-rise">
        <div class="px-4 py-2 font-mono text-[12px] border-b border-line bg-panel-2 text-danger">
          ◉ DATA ABORT — read from 0x0000_0404 (page + 4)
        </div>

        <div class="p-4 grid sm:grid-cols-[auto_1fr] gap-4">
          <div class="space-y-1.5">
            <div class="font-mono text-[10px] uppercase tracking-widest text-muted/70">
              last frame
            </div>
            <div class="w-40 h-28 rounded-sm border border-line bg-panel-2 grid place-items-center">
              <svg
                viewBox="0 0 11 5"
                class="h-12 text-accent"
                shape-rendering="crispEdges"
                aria-label="404"
              >
                <For each={cells()}>
                  {(c) => (
                    <rect
                      x={c.x}
                      y={c.y}
                      width="0.92"
                      height="0.92"
                      fill="currentColor"
                      opacity={0.75 + ((c.x * 7 + c.y * 13) % 5) * 0.05}
                    />
                  )}
                </For>
              </svg>
            </div>
          </div>

          <div class="font-mono text-[11px] space-y-1 min-w-0 self-center text-ink-2">
            <div class="truncate">
              pc 0x0000_0404 —{" "}
              <span class="text-accent">
                router::resolve("{loc.pathname}")
              </span>
            </div>
            <div>
              lr 0x0800_c0de — <span class="text-ink">main()</span>{" "}
              · r0 0x0000_0000 ← the null
            </div>
            <div class="text-muted/70">
              r1 {r1} · r2 {r2} · r3 {r3}
            </div>
            <div class="text-muted">
              this page isn't in the manifest — regs + stack + last frame
              bundled
            </div>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2 border-t border-line bg-panel-2 px-4 py-2.5 font-mono text-[11px] text-muted">
          <Clipboard.Root
            value={globalThis.location?.href ?? ""}
            timeout={1800}
            class="inline-flex"
          >
            <Clipboard.Trigger class="px-2.5 py-1 rounded cursor-pointer bg-accent text-on-accent">
              <Clipboard.Indicator copied="copied ✓">
                share crash card
              </Clipboard.Indicator>
            </Clipboard.Trigger>
          </Clipboard.Root>
          <span class="ml-auto flex items-center gap-3">
            <A href="/" class="text-ink hover:text-accent">
              ▶ Continue
            </A>
            <A href="/docs" class="hover:text-ink">
              docs
            </A>
            <A href="/saros" class="hover:text-ink">
              saros
            </A>
          </span>
        </div>
      </div>
    </div>
  );
};
