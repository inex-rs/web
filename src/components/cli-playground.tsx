import { type Component, createEffect, createSignal, For } from "solid-js";
import { Scroll } from "./scroll.tsx";

type Line = { text: string; cls?: string };

const C = {
  text: "text-term-ink",
  muted: "text-term-ink-2",
  ok: "text-emerald-400",
  err: "text-red-400",
  warn: "text-amber-300",
  accent: "text-accent-hi",
};

const COMPLETIONS = [
  "help",
  "clear",
  "inex scan",
  "inex info",
  "inex upload game.nds",
  "inex debug-print",
  "inex gdb-server --port 4242",
  "inex pocket-video --out frame.ppm",
  "inex dump-firmware",
  "inex flash-firmware app.bin",
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const CliPlayground: Component = () => {
  const [lines, setLines] = createSignal<Line[]>([
    { text: "inex shell — a devkit is connected. try `inex scan` or `help`" },
  ]);
  const [input, setInput] = createSignal("");
  const [busy, setBusy] = createSignal(false);
  let inputEl!: HTMLInputElement;
  let endEl!: HTMLDivElement;
  const hist: string[] = [];
  let histIdx = -1;
  let tabIdx = -1;
  let tabBase = "";

  const push = (text: string, cls?: string) =>
    setLines((l) => [...l, { text, cls }]);
  const swap = (text: string, cls?: string) =>
    setLines((l) => [...l.slice(0, -1), { text, cls }]);

  createEffect(() => {
    lines();
    endEl?.scrollIntoView({ block: "nearest" });
  });
  // No autofocus: focus on click only, so the page doesn't scroll-jack mid-read.

  const scan = async () => {
    push("scanning USB…", "muted");
    await sleep(600);
    push("  bus 3 addr 28  Pocket Debug Cartridge   PICO2TB00   FW 1.00");
    await sleep(250);
    push("  bus 1 addr 04  IS-NITRO-EMULATOR        NUD-25xx");
    await sleep(150);
    push("2 devkits", "ok");
  };

  const info = async () => {
    await sleep(300);
    push("Pocket Debug Cartridge — connected");
    push("  serial    PICO2TB00");
    push("  firmware  1.00 (slot A) · slot B empty");
    push("  target    GBA (AGB-001 cart slot)");
    push("  features  breakpoints ×8 · memory · video capture · OTA");
  };

  const upload = async (rom?: string) => {
    if (!rom) {
      push("usage: inex upload <rom.nds|rom.gba>", "err");
      return;
    }
    push(`validating ${rom} — header ok, 412 KiB`, "muted");
    await sleep(400);
    push("uploading   0%", "warn");
    for (const pct of [18, 41, 67, 88, 100]) {
      await sleep(220);
      swap(`uploading ${String(pct).padStart(3, " ")}%`, "warn");
    }
    swap("uploaded 412 KiB in 0.6s", "ok");
    await sleep(350);
    push("booting…", "muted");
    await sleep(500);
    push("● running — `inex debug-print` tails OS_Print", "ok");
  };

  const debugPrint = async () => {
    push("draining OS_Print (ctrl-c to stop)…", "muted");
    for (
      const [d, l] of [
        [400, "[arm9] nitrofs mounted (42 files)"],
        [500, "[arm9] vblank loop up — 60 fps"],
        [700, "[arm7] audio: sdat player ready"],
        [900, "[arm9] input: L/R to cycle modes"],
      ] as [number, string][]
    ) {
      await sleep(d);
      push(l);
    }
    await sleep(600);
    push("^C", "muted");
  };

  const gdb = async (port: string) => {
    await sleep(300);
    push(`GDB server on :${port} — target is halted at your service`);
    push(`  arm-none-eabi-gdb -ex 'target remote :${port}' game.elf`, "muted");
    await sleep(700);
    push("client attached — breakpoints are FPGA PC-compares", "ok");
  };

  const video = async (out: string) => {
    push("requesting keyframe…", "muted");
    await sleep(500);
    push("240×160 RGB555 keyframe · lossless · 59.5 fps stream");
    await sleep(250);
    push(`wrote ${out} (115 KiB)`, "ok");
  };

  const dump = async () => {
    for (const b of ["monitor", "lca1", "lca2", "lca3"]) {
      push(`dumping ${b}…`, "muted");
      await sleep(450);
      swap(`  ${b.padEnd(8)} ✓ checksum ok`);
    }
    push("4/4 blobs verified — device XOR-fold matched", "ok");
  };

  const flash = async (img?: string) => {
    if (!img) {
      push("usage: inex flash-firmware <image.bin>", "err");
      return;
    }
    push(`staging ${img} to slot B…`, "muted");
    await sleep(600);
    push("CRC-32 verify ✓", "ok");
    await sleep(300);
    push("rebooting — USB re-enumerates…", "warn");
    await sleep(900);
    push("● reconnected on v0.2.0 (slot B)", "ok");
  };

  const dispatch = async (
    head: string,
    sub: string | undefined,
    rest: string[],
  ): Promise<void> => {
    if (head === "clear") setLines([]);
    else if (head === "help" || (head === "inex" && !sub)) {
      push("inex <command> — the devkit CLI. this shell scripts the");
      push("hardware side so every command answers like a real cart:");
      for (const c of COMPLETIONS.slice(2)) push(`  ${c}`, "muted");
      push("↑ history · Tab completes", "muted");
    } else if (head !== "inex") {
      push(
        `command not found: ${head} — this shell only speaks inex (try help)`,
        "err",
      );
    } else if (sub === "scan") await scan();
    else if (sub === "info") await info();
    else if (sub === "upload") await upload(rest[0]);
    else if (sub === "debug-print") await debugPrint();
    else if (sub === "gdb-server") {
      await gdb(rest[0] === "--port" && rest[1] ? rest[1] : "4242");
    } else if (sub === "pocket-video") {
      await video(rest[0] === "--out" && rest[1] ? rest[1] : "frame.ppm");
    } else if (sub === "dump-firmware") await dump();
    else if (sub === "flash-firmware") await flash(rest[0]);
    else push(`unknown subcommand: ${sub} (try help)`, "err");
  };

  const run = (raw: string) => {
    const cmd = raw.trim();
    push(`❯ ${cmd}`, "accent");
    if (!cmd) return;
    hist.push(cmd);
    histIdx = -1;
    const [head, sub, ...rest] = cmd.split(/\s+/);
    setBusy(true);
    dispatch(head, sub, rest).finally(() => {
      setBusy(false);
      inputEl?.focus();
    });
  };

  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !busy()) {
      const v = input();
      setInput("");
      run(v);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!hist.length) return;
      histIdx = histIdx < 0 ? hist.length - 1 : Math.max(0, histIdx - 1);
      setInput(hist[histIdx]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (histIdx < 0) return;
      histIdx++;
      if (histIdx >= hist.length) {
        histIdx = -1;
        setInput("");
      } else setInput(hist[histIdx]);
    } else if (e.key === "Tab") {
      e.preventDefault();
      if (tabIdx < 0) tabBase = input();
      const hits = COMPLETIONS.filter((c) => c.startsWith(tabBase));
      if (!hits.length) return;
      tabIdx = (tabIdx + 1) % hits.length;
      setInput(hits[tabIdx]);
      return;
    }
    if (e.key !== "Tab") tabIdx = -1;
  };

  return (
    <div
      class="rounded-lg border border-term-line bg-term overflow-hidden cursor-text"
      onClick={() => inputEl?.focus()}
    >
      <div class="flex items-center gap-2 px-3 py-1.5 border-b border-term-line">
        <span class="size-2 rounded-full bg-term-line" />
        <span class="size-2 rounded-full bg-term-line" />
        <span class="font-mono text-[10px] text-term-ink-2">
          inex — interactive (scripted hardware)
        </span>
      </div>
      <Scroll dark class="h-64">
        <div class="p-3 font-mono text-[12.5px] leading-relaxed">
          <For each={lines()}>
            {(l) => (
              <div
                class={`whitespace-pre-wrap break-words ${
                  C[(l.cls ?? "text") as keyof typeof C]
                }`}
              >
                {l.text}
              </div>
            )}
          </For>
          <div class="flex items-center gap-2">
            <span class={busy() ? C.muted : C.accent}>❯</span>
            <input
              ref={inputEl}
              value={input()}
              disabled={busy()}
              onInput={(e) => setInput(e.currentTarget.value)}
              onKeyDown={onKey}
              spellcheck={false}
              autocapitalize="off"
              autocomplete="off"
              aria-label="inex shell input"
              class={`flex-1 bg-transparent outline-none caret-accent-hi ${C.text}`}
            />
          </div>
          <div ref={endEl} />
        </div>
      </Scroll>
    </div>
  );
};
