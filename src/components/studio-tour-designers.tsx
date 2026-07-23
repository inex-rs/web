import { type Component, For, Show } from "solid-js";
import { APP, usePhase } from "./studio-tour-kit.tsx";

export const PrinterDesignerPanel: Component = () => {
  const phase = usePhase([1200, 1200, 1200, 1200]);
  const darkness = () => [0.55, 0.7, 0.85, 0.7][phase()];
  const BLOCKS: [string, string][] = [
    ["text", "「 HIGH SCORE 」"],
    ["image", "player portrait · 48×48"],
    ["field", "{score} → 001240"],
    ["border", "frame: dotted"],
  ];
  return (
    <div
      class="p-3 grid sm:grid-cols-[1fr_auto] gap-4 font-mono text-[10px] animate-rise"
      style={{ color: APP.text }}
    >
      <div class="space-y-2">
        <div style={{ color: APP.faint }}>LAYOUT · diploma.print</div>
        <For each={BLOCKS}>
          {([kind, label], i) => (
            <div
              class="flex items-center gap-2 rounded border px-2 py-1.5"
              style={{
                "border-color": i() === 2 ? APP.sel : APP.line,
                background: APP.panel,
              }}
            >
              <span
                class="px-1.5 rounded"
                style={{ background: APP.panel2, color: APP.faint }}
              >
                {kind}
              </span>
              <span style={{ color: APP.muted }}>{label}</span>
            </div>
          )}
        </For>
        <div class="space-y-1 pt-1">
          <div class="flex justify-between" style={{ color: APP.muted }}>
            <span>burn darkness</span>
            <span style={{ color: APP.selSoft }}>
              {Math.round(darkness() * 100)}%
            </span>
          </div>
          <div
            class="relative h-1.5 rounded-full"
            style={{ background: APP.panel2 }}
          >
            <span
              class="absolute -top-[3px] size-3 rounded-full"
              style={{
                left: `calc(${darkness() * 100}% - 6px)`,
                background: APP.sel,
                transition: "left 0.4s steps(4)",
              }}
            />
          </div>
        </div>
        <div style={{ color: APP.faint }}>
          → generates print_data.rs + a 4-shade asset, sized for the 160-dot
          head
        </div>
      </div>
      <div class="space-y-1">
        <div style={{ color: APP.faint }}>THERMAL PREVIEW</div>
        <div
          class="w-28 border-x bg-white/95 px-1.5 py-2 space-y-1"
          style={{ "border-color": APP.line }}
        >
          <div
            class="text-center text-[8px] font-bold"
            style={{ color: `rgba(40,35,30,${darkness() + 0.15})` }}
          >
            HIGH SCORE
          </div>
          <div class="grid grid-cols-10 gap-px px-2">
            <For each={[...Array(40).keys()]}>
              {(i) => (
                <span
                  class="aspect-square"
                  style={{
                    background: (i * 7) % 4 === 0
                      ? `rgba(40,35,30,${darkness()})`
                      : (i * 7) % 4 === 1
                      ? `rgba(40,35,30,${darkness() * 0.55})`
                      : "transparent",
                  }}
                />
              )}
            </For>
          </div>
          <div
            class="text-center text-[8px]"
            style={{ color: `rgba(40,35,30,${darkness() + 0.1})` }}
          >
            001240
          </div>
          <div
            class="border-t border-dotted text-center text-[7px]"
            style={{ "border-color": "#bbb", color: "#999" }}
          >
            ✂
          </div>
        </div>
        <div class="text-center" style={{ color: APP.muted }}>
          banding + heat simulated
        </div>
      </div>
    </div>
  );
};

export const RumbleDesignerPanel: Component = () => {
  const phase = usePhase(Array(16).fill(220));
  const PATTERN = [0, 3, 8, 2, 0, 0, 9, 9, 4, 0, 2, 6, 2, 0, 0, 0];
  const active = () => PATTERN[phase()] > 0;
  return (
    <div
      class="p-3 space-y-3 font-mono text-[10px] animate-rise"
      style={{ color: APP.text }}
    >
      <div class="flex gap-1.5">
        <For each={["heartbeat", "engine", "impact", "custom ●"]}>
          {(p, i) => (
            <span
              class="px-2 py-0.5 rounded"
              style={{
                background: i() === 3 ? APP.sel : APP.panel2,
                color: i() === 3 ? "white" : APP.muted,
              }}
            >
              {p}
            </span>
          )}
        </For>
      </div>
      <div class="flex items-end gap-1 h-16">
        <For each={PATTERN}>
          {(v, i) => (
            <div
              class="flex-1 rounded-t-sm"
              style={{
                height: `${Math.max(6, v * 10)}%`,
                background: i() === phase()
                  ? APP.selSoft
                  : v > 0
                  ? APP.sel
                  : APP.panel2,
              }}
            />
          )}
        </For>
      </div>
      <div class="flex items-center gap-4" style={{ color: APP.muted }}>
        <span
          class="size-5 rounded"
          style={{
            background: active() ? APP.err : APP.panel2,
            transform: active()
              ? `translate(${phase() % 2 ? 1 : -1}px, ${
                phase() % 2 ? -1 : 1
              }px)`
              : "none",
          }}
        />
        <span>
          {active() ? "● motor on" : "motor off"} · 60 Hz steps
        </span>
        <span class="ml-auto" style={{ color: APP.faint }}>
          ▶ playing on the real Rumble Pak · → RumblePattern const
        </span>
      </div>
    </div>
  );
};

export const DotcodeDesignerPanel: Component = () => {
  const phase = usePhase([900, 700, 700, 2400]);
  const encoded = () => phase() >= 2;
  return (
    <div
      class="p-3 space-y-3 font-mono text-[10px] animate-rise"
      style={{ color: APP.text }}
    >
      <div class="flex items-center gap-3">
        <div
          class="rounded border p-2.5 space-y-1"
          style={{ "border-color": APP.line, background: APP.panel }}
        >
          <div>mini-game.vpk · 11.8 KiB</div>
          <div style={{ color: APP.faint }}>
            RS parity + interleave → 2 long strips
          </div>
        </div>
        <span style={{ color: encoded() ? APP.ok : APP.warn }}>
          {encoded() ? "✓ encoded" : "encoding…"}
        </span>
      </div>
      <div class="space-y-1.5">
        <For each={[0, 1]}>
          {(strip) => (
            <div class="space-y-px">
              <div
                class="flex gap-px h-4 rounded-sm overflow-hidden border px-0.5 items-center"
                style={{ "border-color": APP.line, background: "#f5f2ea" }}
              >
                <For each={[...Array(64).keys()]}>
                  {(i) => (
                    <span
                      class="flex-1 rounded-full"
                      style={{
                        height: "60%",
                        background: !encoded()
                          ? "#ddd"
                          : (i * 2654435761 + strip * 97) % 3 === 0
                          ? "#222"
                          : (i * 40503 + strip) % 5 === 0
                          ? "#222"
                          : "transparent",
                        transition: "background 0.3s",
                      }}
                    />
                  )}
                </For>
              </div>
              <div style={{ color: APP.faint }}>
                strip {strip + 1}/2 — swipe direction →
              </div>
            </div>
          )}
        </For>
      </div>
      <div style={{ color: APP.muted }}>
        print sheet: A4 · 3 cards/page · 1200 dpi — scan back in with the
        e-Reader editor to verify round-trip
      </div>
    </div>
  );
};

export const LobbyDesignerPanel: Component = () => {
  const phase = usePhase([800, 800, 800, 800]);
  const hot = () => [5, 10, 6, 9][phase()];
  const ICON = [
    0b0110,
    0b1111,
    0b1111,
    0b0110,
  ];
  return (
    <div
      class="p-3 grid sm:grid-cols-2 gap-4 font-mono text-[10px] animate-rise"
      style={{ color: APP.text }}
    >
      <div class="space-y-2">
        <div style={{ color: APP.faint }}>ICON · 16×16 (shown 4×4)</div>
        <div
          class="grid grid-cols-4 gap-px w-fit rounded border p-1"
          style={{ "border-color": APP.line, background: APP.panel }}
        >
          <For each={[...Array(16).keys()]}>
            {(i) => (
              <span
                class="size-4"
                style={{
                  background: i === hot()
                    ? APP.warn
                    : (ICON[Math.floor(i / 4)] >> (3 - (i % 4))) & 1
                    ? APP.sel
                    : APP.panel2,
                }}
              />
            )}
          </For>
        </div>
        <div>
          banner:{" "}
          <span
            class="px-1.5 rounded"
            style={{ background: APP.panel2, color: APP.muted }}
          >
            inex demo — 4P race!
          </span>
        </div>
      </div>
      <div class="space-y-1.5">
        <div style={{ color: APP.faint }}>AS THE RECEIVING DS SEES IT</div>
        <div
          class="rounded-md border p-3 space-y-2"
          style={{ "border-color": APP.line, background: "#c8ccd4" }}
        >
          <div class="rounded bg-white/90 p-2 flex items-center gap-2">
            <span class="size-6 grid grid-cols-4 gap-px">
              <For each={[...Array(16).keys()]}>
                {(i) => (
                  <span
                    style={{
                      background: (ICON[Math.floor(i / 4)] >> (3 - (i % 4))) & 1
                        ? "#7c3aed"
                        : "transparent",
                    }}
                  />
                )}
              </For>
            </span>
            <div>
              <div class="text-[9px] font-bold text-black/80">
                inex demo — 4P race!
              </div>
              <div class="text-[8px] text-black/50">1 player · 248 KiB</div>
            </div>
          </div>
          <div class="text-center text-[8px] text-black/40">
            Download Play — select a title
          </div>
        </div>
      </div>
    </div>
  );
};

export const SdatTrackerPanel: Component = () => {
  const phase = usePhase(Array(8).fill(280));
  const NOTES: number[][] = [
    [0, 3, 5],
    [3],
    [0, 7],
    [3, 5],
    [0],
    [3, 8],
    [0, 5],
    [3],
  ];
  return (
    <div
      class="p-3 space-y-2 font-mono text-[10px] animate-rise"
      style={{ color: APP.text }}
    >
      <div class="flex gap-3" style={{ color: APP.muted }}>
        <span>SSEQ: battle_theme</span>
        <span>SBNK: main · 12 instruments</span>
        <span class="ml-auto" style={{ color: APP.pocket }}>
          ♪ auditioning on ARM7 (via IPC)
        </span>
      </div>
      <div class="grid grid-cols-8 gap-1">
        <For each={NOTES}>
          {(col, c) => (
            <div
              class="space-y-1 rounded-sm p-1"
              style={{
                background: c() === phase()
                  ? "rgba(139,92,246,0.15)"
                  : "transparent",
              }}
            >
              <For each={[...Array(9).keys()]}>
                {(row) => (
                  <div
                    class="h-2 rounded-[1px]"
                    style={{
                      background: col.includes(row)
                        ? c() === phase() ? APP.selSoft : APP.sel
                        : APP.panel,
                    }}
                  />
                )}
              </For>
            </div>
          )}
        </For>
      </div>
      <div class="flex justify-between" style={{ color: APP.faint }}>
        <span>pattern 02/08 · 120 bpm · PSG + PCM channels</span>
        <span>step {phase() + 1}/8</span>
      </div>
    </div>
  );
};

export const FontDesignerPanel: Component = () => {
  const phase = usePhase([1000, 1000, 1000]);
  const GLYPH = [
    0b011110,
    0b110011,
    0b110011,
    0b111111,
    0b110011,
    0b110011,
    0b110011,
    0,
  ];
  const hot = () => [14, 21, 33][phase()];
  return (
    <div
      class="p-3 grid sm:grid-cols-[auto_1fr] gap-4 font-mono text-[10px] animate-rise"
      style={{ color: APP.text }}
    >
      <div class="space-y-1.5">
        <div style={{ color: APP.faint }}>GLYPH · U+0041 'A'</div>
        <div
          class="grid grid-cols-6 gap-px w-fit rounded border p-1"
          style={{ "border-color": APP.line, background: APP.panel }}
        >
          <For each={[...Array(48).keys()]}>
            {(i) => (
              <span
                class="size-3"
                style={{
                  background: i === hot()
                    ? APP.warn
                    : (GLYPH[Math.floor(i / 6)] >> (5 - (i % 6))) & 1
                    ? APP.text
                    : APP.panel2,
                }}
              />
            )}
          </For>
        </div>
        <div style={{ color: APP.muted }}>advance: 7px · bearing: 1px</div>
      </div>
      <div class="space-y-2 self-center">
        <div style={{ color: APP.faint }}>PREVIEW</div>
        <div
          class="rounded border px-3 py-2 text-sm tracking-wide"
          style={{ "border-color": APP.line, background: APP.panel }}
        >
          ABC abc 0123 「日本語」
        </div>
        <div style={{ color: APP.muted }}>
          main.nftr · 218 glyphs · renders with the engine's real text path
        </div>
      </div>
    </div>
  );
};

export const SaveWorkshopPanel: Component = () => {
  const phase = usePhase([1500, 1500, 900, 2400]);
  const fuzzing = () => phase() >= 2;
  return (
    <div
      class="p-3 grid sm:grid-cols-2 gap-4 font-mono text-[10px] animate-rise"
      style={{ color: APP.text }}
    >
      <div class="space-y-1.5">
        <div style={{ color: APP.faint }}>
          SaveData (from your Rust types) — live on cart SRAM
        </div>
        <For
          each={[
            ["rupees: u16", `${231 + phase() * 4}`],
            ["deaths: u8", "3"],
            ["dungeon_flags: BitArr<8>", "0b0001_1010"],
            ["checksum: u16", "auto"],
          ]}
        >
          {([field, val]) => (
            <div
              class="flex justify-between rounded border px-2 py-1"
              style={{ "border-color": APP.line, background: APP.panel }}
            >
              <span style={{ color: APP.muted }}>{field}</span>
              <span style={{ color: APP.selSoft }}>{val}</span>
            </div>
          )}
        </For>
      </div>
      <div class="space-y-1.5 self-center">
        <div style={{ color: APP.faint }}>CORRUPTION FUZZER</div>
        <Show
          when={fuzzing()}
          fallback={
            <div style={{ color: APP.muted }}>
              flips random bits in the save, reboots, and checks the game's
              recovery path
            </div>
          }
        >
          <div class="space-y-1 animate-rise">
            <div style={{ color: APP.warn }}>▸ flipped 8 bits @ 0x1f2…</div>
            <div style={{ color: phase() >= 3 ? APP.ok : APP.muted }}>
              {phase() >= 3
                ? "✓ game detected bad checksum → restored backup slot"
                : "rebooting…"}
            </div>
            <div style={{ color: APP.faint }}>
              runs 214 · recovered 214 · lost saves 0
            </div>
          </div>
        </Show>
      </div>
    </div>
  );
};

export const TilemapLivePanel: Component = () => {
  const phase = usePhase(Array(10).fill(500));
  const painted = () => phase();
  const CELLS = [12, 13, 14, 22, 30, 38, 37, 36, 28, 20];
  return (
    <div
      class="p-3 flex flex-wrap gap-4 font-mono text-[10px] animate-rise"
      style={{ color: APP.text }}
    >
      <div class="space-y-1.5">
        <div style={{ color: APP.faint }}>EDITOR · level-2.map</div>
        <div
          class="grid grid-cols-8 gap-px w-fit rounded border p-1"
          style={{ "border-color": APP.line, background: APP.panel }}
        >
          <For each={[...Array(48).keys()]}>
            {(i) => (
              <span
                class="size-3.5"
                style={{
                  background: CELLS.slice(0, painted()).includes(i)
                    ? "#3f7d4e"
                    : Math.floor(i / 8) >= 4
                    ? "#356b42"
                    : APP.panel2,
                  outline: CELLS[painted()] === i
                    ? `1px solid ${APP.warn}`
                    : "none",
                }}
              />
            )}
          </For>
        </div>
      </div>
      <div class="space-y-1.5">
        <div style={{ color: APP.faint }}>ON DEVICE — game keeps running</div>
        <div
          class="relative w-40 h-24 rounded-sm border overflow-hidden"
          style={{ "border-color": APP.line, background: "#2b3a67" }}
        >
          <div
            class="absolute bottom-0 inset-x-0 h-2/5"
            style={{ background: "#356b42" }}
          />
          <For each={CELLS.slice(0, painted())}>
            {(c) => (
              <span
                class="absolute size-2.5 animate-rise"
                style={{
                  background: "#3f7d4e",
                  left: `${(c % 8) * 12 + 2}%`,
                  top: `${Math.floor(c / 8) * 14 + 8}%`,
                }}
              />
            )}
          </For>
          <span
            class="absolute size-2"
            style={{
              background: "#c4b5fd",
              left: `${10 + painted() * 8}%`,
              bottom: "38%",
              transition: "left 0.4s steps(4)",
            }}
          />
        </div>
        <div style={{ color: APP.muted }}>
          each brush stroke → BG map write over the debug link · walk it
          instantly
        </div>
      </div>
    </div>
  );
};

export const ScannerPanel: Component = () => {
  const phase = usePhase([1300, 1300, 1300, 2600, 600]);
  const STEPS = [
    ["scan: health == 3", "12 402 matches"],
    ["took damage → rescan == 2", "38 matches"],
    ["healed → rescan == 3", "1 match"],
  ];
  const found = () => phase() >= 3;
  return (
    <div
      class="p-3 space-y-1.5 font-mono text-[10px] animate-rise"
      style={{ color: APP.text }}
    >
      <For each={STEPS.slice(0, Math.min(phase() + 1, 3))}>
        {([q, r], i) => (
          <div class="flex justify-between animate-rise">
            <span style={{ color: APP.muted }}>{q}</span>
            <span style={{ color: i() === 2 ? APP.ok : APP.faint }}>{r}</span>
          </div>
        )}
      </For>
      <Show when={found()}>
        <div
          class="rounded border p-2.5 space-y-1 animate-rise"
          style={{ "border-color": APP.sel, background: APP.panel }}
        >
          <div class="flex justify-between">
            <span style={{ color: APP.selSoft }}>
              0x0300_1f44 · u8 · health
            </span>
            <span
              class="px-1.5 rounded"
              style={{ background: APP.sel, color: "white" }}
            >
              ❄ freeze @ 3
            </span>
          </div>
          <div style={{ color: APP.faint }}>
            → label it, watch it, or export a debug-trainer menu into your own
            ROM
          </div>
        </div>
      </Show>
    </div>
  );
};

export const ProtocolFuzzPanel: Component = () => {
  const phase = usePhase([1400, 900, 900, 900, 2600, 600]);
  const fuzzed = () => Math.min(Math.max(phase() - 1, 0), 3) * 167;
  const done = () => phase() >= 4;
  return (
    <div
      class="p-3 grid sm:grid-cols-2 gap-4 font-mono text-[10px] animate-rise"
      style={{ color: APP.text }}
    >
      <div class="space-y-1">
        <div style={{ color: APP.faint }}>SCHEMA</div>
        <div
          class="rounded border p-2.5 leading-4"
          style={{
            "border-color": APP.line,
            background: APP.panel,
            color: APP.muted,
          }}
        >
          <div>
            <span style={{ color: APP.selSoft }}>msg</span> JoinReq {"{"}
          </div>
          <div>name: [u8; 8],</div>
          <div>version: u8,</div>
          <div>{"}"}</div>
          <div>
            <span style={{ color: APP.selSoft }}>msg</span> Input {"{"} pad: u16
            {" "}
            {"}"}
          </div>
        </div>
        <div style={{ color: APP.faint }}>
          → generates ser/de + handshake for both sides (SIO or WM)
        </div>
      </div>
      <div class="space-y-1 self-center">
        <div style={{ color: APP.faint }}>
          FUZZER — mutated frames on real link
        </div>
        <div style={{ color: APP.muted }}>
          {done() ? 500 : fuzzed()} / 500 frames
        </div>
        <div
          class="h-1.5 rounded-sm overflow-hidden"
          style={{ background: APP.panel2 }}
        >
          <div
            class="h-full"
            style={{
              width: `${done() ? 100 : (fuzzed() / 500) * 100}%`,
              background: done() ? APP.warn : APP.sel,
              transition: "width 0.4s",
            }}
          />
        </div>
        <Show when={done()}>
          <div class="animate-rise" style={{ color: APP.warn }}>
            ⚠ 2 hangs: truncated JoinReq (seed 0x2f31) — slave waits forever.
            <span style={{ color: APP.selSoft }}>repro ▸</span>
          </div>
        </Show>
      </div>
    </div>
  );
};
