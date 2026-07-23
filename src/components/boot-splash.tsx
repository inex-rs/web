import {
  type Component,
  createSignal,
  onCleanup,
  onMount,
  Show,
} from "solid-js";
import { createEventListener } from "@solid-primitives/event-listener";
import { useReducedMotion } from "../lib/media.ts";
import { barSegments } from "./logo.tsx";

export const BootSplash: Component = () => {
  const [on, setOn] = createSignal(false);
  const [leaving, setLeaving] = createSignal(false);

  const reduced = useReducedMotion();
  onMount(() => {
    if (reduced()) return;
    setOn(true);

    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      setLeaving(true);
      setTimeout(() => setOn(false), 720);
    };
    const timer = setTimeout(finish, 2000);
    onCleanup(() => clearTimeout(timer));
    const skip = () => {
      clearTimeout(timer);
      finish();
    };
    createEventListener(globalThis.window, "pointerdown", skip);
    createEventListener(globalThis.window, "keydown", skip);
    createEventListener(globalThis.window, "wheel", skip);
  });

  const bars = barSegments("inex");

  return (
    <Show when={on()}>
      <div
        class={`fixed inset-0 z-[999] grid place-items-center bg-surface transition-opacity duration-300 ${
          leaving()
            ? "opacity-0 delay-[360ms] pointer-events-none"
            : "opacity-100"
        }`}
        aria-hidden="true"
      >
        <div class="flex flex-col items-center gap-4">
          <div class="relative overflow-hidden">
            <svg viewBox="0 0 24 24" class="w-24 h-24 text-accent">
              {bars.map((b, i) => (
                <rect
                  class="boot-bar"
                  data-leaving={leaving() ? "" : undefined}
                  style={{ "--bi": i, "--bri": bars.length - 1 - i }}
                  x={b.cx - b.w / 2}
                  y={b.y0}
                  width={b.w}
                  height={b.y1 - b.y0}
                  rx={b.w / 2}
                  fill="currentColor"
                  opacity={b.o}
                />
              ))}
            </svg>
          </div>
          <span
            class="boot-word font-mono text-sm font-semibold text-accent"
            data-leaving={leaving() ? "" : undefined}
          >
            inex
          </span>
        </div>
      </div>
    </Show>
  );
};
