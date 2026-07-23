import { type Component, For } from "solid-js";
import { Clipboard } from "@ark-ui/solid/clipboard";

function cells(hex: string): { x: number; y: number }[] {
  if (!/^[0-9a-f]{64}$/.test(hex)) return [];
  const out: { x: number; y: number }[] = [];
  for (let i = 0; i < 64; i++) {
    const nibble = parseInt(hex[i], 16);
    for (let b = 0; b < 4; b++) {
      if (nibble & (8 >> b)) {
        const idx = i * 4 + b;
        out.push({ x: idx % 16, y: Math.floor(idx / 16) });
      }
    }
  }
  return out;
}

export const HashMatrix: Component<{ sha256: string }> = (props) => {
  return (
    <Clipboard.Root
      value={props.sha256}
      timeout={1200}
      class="inline-flex shrink-0"
    >
      <Clipboard.Trigger
        title={`sha256 ${props.sha256}\nclick to copy`}
        aria-label={`copy sha256 ${props.sha256}`}
        class="group relative rounded-md border border-line bg-panel p-1.5 hover:border-accent/60 transition-colors cursor-pointer"
      >
        <svg
          viewBox="0 0 16 16"
          class="size-9 text-ink/70 group-hover:text-accent transition-colors"
          shape-rendering="crispEdges"
        >
          <For each={cells(props.sha256)}>
            {(c) => (
              <rect x={c.x} y={c.y} width="1" height="1" fill="currentColor" />
            )}
          </For>
        </svg>
        <Clipboard.Indicator
          copied={
            <span class="absolute inset-0 grid place-items-center rounded-md bg-panel/90 text-[9px] font-mono text-accent">
              copied
            </span>
          }
        >
          <span />
        </Clipboard.Indicator>
      </Clipboard.Trigger>
    </Clipboard.Root>
  );
};
