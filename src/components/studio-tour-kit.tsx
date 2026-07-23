import { createSignal, onCleanup, onMount } from "solid-js";

export const APP = {
  bg: "var(--app-bg)",
  panel: "var(--app-panel)",
  panel2: "var(--app-panel-2)",
  line: "var(--app-line)",
  text: "var(--app-text)",
  muted: "var(--app-muted)",
  faint: "var(--app-faint)",
  sel: "var(--app-sel)",
  selSoft: "var(--app-sel-hi)",
  onSel: "var(--app-on-sel)",
  pocket: "#2fb8a6",
  isnitro: "#3e8ede",
  ok: "var(--app-ok)",
  warn: "var(--app-warn)",
  err: "var(--app-err)",
};

export function usePhase(durations: number[]): () => number {
  const [phase, setPhase] = createSignal(0);
  onMount(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    const tick = (i: number) => {
      if (!alive) return;
      setPhase(i);
      timer = setTimeout(() => tick((i + 1) % durations.length), durations[i]);
    };
    tick(0);
    onCleanup(() => {
      alive = false;
      clearTimeout(timer);
    });
  });
  return phase;
}
