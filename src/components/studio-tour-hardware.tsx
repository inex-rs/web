import {
  type Component,
  createSignal,
  For,
  onCleanup,
  onMount,
  Show,
} from "solid-js";
import { APP, usePhase } from "./studio-tour-kit.tsx";

function useTick(ms: number): () => number {
  const [tick, setTick] = createSignal(0);
  onMount(() => {
    const t = setInterval(() => setTick((x) => x + 1), ms);
    onCleanup(() => clearInterval(t));
  });
  return tick;
}

export const ChannelMixerPanel: Component = () => {
  const tick = useTick(180);
  const level = (i: number) => {
    if (i === 9) return 0;
    const base =
      [80, 65, 40, 0, 55, 70, 30, 90, 45, 0, 60, 25, 0, 35, 50, 20][i];
    return base === 0
      ? 0
      : Math.max(8, base + Math.sin(tick() * 0.9 + i * 1.7) * 22);
  };
  const kind = (i: number) => (i < 8 ? "PCM" : i < 14 ? "PSG" : "NOI");
  return (
    <div
      class="p-3 space-y-2 font-mono text-[9px] animate-rise"
      style={{ color: APP.text }}
    >
      <div class="flex items-end gap-1 h-24">
        <For each={[...Array(16).keys()]}>
          {(i) => (
            <div class="flex-1 flex flex-col items-center gap-1">
              <div
                class="w-full h-16 rounded-sm flex flex-col justify-end overflow-hidden"
                style={{ background: APP.panel }}
              >
                <div
                  style={{
                    height: `${level(i)}%`,
                    background: i === 7
                      ? APP.selSoft
                      : level(i) > 75
                      ? APP.warn
                      : APP.pocket,
                    transition: "height 0.15s",
                  }}
                />
              </div>
              <span style={{ color: i === 9 ? APP.err : APP.faint }}>
                {i === 9 ? "M" : i}
              </span>
            </div>
          )}
        </For>
      </div>
      <div class="flex gap-4" style={{ color: APP.muted }}>
        <span>
          ch7 <span style={{ color: APP.selSoft }}>SOLO</span>{" "}
          · jump.swav (SWAR)
        </span>
        <span>ch9 muted</span>
        <span class="ml-auto" style={{ color: APP.faint }}>
          {kind(0)}0–7 · {kind(9)}8–13 ·{" "}
          {kind(15)}14–15 — live from the ARM7 mixer
        </span>
      </div>
    </div>
  );
};

export const SwarEditorPanel: Component = () => {
  const phase = usePhase(Array(20).fill(140));
  const playhead = () => 25 + ((phase() * 3.2) % 50);
  const wave = [...Array(60).keys()].map(
    (i) =>
      50 + Math.sin(i * 0.5) * 30 * Math.exp(-i * 0.02) + Math.sin(i * 2.1) * 8,
  );
  return (
    <div
      class="p-3 space-y-2 font-mono text-[10px] animate-rise"
      style={{ color: APP.text }}
    >
      <div class="flex justify-between" style={{ color: APP.muted }}>
        <span>jump.swav · IMA-ADPCM · 22 050 Hz · 12.4 KiB</span>
        <span style={{ color: APP.pocket }}>▶ auditioning on hardware</span>
      </div>
      <div
        class="relative h-20 rounded border overflow-hidden"
        style={{ "border-color": APP.line, background: APP.panel }}
      >
        <svg
          viewBox="0 0 60 100"
          preserveAspectRatio="none"
          class="absolute inset-0 w-full h-full"
        >
          <polyline
            points={wave.map((y, x) => `${x},${y}`).join(" ")}
            fill="none"
            stroke={APP.pocket}
            stroke-width="1"
          />
        </svg>
        <div
          class="absolute inset-y-0 w-px"
          style={{ left: "25%", background: APP.warn }}
        />
        <div
          class="absolute inset-y-0 w-px"
          style={{ left: "75%", background: APP.warn }}
        />
        <div
          class="absolute top-0.5 text-[8px]"
          style={{ left: "26%", color: APP.warn }}
        >
          loop
        </div>
        <div
          class="absolute inset-y-0 w-px"
          style={{ left: `${playhead()}%`, background: APP.text }}
        />
      </div>
      <div style={{ color: APP.faint }}>
        drag the loop points — the running game's channel picks the change up on
        the next trigger
      </div>
    </div>
  );
};

export const MicLabPanel: Component = () => {
  const tick = useTick(120);
  const blow = () => tick() % 24 > 16;
  const amp = (i: number) =>
    blow()
      ? 30 + Math.sin(tick() * 2 + i) * 26
      : 6 + Math.sin(tick() * 0.7 + i * 2.1) * 4;
  return (
    <div
      class="p-3 space-y-2 font-mono text-[10px] animate-rise"
      style={{ color: APP.text }}
    >
      <div
        class="relative h-16 rounded border overflow-hidden"
        style={{ "border-color": APP.line, background: APP.panel }}
      >
        <svg
          viewBox="0 0 40 80"
          preserveAspectRatio="none"
          class="absolute inset-0 w-full h-full"
        >
          <polyline
            points={[...Array(40).keys()]
              .map((i) => `${i},${40 + (i % 2 ? amp(i) : -amp(i))}`)
              .join(" ")}
            fill="none"
            stroke={blow() ? "#fbbf24" : APP.pocket}
            stroke-width="1"
          />
        </svg>
        <div
          class="absolute inset-x-0 border-t border-dashed"
          style={{ top: "18%", "border-color": `${APP.warn}88` }}
        />
        <span
          class="absolute right-1.5 top-0.5 text-[8px]"
          style={{ color: APP.warn }}
        >
          blow threshold
        </span>
      </div>
      <div class="flex items-center gap-3" style={{ color: APP.muted }}>
        <Show when={blow()} fallback={<span>listening…</span>}>
          <span
            class="animate-rise px-1.5 rounded"
            style={{ background: APP.warn, color: "black" }}
          >
            BLOW detected
          </span>
        </Show>
        <span style={{ color: APP.faint }}>
          events: 12 · false positives: 0
        </span>
        <span class="ml-auto" style={{ color: APP.selSoft }}>
          ● record 2.0s → assets/samples/
        </span>
      </div>
    </div>
  );
};

export const TeakDspPanel: Component = () => {
  const tick = useTick(500);
  const load = () => 31 + (tick() % 5) * 3;
  return (
    <div
      class="p-3 space-y-3 font-mono text-[10px] animate-rise"
      style={{ color: APP.text }}
    >
      <div class="flex items-center gap-2">
        <span
          class="px-2 py-0.5 rounded"
          style={{ background: APP.panel2, color: APP.muted }}
        >
          echo_fx.cdc (COFF)
        </span>
        <span style={{ color: APP.ok }}>✓ loaded to P/D RAM</span>
        <span class="ml-auto" style={{ color: APP.muted }}>
          load {load()}% @ 134 MHz
        </span>
      </div>
      <div class="flex items-center gap-1.5">
        <For each={["pcm in", "echo 120ms", "gain +3dB", "out"]}>
          {(stage, i) => (
            <>
              <span
                class="px-2 py-1 rounded border"
                style={{
                  "border-color": tick() % 4 === i() ? APP.pocket : APP.line,
                  background: APP.panel,
                  color: tick() % 4 === i() ? APP.text : APP.muted,
                }}
              >
                {stage}
              </span>
              <Show when={i() < 3}>
                <span style={{ color: APP.faint }}>→</span>
              </Show>
            </>
          )}
        </For>
      </div>
      <div class="space-y-0.5" style={{ color: APP.faint }}>
        <div>pipe0 ← cmd SET_DELAY 120 · reply OK (2 941 cycles)</div>
        <div>pipe1 → 512-sample block · {480 + tick() % 20} blocks/s</div>
      </div>
    </div>
  );
};

export const CameraLabPanel: Component = () => {
  const phase = usePhase([1500, 300, 1500, 1500]);
  const snapped = () => phase() >= 2;
  return (
    <div
      class="p-3 flex flex-wrap gap-4 font-mono text-[10px] animate-rise"
      style={{ color: APP.text }}
    >
      <div class="space-y-1.5">
        <div
          class="relative w-40 h-28 rounded-sm border overflow-hidden"
          style={{
            "border-color": APP.line,
            background: phase() === 1
              ? "#fff"
              : `linear-gradient(${
                115 + phase() * 8
              }deg, #4a5568, #2d3748 60%, #1a202c)`,
            transition: "background 0.2s",
          }}
        >
          <span class="absolute top-1 left-1.5" style={{ color: APP.err }}>
            ● REC
          </span>
          <span
            class="absolute bottom-1 right-1.5"
            style={{ color: "#ffffff88" }}
          >
            256×192 · 15 fps
          </span>
        </div>
        <div class="flex gap-1.5">
          <For each={["normal", "negative", "sepia", "edge"]}>
            {(f, i) => (
              <span
                class="px-1.5 py-0.5 rounded"
                style={{
                  background: i() === 0 ? APP.sel : APP.panel2,
                  color: i() === 0 ? "white" : APP.muted,
                }}
              >
                {f}
              </span>
            )}
          </For>
        </div>
      </div>
      <div class="space-y-1.5 self-center">
        <div style={{ color: APP.faint }}>outer camera · live over USB</div>
        <span
          class="inline-block px-3 py-1 rounded"
          style={{
            background: phase() === 1 ? APP.panel2 : APP.sel,
            color: phase() === 1 ? APP.muted : "white",
          }}
        >
          ◉ capture
        </span>
        <Show when={snapped()}>
          <div class="animate-rise" style={{ color: APP.ok }}>
            ✓ frame → assets/captures/cam_0042.png
          </div>
        </Show>
      </div>
    </div>
  );
};

export const RtcPanel: Component = () => {
  const phase = usePhase([700, 700, 700, 700, 700, 2200]);
  const HOURS = [9, 13, 17, 20, 23, 7];
  const hour = () => HOURS[phase()];
  const night = () => hour() >= 20 || hour() < 8;
  return (
    <div
      class="p-3 flex flex-wrap items-center gap-4 font-mono text-[10px] animate-rise"
      style={{ color: APP.text }}
    >
      <div class="space-y-1.5">
        <div class="text-lg" style={{ color: APP.selSoft }}>
          {String(hour()).padStart(2, "0")}:00
        </div>
        <div style={{ color: APP.muted }}>2026-07-03 → scrubbing</div>
        <div
          class="relative h-1.5 w-40 rounded-full"
          style={{ background: APP.panel2 }}
        >
          <span
            class="absolute -top-[3px] size-3 rounded-full"
            style={{
              left: `calc(${(hour() / 24) * 100}% - 6px)`,
              background: night() ? "#5b7db1" : APP.warn,
              transition: "left 0.4s steps(4)",
            }}
          />
        </div>
      </div>
      <div
        class="w-32 h-20 rounded-sm border grid place-items-center"
        style={{
          "border-color": APP.line,
          background: night() ? "#1a2340" : "#4b69ad",
          transition: "background 0.4s",
        }}
      >
        <span style={{ color: night() ? "#c4d2f5" : "#fff" }}>
          {night() ? "🌙 shop closed" : "☀ shop open"}
        </span>
      </div>
      <div class="space-y-0.5" style={{ color: APP.muted }}>
        <div style={{ color: phase() >= 2 ? APP.ok : APP.faint }}>
          {phase() >= 2 ? "✓" : "·"} evening music switched
        </div>
        <div style={{ color: phase() >= 4 ? APP.ok : APP.faint }}>
          {phase() >= 4 ? "✓" : "·"} midnight save rollover survived
        </div>
        <div style={{ color: phase() >= 5 ? APP.ok : APP.faint }}>
          {phase() >= 5 ? "✓" : "·"} next-day event fired
        </div>
      </div>
    </div>
  );
};

export const TouchLabPanel: Component = () => {
  const phase = usePhase(Array(14).fill(200));
  const pts = () => Math.min(phase() + 1, 12);
  const CIRCLE = [...Array(12).keys()].map((i) => {
    const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
    return [50 + Math.cos(a) * 30, 50 + Math.sin(a) * 32];
  });
  const done = () => phase() >= 12;
  return (
    <div
      class="p-3 flex flex-wrap gap-4 font-mono text-[10px] animate-rise"
      style={{ color: APP.text }}
    >
      <div
        class="relative w-40 h-30 rounded-sm border"
        style={{
          "border-color": APP.line,
          background: "#1e2634",
          height: "120px",
        }}
      >
        <svg viewBox="0 0 100 100" class="absolute inset-0 w-full h-full">
          <polyline
            points={CIRCLE.slice(0, pts()).map((p) => p.join(",")).join(" ")}
            fill="none"
            stroke={done() ? "#34d399" : "#c4b5fd"}
            stroke-width="2"
            stroke-linecap="round"
          />
        </svg>
        <span class="absolute bottom-1 left-1.5" style={{ color: APP.faint }}>
          bottom screen · 4 096×4 096 raw
        </span>
      </div>
      <div class="space-y-1 self-center" style={{ color: APP.muted }}>
        <div>stroke: 12 samples · 380 ms</div>
        <div style={{ color: done() ? APP.ok : APP.faint }}>
          {done() ? "✓ recognized: circle (0.92)" : "recording…"}
        </div>
        <div style={{ color: APP.faint }}>
          saved as a test case — replays into the game via the debug link
        </div>
      </div>
    </div>
  );
};

export const Poly3dPanel: Component = () => {
  const tick = useTick(600);
  const polys = () => [1620, 1780, 1843, 2110, 1750][tick() % 5];
  const over = () => polys() > 2048;
  return (
    <div
      class="p-3 space-y-2.5 font-mono text-[10px] animate-rise"
      style={{ color: APP.text }}
    >
      <div class="flex justify-between" style={{ color: APP.muted }}>
        <span>polygons this frame</span>
        <span style={{ color: over() ? APP.err : APP.text }}>
          {polys()} / 2048
        </span>
      </div>
      <div
        class="h-2.5 rounded-sm overflow-hidden"
        style={{ background: APP.panel }}
      >
        <div
          class="h-full"
          style={{
            width: `${Math.min(100, (polys() / 2048) * 100)}%`,
            background: over()
              ? APP.err
              : polys() > 1850
              ? APP.warn
              : APP.pocket,
            transition: "width 0.4s",
          }}
        />
      </div>
      <div class="grid grid-cols-3 gap-2" style={{ color: APP.muted }}>
        <For
          each={[
            ["level.nsbmd", 1204],
            ["player.nsbmd", 214],
            ["fx quads", over() ? 692 : 402],
          ] as [string, number][]}
        >
          {([mesh, n]) => (
            <div
              class="rounded border px-2 py-1 flex justify-between"
              style={{ "border-color": APP.line, background: APP.panel }}
            >
              <span class="truncate">{mesh}</span>
              <span
                style={{
                  color: mesh === "fx quads" && over() ? APP.err : APP.faint,
                }}
              >
                {n}
              </span>
            </div>
          )}
        </For>
      </div>
      <div style={{ color: over() ? APP.err : APP.faint }}>
        {over()
          ? "⚠ over the per-frame limit — geometry engine will drop polygons"
          : "vertex RAM 61% · matrix stack 12/31"}
      </div>
    </div>
  );
};

export const GbCameraPanel: Component = () => {
  const phase = usePhase([1200, 900, 900, 2200]);
  const imported = () => phase() >= 3;
  const SHADES = ["#0f180f", "#39543a", "#87a888", "#cadbca"];
  return (
    <div
      class="p-3 space-y-2 font-mono text-[10px] animate-rise"
      style={{ color: APP.text }}
    >
      <div style={{ color: APP.muted }}>
        reading cart save… 26 photos found (128×112, 4 shades)
      </div>
      <div class="flex gap-2">
        <For each={[...Array(6).keys()]}>
          {(p) => (
            <div
              class="rounded-sm border p-0.5"
              style={{
                "border-color": p <= 1 && phase() >= 1 ? APP.sel : APP.line,
                background: APP.panel,
              }}
            >
              <div class="grid grid-cols-8 gap-px">
                <For each={[...Array(56).keys()]}>
                  {(i) => (
                    <span
                      class="size-1.5"
                      style={{
                        background: SHADES[(i * 2654435761 + p * 97) % 4],
                      }}
                    />
                  )}
                </For>
              </div>
            </div>
          )}
        </For>
      </div>
      <div style={{ color: imported() ? APP.ok : APP.faint }}>
        {imported()
          ? "✓ 2 photos → assets/photos/ (PNG + original 2bpp)"
          : phase() >= 1
          ? "2 selected — import?"
          : "…"}
      </div>
    </div>
  );
};

export const IrLabPanel: Component = () => {
  const phase = usePhase([800, 800, 800, 800, 2400, 600]);
  const LOG = [
    "ADV     cart broadcasts (HG/SS)",
    "SYNC    walker responds · session key exch",
    "DATA →  peer info 40 B",
    "DATA ←  steps=4 021 · watts=12",
  ];
  return (
    <div
      class="p-3 space-y-2 font-mono text-[10px] animate-rise"
      style={{ color: APP.text }}
    >
      <div class="flex items-center gap-2">
        <span style={{ color: APP.muted }}>cart IR (slot-1)</span>
        <span class="animate-blink" style={{ color: APP.err }}>◉</span>
        <span style={{ color: APP.muted }}>studio = Pokéwalker</span>
        <span class="ml-auto" style={{ color: APP.faint }}>
          emulating the peer, frame-accurate
        </span>
      </div>
      <div class="space-y-0.5">
        <For each={LOG.slice(0, phase() + 1)}>
          {(l) => (
            <div class="animate-rise" style={{ color: APP.muted }}>
              {l}
            </div>
          )}
        </For>
      </div>
      <Show when={phase() >= 4}>
        <div class="animate-rise" style={{ color: APP.ok }}>
          ✓ stroll complete — gift item granted · replayable as a test
        </div>
      </Show>
    </div>
  );
};

export const JoybusPanel: Component = () => {
  const phase = usePhase([900, 900, 900, 900, 2400, 600]);
  const STEPS = [
    ["RESET", "device id 0x0004 (GBA)"],
    ["STATUS", "ready · flags 0x28"],
    ["TRANS ↓", "multiboot stub 1.2 KiB"],
    ["RECV ↑", "Tingle Tuner input frame"],
  ];
  return (
    <div
      class="p-3 space-y-2 font-mono text-[10px] animate-rise"
      style={{ color: APP.text }}
    >
      <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <div
          class="rounded border p-2"
          style={{ "border-color": APP.sel, background: APP.panel }}
        >
          <div>studio = GameCube</div>
          <div style={{ color: APP.faint }}>JOY bus master · 800 kbps</div>
        </div>
        <span class="animate-blink" style={{ color: APP.selSoft }}>⇄</span>
        <div
          class="rounded border p-2"
          style={{ "border-color": APP.pocket, background: APP.panel }}
        >
          <div>GBA via link port</div>
          <div style={{ color: APP.faint }}>SIO mode: JOYBUS</div>
        </div>
      </div>
      <div class="space-y-0.5">
        <For each={STEPS.slice(0, phase() + 1)}>
          {([cmd, detail]) => (
            <div class="flex gap-3 animate-rise">
              <span class="w-14" style={{ color: APP.selSoft }}>{cmd}</span>
              <span style={{ color: APP.muted }}>{detail}</span>
            </div>
          )}
        </For>
      </div>
      <Show when={phase() >= 4}>
        <div style={{ color: APP.faint }}>
          test GC-linked features without owning a GameCube
        </div>
      </Show>
    </div>
  );
};

export const SolarCurvePanel: Component = () => {
  const phase = usePhase(Array(12).fill(400));
  const day = () => phase() / 11;
  const sunX = () => 10 + day() * 80;
  const sunY = () => 70 - Math.sin(day() * Math.PI) * 55;
  const lux = () => Math.max(0.05, Math.sin(day() * Math.PI));
  const gauge = () => Math.min(1, Math.pow(lux(), 0.6) * 1.05);
  return (
    <div
      class="p-3 grid sm:grid-cols-2 gap-4 font-mono text-[10px] animate-rise"
      style={{ color: APP.text }}
    >
      <div class="space-y-1.5">
        <div style={{ color: APP.faint }}>DAY CYCLE — scrub or simulate</div>
        <div
          class="relative h-20 rounded-sm border overflow-hidden"
          style={{
            "border-color": APP.line,
            background: `linear-gradient(#1a2340 ${
              100 - lux() * 80
            }%, #4b69ad)`,
          }}
        >
          <span
            class="absolute size-2.5 rounded-full"
            style={{
              left: `${sunX()}%`,
              top: `${sunY()}%`,
              background: "#fbbf24",
              "box-shadow": `0 0 ${6 + lux() * 10}px #fbbf24`,
              transition: "all 0.35s",
            }}
          />
        </div>
        <div style={{ color: APP.muted }}>
          {String(6 + Math.round(day() * 12)).padStart(2, "0")}:00 · sensor{" "}
          {Math.round(lux() * 9)}/9
        </div>
      </div>
      <div class="space-y-1.5">
        <div style={{ color: APP.faint }}>
          RESPONSE CURVE · lux → charge rate
        </div>
        <div
          class="relative h-20 rounded-sm border"
          style={{ "border-color": APP.line, background: APP.panel }}
        >
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            class="absolute inset-0 w-full h-full"
          >
            <polyline
              points={[...Array(21).keys()]
                .map((i) => `${i * 5},${100 - Math.pow(i / 20, 0.6) * 95}`)
                .join(" ")}
              fill="none"
              stroke={APP.warn}
              stroke-width="1.5"
            />
            <circle
              cx={lux() * 100}
              cy={100 - gauge() * 95}
              r="3"
              fill="#c4b5fd"
            />
          </svg>
        </div>
        <div
          class="h-1.5 rounded-sm overflow-hidden"
          style={{ background: APP.panel2 }}
        >
          <div
            class="h-full"
            style={{
              width: `${gauge() * 100}%`,
              background: APP.warn,
              transition: "width 0.35s",
            }}
          />
        </div>
        <div style={{ color: APP.faint }}>
          gun charge — tune the whole day without leaving your desk
        </div>
      </div>
    </div>
  );
};

export const PaletteProofPanel: Component = () => {
  const SWATCHES = ["#7c3aed", "#3f7d4e", "#b45309", "#5b7db1"];
  const VIEWS: [string, string][] = [
    ["source", "none"],
    ["GBA LCD", "brightness(0.72) contrast(0.85) saturate(0.8)"],
    ["SP backlit", "brightness(1.1) saturate(1.05)"],
    ["deuteranopia", "grayscale(0.4) sepia(0.3) hue-rotate(-20deg)"],
  ];
  return (
    <div
      class="p-3 space-y-2 font-mono text-[10px] animate-rise"
      style={{ color: APP.text }}
    >
      <div class="grid grid-cols-4 gap-2">
        <For each={VIEWS}>
          {([label, filter]) => (
            <div class="space-y-1">
              <div style={{ color: APP.faint }}>{label}</div>
              <div
                class="rounded border p-1.5 grid grid-cols-2 gap-1"
                style={{
                  "border-color": APP.line,
                  background: APP.panel,
                  filter,
                }}
              >
                <For each={SWATCHES}>
                  {(c) => (
                    <span
                      class="h-4 rounded-[2px]"
                      style={{ background: c }}
                    />
                  )}
                </For>
              </div>
            </div>
          )}
        </For>
      </div>
      <div style={{ color: APP.warn }}>
        ⚠ enemy (violet) vs grass (green): contrast 2.1 : 1 under deuteranopia —
        consider an outline
      </div>
      <div style={{ color: APP.faint }}>
        screen sims calibrated from real capture; checks run on every palette
        asset at build time
      </div>
    </div>
  );
};
