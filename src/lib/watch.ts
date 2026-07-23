import { onCleanup } from "solid-js";

export function createWatch<T>(
  open: (signal: AbortSignal) => AsyncIterable<T>,
  onDelta: (delta: T, snapshot: boolean) => void,
  onState?: (s: "connecting" | "live" | "reconnecting") => void,
): void {
  const ab = new AbortController();
  let stopped = false;

  onCleanup(() => {
    stopped = true;
    ab.abort();
  });

  (async () => {
    let backoff = 400;
    let everLive = false;
    onState?.("connecting");
    while (!stopped) {
      const drain = async () => {
        let snapshot = true;
        for await (const delta of open(ab.signal)) {
          onDelta(delta, snapshot);
          if (snapshot) {
            snapshot = false;
            everLive = true;
            backoff = 400;
            onState?.("live");
          }
        }
      };
      await drain().catch(() => {});
      if (stopped || ab.signal.aborted) return;
      onState?.(everLive ? "reconnecting" : "connecting");
      await new Promise((r) => setTimeout(r, backoff));
      backoff = Math.min(backoff * 2, 8000);
    }
  })();
}
