import {
  type Component,
  createSignal,
  For,
  onCleanup,
  onMount,
  Show,
} from "solid-js";
import { APP, usePhase } from "./studio-tour-kit.tsx";
import { useReducedMotion } from "../lib/media.ts";

export const InputReplayPanel: Component = () => {
  const phase = usePhase(Array(24).fill(240));
  const TRACKS: [string, number[]][] = [
    ["A", [4, 5, 11, 12, 19]],
    ["B", [8, 9]],
    ["←", [0, 1, 2, 3, 14, 15, 16]],
    ["→", [6, 7, 8, 9, 10, 20, 21, 22]],
  ];
  return (
    <div
      class="p-3 space-y-2 font-mono text-[10px] animate-rise"
      style={{ color: APP.text }}
    >
      <div class="space-y-1">
        <For each={TRACKS}>
          {([btn, frames]) => (
            <div class="flex items-center gap-2">
              <span class="w-4 text-center" style={{ color: APP.muted }}>
                {btn}
              </span>
              <div class="flex gap-px flex-1">
                <For each={[...Array(24).keys()]}>
                  {(f) => (
                    <span
                      class="flex-1 h-3.5 rounded-[1px]"
                      style={{
                        background: frames.includes(f)
                          ? f === phase() ? APP.selSoft : APP.sel
                          : f === phase()
                          ? APP.panel2
                          : APP.panel,
                        outline: f === phase()
                          ? `1px solid ${APP.text}`
                          : "none",
                      }}
                    />
                  )}
                </For>
              </div>
            </div>
          )}
        </For>
      </div>
      <div class="flex justify-between" style={{ color: APP.muted }}>
        <span>
          ▶ replaying on <span style={{ color: APP.pocket }}>pocket-debug</span>
          {" "}
          — recorded on melonDS
        </span>
        <span style={{ color: APP.ok }}>deterministic ✓</span>
      </div>
    </div>
  );
};

export const HotAssetPanel: Component = () => {
  const phase = usePhase([1200, 500, 900, 2000]);
  const painted = () => phase() >= 1;
  const patched = () => phase() >= 2;
  const GRID = [...Array(64).keys()];
  const spriteCell = (i: number) => {
    const x = i % 8, y = Math.floor(i / 8);
    return x >= 2 && x <= 5 && y >= 1 && y <= 6;
  };
  const hotCell = 28;
  return (
    <div
      class="p-3 flex flex-wrap items-center gap-5 font-mono text-[10px] animate-rise"
      style={{ color: APP.text }}
    >
      <div class="space-y-1.5">
        <div style={{ color: APP.faint }}>SPRITE EDITOR · player.4bpp</div>
        <div
          class="grid grid-cols-8 gap-px w-fit rounded border p-1"
          style={{ "border-color": APP.line, background: APP.panel }}
        >
          <For each={GRID}>
            {(i) => (
              <span
                class="size-3"
                style={{
                  background: i === hotCell
                    ? painted() ? APP.warn : "#c4b5fd"
                    : spriteCell(i)
                    ? "#8b5cf6"
                    : APP.panel2,
                  outline: i === hotCell && phase() === 1
                    ? `1px solid ${APP.text}`
                    : "none",
                }}
              />
            )}
          </For>
        </div>
      </div>
      <div
        class="text-center"
        style={{ color: patched() ? APP.ok : APP.faint }}
      >
        {patched() ? "→ 32 B → VRAM bank D ✓" : "→"}
        <div style={{ color: APP.faint }}>0 frames dropped</div>
      </div>
      <div class="space-y-1.5">
        <div style={{ color: APP.faint }}>ON DEVICE</div>
        <div
          class="relative w-28 h-20 rounded-sm border"
          style={{
            "border-color": APP.line,
            background: "linear-gradient(#2b3a67 70%, #3f7d4e 70%)",
          }}
        >
          <span
            class="absolute size-4 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{
              background: patched() ? APP.warn : "#8b5cf6",
              transition: "background 0.2s",
            }}
          />
        </div>
      </div>
    </div>
  );
};

export const ScanlinePanel: Component = () => {
  const phase = usePhase([1500, 1500, 1500, 1500]);
  const over = () => phase() === 2;
  const ROWS: [string, number, string][] = [
    ["sprite_update", 34, "#8b5cf6"],
    ["bg_scroll", 12, "#5b7db1"],
    ["audio_mix (arm7)", 18, "#2fb8a6"],
    ["game_logic", 22, "#fbbf24"],
  ];
  return (
    <div
      class="p-3 space-y-2 font-mono text-[10px] animate-rise"
      style={{ color: APP.text }}
    >
      <div style={{ color: APP.faint }}>
        frame budget: 160 visible scanlines + 68 vblank
      </div>
      <div class="space-y-1">
        <For each={ROWS}>
          {([name, w, color], i) => (
            <div class="flex items-center gap-2">
              <span class="w-28 truncate" style={{ color: APP.muted }}>
                {name}
              </span>
              <div
                class="flex-1 h-3 rounded-sm overflow-hidden"
                style={{ background: APP.panel }}
              >
                <div
                  class="h-full"
                  style={{
                    width: `${w + (over() && i() === 0 ? 14 : 0)}%`,
                    background: color,
                    transition: "width 0.4s steps(4)",
                  }}
                />
              </div>
              <span class="w-16 text-right" style={{ color: APP.faint }}>
                {Math.round((w + (over() && i() === 0 ? 14 : 0)) * 2.28)} lines
              </span>
            </div>
          )}
        </For>
      </div>
      <div
        class="h-1.5 rounded-sm overflow-hidden flex"
        style={{ background: APP.panel }}
      >
        <div style={{ width: "70%", background: APP.ok, opacity: 0.6 }} />
        <div
          style={{ width: "30%", background: over() ? APP.err : APP.panel2 }}
        />
      </div>
      <div style={{ color: over() ? APP.err : APP.ok }}>
        {over()
          ? "⚠ 4.2 scanlines over budget — sprite_update grew this frame"
          : "✓ 21 scanlines of headroom before vblank deadline"}
      </div>
    </div>
  );
};

export const TestRunnerPanel: Component = () => {
  const phase = usePhase([700, 700, 700, 700, 700, 3000, 500]);
  const TESTS: [string, string, boolean][] = [
    ["ipc::roundtrip", "142 µs", true],
    ["dma::copy32_irq", "88 µs", true],
    ["vram::bank_swap", "31 µs", true],
    ["sprite::oam_write", "expected x=104, got x=96", false],
    ["save::sram_rw", "3.2 ms", true],
  ];
  const done = () => Math.min(phase(), 5);
  return (
    <div
      class="p-3 space-y-1 font-mono text-[10px] animate-rise"
      style={{ color: APP.text }}
    >
      <div class="pb-1" style={{ color: APP.faint }}>
        cargo test --target pocket-debug — runs on the real ARM7TDMI
      </div>
      <For each={TESTS}>
        {([name, detail, pass], i) => (
          <div class="flex items-center gap-2">
            <span class="w-4 text-center">
              {i() < done()
                ? (
                  <span style={{ color: pass ? APP.ok : APP.err }}>
                    {pass ? "✓" : "✗"}
                  </span>
                )
                : i() === done() && phase() < 5
                ? (
                  <span class="animate-blink" style={{ color: APP.warn }}>
                    ▸
                  </span>
                )
                : <span style={{ color: APP.faint }}>·</span>}
            </span>
            <span style={{ color: i() < done() ? APP.text : APP.muted }}>
              {name}
            </span>
            <span
              class="ml-auto"
              style={{
                color: i() < done()
                  ? (pass ? APP.faint : APP.err)
                  : "transparent",
              }}
            >
              {detail}
            </span>
          </div>
        )}
      </For>
      <Show when={phase() >= 5}>
        <div class="pt-1 animate-rise" style={{ color: APP.err }}>
          4 passed · 1 failed — timings measured with the hardware timer
        </div>
      </Show>
    </div>
  );
};

export const OrchestraPanel: Component = () => {
  const phase = usePhase([600, 600, 600, 600, 1000, 2600, 600]);
  const DEVICES: [string, string][] = [
    ["pocket-1", APP.pocket],
    ["pocket-2", APP.pocket],
    ["isnitro", APP.isnitro],
    ["melonDS", "#8a9097"],
  ];
  const pct = (i: number) =>
    Math.max(0, Math.min(100, (phase() - i * 0.6) * 40));
  const synced = () => phase() >= 5;
  return (
    <div
      class="p-3 space-y-3 font-mono text-[10px] animate-rise"
      style={{ color: APP.text }}
    >
      <div class="grid grid-cols-4 gap-2">
        <For each={DEVICES}>
          {([name, color], i) => (
            <div
              class="rounded border p-2 space-y-1.5"
              style={{
                "border-color": synced() ? color : APP.line,
                background: APP.panel,
              }}
            >
              <div class="flex items-center gap-1.5">
                <span
                  class="size-1.5 rounded-full"
                  style={{ background: color }}
                />
                <span class="truncate">{name}</span>
              </div>
              <div
                class="h-1 rounded-sm overflow-hidden"
                style={{ background: APP.panel2 }}
              >
                <div
                  class="h-full"
                  style={{
                    width: `${pct(i())}%`,
                    background: color,
                    transition: "width 0.3s",
                  }}
                />
              </div>
              <div style={{ color: synced() ? APP.ok : APP.faint }}>
                {synced() ? "● synced" : pct(i()) >= 100 ? "ready" : "deploy…"}
              </div>
            </div>
          )}
        </For>
      </div>
      <div class="flex items-center gap-3" style={{ color: APP.muted }}>
        <span style={{ color: synced() ? APP.ok : APP.faint }}>
          input broadcast {synced() ? "ON" : "off"}
        </span>
        <Show when={synced()}>
          <span class="animate-blink" style={{ color: APP.selSoft }}>
            → A pressed on all 4
          </span>
        </Show>
        <span class="ml-auto" style={{ color: APP.faint }}>
          4-player wireless test, one click
        </span>
      </div>
    </div>
  );
};

export const CartSharePanel: Component = () => {
  const phase = usePhase([1400, 1400, 1400, 1400]);
  const CURSOR: [number, number][] = [[30, 40], [55, 30], [70, 60], [45, 70]];
  const cur = () => CURSOR[phase() % 4];
  return (
    <div
      class="p-3 grid sm:grid-cols-[auto_1fr] gap-4 font-mono text-[10px] animate-rise"
      style={{ color: APP.text }}
    >
      <div
        class="relative w-52 h-32 rounded-sm border overflow-hidden"
        style={{
          "border-color": APP.line,
          background: "linear-gradient(#2b3a67 60%, #3f7d4e 60%)",
        }}
      >
        <span
          class="absolute size-2.5"
          style={{ background: "#c4b5fd", left: "46%", top: "48%" }}
        />
        <span
          class="absolute"
          style={{
            left: `${cur()[0]}%`,
            top: `${cur()[1]}%`,
            color: APP.warn,
            transition: "all 0.6s steps(6)",
          }}
        >
          ➤
          <span
            class="ml-1 px-1 rounded-sm text-[8px]"
            style={{ background: APP.warn, color: "black" }}
          >
            kiv
          </span>
        </span>
      </div>
      <div class="space-y-1.5 self-center">
        <div class="flex items-center gap-2">
          <span
            class="px-2 py-0.5 rounded border truncate"
            style={{ "border-color": APP.line, color: APP.muted }}
          >
            inex.example/s/8f2a-live
          </span>
          <span style={{ color: APP.faint }}>copy</span>
        </div>
        <div style={{ color: APP.muted }}>
          <span style={{ color: APP.ok }}>●</span>{" "}
          kiv joined — watching your real cartridge, 23 ms away
        </div>
        <div style={{ color: APP.faint }}>
          viewers see live video + can point; you keep the controls. Perfect for
          "it only breaks on hardware".
        </div>
      </div>
    </div>
  );
};

export const SioAnalyzerPanel: Component = () => {
  const phase = usePhase([700, 700, 700, 700, 700, 700]);
  const word = (player: number) =>
    (0xf120 + phase() * 0x11 + player * 0x203) & 0xffff;
  return (
    <div
      class="p-3 space-y-3 font-mono text-[10px] animate-rise"
      style={{ color: APP.text }}
    >
      <div class="flex gap-1.5">
        <For each={["normal", "multiplayer", "uart", "joybus", "gp"]}>
          {(m) => (
            <span
              class="px-2 py-0.5 rounded"
              style={{
                background: m === "multiplayer" ? APP.sel : APP.panel2,
                color: m === "multiplayer" ? "white" : APP.muted,
              }}
            >
              {m}
            </span>
          )}
        </For>
        <span class="ml-auto" style={{ color: APP.faint }}>
          115200 baud · 4 connected
        </span>
      </div>
      <div class="grid grid-cols-4 gap-2">
        <For each={["P1 master", "P2", "P3", "P4"]}>
          {(p, i) => (
            <div
              class="rounded border p-2 space-y-1"
              style={{
                "border-color": i() === 0 ? APP.sel : APP.line,
                background: APP.panel,
              }}
            >
              <div style={{ color: i() === 0 ? APP.selSoft : APP.muted }}>
                {p}
              </div>
              <div
                class="rounded px-1.5 py-0.5 animate-rise"
                style={{ background: APP.panel2, color: APP.text }}
              >
                0x{word(i()).toString(16)}
              </div>
              <div style={{ color: APP.faint }}>SIOMULTI{i()}</div>
            </div>
          )}
        </For>
      </div>
      <div style={{ color: APP.muted }}>
        round {5820 + phase()}{" "}
        — one 16-bit word per player per transfer, master clocks the bus
      </div>
    </div>
  );
};

export const MultibootPanel: Component = () => {
  const phase = usePhase([800, 600, 600, 600, 600, 600, 2400, 600]);
  const pct = (i: number) => Math.max(0, Math.min(100, (phase() - 1 - i) * 45));
  const allDone = () => phase() >= 6;
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
          demo-mb.gba · 248 KiB
        </span>
        <span style={{ color: APP.faint }}>
          → over the link cable, no cartridges needed
        </span>
      </div>
      <div class="grid grid-cols-3 gap-2">
        <For each={[0, 1, 2]}>
          {(i) => (
            <div
              class="rounded border p-2 space-y-1.5"
              style={{
                "border-color": pct(i) >= 100 ? APP.ok : APP.line,
                background: APP.panel,
              }}
            >
              <div class="flex justify-between">
                <span>GBA #{i + 2}</span>
                <span style={{ color: APP.faint }}>no cart</span>
              </div>
              <div
                class="h-1.5 rounded-sm overflow-hidden"
                style={{ background: APP.panel2 }}
              >
                <div
                  class="h-full"
                  style={{
                    width: `${pct(i)}%`,
                    background: pct(i) >= 100 ? APP.ok : APP.sel,
                    transition: "width 0.4s steps(4)",
                  }}
                />
              </div>
              <div style={{ color: pct(i) >= 100 ? APP.ok : APP.muted }}>
                {pct(i) >= 100
                  ? "✓ booted"
                  : pct(i) > 0
                  ? "receiving…"
                  : "waiting"}
              </div>
            </div>
          )}
        </For>
      </div>
      <Show when={allDone()}>
        <div class="animate-rise" style={{ color: APP.ok }}>
          3 consoles booted from one image — instant playtest lobby
        </div>
      </Show>
    </div>
  );
};

export const WiredWirelessPanel: Component = () => {
  const phase = usePhase([600, 600, 600, 600, 600, 600]);
  const FRAMES = [
    "BEACON  parent gid=0x1a2 seq=421 · CRC ok",
    "JOIN-REQ  child#2 aid→2 · CRC ok",
    "MP-PARENT  12 B payload · vblank 8804",
    "MP-ACK  child#1 child#2 child#3 · CRC ok",
    "MP-PARENT  12 B payload · vblank 8805",
    "KEY-SET  child#3 · CRC ok",
  ];
  return (
    <div
      class="p-3 grid sm:grid-cols-[auto_1fr] gap-4 font-mono text-[10px] animate-rise"
      style={{ color: APP.text }}
    >
      <div class="relative w-40 h-32">
        <div
          class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded border px-2 py-1"
          style={{
            "border-color": APP.line,
            background: APP.panel2,
            color: APP.muted,
          }}
        >
          HUB
        </div>
        <For
          each={[
            ["top-0 left-1/2 -translate-x-1/2", "N1"],
            ["bottom-0 left-1/2 -translate-x-1/2", "N2"],
            ["left-0 top-1/2 -translate-y-1/2", "N3"],
            ["right-0 top-1/2 -translate-y-1/2", "N4"],
          ] as [string, string][]}
        >
          {([pos, label], i) => (
            <div
              class={`absolute ${pos} rounded border px-1.5 py-0.5`}
              style={{
                "border-color": phase() % 4 === i() ? APP.isnitro : APP.line,
                background: APP.panel,
                color: phase() % 4 === i() ? APP.text : APP.muted,
              }}
            >
              {label}
            </div>
          )}
        </For>
      </div>
      <div class="space-y-1 self-center">
        <div style={{ color: APP.faint }}>
          802.11b DSSS over RJ45 — Barker 0x5B8 · DBPSK 1 Mbps
        </div>
        <For each={FRAMES.slice(0, phase() + 1)}>
          {(f) => (
            <div class="animate-rise" style={{ color: APP.muted }}>
              {f}
            </div>
          )}
        </For>
        <div style={{ color: APP.pocket }}>
          real WM protocol, zero radio flakiness — capturable & replayable
        </div>
      </div>
    </div>
  );
};

export const WmSequencePanel: Component = () => {
  const phase = usePhase([900, 900, 900, 900, 700, 700, 700, 1600]);
  const STEPS: [string, boolean][] = [
    ["beacon (game id + banner)", true],
    ["scan → found parent", false],
    ["join request (aid?)", false],
    ["assoc response · aid=1", true],
  ];
  return (
    <div
      class="p-3 font-mono text-[10px] animate-rise"
      style={{ color: APP.text }}
    >
      <div class="grid grid-cols-[1fr_auto_1fr] gap-x-3">
        <div class="text-center pb-2" style={{ color: APP.isnitro }}>
          PARENT (isnitro)
        </div>
        <div />
        <div class="text-center pb-2" style={{ color: APP.pocket }}>
          CHILD (melonDS)
        </div>
        <For each={STEPS}>
          {([label, fromParent], i) => (
            <Show
              when={phase() >= i() + 1}
              fallback={
                <>
                  <div />
                  <div />
                  <div />
                </>
              }
            >
              <div class="col-span-3 flex items-center gap-2 py-0.5 animate-rise">
                <div
                  class="flex-1 h-px"
                  style={{
                    background: fromParent ? APP.isnitro : "transparent",
                  }}
                />
                <span style={{ color: APP.muted }}>
                  {fromParent ? "→" : "←"} {label}
                </span>
                <div
                  class="flex-1 h-px"
                  style={{
                    background: fromParent ? "transparent" : APP.pocket,
                  }}
                />
              </div>
            </Show>
          )}
        </For>
      </div>
      <Show when={phase() >= 5}>
        <div class="pt-2 animate-rise" style={{ color: APP.ok }}>
          ● connected — MP frame every vblank · {8800 + (phase() - 5) * 60}{" "}
          exchanged · 0 retries
        </div>
      </Show>
    </div>
  );
};

export const DlPlayPanel: Component = () => {
  const phase = usePhase([1200, 900, 700, 700, 700, 2200, 600]);
  const pct = () => Math.max(0, Math.min(100, (phase() - 2) * 34));
  return (
    <div
      class="p-3 space-y-3 font-mono text-[10px] animate-rise"
      style={{ color: APP.text }}
    >
      <div class="flex items-center gap-3">
        <div
          class="size-8 rounded grid place-items-center"
          style={{ background: APP.sel }}
        >
          <span class="size-3" style={{ background: "white" }} />
        </div>
        <div>
          <div>inex-demo — single-card play</div>
          <div style={{ color: APP.faint }}>
            broadcasting banner + icon · DS Download Play
          </div>
        </div>
        <span class="ml-auto animate-blink" style={{ color: APP.warn }}>
          ((( )))
        </span>
      </div>
      <Show
        when={phase() >= 1}
        fallback={<div style={{ color: APP.muted }}>waiting for clients…</div>}
      >
        <div
          class="rounded border p-2.5 space-y-1.5 animate-rise"
          style={{ "border-color": APP.line, background: APP.panel }}
        >
          <div class="flex justify-between">
            <span>DS (retail, no cart)</span>
            <span style={{ color: pct() >= 100 ? APP.ok : APP.muted }}>
              {pct() >= 100 ? "✓ booted" : `${pct()}%`}
            </span>
          </div>
          <div
            class="h-1.5 rounded-sm overflow-hidden"
            style={{ background: APP.panel2 }}
          >
            <div
              class="h-full"
              style={{
                width: `${pct()}%`,
                background: pct() >= 100 ? APP.ok : APP.sel,
                transition: "width 0.4s steps(4)",
              }}
            />
          </div>
        </div>
      </Show>
      <div style={{ color: APP.faint }}>
        ships the ARM9/ARM7 DL-play stubs the framework builds — test
        single-card multiplayer without a second flashcart
      </div>
    </div>
  );
};

export const PeripheralBenchPanel: Component = () => {
  const [t, setT] = createSignal(0);
  onMount(() => {
    const reduced = useReducedMotion();
    if (reduced()) return;
    let raf = 0;
    const loop = (now: number) => {
      setT(now / 1000);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    onCleanup(() => cancelAnimationFrame(raf));
  });
  const lux = () => 0.5 + Math.sin(t() * 0.8) * 0.45;
  const deg = () => Math.round((Math.sin(t() * 1.3) * 60 + 360) % 360);
  const rumbleOn = () => Math.floor(t() * 2) % 3 === 0;
  return (
    <div
      class="p-3 grid sm:grid-cols-3 gap-3 font-mono text-[10px] animate-rise"
      style={{ color: APP.text }}
    >
      <div
        class="rounded border p-2.5 space-y-1.5"
        style={{ "border-color": APP.line, background: APP.panel }}
      >
        <div style={{ color: APP.faint }}>SOLAR SENSOR</div>
        <div
          class="relative h-1.5 rounded-full"
          style={{ background: APP.panel2 }}
        >
          <span
            class="absolute -top-[3px] size-3 rounded-full"
            style={{
              left: `calc(${lux() * 100}% - 6px)`,
              background: APP.warn,
            }}
          />
        </div>
        <div style={{ color: APP.muted }}>
          ☀ {Math.round(lux() * 9)}/9 — Boktai without sunlight
        </div>
      </div>
      <div
        class="rounded border p-2.5 space-y-1.5"
        style={{ "border-color": APP.line, background: APP.panel }}
      >
        <div style={{ color: APP.faint }}>GYRO / TILT</div>
        <div class="grid place-items-center h-10">
          <div
            class="w-8 h-1 rounded-full"
            style={{
              background: APP.selSoft,
              transform: `rotate(${deg()}deg)`,
            }}
          />
        </div>
        <div style={{ color: APP.muted }}>{deg()}° — WarioWare Twisted</div>
      </div>
      <div
        class="rounded border p-2.5 space-y-1.5"
        style={{ "border-color": APP.line, background: APP.panel }}
      >
        <div style={{ color: APP.faint }}>RUMBLE</div>
        <div class="grid place-items-center h-10">
          <span
            class="size-5 rounded"
            style={{
              background: rumbleOn() ? APP.err : APP.panel2,
              transform: rumbleOn()
                ? `translate(${(t() * 40) % 2 - 1}px, ${(t() * 53) % 2 - 1}px)`
                : "none",
            }}
          />
        </div>
        <div style={{ color: APP.muted }}>
          {rumbleOn() ? "● pattern: heartbeat" : "idle"}
        </div>
      </div>
      <div class="sm:col-span-3" style={{ color: APP.faint }}>
        the studio impersonates the accessory — sensor values scripted or driven
        live from these controls
      </div>
    </div>
  );
};

export const GbPrinterPanel: Component = () => {
  const phase = usePhase([500, 400, 400, 400, 400, 400, 400, 2400, 600]);
  const rows = () => Math.min(Math.max(phase() - 1, 0), 6);
  const done = () => phase() >= 7;
  return (
    <div
      class="p-3 flex items-start gap-5 font-mono text-[10px] animate-rise"
      style={{ color: APP.text }}
    >
      <div class="space-y-0">
        <div
          class="w-32 rounded-t border px-2 py-1"
          style={{
            "border-color": APP.line,
            background: APP.panel2,
            color: APP.muted,
          }}
        >
          ▤ printer head {done() ? "" : "▸▸"}
        </div>
        <div
          class="w-32 border-x px-1.5 py-1 bg-white/95"
          style={{ "border-color": APP.line }}
        >
          <For each={[...Array(rows()).keys()]}>
            {(r) => (
              <div class="flex animate-rise">
                <For each={[...Array(14).keys()]}>
                  {(c) => (
                    <span
                      class="flex-1 aspect-square"
                      style={{
                        background: (r * 7 + c * 3) % 5 < 2
                          ? "#333"
                          : (r + c) % 4 === 0
                          ? "#999"
                          : "transparent",
                      }}
                    />
                  )}
                </For>
              </div>
            )}
          </For>
        </div>
        <Show when={done()}>
          <div
            class="w-32 border-x border-b border-dashed text-center text-[8px]"
            style={{ "border-color": APP.line, color: APP.faint }}
          >
            ✂ tear
          </div>
        </Show>
      </div>
      <div class="space-y-1 self-center" style={{ color: APP.muted }}>
        <div>Pokémon gold — “print pokédex entry”</div>
        <div style={{ color: done() ? APP.ok : APP.warn }}>
          {done()
            ? "✓ 160×144 received → saved to project"
            : `receiving band ${rows()}/6…`}
        </div>
        <div style={{ color: APP.faint }}>
          the studio answers the printer protocol on the link port — every print
          lands as a PNG in assets/prints/
        </div>
      </div>
    </div>
  );
};

export const Slot2Panel: Component = () => {
  const phase = usePhase([1000, 1400, 1400, 1000, 500, 500, 500, 500, 1200]);
  const stage = () => (phase() <= 2 ? "rumble" : "guitar");
  const fret = () => phase() - 4;
  return (
    <div
      class="p-3 space-y-2.5 font-mono text-[10px] animate-rise"
      style={{ color: APP.text }}
    >
      <div class="flex items-center gap-2">
        <span style={{ color: APP.faint }}>GBA SLOT:</span>
        <Show
          when={phase() >= 1}
          fallback={<span style={{ color: APP.muted }}>empty</span>}
        >
          <span class="animate-rise" style={{ color: APP.text }}>
            {stage() === "rumble" ? "Rumble Pak (DS)" : "Guitar Grip"}
          </span>
          <span
            class="px-1.5 rounded"
            style={{ background: APP.panel2, color: APP.ok }}
          >
            detected
          </span>
        </Show>
      </div>
      <Show when={stage() === "rumble" && phase() >= 2}>
        <div
          class="flex items-center gap-2 animate-rise"
          style={{ color: APP.muted }}
        >
          test pulse:
          <span class="animate-blink" style={{ color: APP.err }}>▮▮▮</span>
          8 ms on / 24 ms off · driven via slot-2 bus writes
        </div>
      </Show>
      <Show when={stage() === "guitar"}>
        <div class="flex items-center gap-2">
          <For each={["G", "R", "Y", "B"]}>
            {(f, i) => (
              <span
                class="size-6 rounded grid place-items-center border"
                style={{
                  "border-color": APP.line,
                  background: fret() === i()
                    ? ["#3f7d4e", "#b91c1c", "#b45309", "#1d4ed8"][i()]
                    : APP.panel2,
                  color: fret() === i() ? "white" : APP.faint,
                }}
              >
                {f}
              </span>
            )}
          </For>
          <span style={{ color: APP.muted }}>
            live fret state — key mapping editor below
          </span>
        </div>
      </Show>
      <div style={{ color: APP.faint }}>
        also: Opera RAM pak (+8 MiB, memtest), paddle, slider, IR carts
      </div>
    </div>
  );
};

export const NetplayPanel: Component = () => {
  const phase = usePhase([800, 800, 800, 800, 800, 800]);
  const desync = () => phase() === 4;
  return (
    <div
      class="p-3 space-y-3 font-mono text-[10px] animate-rise"
      style={{ color: APP.text }}
    >
      <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <div
          class="rounded border p-2 space-y-1"
          style={{ "border-color": APP.pocket, background: APP.panel }}
        >
          <div>you · pocket-debug</div>
          <div style={{ color: APP.faint }}>P1 · SIO multiplayer master</div>
        </div>
        <div class="text-center space-y-0.5">
          <div style={{ color: APP.muted }}>
            <span class="animate-blink" style={{ color: APP.selSoft }}>
              ◂▸
            </span>
          </div>
          <div style={{ color: desync() ? APP.warn : APP.faint }}>
            {desync() ? "resync…" : "38 ms RTT"}
          </div>
        </div>
        <div
          class="rounded border p-2 space-y-1"
          style={{ "border-color": APP.isnitro, background: APP.panel }}
        >
          <div>kiv · GBA + flashcart</div>
          <div style={{ color: APP.faint }}>P2 · 900 km away</div>
        </div>
      </div>
      <div class="flex items-center gap-4" style={{ color: APP.muted }}>
        <span>
          input delay <span style={{ color: APP.selSoft }}>2 frames</span>
        </span>
        <span>
          drift{" "}
          <span style={{ color: desync() ? APP.warn : APP.ok }}>
            {desync() ? "+1 frame → rolling back" : "0"}
          </span>
        </span>
        <span class="ml-auto" style={{ color: APP.faint }}>
          the cable, tunneled — two studios bridge their real link ports
        </span>
      </div>
    </div>
  );
};

export const ChoreographerPanel: Component = () => {
  const phase = usePhase([700, 700, 700, 700, 700, 700, 700, 700]);
  const head = () => (phase() / 7) * 100;
  const LANES: [string, string, [number, number, string][]][] = [
    ["P1", APP.isnitro, [[0, 100, "host"]]],
    ["P2", APP.pocket, [[14, 86, "joined"]]],
    ["P3", "#8a9097", [[14, 40, "joined"], [62, 38, "rejoined"]]],
    ["P4", "#fbbf24", [[28, 72, "joined"]]],
  ];
  return (
    <div
      class="p-3 space-y-2 font-mono text-[10px] animate-rise"
      style={{ color: APP.text }}
    >
      <div style={{ color: APP.faint }}>
        scenario: rejoin-storm.toml — scripted joins, drops and rejoins
      </div>
      <div class="space-y-1">
        <For each={LANES}>
          {([name, color, spans]) => (
            <div class="flex items-center gap-2">
              <span class="w-5" style={{ color: APP.muted }}>{name}</span>
              <div
                class="relative flex-1 h-4 rounded-sm"
                style={{ background: APP.panel }}
              >
                <For each={spans}>
                  {([at, w, label]) => (
                    <div
                      class="absolute inset-y-0 rounded-sm grid place-items-center text-[8px] text-black/70"
                      style={{
                        left: `${at}%`,
                        width: `${w}%`,
                        background: color,
                        opacity: head() >= at ? 0.9 : 0.25,
                      }}
                    >
                      {label}
                    </div>
                  )}
                </For>
              </div>
            </div>
          )}
        </For>
      </div>
      <div
        class="relative h-1 rounded-full"
        style={{ background: APP.panel2 }}
      >
        <span
          class="absolute -top-1 w-px h-3"
          style={{
            left: `${head()}%`,
            background: APP.text,
            transition: "left 0.5s steps(5)",
          }}
        />
      </div>
      <div
        style={{ color: phase() >= 4 && phase() <= 5 ? APP.warn : APP.muted }}
      >
        {phase() >= 4 && phase() <= 5
          ? "⚠ P3 dropped mid-frame — parent kept the slot, testing rejoin path"
          : "all sessions nominal — netcode chaos-testing on real hardware"}
      </div>
    </div>
  );
};
