import {
  type Component,
  createSignal,
  For,
  type JSX,
  Match,
  onMount,
  Show,
  Switch,
} from "solid-js";
import { Dynamic } from "solid-js/web";
import { createRAF } from "@solid-primitives/raf";
import { createTimer } from "@solid-primitives/timer";
import { useReducedMotion } from "../lib/media.ts";
import { Scroll } from "./scroll.tsx";
import {
  IconActivity,
  IconBug,
  IconChevronRight,
  IconCode,
  IconCpu,
  IconDeviceDesktop,
  IconDeviceGamepad2,
  IconFolder,
  IconHammer,
  IconPalette,
  IconPlug,
  IconSitemap,
  IconX,
} from "@tabler/icons-solidjs";
import { APP, usePhase } from "./studio-tour-kit.tsx";
import {
  CartSharePanel,
  ChoreographerPanel,
  DlPlayPanel,
  GbPrinterPanel,
  HotAssetPanel,
  InputReplayPanel,
  MultibootPanel,
  NetplayPanel,
  OrchestraPanel,
  PeripheralBenchPanel,
  ScanlinePanel,
  SioAnalyzerPanel,
  Slot2Panel,
  TestRunnerPanel,
  WiredWirelessPanel,
  WmSequencePanel,
} from "./studio-tour-future-link.tsx";
import {
  DotcodeDesignerPanel,
  FontDesignerPanel,
  LobbyDesignerPanel,
  PrinterDesignerPanel,
  ProtocolFuzzPanel,
  RumbleDesignerPanel,
  SaveWorkshopPanel,
  ScannerPanel,
  SdatTrackerPanel,
  TilemapLivePanel,
} from "./studio-tour-designers.tsx";
import {
  CameraLabPanel,
  ChannelMixerPanel,
  GbCameraPanel,
  IrLabPanel,
  JoybusPanel,
  MicLabPanel,
  PaletteProofPanel,
  Poly3dPanel,
  RtcPanel,
  SolarCurvePanel,
  SwarEditorPanel,
  TeakDspPanel,
  TouchLabPanel,
} from "./studio-tour-hardware.tsx";

const GbaScreen: Component<{ scale?: number }> = (props) => {
  let canvas: HTMLCanvasElement | undefined;
  const [fps, setFps] = createSignal(60);

  const reduced = useReducedMotion();
  onMount(() => {
    const el = canvas!;
    const ctx = el.getContext("2d")!;
    const W = 120, H = 80;
    el.width = W;
    el.height = H;

    let frames = 0;
    let last = performance.now();

    const draw = (t: number) => {
      const bands = ["#2b3a67", "#33487e", "#3d5795", "#4b69ad"];
      bands.forEach((c, i) => {
        ctx.fillStyle = c;
        ctx.fillRect(0, i * 12, W, 12);
      });
      const off = Math.floor(t / 40) % 16;
      for (let y = 48; y < H; y += 8) {
        for (let x = -16; x < W; x += 8) {
          const odd = ((x + off) / 8 + y / 8) % 2 === 0;
          ctx.fillStyle = odd ? "#3f7d4e" : "#356b42";
          ctx.fillRect(x + off, y, 8, 8);
        }
      }
      const bx = Math.floor(W / 2 + Math.sin(t / 900) * 34);
      const by = Math.floor(38 - Math.abs(Math.sin(t / 300)) * 22);
      ctx.fillStyle = "rgba(0,0,0,0.3)";
      ctx.fillRect(bx - 3, 46, 10, 3);
      ctx.fillStyle = "#8b5cf6";
      ctx.fillRect(bx - 4, by - 4, 8, 8);
      ctx.fillStyle = "#c4b5fd";
      ctx.fillRect(bx - 4, by - 4, 8, 2);
    };

    const [, start] = createRAF((t) => {
      draw(t);
      frames++;
      if (t - last >= 1000) {
        setFps(frames);
        frames = 0;
        last = t;
      }
    });
    if (reduced()) draw(0);
    else start();
  });

  return (
    <div class="relative inline-block">
      <canvas
        ref={canvas}
        class="block border"
        style={{
          width: `${240 * (props.scale ?? 1)}px`,
          height: `${160 * (props.scale ?? 1)}px`,
          "image-rendering": "pixelated",
          "border-color": APP.line,
        }}
      />
      <span
        class="absolute top-1.5 right-2 font-mono text-[10px] px-1 rounded"
        style={{ color: APP.ok, background: "rgba(0,0,0,0.5)" }}
      >
        ● LIVE {fps()} fps
      </span>
    </div>
  );
};

type Status = "shipped" | "wip" | "concept";
type Region =
  | "rail"
  | "toolbar"
  | "main"
  | "inspector"
  | "dock"
  | "bottombar"
  | "palette";

type Stop = {
  id: string;
  label: string;
  title: string;
  group: string;
  status: Status;
  region: Region;
  view?: PanelId;
  body: string;
  hint?: string;
};

const STATUS: Record<Status, { label: string; color: string }> = {
  shipped: { label: "shipped", color: "#059669" },
  wip: { label: "in progress", color: "#b45309" },
  concept: { label: "concept", color: "#7c3aed" },
};

const STOPS: Stop[] = [
  {
    id: "rail",
    label: "Activity rail",
    title: "Activity rail — two contexts",
    group: "shell & chrome",
    status: "shipped",
    region: "rail",
    body: "The rail is the app's spine. The top group is the Author context " +
      "(Code, Project, Assets, Files, Build) and is always available; the " +
      "bottom group is the Debug context (Debugger, CPU, Video, Trace), " +
      "which shows live data while a session is active. Starting a session " +
      "auto-focuses the Debugger.",
    hint: "Click any icon in the mock rail to jump to that panel.",
  },
  {
    id: "toolbar",
    label: "Top bar",
    title: "Top bar — File, project, devkit",
    group: "shell & chrome",
    status: "shipped",
    region: "toolbar",
    body: "The top bar doubles as the window's title bar — the OS ribbon is " +
      "off, so you drag it to move the window and the window controls sit " +
      "in its corner. File holds the cross-cutting pipelines (PNG → " +
      "tileset, WAV → ADPCM, NARC packing, LZ77/Huffman/RLE codecs); the " +
      "project chip shows name, platform and game code; and the devkit " +
      "control picks, connects and switches devices — tinted in the " +
      "connected device's manifest theme, teal for the Pocket cart. A " +
      "green GDB badge appears when an emulator exposes a stub.",
  },
  {
    id: "inspector",
    label: "Device inspector",
    title: "Device inspector",
    group: "shell & chrome",
    status: "shipped",
    region: "inspector",
    body: "Devices appear the moment they enumerate — a hotplug watch, not a " +
      "refresh button. Each device type is described by a manifest (USB " +
      "descriptors, theme, image), so the Pocket cart shows up teal and " +
      "the IS-NITRO blue. When Saros has a newer image " +
      "for a connected device, the update offer lands here.",
  },
  {
    id: "dock",
    label: "Output dock",
    title: "Output dock",
    group: "shell & chrome",
    status: "shipped",
    region: "dock",
    body: "Tabbed output above the bottom bar: Log, Debug Console, Debug " +
      "Server — the editor debug bridge, where your editor's gdb/lldb " +
      "attaches while studio keeps driving the same session — and " +
      "Diagnostics, the project-health checks with one-click fixes. The " +
      "Diagnostics tab carries its issue count and only appears while a " +
      "project is open.",
  },
  {
    id: "bottombar",
    label: "Bottom bar",
    title: "Bottom bar — run controls & tasks",
    group: "shell & chrome",
    status: "shipped",
    region: "bottombar",
    body: "It leads with the debugger-state indicator — click it in the " +
      "real app to jump to the Debugger — then Build & Run (build, then " +
      "deploy to the selected target, hardware or emulator alike), Run " +
      "Last, and the hardware runtime controls: Halt, Continue, Step " +
      "while halted, Reset. Record captures sessions for replay. On the " +
      "right, the unified task area — build, deploy, firmware dump and " +
      "flash progress all land there — plus the diagnostics indicator " +
      "and the Commands button.",
  },
  {
    id: "palette",
    label: "Command palette",
    title: "Command palette",
    group: "shell & chrome",
    status: "shipped",
    region: "palette",
    body: "One searchable list of every command: file operations, undo/redo, " +
      "Go-to for each section, and the asset pipelines (PNG → tileset, " +
      "WAV → ADPCM, NARC packing, the codec compressors). Filtering " +
      "matches the command or its group, and ↑/↓ plus Enter drive it " +
      "entirely from the keyboard.",
    hint: "Ctrl+P in the real app — or the Commands button in the bottom bar.",
  },
  {
    id: "welcome",
    label: "Welcome screen",
    title: "Welcome — chooser & project wizard",
    group: "shell & chrome",
    status: "shipped",
    region: "main",
    view: "welcome",
    body: "Before a project opens, the studio shows the chooser: recent " +
      "projects as one-click rows, Open Project, and the New Project " +
      "wizard — name it, pick GBA, NDS or DSi, and it scaffolds the cargo " +
      "project, inex.toml and the assets/ tree. File → Welcome… brings it " +
      "back any time.",
  },
  {
    id: "code",
    label: "Code",
    title: "Code — tabbed editor",
    group: "author context",
    status: "shipped",
    region: "main",
    view: "code",
    body: "A tabbed text editor with the file tree alongside. inex projects " +
      "are plain cargo projects — what you edit here is exactly what " +
      "builds on the CLI, with no studio-only project format.",
  },
  {
    id: "project",
    label: "Project",
    title: "Project — tree & configuration",
    group: "author context",
    status: "shipped",
    region: "main",
    view: "project",
    body: "The project tree plus inex.toml, the single source of truth for " +
      "project configuration and feature flags. Right-click for file " +
      "operations; feature toggles route through the config so the " +
      "on-disk state and the UI never disagree.",
  },
  {
    id: "assets",
    label: "Assets",
    title: "Assets — feature-gated editors",
    group: "author context",
    status: "shipped",
    region: "main",
    view: "assets",
    body: "Editors for graphics, tilemaps, sprites, fonts, 3D models, sound " +
      "and e-Reader cards. Each is gated behind a feature flag in " +
      "inex.toml: enable one and its folder-backed editor appears (and " +
      "the asset pipeline picks the folder up); disable it and " +
      "diagnostics offer to clean up what's left behind.",
    hint: "Every sub-tab is clickable — the whole panel group is mocked.",
  },
  {
    id: "files",
    label: "Files",
    title: "Files — the ROM filesystem",
    group: "author context",
    status: "shipped",
    region: "main",
    view: "files",
    body: "Two views of the filesystem: the planned NitroFS layout derived " +
      "from assets/, and the filesystem inside a built or loaded ROM. " +
      "The whole assets/ tree goes through one pipeline into NitroFS — " +
      "the filesystem is the source of truth, not a catalogue.",
    hint: "Every sub-tab is clickable — the whole panel group is mocked.",
  },
  {
    id: "build",
    label: "Build",
    title: "Build — dashboard & artifacts",
    group: "author context",
    status: "shipped",
    region: "main",
    view: "build",
    body: "Streaming cargo output on the dashboard, plus ROM inspector, ROM " +
      "diff and compatibility sub-tabs. The artifact card at the end " +
      "deploys straight to the connected device.",
    hint: "Every sub-tab is clickable — the whole panel group is mocked.",
  },
  {
    id: "debugger",
    label: "Debugger",
    title: "Debugger — disassembly, stack, watch",
    group: "debug context",
    status: "wip",
    region: "main",
    view: "debugger",
    body: "Disassembly with breakpoints, a call stack and a watch list, " +
      "driven over the same debug bridge the CLI serves (inex " +
      "gdb-server). On the Pocket cart breakpoints are FPGA hardware " +
      "PC-compares; on IS-NITRO the on-device debug monitor handles " +
      "them. The panels are still filling out.",
    hint: "Every sub-tab is clickable — the whole panel group is mocked.",
  },
  {
    id: "cpu",
    label: "CPU",
    title: "CPU — memory, IO registers, map",
    group: "debug context",
    status: "wip",
    region: "main",
    view: "cpu",
    body: "A hex viewer, decoded IO registers and a clickable memory map " +
      "that jumps the viewer to a region. Watched bytes update live " +
      "while the target runs.",
    hint: "Every sub-tab is clickable — the whole panel group is mocked.",
  },
  {
    id: "video",
    label: "Video",
    title: "Video — VRAM, OAM & live capture",
    group: "debug context",
    status: "shipped",
    region: "main",
    view: "video",
    body: "Graphics state — VRAM bank assignments and active OAM sprites — " +
      "next to a live, lossless video stream of the target's screen. " +
      "The capture path is hardware-validated on the Pocket cart at " +
      "a sustained ~60 fps.",
    hint: "Every sub-tab is clickable — the whole panel group is mocked.",
  },
  {
    id: "trace",
    label: "Trace",
    title: "Trace — IPC, DMA, frame timing",
    group: "debug context",
    status: "wip",
    region: "main",
    view: "trace",
    body: "The runtime's plumbing, visualised: IPC channel traffic, DMA " +
      "channel activity, per-frame timing against the 16.7 ms budget, " +
      "and stream/wifi status lines.",
    hint: "Every sub-tab is clickable — the whole panel group is mocked.",
  },
  {
    id: "timetravel",
    label: "Time travel",
    title: "Time-travel debugging",
    group: "future concepts",
    status: "concept",
    region: "main",
    view: "timetravel",
    body: "Deterministic replay: scrub the timeline and the whole machine " +
      "state reconstructs — every frame, every register, backwards and " +
      "forwards. The groundwork is the same determinism the emulator " +
      "harness already relies on.",
  },
  {
    id: "lockstep",
    label: "HW ⇄ emu lockstep",
    title: "Hardware ⇄ emulator lockstep",
    group: "future concepts",
    status: "concept",
    region: "main",
    view: "lockstep",
    body: "Run real hardware and melonDS side by side on the same inputs " +
      "and hash state every frame. The first divergent write is your " +
      "bug — or the emulator's — found automatically instead of by " +
      "staring at two screens.",
  },
  {
    id: "tuning",
    label: "Live tuning",
    title: "Live tuning",
    group: "future concepts",
    status: "concept",
    region: "main",
    view: "tuning",
    body: "Sliders bound to a tunables table in EWRAM over the live memory " +
      "link. Drag gravity and watch the jump change on the device — no " +
      "rebuild, no reflash, no lost state.",
  },
  {
    id: "provenance",
    label: "Pixel provenance",
    title: "Pixel provenance",
    group: "future concepts",
    status: "concept",
    region: "main",
    view: "provenance",
    body: "Click any pixel on the captured screen and see exactly why it's " +
      "there: which layer, which tile, which palette entry, and the " +
      "source asset in your project that drew it.",
  },
  {
    id: "crashbox",
    label: "Crash black box",
    title: "Crash black box",
    group: "future concepts",
    status: "concept",
    region: "main",
    view: "crashbox",
    body: "The last 120 frames, a register trail, the stack and the input " +
      "tail are always kept. When the ROM crashes you get a shareable " +
      "crash card instead of a black screen and a shrug.",
  },
  {
    id: "treemap",
    label: "ROM budget",
    title: "ROM budget treemap",
    group: "future concepts",
    status: "concept",
    region: "main",
    view: "treemap",
    body: "Every build diffs against the last: a treemap of code, runtime " +
      "and assets shows what grew and how close you are to the cart " +
      "budget — before it becomes a shipping problem.",
  },
  {
    id: "inputreplay",
    label: "Input replay",
    title: "Input recording & replay",
    group: "future concepts",
    status: "concept",
    region: "main",
    view: "inputreplay",
    body: "Capture every button press with cycle timing and replay it " +
      "deterministically — TAS-grade input tracks you can trim, diff and " +
      "ship alongside a bug report.",
  },
  {
    id: "hotasset",
    label: "Hot asset reload",
    title: "Hot asset reload",
    group: "future concepts",
    status: "concept",
    region: "main",
    view: "hotasset",
    body: "Repaint a tile or nudge a palette and the running cartridge " +
      "updates in place — no rebuild, no redeploy, the change lands on " +
      "hardware as you draw it.",
  },
  {
    id: "scanline",
    label: "Scanline profiler",
    title: "Scanline profiler",
    group: "future concepts",
    status: "concept",
    region: "main",
    view: "scanline",
    body: "A per-scanline budget broken out by subsystem — CPU, DMA, 2D, " +
      "3D, audio — so a frame that blows its timing shows you exactly " +
      "which line and which engine spent it.",
  },
  {
    id: "testrunner",
    label: "Hardware tests",
    title: "Tests on real hardware",
    group: "future concepts",
    status: "concept",
    region: "main",
    view: "testrunner",
    body: "Run the suite on the connected device, timed by the hardware " +
      "timer — pass/fail and cycle counts come back from the silicon, not " +
      "an emulator's approximation.",
  },
  {
    id: "orchestra",
    label: "Device orchestra",
    title: "Device orchestra",
    group: "future concepts",
    status: "concept",
    region: "main",
    view: "orchestra",
    body: "Drive up to four linked devices from one click for multiplayer " +
      "and Download Play tests — the studio conducts the whole session and " +
      "collects every side.",
  },
  {
    id: "cartshare",
    label: "Shared session",
    title: "Shared live session",
    group: "future concepts",
    status: "concept",
    region: "main",
    view: "cartshare",
    body: "Invite a remote collaborator to watch your cartridge live — " +
      "shared video, state and controls over the registry link, so another " +
      "set of eyes lands on the bug with you.",
  },
  {
    id: "sio",
    label: "SIO analyzer",
    title: "SIO analyzer — the link port, decoded",
    group: "link & multiplayer",
    status: "concept",
    region: "main",
    view: "sio",
    body: "The serial link port decoded live: mode, clock and every byte on " +
      "the wire, framed and annotated as it transfers.",
  },
  {
    id: "multiboot",
    label: "MultiBoot deploy",
    title: "MultiBoot deploy",
    group: "link & multiplayer",
    status: "concept",
    region: "main",
    view: "multiboot",
    body: "Boot a cartridge-less console over the link cable — push a " +
      "MultiBoot image to a bare GBA or DS and watch it come up.",
  },
  {
    id: "wiredwireless",
    label: "Wired-wireless",
    title: "Wired-wireless arena",
    group: "link & multiplayer",
    status: "concept",
    region: "main",
    view: "wiredwireless",
    body: "DS wireless multiplayer carried over the devkit RJ45 baseband, " +
      "deterministically — a repeatable arena for netcode you can replay.",
  },
  {
    id: "wm",
    label: "WM inspector",
    title: "WM session inspector",
    group: "link & multiplayer",
    status: "concept",
    region: "main",
    view: "wm",
    body: "The DS wireless-manager parent/child handshake, live: beacons, " +
      "joins and the per-slot state machine as it negotiates a session.",
  },
  {
    id: "dlplay",
    label: "Download Play",
    title: "Download Play sender",
    group: "link & multiplayer",
    status: "concept",
    region: "main",
    view: "dlplay",
    body: "Serve a single-card Download Play binary to nearby consoles to " +
      "test the whole receive-and-boot flow without extra cartridges.",
  },
  {
    id: "netplay",
    label: "Link tunnel",
    title: "Link tunnel — netplay for real ports",
    group: "link & multiplayer",
    status: "concept",
    region: "main",
    view: "netplay",
    body: "Tunnel a real link port across the internet — netplay for " +
      "hardware, so two physical consoles play as if they were cabled " +
      "together.",
  },
  {
    id: "choreographer",
    label: "Choreographer",
    title: "Multiplayer choreographer",
    group: "link & multiplayer",
    status: "concept",
    region: "main",
    view: "choreographer",
    body: "Script join, drop and latency chaos across a session to stress " +
      "multiplayer code against the messy cases that only happen live.",
  },
  {
    id: "peripheralbench",
    label: "Peripheral bench",
    title: "Peripheral bench",
    group: "peripherals & accessories",
    status: "concept",
    region: "main",
    view: "peripheralbench",
    body: "Solar sensor, gyro, tilt, rumble — synthesize peripheral inputs " +
      "without the hardware and feed them straight to the running game.",
  },
  {
    id: "slot2",
    label: "Slot-2 inspector",
    title: "Slot-2 inspector",
    group: "peripherals & accessories",
    status: "concept",
    region: "main",
    view: "slot2",
    body: "Inspect and emulate Slot-2 accessories — Rumble Pak, Guitar " +
      "Grip, Opera RAM — with live detection and register state.",
  },
  {
    id: "gbprinter",
    label: "GB Printer",
    title: "GB Printer emulator",
    group: "peripherals & accessories",
    status: "concept",
    region: "main",
    view: "gbprinter",
    body: "A virtual Game Boy Printer: the game prints, and the sheets land " +
      "as PNGs in your project's assets.",
  },
  {
    id: "gbcamera",
    label: "GB Camera",
    title: "GB Camera importer",
    group: "peripherals & accessories",
    status: "concept",
    region: "main",
    view: "gbcamera",
    body: "Pull photos off a Game Boy Camera cartridge and drop them " +
      "straight into your assets tree.",
  },
  {
    id: "ir",
    label: "IR lab",
    title: "IR lab — the studio as a Pokéwalker",
    group: "peripherals & accessories",
    status: "concept",
    region: "main",
    view: "ir",
    body: "Drive the DS/Pokéwalker infrared link — the studio plays the " +
      "other end of an IR conversation.",
  },
  {
    id: "joybus",
    label: "JOYBUS bridge",
    title: "JOYBUS bridge",
    group: "peripherals & accessories",
    status: "concept",
    region: "main",
    view: "joybus",
    body: "Speak the GameCube JOYBUS protocol to a GBA over the link " +
      "cable — GC↔GBA link testing without a GameCube in the room.",
  },
  {
    id: "solar",
    label: "Solar curve",
    title: "Solar curve designer",
    group: "peripherals & accessories",
    status: "concept",
    region: "main",
    view: "solar",
    body: "Author a day's worth of Boktai solar-sensor readings and replay " +
      "the curve at your desk, any hour, any weather.",
  },
  {
    id: "printerdesigner",
    label: "Print designer",
    title: "Print designer",
    group: "designers & workshops",
    status: "concept",
    region: "main",
    view: "printerdesigner",
    body: "Lay out a printed sheet, preview the thermal render and calibrate " +
      "burn intensity before the game ever drives the printer.",
  },
  {
    id: "rumbledesigner",
    label: "Rumble designer",
    title: "Rumble designer",
    group: "designers & workshops",
    status: "concept",
    region: "main",
    view: "rumbledesigner",
    body: "Draw rumble patterns on a 60 Hz timeline and feel them play back " +
      "on the pak.",
  },
  {
    id: "dotcode",
    label: "Dot-code designer",
    title: "Dot-code designer",
    group: "designers & workshops",
    status: "concept",
    region: "main",
    view: "dotcode",
    body: "Turn data into printable e-Reader dot-code strips, with the " +
      "scan-back proof that they decode.",
  },
  {
    id: "lobby",
    label: "Lobby designer",
    title: "Lobby designer",
    group: "designers & workshops",
    status: "concept",
    region: "main",
    view: "lobby",
    body: "Design your Download Play banner and see it exactly as the " +
      "receiving DS renders it in the lobby.",
  },
  {
    id: "sdat",
    label: "SDAT tracker",
    title: "SDAT tracker",
    group: "designers & workshops",
    status: "concept",
    region: "main",
    view: "sdat",
    body: "A pattern tracker whose voices audition on the real ARM7 SDAT " +
      "engine, not a soft-synth stand-in.",
  },
  {
    id: "font",
    label: "Font designer",
    title: "Font designer",
    group: "designers & workshops",
    status: "concept",
    region: "main",
    view: "font",
    body: "Edit NFTR glyphs and proof them through the real text-rendering " +
      "path — kerning, widths and all.",
  },
  {
    id: "saveworkshop",
    label: "Save workshop",
    title: "Save workshop",
    group: "designers & workshops",
    status: "concept",
    region: "main",
    view: "saveworkshop",
    body: "Edit typed save structures and fuzz them for corruption " +
      "resilience — round-tripped through the real save format.",
  },
  {
    id: "tilemap",
    label: "Tilemap painting",
    title: "Tilemap painting — live",
    group: "designers & workshops",
    status: "concept",
    region: "main",
    view: "tilemap",
    body: "Paint the level while it runs — edits to the tilemap land in the " +
      "live scene on the device.",
  },
  {
    id: "scanner",
    label: "Memory scanner",
    title: "Memory scanner",
    group: "designers & workshops",
    status: "concept",
    region: "main",
    view: "scanner",
    body: "Find a value, freeze it, label it — a cheat-search-style scanner " +
      "wired to live device memory.",
  },
  {
    id: "protocolfuzz",
    label: "Protocol fuzzer",
    title: "Protocol designer + fuzzer",
    group: "designers & workshops",
    status: "concept",
    region: "main",
    view: "protocolfuzz",
    body: "Design a link handshake and fuzz it — malformed frames and " +
      "timing jitter, to find the states that don't survive contact.",
  },
  {
    id: "channelmixer",
    label: "Channel mixer",
    title: "Channel mixer — all 16 channels",
    group: "sound & hardware",
    status: "concept",
    region: "main",
    view: "channelmixer",
    body: "All 16 DS sound channels live: per-channel level, pan and format, " +
      "mixed in real time.",
  },
  {
    id: "swar",
    label: "Sample editor",
    title: "Sample editor — SWAR loop points",
    group: "sound & hardware",
    status: "concept",
    region: "main",
    view: "swar",
    body: "Edit SWAR sample loop points and audition them on the hardware " +
      "mixer, not an approximation.",
  },
  {
    id: "mic",
    label: "Mic lab",
    title: "Mic lab",
    group: "sound & hardware",
    status: "concept",
    region: "main",
    view: "mic",
    body: "Live microphone waveform with blow detection, and one-tap " +
      "recording straight into your assets.",
  },
  {
    id: "teakdsp",
    label: "Teak DSP",
    title: "Teak DSP workbench",
    group: "sound & hardware",
    status: "concept",
    region: "main",
    view: "teakdsp",
    body: "Chain DSi Teak DSP effects and profile them — cycle cost and " +
      "I/O, measured on the DSP itself.",
  },
  {
    id: "cameralab",
    label: "Camera lab",
    title: "Camera lab",
    group: "sound & hardware",
    status: "concept",
    region: "main",
    view: "cameralab",
    body: "The DSi camera viewfinder inside the studio — resolution, format " +
      "and capture, live.",
  },
  {
    id: "rtc",
    label: "RTC machine",
    title: "RTC time machine",
    group: "sound & hardware",
    status: "concept",
    region: "main",
    view: "rtc",
    body: "Set the real-time clock to any moment to test day/night, events " +
      "and dailies without waiting for the wall clock.",
  },
  {
    id: "touch",
    label: "Touch lab",
    title: "Touch gesture lab",
    group: "sound & hardware",
    status: "concept",
    region: "main",
    view: "touch",
    body: "Record touchscreen gestures, recognize them, and replay them " +
      "into the running game.",
  },
  {
    id: "poly3d",
    label: "3D budget",
    title: "3D geometry budget",
    group: "sound & hardware",
    status: "concept",
    region: "main",
    view: "poly3d",
    body: "Watch the 2048-polygon budget in real time as the 3D scene " +
      "draws — headroom and overflow, per frame.",
  },
  {
    id: "paletteproof",
    label: "Palette proofing",
    title: "Palette proofing",
    group: "sound & hardware",
    status: "concept",
    region: "main",
    view: "paletteproof",
    body: "Proof palettes on real screen models — DS, DS Lite, backlit vs " +
      "not — to see what players actually see.",
  },
];

const GROUP_ORDER = [
  "shell & chrome",
  "author context",
  "debug context",
  "future concepts",
  "link & multiplayer",
  "peripherals & accessories",
  "designers & workshops",
  "sound & hardware",
];

const SubTabs: Component<{
  tabs: string[];
  active: number;
  onPick: (i: number) => void;
}> = (props) => {
  return (
    <div
      class="flex gap-1 border-b px-2 py-1.5 text-[10px] overflow-x-auto"
      style={{ "border-color": APP.line, background: APP.panel }}
    >
      <For each={props.tabs}>
        {(t, i) => (
          <button
            type="button"
            class="px-2 py-0.5 rounded whitespace-nowrap cursor-pointer"
            style={{
              background: i() === props.active ? APP.sel : "transparent",
              color: i() === props.active ? APP.onSel : APP.muted,
            }}
            onClick={(e) => {
              e.stopPropagation();
              props.onPick(i());
            }}
          >
            {t}
          </button>
        )}
      </For>
    </div>
  );
};

const CodePanel: Component = () => {
  const LINES: [string, string][] = [
    ["1", "async fn game(p: NtrPlatform) -> ! {"],
    ["2", "    let mut bg = p.gfx.bg0.into_text(cfg, &vram);"],
    ["3", "    let mut player = Sprite::new(&mut oam, PLAYER);"],
    ["4", "    loop {"],
    ["5", "        events::vblank().wait().await;"],
    ["6", "        player.set_pos(input.dpad_vector() * SPEED);"],
    ["7", "    }"],
    ["8", "}"],
  ];
  const TREE: [number, string, boolean][] = [
    [0, "▾ src/", false],
    [1, "main.rs", true],
    [1, "sprite.rs", false],
    [0, "▸ assets/", false],
    [0, "Cargo.toml", false],
    [0, "inex.toml", false],
  ];
  return (
    <div class="grid grid-cols-[110px_minmax(0,1fr)] min-h-full animate-rise">
      <div
        class="border-r p-1.5 text-[10px] space-y-px"
        style={{ "border-color": APP.line, background: APP.panel }}
      >
        <For each={TREE}>
          {([depth, name, sel]) => (
            <div
              class="rounded px-1.5 py-0.5 truncate"
              style={{
                "padding-left": `${6 + depth * 10}px`,
                background: sel
                  ? "color-mix(in srgb, var(--app-sel) 20%, transparent)"
                  : "transparent",
                color: name.endsWith("/") ? APP.text : APP.muted,
              }}
            >
              {name}
            </div>
          )}
        </For>
      </div>
      <div class="min-w-0">
        <div
          class="flex items-center border-b text-[10px]"
          style={{ "border-color": APP.line, background: APP.panel }}
        >
          <For each={["main.rs ● ✕", "sprite.rs", "Cargo.toml"]}>
            {(t, i) => (
              <span
                class="px-3 py-1.5 border-r"
                style={{
                  "border-color": APP.line,
                  background: i() === 0 ? APP.bg : "transparent",
                  color: i() === 0 ? APP.text : APP.muted,
                }}
              >
                {t}
              </span>
            )}
          </For>
        </div>
        <div
          class="flex items-center gap-2 border-b px-3 py-1 text-[9px]"
          style={{ "border-color": APP.line, color: APP.faint }}
        >
          <span>Text</span>
          <span>|</span>
          <span class="truncate">examples/inex-demo/src/main.rs</span>
          <span>|</span>
          <span style={{ color: APP.warn }}>modified</span>
        </div>
        <div class="p-3 font-mono text-[11px] leading-5 overflow-x-auto">
          <For each={LINES}>
            {([n, code], i) => (
              <div
                class="flex gap-3"
                style={{
                  background: i() === 4
                    ? "color-mix(in srgb, var(--app-sel) 8%, transparent)"
                    : "transparent",
                }}
              >
                <span class="w-4 text-right" style={{ color: APP.faint }}>
                  {n}
                </span>
                <span
                  class="font-mono whitespace-pre"
                  style={{
                    color: code.includes("async") || code.includes("loop")
                      ? APP.selSoft
                      : code.includes("await")
                      ? APP.warn
                      : APP.text,
                  }}
                >
                  {code}
                  {i() === 4 && <span class="animate-blink">▏</span>}
                </span>
              </div>
            )}
          </For>
        </div>
      </div>
    </div>
  );
};

const ProjectPanel: Component = () => {
  const TREE: [number, string, string][] = [
    [0, "▾ src/", ""],
    [1, "main.rs", "4.2 KiB"],
    [1, "sprite.rs", "1.8 KiB"],
    [0, "▾ assets/", ""],
    [1, "▸ sprites/", "12 files"],
    [1, "▸ sound/", "3 files"],
    [0, "Cargo.toml", "0.6 KiB"],
    [0, "inex.toml", "0.2 KiB"],
  ];
  return (
    <div class="p-3 text-[11px] space-y-0.5 animate-rise">
      <div class="flex items-center gap-2 pb-1.5 text-[10px]">
        <span
          class="px-2 py-0.5 rounded border"
          style={{
            "border-color": APP.line,
            background: APP.panel2,
            color: APP.muted,
          }}
        >
          ✚ New ▾
        </span>
        <span style={{ color: APP.text }}>☐</span>
        <span style={{ color: APP.muted }}>Hidden</span>
        <span style={{ color: APP.text }}>☐</span>
        <span style={{ color: APP.muted }}>target/</span>
      </div>
      <For each={TREE}>
        {([depth, name, meta], i) => (
          <div
            class="flex justify-between rounded px-2 py-0.5"
            style={{
              "padding-left": `${8 + depth * 14}px`,
              background: i() === 1
                ? "color-mix(in srgb, var(--app-sel) 20%, transparent)"
                : "transparent",
              color: name.endsWith("/") ? APP.text : APP.muted,
            }}
          >
            <span>{name}</span>
            <span style={{ color: APP.faint }}>{meta}</span>
          </div>
        )}
      </For>
      <div class="pt-1.5 text-[10px]" style={{ color: APP.faint }}>
        New ▸ Folder · Empty file · Tile Graphic (.ncgr) · Palette (.nclr) ·
        Tilemap (.nscr) · Sprite Cell (.ncer) · Audio (.wav)
      </div>
    </div>
  );
};

const AssetsPanel: Component = () => {
  const [tab, setTab] = createSignal(6);
  const gate = usePhase([1800, 700, 3200]);
  const seq = usePhase([600, 600, 600, 600]);
  const TILE = ["#3f7d4e", "#356b42", "#2b3a67", "#33487e"];
  const box = (label: string, on = false) => (
    <span
      class="px-2 py-0.5 rounded border text-[10px] whitespace-nowrap"
      style={{
        "border-color": APP.line,
        background: on ? APP.sel : APP.panel2,
        color: on ? APP.onSel : APP.muted,
      }}
    >
      {label}
    </span>
  );
  const pane = (files: [string, boolean][], editor: JSX.Element) => (
    <div class="grid grid-cols-[104px_minmax(0,1fr)] gap-3">
      <div class="space-y-1 min-w-0 text-[10px]">
        {box("📁+ Import…")}
        <div style={{ color: APP.faint }}>Files</div>
        <For each={files}>
          {([name, sel]) => (
            <div
              class="truncate rounded px-1.5 py-0.5"
              style={{
                background: sel
                  ? "color-mix(in srgb, var(--app-sel) 18%, transparent)"
                  : "transparent",
                color: sel ? APP.text : APP.muted,
              }}
            >
              {name}
            </div>
          )}
        </For>
      </div>
      <div class="min-w-0 space-y-1.5">
        <div class="flex items-center gap-2 text-[10px]">
          {box("💾  Save")}
          <span style={{ color: APP.warn }}>● modified</span>
        </div>
        {editor}
      </div>
    </div>
  );
  return (
    <div class="animate-rise">
      <SubTabs
        tabs={[
          "Graphics",
          "Tilemaps",
          "Sprites",
          "Fonts",
          "Models",
          "Sound",
          "e-Reader",
        ]}
        active={tab()}
        onPick={setTab}
      />
      <div class="p-3 text-[11px]">
        <Switch>
          <Match when={tab() === 0}>
            {pane(
              [["tiles.ncgr •", true], ["sprites.ncgr", false], [
                "hud.nclr",
                false,
              ]],
              <div class="space-y-2">
                <div class="flex gap-1 flex-wrap">
                  {box("4bpp", true)}
                  {box("8bpp")}
                  {box("Brush", true)}
                  {box("Fill")}
                  {box("Eyedropper")}
                  {box("Export PNG")}
                </div>
                <div class="grid grid-cols-8 gap-px w-fit">
                  <For each={[...Array(16).keys()]}>
                    {(i) => (
                      <span
                        class="size-5"
                        style={{ background: TILE[(i * 7 + 3) % 4] }}
                      />
                    )}
                  </For>
                </div>
                <div class="flex gap-px w-fit">
                  <For each={[...Array(16).keys()]}>
                    {(i) => (
                      <span
                        class="size-3"
                        style={{
                          background: i === 0
                            ? "repeating-conic-gradient(#555 0 25%, #333 0 50%) 0 0 / 6px 6px"
                            : `hsl(${i * 22} 40% ${30 + (i % 4) * 12}%)`,
                          outline: i === 5 ? "1px solid white" : "none",
                        }}
                      />
                    )}
                  </For>
                </div>
                <div class="text-[10px]" style={{ color: APP.faint }}>
                  128 tiles
                </div>
              </div>,
            )}
          </Match>
          <Match when={tab() === 1}>
            {pane(
              [["forest.nscr •", true], ["hud.nbfs", false]],
              <div class="space-y-2">
                <div class="flex gap-1 flex-wrap">
                  {box("Zoom 4×")}
                  <span style={{ color: APP.text }}>☑</span>
                  <span class="text-[10px]" style={{ color: APP.muted }}>
                    Grid
                  </span>
                  {box("tile 42")}
                  {box("pal 3")}
                </div>
                <div class="grid grid-cols-12 gap-px w-fit">
                  <For each={[...Array(48).keys()]}>
                    {(i) => (
                      <span
                        class="size-4"
                        style={{
                          background:
                            TILE[(i * 13 + Math.floor(i / 12) * 7) % 4],
                          opacity: i === 17 ? 0.55 : 1,
                        }}
                      />
                    )}
                  </For>
                </div>
                <div class="text-[10px]" style={{ color: APP.faint }}>
                  64×32 · eyedropper: right-click picks tile + palette
                </div>
              </div>,
            )}
          </Match>
          <Match when={tab() === 2}>
            {pane(
              [["player.ncer •", true], ["fx.nanr", false]],
              <div class="space-y-2">
                <div class="flex items-center gap-1.5 flex-wrap text-[10px]">
                  {box("◀")}
                  <span style={{ color: APP.muted }}>Cell 1/4</span>
                  {box("▶")}
                  <span style={{ color: APP.text }}>☑</span>
                  <span style={{ color: APP.muted }}>Show hidden</span>
                  <span class="ml-auto" style={{ color: APP.faint }}>
                    3 objects
                  </span>
                </div>
                <div
                  class="relative w-[128px] h-[96px] rounded-sm border"
                  style={{ "border-color": APP.line, background: "#141418" }}
                >
                  <span
                    class="absolute size-4 border"
                    style={{
                      background:
                        "color-mix(in srgb, var(--app-sel) 45%, transparent)",
                      "border-color": APP.selSoft,
                      left: `${34 + seq() * 6}px`,
                      top: "40px",
                      transition: "left 0.3s steps(3)",
                    }}
                  />
                  <span
                    class="absolute w-4 h-2 border border-dashed"
                    style={{
                      "border-color": APP.faint,
                      left: `${34 + seq() * 6}px`,
                      top: "58px",
                      transition: "left 0.3s steps(3)",
                    }}
                  />
                </div>
                <div class="text-[10px]" style={{ color: APP.faint }}>
                  256×192 canvas — drag OBJs to move, click to select
                </div>
              </div>,
            )}
          </Match>
          <Match when={tab() === 3}>
            {pane(
              [["main.nftr •", true]],
              <div class="space-y-2">
                <div
                  class="w-fit rounded border px-3 py-2 text-lg tracking-wide"
                  style={{ "border-color": APP.line, background: APP.panel }}
                >
                  AaBb 0123 →★
                </div>
                <div class="text-[10px]" style={{ color: APP.faint }}>
                  214 glyphs · rendered with the real DS text path
                </div>
              </div>,
            )}
          </Match>
          <Match when={tab() === 4}>
            <div class="min-h-24 grid place-items-center">
              <Show
                when={gate() >= 2}
                fallback={
                  <div
                    class="text-center space-y-2"
                    style={{ color: APP.muted }}
                  >
                    <div>3D Models</div>
                    <div class="text-[10px]" style={{ color: APP.faint }}>
                      Enabling creates assets/models/.
                    </div>
                    <span
                      class="inline-block px-3 py-1 rounded"
                      style={{
                        background: gate() === 1 ? APP.sel : APP.panel2,
                        color: gate() === 1 ? APP.onSel : APP.muted,
                      }}
                    >
                      {gate() === 1 ? "enabling…" : "✓  Enable 3D Models"}
                    </span>
                  </div>
                }
              >
                <div class="w-full space-y-1 animate-rise">
                  <div class="flex justify-between">
                    <span class="font-semibold" style={{ color: APP.text }}>
                      player.nsbmd
                    </span>
                    <span style={{ color: APP.faint }}>34 KB · read-only</span>
                  </div>
                  <div style={{ color: APP.muted }}>
                    vertices 486 · polygons 142 · triangles 96 · quads 46
                  </div>
                  <div style={{ color: APP.muted }}>
                    materials 3 · meshes 2 · bones 11
                  </div>
                  <div style={{ color: APP.faint }}>
                    inspector only — models are authored externally
                  </div>
                </div>
              </Show>
            </div>
          </Match>
          <Match when={tab() === 5}>
            {pane(
              [["bank.sdat •", true]],
              <div class="space-y-1.5">
                <For
                  each={[
                    ["title_theme.sseq", "sequence · 1:24"],
                    ["bank.sbnk", "instrument bank"],
                    ["samples.swar", "wave archive · 22 kHz"],
                  ]}
                >
                  {([name, meta]) => (
                    <div
                      class="flex items-center gap-2 rounded border px-2.5 py-1.5"
                      style={{
                        "border-color": APP.line,
                        background: APP.panel,
                      }}
                    >
                      <span style={{ color: APP.selSoft }}>▶</span>
                      <span class="truncate">{name}</span>
                      <span
                        class="ml-auto shrink-0"
                        style={{ color: APP.faint }}
                      >
                        {meta}
                      </span>
                    </div>
                  )}
                </For>
                <div class="text-[10px]" style={{ color: APP.faint }}>
                  auditioned on the ARM7, not a host approximation
                </div>
              </div>,
            )}
          </Match>
          <Match when={tab() === 6}>
            <div class="space-y-1.5">
              <div class="text-[10px]" style={{ color: APP.faint }}>Cards</div>
              <For
                each={[
                  ["intro-card", "[GBA]", true],
                  ["cheat-pack", "[GBA]", false],
                  ["mini-game", "[Z80]", false],
                ] as [string, string, boolean][]}
              >
                {([name, app, sel]) => (
                  <div
                    class="flex justify-between rounded border px-2.5 py-1"
                    style={{
                      "border-color": sel ? APP.sel : APP.line,
                      background: APP.panel,
                    }}
                  >
                    <span>{name}</span>
                    <span style={{ color: APP.faint }}>{app}</span>
                  </div>
                )}
              </For>
              <div class="flex items-center gap-2 pt-0.5 text-[10px] flex-wrap">
                <span
                  class="px-2 py-0.5 rounded"
                  style={{ background: APP.sel, color: APP.onSel }}
                >
                  ▶ Encode
                </span>
                <span style={{ color: APP.muted }}>
                  2 strip(s) · 2,212 bytes
                </span>
                <span style={{ color: APP.ok }}>
                  ✓ encoded + decode-verified
                </span>
              </div>
            </div>
          </Match>
        </Switch>
      </div>
    </div>
  );
};

const FilesPanel: Component = () => {
  const [tab, setTab] = createSignal(0);
  const LAYOUT: [number, string, string][] = [
    [0, "▾ /", ""],
    [1, "▾ fonts/", ""],
    [2, "main.nftr", "18 KiB"],
    [1, "▾ sprites/", ""],
    [2, "player.narc", "34 KiB"],
    [2, "tiles.narc", "51 KiB"],
    [1, "sound/bank.sdat", "204 KiB"],
  ];
  const ROMFS: [string, string, string][] = [
    ["header", "0x0000", "0x4000"],
    ["arm9.bin", "0x4000", "148 KiB"],
    ["arm7.bin", "0x2A000", "38 KiB"],
    ["fnt + fat", "0x34000", "2.1 KiB"],
    ["fonts/main.nftr", "0x36000", "18 KiB"],
    ["sprites/player.narc", "0x3A800", "34 KiB"],
    ["sound/bank.sdat", "0x43000", "204 KiB"],
  ];
  return (
    <div class="animate-rise">
      <SubTabs tabs={["Layout", "ROM fs"]} active={tab()} onPick={setTab} />
      <div class="p-3 text-[11px]">
        <Switch>
          <Match when={tab() === 0}>
            <For each={LAYOUT}>
              {([depth, name, size]) => (
                <div
                  class="flex justify-between py-0.5"
                  style={{
                    "padding-left": `${8 + depth * 14}px`,
                    color: name.endsWith("/") ? APP.text : APP.muted,
                  }}
                >
                  <span>{name}</span>
                  <span style={{ color: APP.faint }}>{size}</span>
                </div>
              )}
            </For>
            <div
              class="mt-2 pt-2 border-t text-[10px]"
              style={{ "border-color": APP.line, color: APP.faint }}
            >
              Add files under assets/ — they're packed into NitroFS at build
            </div>
          </Match>
          <Match when={tab() === 1}>
            <div class="flex items-center gap-2 pb-2 text-[10px]">
              <span
                class="px-2 py-0.5 rounded border"
                style={{
                  "border-color": APP.line,
                  background: APP.panel2,
                  color: APP.muted,
                }}
              >
                Load from Inspector
              </span>
              <span style={{ color: APP.faint }}>7 files, 307 KB</span>
            </div>
            <For each={ROMFS}>
              {([name, off, size]) => (
                <div class="font-mono flex gap-3 py-0.5">
                  <span class="w-16" style={{ color: APP.faint }}>{off}</span>
                  <span style={{ color: APP.muted }}>{name}</span>
                  <span class="ml-auto" style={{ color: APP.faint }}>
                    {size}
                  </span>
                </div>
              )}
            </For>
            <div
              class="mt-2 pt-2 border-t text-[10px]"
              style={{ "border-color": APP.line, color: APP.faint }}
            >
              parsed from the loaded ROM's FNT/FAT — hover shows offset + size
            </div>
          </Match>
        </Switch>
      </div>
    </div>
  );
};

const BuildPanel: Component = () => {
  const [tab, setTab] = createSignal(0);
  const phase = usePhase([900, 1200, 1400, 900, 3200]);
  const box = (label: string, on = false) => (
    <span
      class="px-2 py-0.5 rounded border text-[10px]"
      style={{
        "border-color": APP.line,
        background: on ? APP.sel : APP.panel2,
        color: on ? APP.onSel : APP.muted,
      }}
    >
      {label}
    </span>
  );
  const STAGES: [string, string][] = [
    ["cargo build (arm9)", "2140ms"],
    ["cargo build (arm7)", "890ms"],
    ["pack-nds", "120ms"],
  ];
  const CMP: [string, string, string, boolean][] = [
    ["Title", "INEXDEMO", "INEXDEMO", true],
    ["Game Code", "AINE", "AINE", true],
    ["ARM9 Size", "151552 bytes", "152784 bytes", false],
    ["ARM7 Size", "38912 bytes", "38912 bytes", true],
    ["Total Size", "412 KB", "437 KB", false],
  ];
  const CAPS = ["ROM Upload", "Debug", "Capture", "GBA Slot", "TWL Mode"];
  const DEVICES: [string, string[]][] = [
    ["IS-NITRO-EMULATOR", ["y", "y", "n", "y", "n"]],
    ["IS-NITRO-CAPTURE", ["n", "n", "y", "n", "n"]],
    ["IS-TWL-EMULATOR", ["y", "y", "i", "n", "y"]],
    ["IS-AGB-EMULATOR", ["i", "i", "n", "y", "n"]],
  ];
  const mark = (c: string) => (
    <span
      style={{
        color: c === "y" ? APP.ok : c === "i" ? APP.warn : APP.faint,
      }}
    >
      {c === "y" ? "✓" : c === "i" ? "⚠" : "✕"}
    </span>
  );
  return (
    <div class="animate-rise">
      <SubTabs
        tabs={["Dashboard", "ROM Inspector", "ROM Diff", "Compatibility"]}
        active={tab()}
        onPick={setTab}
      />
      <div class="p-3 text-[11px]">
        <Switch>
          <Match when={tab() === 0}>
            <div class="flex gap-2 pb-2">
              {box("🔨 Build Debug")}
              {box("📦 Build Release", true)}
              <Show when={phase() < 3}>
                <span class="animate-blink" style={{ color: APP.muted }}>
                  Building...
                </span>
              </Show>
            </div>
            <div class="font-mono space-y-0.5 text-[10px]">
              <For each={STAGES}>
                {([name, ms], i) => (
                  <div class="flex gap-2">
                    <span
                      style={{
                        color: i() < phase()
                          ? APP.ok
                          : i() === phase()
                          ? APP.warn
                          : APP.faint,
                      }}
                    >
                      {i() < phase() ? "✓" : i() === phase() ? "◌" : "○"}
                    </span>
                    <span
                      style={{
                        color: i() <= phase() ? APP.text : APP.faint,
                      }}
                    >
                      {name}
                    </span>
                    <span class="ml-auto" style={{ color: APP.faint }}>
                      {i() < phase() ? ms : i() === phase() ? "running..." : ""}
                    </span>
                  </div>
                )}
              </For>
            </div>
            <Show when={phase() >= 3}>
              <div
                class="mt-2 pt-2 border-t space-y-0.5 text-[10px] animate-rise"
                style={{ "border-color": APP.line }}
              >
                <div class="flex justify-between">
                  <span style={{ color: APP.faint }}>File</span>
                  <span style={{ color: APP.text }}>inex-demo.nds</span>
                </div>
                <div class="flex justify-between">
                  <span style={{ color: APP.faint }}>Size</span>
                  <span style={{ color: APP.ok }}>412 KB</span>
                </div>
              </div>
            </Show>
          </Match>
          <Match when={tab() === 1}>
            <div class="flex items-center gap-2 pb-1.5">
              {box("Open ROM...")}
              {box("Close")}
              <span class="ml-auto text-[10px]">
                <span class="font-semibold" style={{ color: APP.text }}>
                  inex-demo.nds
                </span>{" "}
                <span style={{ color: APP.faint }}>412.0 KB total</span>
              </span>
            </div>
            <div class="font-mono space-y-0.5 text-[10px]">
              <div class="font-semibold pt-1" style={{ color: APP.text }}>
                Header
              </div>
              <For
                each={[
                  ["Title", "INEXDEMO"],
                  ["Game Code", "AINE"],
                  ["Unit", "NDS"],
                  ["ROM Version", "0"],
                  ["Capacity", "8 Mbit"],
                ]}
              >
                {([k, v]) => (
                  <div class="flex gap-3">
                    <span class="w-24" style={{ color: APP.faint }}>{k}</span>
                    <span style={{ color: APP.muted }}>{v}</span>
                  </div>
                )}
              </For>
              <div class="font-semibold pt-1" style={{ color: APP.text }}>
                ARM9
              </div>
              <div class="flex gap-3">
                <span class="w-24" style={{ color: APP.faint }}>Offset</span>
                <span style={{ color: APP.muted }}>
                  0x00004000 · entry 0x02000000 · RAM 0x02000000 · 148.0 KB
                </span>
              </div>
              <div class="font-semibold pt-1" style={{ color: APP.text }}>
                ARM7
              </div>
              <div class="flex gap-3">
                <span class="w-24" style={{ color: APP.faint }}>Offset</span>
                <span style={{ color: APP.muted }}>
                  0x00029000 · entry 0x037F8000 · RAM 0x037F8000 · 38.0 KB
                </span>
              </div>
              <div class="font-semibold pt-1" style={{ color: APP.text }}>
                CRC
              </div>
              <div style={{ color: APP.ok }}>Logo: OK · Header: OK</div>
              <div class="font-semibold pt-1" style={{ color: APP.text }}>
                NitroFS
              </div>
              <div style={{ color: APP.muted }}>
                7 files — browse them in Files ▸ ROM fs
              </div>
            </div>
          </Match>
          <Match when={tab() === 2}>
            <div class="flex gap-2 pb-2">
              {box("Open ROM A")}
              {box("Open ROM B")}
              <span class="ml-auto text-[10px]" style={{ color: APP.faint }}>
                A: build 41 · B: build 42
              </span>
            </div>
            <div
              class="font-mono grid grid-cols-[76px_minmax(0,1fr)_minmax(0,1fr)_24px] gap-x-2 gap-y-0.5 text-[10px]"
              style={{ color: APP.faint }}
            >
              <span>Field</span>
              <span>ROM A</span>
              <span>ROM B</span>
              <span />
              <For each={CMP}>
                {([field, a, b, match_]) => (
                  <>
                    <span>{field}</span>
                    <span style={{ color: APP.muted }}>{a}</span>
                    <span style={{ color: APP.muted }}>{b}</span>
                    <span style={{ color: match_ ? APP.ok : APP.err }}>
                      {match_ ? "✓" : "✕"}
                    </span>
                  </>
                )}
              </For>
            </div>
          </Match>
          <Match when={tab() === 3}>
            <div class="pb-1 font-semibold" style={{ color: APP.text }}>
              Hardware Compatibility Matrix
            </div>
            <div class="pb-2 text-[10px]" style={{ color: APP.faint }}>
              Shows supported features per devkit model
            </div>
            <div class="overflow-x-auto">
              <div
                class="grid gap-x-3 gap-y-0.5 text-[10px] min-w-fit"
                style={{
                  "grid-template-columns": "150px repeat(5, 64px)",
                  color: APP.faint,
                }}
              >
                <span>Device</span>
                <For each={CAPS}>{(c) => <span>{c}</span>}</For>
                <For each={DEVICES}>
                  {([dev, caps]) => (
                    <>
                      <span style={{ color: APP.text }}>{dev}</span>
                      <For each={caps}>{(c) => mark(c)}</For>
                    </>
                  )}
                </For>
              </div>
            </div>
            <div class="pt-2 text-[10px]" style={{ color: APP.faint }}>
              <span style={{ color: APP.ok }}>✓</span> Confirmed ·{" "}
              <span style={{ color: APP.warn }}>⚠</span>{" "}
              Inferred (needs testing) · ✕ Not supported
            </div>
          </Match>
        </Switch>
      </div>
    </div>
  );
};

const DebuggerPanel: Component = () => {
  const [tab, setTab] = createSignal(0);
  const phase = usePhase([1200, 500, 500, 500, 500, 2200, 800]);
  const pcRow = () => Math.min(Math.max(phase() - 1, 0), 4);
  const hit = () => phase() === 5;
  const PC_GRN = "#64FF64", BP_RED = "#FF5050", PC_YLW = "#FFFF64";
  const SRC_GRN = "#8CB48C";
  const DISASM: [string, string, string, string][] = [
    ["02000800", "B5F0", "push  {r4-r7, lr}", "; frame_tick @ main.rs:41"],
    ["02000802", "4A08", "ldr   r2, [pc, #32]", ""],
    ["02000804", "6813", "ldr   r3, [r2]", ""],
    ["02000806", "3301", "adds  r3, #1", ""],
    ["02000808", "6013", "str   r3, [r2]", ""],
    ["0200080A", "BDF0", "pop   {r4-r7, pc}", ""],
  ];
  const BPS: [boolean, string, string, string][] = [
    [true, "0x02000808  main.rs:44", "ARM9", "3"],
    [true, "0x0200114C  enemy.rs:88", "ARM9", "0"],
    [false, "0x037F8204", "ARM7", "12"],
  ];
  const FRAMES: [string, string, string, string, string][] = [
    ["0", "0x02000808", "0x02001A50", "0x027E3F70", "frame_tick"],
    ["1", "0x02001A4C", "0x020004E8", "0x027E3F88", "game_loop"],
    ["2", "0x020004E4", "0x02000200", "0x027E3FA0", "main"],
  ];
  const box = (label: string, on = false) => (
    <span
      class="px-2 py-0.5 rounded border text-[10px]"
      style={{
        "border-color": APP.line,
        background: on ? APP.sel : APP.panel2,
        color: on ? APP.onSel : APP.muted,
      }}
    >
      {label}
    </span>
  );
  return (
    <div class="animate-rise">
      <SubTabs
        tabs={["Disassembly", "Breakpoints", "Call Stack", "Watch"]}
        active={tab()}
        onPick={setTab}
      />
      <Switch>
        <Match when={tab() === 0}>
          <div class="p-3 text-[11px]">
            <div class="flex items-center gap-1.5 pb-2 flex-wrap text-[10px]">
              <span style={{ color: APP.muted }}>Addr:</span>
              <span
                class="rounded border px-1.5 py-0.5"
                style={{ "border-color": APP.line, color: APP.muted }}
              >
                0x 02000800
              </span>
              {box("Go")}
              <span style={{ color: APP.text }}>☑</span>
              <span style={{ color: APP.muted }}>Follow PC</span>
              {box("Thumb", true)}
              {box("ARM")}
              {box("Refresh")}
              <span class="ml-auto" style={{ color: APP.faint }}>
                src: ARM9 (inex-demo.elf)
              </span>
            </div>
            <For each={DISASM}>
              {([addr, bytes, asm, src], i) => {
                const isPc = () => i() === pcRow();
                const isBp = i() === 4;
                return (
                  <div class="flex gap-2 px-1 py-px font-mono whitespace-pre">
                    <span style={{ color: isBp ? BP_RED : "transparent" }}>
                      ●
                    </span>
                    <span style={{ color: isPc() ? PC_GRN : "transparent" }}>
                      ▶
                    </span>
                    <span style={{ color: APP.faint }}>{addr}</span>
                    <span class="w-10" style={{ color: APP.faint }}>
                      {bytes}
                    </span>
                    <span
                      style={{
                        color: isPc() ? hit() ? BP_RED : PC_YLW : APP.text,
                      }}
                    >
                      {asm}
                    </span>
                    <Show when={src}>
                      <span style={{ color: SRC_GRN }}>{src}</span>
                    </Show>
                    <Show when={isPc() && hit()}>
                      <span class="ml-auto" style={{ color: BP_RED }}>
                        bp hit
                      </span>
                    </Show>
                  </div>
                );
              }}
            </For>
          </div>
        </Match>
        <Match when={tab() === 1}>
          <div class="p-3 text-[11px] space-y-1.5">
            <div class="flex items-center gap-1.5 text-[10px]">
              <span style={{ color: APP.muted }}>Addr:</span>
              <span
                class="rounded border px-1.5 py-0.5"
                style={{ "border-color": APP.line, color: APP.faint }}
              >
                0x<span class="animate-blink">▏</span>
              </span>
              {box("Add")}
            </div>
            <div
              class="font-mono grid grid-cols-[24px_minmax(0,1fr)_44px_36px_20px] gap-x-2 text-[10px]"
              style={{ color: APP.faint }}
            >
              <span>En</span>
              <span>Address</span>
              <span>Core</span>
              <span>Hits</span>
              <span />
              <For each={BPS}>
                {([en, addr, core, hits]) => (
                  <>
                    <span style={{ color: APP.text }}>{en ? "☑" : "☐"}</span>
                    <span class="truncate" style={{ color: APP.text }}>
                      {addr}
                    </span>
                    <span style={{ color: APP.muted }}>{core}</span>
                    <span style={{ color: APP.faint }}>{hits}</span>
                    <span style={{ color: APP.muted }}>X</span>
                  </>
                )}
              </For>
            </div>
          </div>
        </Match>
        <Match when={tab() === 2}>
          <div class="p-3 text-[11px] space-y-1.5">
            <div class="flex gap-1.5 text-[10px]">
              {box("ARM9", true)}
              {box("ARM7")}
              {box("Refresh")}
            </div>
            <div
              class="font-mono grid grid-cols-[16px_88px_88px_88px_minmax(0,1fr)] gap-x-2 text-[10px]"
              style={{ color: APP.faint }}
            >
              <span>#</span>
              <span>PC</span>
              <span>LR</span>
              <span>SP</span>
              <span>Function</span>
              <For each={FRAMES}>
                {([n, pc, lr, sp, fn]) => (
                  <>
                    <span>{n}</span>
                    <span style={{ color: "#64C8FF" }}>{pc}</span>
                    <span style={{ color: APP.muted }}>{lr}</span>
                    <span style={{ color: APP.muted }}>{sp}</span>
                    <span style={{ color: APP.text }}>{fn}</span>
                  </>
                )}
              </For>
            </div>
            <div class="text-[10px]" style={{ color: APP.faint }}>
              PC cells navigate the disassembly
            </div>
          </div>
        </Match>
        <Match when={tab() === 3}>
          <div class="p-3 text-[11px] space-y-1.5">
            <div class="flex items-center gap-1.5 text-[10px] flex-wrap">
              <span
                class="rounded border px-1.5 py-0.5"
                style={{ "border-color": APP.line, color: APP.faint }}
              >
                Label
              </span>
              <span
                class="rounded border px-1.5 py-0.5"
                style={{ "border-color": APP.line, color: APP.faint }}
              >
                0x
              </span>
              {box("4B ▾")}
              {box("Add")}
              <span class="w-px h-4" style={{ background: APP.line }} />
              {box("Refresh All")}
            </div>
            <div
              class="font-mono grid grid-cols-[80px_92px_minmax(0,1fr)_44px_20px] gap-x-2 text-[10px]"
              style={{ color: APP.faint }}
            >
              <span>Label</span>
              <span>Address</span>
              <span>Value</span>
              <span />
              <span />
              <For
                each={[
                  ["player_x", "0x02100844", () =>
                    "0x" +
                    (0xabc0 + pcRow() * 2).toString(16).toUpperCase()
                      .padStart(8, "0"), "Hex ▾"],
                  ["frame_count", "0x02100850", () =>
                    String(3402 + pcRow()), "Dec ▾"],
                  ["keyinput", "0x04000130", () =>
                    "0b1111110111", "Bin ▾"],
                ] as [string, string, () => string, string][]}
              >
                {([label, addr, val, fmt]) => (
                  <>
                    <span style={{ color: APP.text }}>{label}</span>
                    <span style={{ color: APP.muted }}>{addr}</span>
                    <span style={{ color: APP.selSoft }}>{val()}</span>
                    <span style={{ color: APP.muted }}>{fmt}</span>
                    <span style={{ color: APP.muted }}>X</span>
                  </>
                )}
              </For>
            </div>
          </div>
        </Match>
      </Switch>
    </div>
  );
};

const CpuPanel: Component = () => {
  const [tab, setTab] = createSignal(1);
  const [tick, setTick] = createSignal(0);
  createTimer(() => setTick((x) => x + 1), 700, setInterval);
  const box = (label: string, on = false) => (
    <span
      class="px-2 py-0.5 rounded border text-[10px]"
      style={{
        "border-color": APP.line,
        background: on ? APP.sel : APP.panel2,
        color: on ? APP.onSel : APP.muted,
      }}
    >
      {label}
    </span>
  );
  const hot = [5, 12, 19, 26, 40, 53];
  const byteAt = (i: number) => {
    const h = hot.indexOf(i % 64);
    return h >= 0 ? (i * 37 + tick() * (h + 3) * 41) & 0xff : (i * 73) & 0xff;
  };
  const hex2 = (b: number) => b.toString(16).toUpperCase().padStart(2, "0");
  const asc = (b: number) => b >= 32 && b < 127 ? String.fromCharCode(b) : ".";
  const REGS: [string, string][] = [
    ["R0", "0x00000001  (1)"],
    ["R1", "0x02100844"],
    ["R2", "0x0210085C"],
    ["R3", "0x000000FF  (255)"],
    ["R4", "0x02066800"],
    ["R5", "0x00000000  (0)"],
    ["R6", "0x04000000"],
    ["R7", "0x0000012C  (300)"],
    ["R12", "0x027E0F00"],
    ["SP", "0x027E3F70"],
    ["LR", "0x02001A50"],
    ["PC", "0x02000808"],
  ];
  const MAP: [string, string, string, string, number][] = [
    ["02000000", "Main RAM", "4 MB", "#508CC8", 88],
    ["01000000", "ITCM", "32 KB", "#C86464", 60],
    ["027E0000", "DTCM", "16 KB", "#C86464", 56],
    ["03000000", "Shared WRAM", "32 KB", "#64B464", 60],
    ["04000000", "I/O", "16 MB", "#C8B450", 96],
    ["05000000", "Palettes", "2 KB", "#B450C8", 44],
    ["06000000", "VRAM", "656 KB", "#50C8B4", 77],
    ["07000000", "OAM", "2 KB", "#C87850", 44],
    ["08000000", "GBA Slot", "32 MB", "#787878", 100],
  ];
  return (
    <div class="animate-rise">
      <SubTabs
        tabs={["Registers", "Memory", "IO Registers", "Memory Map"]}
        active={tab()}
        onPick={setTab}
      />
      <div class="p-3 text-[11px]">
        <Switch>
          <Match when={tab() === 0}>
            <div class="flex gap-1.5 pb-2">
              {box("ARM9", true)}
              {box("ARM7")}
            </div>
            <div class="font-mono grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-0.5 max-w-lg">
              <For each={REGS}>
                {([name, val]) => (
                  <div class="flex justify-between gap-3">
                    <span style={{ color: APP.faint }}>{name}</span>
                    <span
                      class="font-mono whitespace-pre"
                      style={{ color: APP.text }}
                    >
                      {val}
                    </span>
                  </div>
                )}
              </For>
            </div>
            <div
              class="font-mono flex justify-between gap-3 max-w-lg pt-1.5 mt-1.5 border-t"
              style={{ "border-color": APP.line }}
            >
              <span style={{ color: APP.faint }}>CPSR</span>
              <span style={{ color: APP.selSoft }}>
                0x2000001F N=0 Z=0 C=1 V=0 SYS
              </span>
            </div>
          </Match>
          <Match when={tab() === 1}>
            <div class="flex items-center gap-1.5 pb-2 text-[10px]">
              <span style={{ color: APP.muted }}>Addr:</span>
              <span
                class="rounded border px-1.5 py-0.5"
                style={{ "border-color": APP.line, color: APP.muted }}
              >
                0x 02000000
              </span>
              {box("Read")}
              <span class="ml-auto" style={{ color: APP.faint }}>
                256 bytes
              </span>
            </div>
            <div class="overflow-x-auto font-mono whitespace-pre leading-4">
              <For each={[...Array(3).keys()]}>
                {(row) => {
                  const bytes = () =>
                    [...Array(16).keys()]
                      .map((c) => byteAt(row * 16 + c));
                  return (
                    <div class="flex gap-3">
                      <span style={{ color: APP.faint }}>
                        {"0200" + (row * 16).toString(16).padStart(4, "0")
                          .toUpperCase()}
                      </span>
                      <span style={{ color: APP.muted }}>
                        {bytes().slice(0, 8).map(hex2).join(" ") + "  " +
                          bytes().slice(8).map(hex2).join(" ")}
                      </span>
                      <span style={{ color: APP.faint }}>
                        {bytes().map(asc).join("")}
                      </span>
                    </div>
                  );
                }}
              </For>
            </div>
            <div class="pt-2 text-[10px]" style={{ color: APP.faint }}>
              live while the target runs — changing bytes flicker
            </div>
          </Match>
          <Match when={tab() === 2}>
            <div class="flex items-center gap-1.5 pb-2 text-[10px] flex-wrap">
              {box("Display ▾")}
              <span
                class="rounded border px-1.5 py-0.5"
                style={{ "border-color": APP.line, color: APP.faint }}
              >
                Filter...
              </span>
              {box("Read All")}
              <span style={{ color: APP.text }}>☑</span>
              <span style={{ color: APP.muted }}>Auto</span>
            </div>
            <div class="font-mono space-y-0.5 text-[10px]">
              <div class="flex items-center gap-2">
                <span style={{ color: APP.muted }}>▼</span>
                <span class="font-semibold" style={{ color: APP.text }}>
                  DISPCNT
                </span>
                <span style={{ color: APP.faint }}>04000000</span>
                <span style={{ color: APP.selSoft }}>
                  0001010{tick() % 4 < 2 ? "1" : "0"}
                </span>
                {box("R")}
              </div>
              <div class="pl-6" style={{ color: APP.faint }}>
                [2-0] BG_MODE = 0
              </div>
              <div class="pl-6" style={{ color: APP.faint }}>
                [8] BG0_ON = {tick() % 4 < 2 ? "1" : "0"}{" "}
                · [9] BG1_ON = 1 · [12] OBJ_ON = 1
              </div>
              <div class="flex items-center gap-2 pt-1">
                <span style={{ color: APP.muted }}>▶</span>
                <span class="font-semibold" style={{ color: APP.text }}>
                  DISPSTAT
                </span>
                <span style={{ color: APP.faint }}>04000004</span>
                <span style={{ color: APP.muted }}>????</span>
                {box("R")}
              </div>
              <div class="flex items-center gap-2">
                <span style={{ color: APP.muted }}>▶</span>
                <span class="font-semibold" style={{ color: APP.text }}>
                  VCOUNT
                </span>
                <span style={{ color: APP.faint }}>04000006</span>
                <span style={{ color: APP.selSoft }}>
                  00{(40 + tick() * 37 % 150).toString(16).toUpperCase()
                    .padStart(2, "0")}
                </span>
                {box("R")}
              </div>
            </div>
          </Match>
          <Match when={tab() === 3}>
            <div class="pb-1.5 font-semibold" style={{ color: APP.text }}>
              ARM9 Memory Map
            </div>
            <div class="space-y-1 text-[10px]">
              <For each={MAP}>
                {([addr, name, size, color, w]) => (
                  <div class="flex items-center gap-2">
                    <span
                      class="h-3 rounded-[2px] shrink-0"
                      style={{ width: `${w * 0.4}%`, background: color }}
                    />
                    <span style={{ color: APP.faint }}>{addr}</span>
                    <span class="font-semibold" style={{ color: APP.text }}>
                      {name}
                    </span>
                    <span style={{ color: APP.faint }}>{size}</span>
                    <span class="ml-auto">{box("View")}</span>
                  </div>
                )}
              </For>
            </div>
          </Match>
        </Switch>
      </div>
    </div>
  );
};

const VideoPanel: Component = () => {
  const [tab, setTab] = createSignal(0);
  const phase = usePhase([800, 800, 800, 800]);
  const box = (label: string, on = false) => (
    <span
      class="px-2 py-0.5 rounded border text-[10px]"
      style={{
        "border-color": APP.line,
        background: on ? APP.sel : APP.panel2,
        color: on ? APP.onSel : APP.muted,
      }}
    >
      {label}
    </span>
  );
  const BANKS: [string, string, string, string, boolean, string][] = [
    ["A", "128 KB", "0x81", "BG Engine A", true, "#508CC8"],
    ["B", "128 KB", "0x81", "BG Engine A", true, "#508CC8"],
    ["C", "128 KB", "0x84", "ARM7", true, "#50C8B4"],
    ["D", "128 KB", "0x82", "OBJ Engine A", true, "#C87850"],
    ["E", "64 KB", "0x82", "OBJ Engine A", true, "#C87850"],
    ["F", "16 KB", "0x83", "Texture", true, "#64B464"],
    ["G", "16 KB", "??", "Unknown", false, "#3c4043"],
    ["H", "32 KB", "0x85", "BG Engine B", true, "#C8B450"],
    ["I", "16 KB", "0x80", "LCDC", false, "#3c4043"],
  ];
  const OAM: () => [
    string,
    number,
    number,
    string,
    number,
    number,
    number,
    string,
  ][] = () => [
    ["0", 72 + phase() * 19, 100, "16x16", 42, 3, 2, "H"],
    ["1", 72 + phase() * 19, 112, "16x8", 58, 3, 3, "-"],
    ["2", 168, 64, "8x8", 12, 1, 1, "-"],
    ["3", 192, 64, "8x8", 12, 1, 1, "H V"],
    ["4", 8, 8, "32x8", 96, 0, 0, "-"],
  ];
  return (
    <div class="animate-rise">
      <SubTabs
        tabs={["Screen Capture", "VRAM Map", "OAM Preview"]}
        active={tab()}
        onPick={setTab}
      />
      <div class="p-3 text-[10px]">
        <Switch>
          <Match when={tab() === 0}>
            <div class="flex items-center gap-2 pb-2 flex-wrap">
              {box("📷 Capture Frame")}
              <span style={{ color: APP.text }}>☑</span>
              <span style={{ color: APP.muted }}>Live</span>
              <span class="ml-auto" style={{ color: APP.faint }}>
                59 fps · <span style={{ color: APP.ok }}>KEY</span>{" "}
                · 240×160 · 75.2 KB · 1.5× · 1100 KB/s
              </span>
            </div>
            <GbaScreen scale={1.5} />
          </Match>
          <Match when={tab() === 1}>
            <div class="flex items-center gap-2 pb-2">
              {box("🔄 Read VRAM Ctrl")}
              <span class="ml-auto" style={{ color: APP.faint }}>
                Total: 640 KB
              </span>
            </div>
            <div
              class="font-mono grid grid-cols-[40px_56px_44px_minmax(0,1fr)_36px] gap-x-2 gap-y-0.5"
              style={{ color: APP.faint }}
            >
              <span>Bank</span>
              <span>Size</span>
              <span>Value</span>
              <span>Mapping</span>
              <span>Status</span>
              <For each={BANKS}>
                {([bank, size, val, map, on]) => (
                  <>
                    <span class="font-semibold" style={{ color: APP.text }}>
                      VRAM {bank}
                    </span>
                    <span>{size}</span>
                    <span
                      style={{ color: val === "??" ? APP.faint : APP.muted }}
                    >
                      {val}
                    </span>
                    <span style={{ color: APP.muted }}>{map}</span>
                    <span style={{ color: on ? APP.ok : APP.faint }}>
                      {on ? "ON" : "OFF"}
                    </span>
                  </>
                )}
              </For>
            </div>
            <div class="pt-2 space-y-1">
              <div style={{ color: APP.faint }}>Bank Allocation</div>
              <div class="flex h-4 rounded-sm overflow-hidden w-[95%]">
                <For each={BANKS}>
                  {([bank, size, , , , color]) => (
                    <span
                      class="grid place-items-center text-[8px] text-white/90"
                      style={{
                        width: `${(parseInt(size) / 640) * 100}%`,
                        background: color,
                      }}
                    >
                      {parseInt(size) >= 32 ? bank : ""}
                    </span>
                  )}
                </For>
              </div>
            </div>
          </Match>
          <Match when={tab() === 2}>
            <div class="flex items-center gap-2 pb-2 flex-wrap">
              {box("⬇ Read from Memory")}
              <span style={{ color: APP.text }}>☑</span>
              <span style={{ color: APP.muted }}>Show hidden</span>
              <span class="ml-auto" style={{ color: APP.faint }}>
                5/128 visible
              </span>
            </div>
            <div
              class="font-mono grid grid-cols-[20px_36px_32px_44px_36px_28px_28px_32px] gap-x-2 gap-y-0.5"
              style={{ color: APP.faint }}
            >
              <span>#</span>
              <span>X</span>
              <span>Y</span>
              <span>Size</span>
              <span>Tile</span>
              <span>Pal</span>
              <span>Pri</span>
              <span>Flip</span>
              <For each={OAM()}>
                {([n, x, y, size, tile, pal, pri, flip]) => (
                  <>
                    <span style={{ color: APP.muted }}>{n}</span>
                    <span style={{ color: APP.text }}>{x}</span>
                    <span style={{ color: APP.text }}>{y}</span>
                    <span style={{ color: APP.muted }}>{size}</span>
                    <span style={{ color: APP.muted }}>{tile}</span>
                    <span style={{ color: APP.muted }}>{pal}</span>
                    <span style={{ color: APP.muted }}>{pri}</span>
                    <span style={{ color: APP.muted }}>{flip}</span>
                  </>
                )}
              </For>
            </div>
            <div class="pt-2 text-[10px]" style={{ color: APP.faint }}>
              read from 0x07000000 — sprite #0 is mid-walk, X is moving
            </div>
          </Match>
        </Switch>
      </div>
    </div>
  );
};

const TracePanel: Component = () => {
  const [tab, setTab] = createSignal(0);
  const [tick, setTick] = createSignal(0);
  createTimer(() => setTick((x) => x + 1), 900, setInterval);
  const box = (label: string, on = false) => (
    <span
      class="px-2 py-0.5 rounded border text-[10px]"
      style={{
        "border-color": APP.line,
        background: on ? APP.sel : APP.panel2,
        color: on ? APP.onSel : APP.muted,
      }}
    >
      {label}
    </span>
  );
  const ts = (n: number) =>
    `14:02:${String(10 + (n % 45)).padStart(2, "0")}.${
      String((n * 137) % 1000).padStart(3, "0")
    }`;
  const TXB = "#64C8FF", RXG = "#64FF64";
  const IPC: [string, string, string][] = [
    ["TX", "0x00060000", "SYNC"],
    ["RX", "0x00060100", "SYNC_ACK"],
    ["TX", "0x12030001", "SND_PLAY_SEQ"],
    ["RX", "0x00000001", ""],
    ["TX", "0x00110000", "TOUCH_READ"],
    ["RX", "0x00B0C4A2", "TOUCH_DATA"],
  ];
  const ipcShown = () => IPC.slice(0, 3 + (tick() % 4));
  const frames = () =>
    [...Array(40).keys()].map((i) =>
      15.4 + ((i * 37 + Math.floor(tick() / 2) * 13) % 10) / 5 +
      ((i + tick()) % 17 === 0 ? 6 : 0)
    );
  const WIFI: [string, string, string, string][] = [
    ["TX", "0x04", "WIFI_INIT", "(000000)"],
    ["TX", "0x20", "BEACON_SCAN", "(000007)"],
    ["RX", "0x21", "BEACON_RESULT", "(00000B)"],
    ["TX", "0x10", "WFC_CONNECT", "(000001)"],
    ["RX", "0x12", "WFC_STATUS", "(000002)"],
  ];
  const wifiShown = () => WIFI.slice(0, 2 + (tick() % 4));
  const scrub = () => (tick() % 10) / 10;
  return (
    <div class="animate-rise">
      <SubTabs
        tabs={[
          "IPC",
          "DMA",
          "Frame Timing",
          "Timeline",
          "Streams",
          "Slot-2",
          "Wifi",
        ]}
        active={tab()}
        onPick={setTab}
      />
      <div class="p-3 text-[10px]">
        <Switch>
          <Match when={tab() === 0}>
            <div class="flex items-center gap-2 pb-2 flex-wrap">
              {box("📷 Snapshot")}
              <span style={{ color: APP.text }}>☑</span>
              <span style={{ color: APP.muted }}>Auto-scroll</span>
              {box("Clear")}
              <span class="ml-auto" style={{ color: APP.faint }}>
                {ipcShown().length} entries
              </span>
            </div>
            <div class="space-y-0.5 font-mono whitespace-pre">
              <For each={ipcShown()}>
                {([dir, word, decoded], i) => (
                  <div
                    class={i() === ipcShown().length - 1 ? "animate-rise" : ""}
                  >
                    <span style={{ color: dir === "TX" ? TXB : RXG }}>
                      {dir}
                    </span>
                    <span style={{ color: APP.faint }}>
                      {" @ " + ts(i())}
                    </span>
                    <span style={{ color: APP.muted }}>{"   " + word}</span>
                    <span style={{ color: APP.text }}>
                      {decoded ? "  " + decoded : ""}
                    </span>
                  </div>
                )}
              </For>
            </div>
          </Match>
          <Match when={tab() === 1}>
            <div class="pb-2">{box("Read DMA")}</div>
            <div
              class="font-mono grid grid-cols-[24px_84px_84px_44px_44px_66px_48px] gap-x-2 gap-y-0.5"
              style={{ color: APP.faint }}
            >
              <span>Ch</span>
              <span>Source</span>
              <span>Dest</span>
              <span>Count</span>
              <span>Width</span>
              <span>Trigger</span>
              <span>Status</span>
              <For
                each={[
                  [
                    "0",
                    "0x00000000",
                    "0x00000000",
                    "0",
                    "16-bit",
                    "Immediate",
                    false,
                  ],
                  [
                    "1",
                    "0x02066800",
                    "0x04000188",
                    "512",
                    "32-bit",
                    "FIFO",
                    true,
                  ],
                  [
                    "2",
                    "0x00000000",
                    "0x00000000",
                    "0",
                    "16-bit",
                    "Immediate",
                    false,
                  ],
                  [
                    "3",
                    "0x02040000",
                    "0x06000000",
                    "8192",
                    "32-bit",
                    "VBlank",
                    tick() % 3 === 0,
                  ],
                ] as [
                  string,
                  string,
                  string,
                  string,
                  string,
                  string,
                  boolean,
                ][]}
              >
                {([ch, src, dst, cnt, w, trig, act]) => (
                  <>
                    <span style={{ color: APP.muted }}>{ch}</span>
                    <span style={{ color: APP.text }}>{src}</span>
                    <span style={{ color: APP.text }}>{dst}</span>
                    <span style={{ color: APP.muted }}>{cnt}</span>
                    <span style={{ color: APP.muted }}>{w}</span>
                    <span style={{ color: APP.muted }}>{trig}</span>
                    <span style={{ color: act ? APP.ok : APP.faint }}>
                      {act ? "ACTIVE" : "idle"}
                    </span>
                  </>
                )}
              </For>
            </div>
          </Match>
          <Match when={tab() === 2}>
            <div class="flex items-center gap-2 pb-2">
              <span style={{ color: APP.muted }}>Target: 59.8 FPS</span>
              <span class="w-px h-3" style={{ background: APP.line }} />
              <span style={{ color: APP.ok }}>59.6 FPS</span>
              <span class="ml-auto" style={{ color: APP.faint }}>
                300 samples
              </span>
            </div>
            <div
              class="relative flex items-end gap-px h-24 rounded border p-1"
              style={{ "border-color": APP.line, background: "#141418" }}
            >
              <span
                class="absolute inset-x-1 h-px"
                style={{ top: "33%", background: APP.ok, opacity: 0.5 }}
              />
              <For each={frames()}>
                {(ms) => (
                  <span
                    class="flex-1"
                    style={{
                      height: `${Math.min(100, (ms / 41.8) * 100)}%`,
                      background: ms <= 16.7
                        ? "#64B464"
                        : ms <= 25
                        ? "#C8B450"
                        : "#C86464",
                    }}
                  />
                )}
              </For>
            </div>
            <div class="pt-1" style={{ color: APP.faint }}>
              green line = 16.7 ms target · bars: ≤target · ≤1.5× · over
            </div>
          </Match>
          <Match when={tab() === 3}>
            <div class="flex items-center gap-2 pb-2 flex-wrap">
              {box("Open Recording...")}
              {box(tick() % 2 === 0 ? "Pause" : "Play", true)}
              {box("Rewind")}
              <span class="ml-auto" style={{ color: APP.faint }}>
                session-0703.inexrec
              </span>
            </div>
            <div style={{ color: APP.muted }}>214 events, 12.4s</div>
            <div class="py-2">
              <div
                class="relative h-1.5 rounded-full"
                style={{ background: APP.panel2 }}
              >
                <span
                  class="absolute inset-y-0 rounded-full"
                  style={{
                    width: `${scrub() * 100}%`,
                    background: APP.sel,
                    transition: "width 0.6s linear",
                  }}
                />
                <span
                  class="absolute -top-1 size-3.5 rounded-full border-2"
                  style={{
                    left: `calc(${scrub() * 100}% - 7px)`,
                    background: APP.panel,
                    "border-color": APP.selSoft,
                    transition: "left 0.6s linear",
                  }}
                />
              </div>
            </div>
            <div style={{ color: APP.faint }}>
              {(scrub() * 12.4).toFixed(2)}s / 12.40s
            </div>
          </Match>
          <Match when={tab() === 4}>
            <div class="flex items-center gap-2 pb-2 flex-wrap">
              <span style={{ color: APP.muted }}>View:</span>
              {box("All channels ▾")}
              {box("Clear")}
              <span class="ml-auto" style={{ color: APP.faint }}>
                {8 + (tick() % 5)} frames across 2 channel(s)
              </span>
            </div>
            <div class="space-y-0.5 font-mono whitespace-pre overflow-x-auto">
              <For
                each={[
                  ["ch  7", "73 63 6f 72 65 3d 31 32 30 30"],
                  ["ch  2", "01 f4 00 0c 00 00 9a 02 … +58 more"],
                  ["ch  7", "6c 61 70 3d 32"],
                ]}
              >
                {([ch, bytes], i) => (
                  <div>
                    <span style={{ color: APP.faint }}>{ts(i() + 4)}</span>
                    <span style={{ color: TXB }}>{" " + ch}</span>
                    <span style={{ color: APP.muted }}>{" " + bytes}</span>
                  </div>
                )}
              </For>
            </div>
            <div class="pt-1.5" style={{ color: APP.faint }}>
              inbound cmd 0x8f · outbound cmd 0xa4 (max payload 8 KB)
            </div>
          </Match>
          <Match when={tab() === 5}>
            <div class="flex items-center gap-1.5 pb-1.5 flex-wrap text-[10px]">
              <span style={{ color: APP.muted }}>Region:</span>
              {box("SLOT2 (GBA bus) ▾")}
              <span style={{ color: APP.muted }}>Addr 0x</span>
              <span
                class="rounded border px-1.5 py-0.5"
                style={{ "border-color": APP.line, color: APP.muted }}
              >
                000000b8
              </span>
              {box("64 bytes ▾")}
              {box("Read")}
            </div>
            <div class="pb-1.5" style={{ color: APP.faint }}>
              GBA cartridge bus / scratch region. Known-good reads: 4 bytes @
              0xb8 (handshake).
            </div>
            <div
              class="font-mono whitespace-pre overflow-x-auto"
              style={{ color: APP.muted }}
            >
              <div>
                <span style={{ color: APP.faint }}>000000B8</span>
                {" · A5 5A C3 3C 00 00 00 00  00 00 00 00 00 00 00 00 · "}
                <span style={{ color: APP.faint }}>¥Z.&lt;............</span>
              </div>
            </div>
            <div class="pt-1.5" style={{ color: APP.faint }}>
              last read: SLOT2 @ 0x000000b8 (64 bytes)
            </div>
          </Match>
          <Match when={tab() === 6}>
            <div class="flex items-center gap-1.5 pb-2 flex-wrap text-[10px]">
              <span style={{ color: APP.text }}>☑</span>
              <span style={{ color: APP.muted }}>Auto-scroll</span>
              {box("Pause")}
              {box("Clear")}
              <span
                class="rounded border px-1.5 py-0.5"
                style={{ "border-color": APP.line, color: APP.faint }}
              >
                Filter...
              </span>
              <span class="ml-auto" style={{ color: APP.faint }}>
                {wifiShown().length} packets
              </span>
            </div>
            <div class="space-y-0.5 font-mono whitespace-pre">
              <For each={wifiShown()}>
                {([dir, cmd, name, param], i) => (
                  <div
                    class={i() === wifiShown().length - 1 ? "animate-rise" : ""}
                  >
                    <span style={{ color: APP.faint }}>{ts(i() + 9)}</span>
                    <span style={{ color: dir === "TX" ? TXB : RXG }}>
                      {" · " + dir}
                    </span>
                    <span style={{ color: APP.muted }}>{" · " + cmd}</span>
                    <span style={{ color: APP.text }}>{" · " + name}</span>
                    <span style={{ color: APP.faint }}>{" · " + param}</span>
                  </div>
                )}
              </For>
            </div>
          </Match>
        </Switch>
      </div>
    </div>
  );
};

const TimeTravelPanel: Component = () => {
  const phase = usePhase(Array(22).fill(350));
  const frame = () => {
    const p = phase();
    return p < 11 ? 11 - p : p - 11;
  };
  const rewinding = () => phase() < 11;
  return (
    <div class="p-3 space-y-3 text-[10px] animate-rise">
      <div class="flex items-center gap-2">
        <For each={["⏮", "⏪", "⏸", "⏩", "⏭"]}>
          {(b, i) => (
            <span
              class="px-2 py-1 rounded border"
              style={{
                "border-color": APP.line,
                background:
                  (rewinding() && i() === 1) || (!rewinding() && i() === 3)
                    ? APP.sel
                    : APP.panel2,
                color: (rewinding() && i() === 1) || (!rewinding() && i() === 3)
                  ? APP.onSel
                  : APP.muted,
              }}
            >
              {b}
            </span>
          )}
        </For>
        <span
          class="ml-2"
          style={{ color: rewinding() ? APP.warn : APP.muted }}
        >
          frame {3390 + frame()} {rewinding() ? "· rewinding" : ""}
        </span>
      </div>
      <div class="flex gap-1">
        <For each={[...Array(12).keys()]}>
          {(i) => (
            <div
              class="relative flex-1 h-12 rounded-sm overflow-hidden border"
              style={{
                "border-color": i === frame() ? APP.sel : APP.line,
                background: "linear-gradient(#33487e 55%, #3f7d4e 55%)",
                opacity: i === frame() ? 1 : 0.45,
              }}
            >
              <span
                class="absolute size-1.5"
                style={{
                  background: "#c4b5fd",
                  left: `${15 + i * 6}%`,
                  top: `${45 - Math.abs(Math.sin(i * 0.9)) * 30}%`,
                }}
              />
            </div>
          )}
        </For>
      </div>
      <div class="flex flex-wrap gap-x-6" style={{ color: APP.muted }}>
        <span>
          player.x{" "}
          <span style={{ color: APP.selSoft }}>{96 + frame() * 3}</span>
        </span>
        <span>
          rng_state{" "}
          <span style={{ color: APP.selSoft }}>
            0x{((0x1a2b + frame() * 0x9e37) & 0xffff).toString(16)}
          </span>
        </span>
        <span style={{ color: APP.faint }}>
          deterministic replay — scrub anywhere, state reconstructs
        </span>
      </div>
    </div>
  );
};

const LockstepPanel: Component = () => {
  const phase = usePhase([900, 900, 900, 900, 2600, 600]);
  const diverged = () => phase() >= 3 && phase() <= 4;
  const spriteX = (emu: boolean) =>
    18 + phase() * 12 + (emu && diverged() ? 9 : 0);
  return (
    <div class="p-3 space-y-3 text-[10px] animate-rise">
      <div class="grid grid-cols-2 gap-3">
        <For each={["IS-NITRO (hardware)", "melonDS (emulator)"]}>
          {(label, i) => (
            <div class="space-y-1">
              <div style={{ color: APP.faint }}>{label}</div>
              <div
                class="relative h-20 rounded-sm border overflow-hidden"
                style={{
                  "border-color": i() === 1 && diverged() ? APP.err : APP.line,
                  background: "linear-gradient(#2b3a67 60%, #356b42 60%)",
                }}
              >
                <span
                  class="absolute size-2.5"
                  style={{
                    background: "#c4b5fd",
                    left: `${spriteX(i() === 1)}%`,
                    top: "50%",
                    transition: "left 0.3s steps(4)",
                  }}
                />
              </div>
            </div>
          )}
        </For>
      </div>
      <Show
        when={diverged()}
        fallback={
          <div style={{ color: APP.ok }}>
            ✓ in lockstep — frame {8800 + phase() * 4}{" "}
            · same inputs, same state hash
          </div>
        }
      >
        <div
          class="rounded border px-3 py-2 animate-rise"
          style={{ "border-color": APP.err, background: APP.panel }}
        >
          <div style={{ color: APP.err }}>
            ◉ DIVERGENCE @ frame 8812 — 0x0300_1f44 differs (hw: 0x60, emu:
            0x69)
          </div>
          <div style={{ color: APP.muted }}>
            first write: dma3 timing — emulator fires one scanline early
          </div>
        </div>
      </Show>
    </div>
  );
};

const TuningPanel: Component = () => {
  const [t, setT] = createSignal(0);
  const reduced = useReducedMotion();
  const [, startT] = createRAF((now) => setT(now / 1000));
  onMount(() => {
    if (!reduced()) startT();
  });
  const gravity = () => 0.5 + Math.sin(t() * 0.7) * 0.35;
  const bounceY = () => Math.abs(Math.sin(t() * 3)) * (1.1 - gravity()) * 70;
  return (
    <div class="p-3 grid sm:grid-cols-[1fr_auto] gap-4 text-[10px] animate-rise">
      <div class="space-y-3">
        <For
          each={[
            ["GRAVITY", gravity(), true],
            ["JUMP_VEL", 0.62, false],
            ["MOVE_SPEED", 0.4, false],
          ] as [string, number, boolean][]}
        >
          {([name, val, live]) => (
            <div class="space-y-1">
              <div class="flex justify-between">
                <span style={{ color: APP.muted }}>{name}</span>
                <span style={{ color: live ? APP.selSoft : APP.faint }}>
                  {val.toFixed(2)}
                </span>
              </div>
              <div
                class="relative h-1.5 rounded-full"
                style={{ background: APP.panel2 }}
              >
                <span
                  class="absolute -top-[3px] size-3 rounded-full border-2"
                  style={{
                    left: `calc(${val * 100}% - 6px)`,
                    background: live ? APP.sel : APP.panel,
                    "border-color": live ? APP.selSoft : APP.line,
                  }}
                />
              </div>
            </div>
          )}
        </For>
        <div style={{ color: APP.faint }}>
          writes straight to the tunables table in EWRAM — no rebuild, no
          reflash
        </div>
      </div>
      <div
        class="relative w-40 h-28 rounded-sm border overflow-hidden self-center"
        style={{
          "border-color": APP.line,
          background: "linear-gradient(#2b3a67 75%, #3f7d4e 75%)",
        }}
      >
        <span
          class="absolute size-2.5"
          style={{
            background: "#c4b5fd",
            left: "45%",
            bottom: `${18 + bounceY()}px`,
          }}
        />
        <span class="absolute top-1 right-1.5" style={{ color: APP.ok }}>
          ● live
        </span>
      </div>
    </div>
  );
};

const ProvenancePanel: Component = () => {
  const phase = usePhase([2000, 2000, 2000]);
  const SPOTS: [number, number, string, string, string][] = [
    [
      30,
      30,
      "BG1 · tile 0x42 (3,5)",
      "palette 2 · assets/tiles.narc",
      "forest.4bpp, row 18",
    ],
    [
      65,
      55,
      "OBJ #00 · sprite 'player'",
      "OAM x=104 y=72 · 16×16",
      "assets/sprites/player.narc",
    ],
    [
      80,
      20,
      "BG0 · tile 0x0a (12,2)",
      "palette 0 · assets/tiles.narc",
      "hud.4bpp, row 2",
    ],
  ];
  const spot = () => SPOTS[phase() % 3];
  return (
    <div class="p-3 grid sm:grid-cols-[auto_1fr] gap-4 text-[10px] animate-rise">
      <div
        class="relative w-52 h-32 rounded-sm border overflow-hidden"
        style={{
          "border-color": APP.line,
          background:
            "linear-gradient(#2b3a67 30%, #33487e 30%, #33487e 60%, #3f7d4e 60%)",
        }}
      >
        <span
          class="absolute size-3"
          style={{ background: "#c4b5fd", left: "48%", top: "52%" }}
        />
        <span
          class="absolute w-px inset-y-0"
          style={{
            left: `${spot()[0]}%`,
            background: `${APP.warn}88`,
            transition: "left 0.4s steps(6)",
          }}
        />
        <span
          class="absolute h-px inset-x-0"
          style={{
            top: `${spot()[1]}%`,
            background: `${APP.warn}88`,
            transition: "top 0.4s steps(6)",
          }}
        />
      </div>
      <div
        class="rounded border p-3 space-y-1 self-start animate-rise"
        style={{ "border-color": APP.line, background: APP.panel }}
      >
        <div style={{ color: APP.selSoft }}>{spot()[2]}</div>
        <div style={{ color: APP.muted }}>{spot()[3]}</div>
        <div style={{ color: APP.faint }}>{spot()[4]}</div>
        <div class="pt-1" style={{ color: APP.faint }}>
          click any pixel → which layer, tile, palette and source asset drew it
        </div>
      </div>
    </div>
  );
};

const CrashPanel: Component = () => {
  const phase = usePhase([2000, 400, 3400, 600]);
  const crashed = () => phase() >= 1 && phase() <= 2;
  return (
    <div class="p-3 min-h-40 text-[10px] animate-rise">
      <Show
        when={crashed()}
        fallback={
          <div class="flex items-center gap-2" style={{ color: APP.ok }}>
            ● running — black box armed (last 120 frames + reg trail kept)
          </div>
        }
      >
        <div
          class="rounded border overflow-hidden animate-rise"
          style={{ "border-color": APP.err }}
        >
          <div
            class="px-3 py-1.5"
            style={{ background: "rgba(248,113,113,0.15)", color: APP.err }}
          >
            ◉ DATA ABORT — read from 0x0000_0004 (null + 4) · frame 12 402
          </div>
          <div
            class="p-3 grid sm:grid-cols-[auto_1fr] gap-3"
            style={{ background: APP.panel }}
          >
            <div
              class="w-24 h-16 rounded-sm border grid place-items-center"
              style={{
                "border-color": APP.line,
                background: "#2b3a67",
                color: APP.faint,
              }}
            >
              last frame ▣
            </div>
            <div class="space-y-0.5" style={{ color: APP.muted }}>
              <div>
                pc 0x0800_2f10 —{" "}
                <span style={{ color: APP.selSoft }}>enemy_ai::think</span>
              </div>
              <div>lr 0x0800_2c44 — game_loop · r0 0x0000_0000 ← the null</div>
              <div style={{ color: APP.faint }}>
                regs + stack + last 120 frames + input tail bundled
              </div>
              <span
                class="inline-block mt-1 px-2 py-0.5 rounded"
                style={{ background: APP.sel, color: APP.onSel }}
              >
                share crash card
              </span>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
};

const TreemapPanel: Component = () => {
  const phase = usePhase([2000, 2000]);
  const over = () => phase() === 1;
  return (
    <div class="p-3 space-y-2 text-[10px] animate-rise">
      <div class="flex h-32 gap-1">
        <div class="flex flex-col gap-1" style={{ width: "42%" }}>
          <div
            class="flex-[2] rounded-sm grid place-items-center"
            style={{ background: "#8b5cf6" }}
          >
            <span class="text-black/70">code · 148 KiB</span>
          </div>
          <div
            class="flex-1 rounded-sm grid place-items-center"
            style={{ background: "#a78bfa" }}
          >
            <span class="text-black/70">inex runtime · 38 KiB</span>
          </div>
        </div>
        <div class="flex flex-col gap-1" style={{ width: "34%" }}>
          <div
            class={`flex-[2] rounded-sm grid place-items-center ${
              over() ? "animate-blink" : ""
            }`}
            style={{ background: over() ? APP.err : "#2fb8a6" }}
          >
            <span class="text-black/70">
              sprites · {over() ? "142" : "118"} KiB
            </span>
          </div>
          <div
            class="flex-1 rounded-sm grid place-items-center"
            style={{ background: "#5b7db1" }}
          >
            <span class="text-black/70">maps · 64 KiB</span>
          </div>
        </div>
        <div class="flex flex-col gap-1 flex-1">
          <div
            class="flex-[3] rounded-sm grid place-items-center"
            style={{ background: "#fbbf24" }}
          >
            <span class="text-black/70">audio · 204 KiB</span>
          </div>
          <div
            class="flex-1 rounded-sm grid place-items-center"
            style={{ background: APP.panel2 }}
          >
            <span style={{ color: APP.muted }}>free</span>
          </div>
        </div>
      </div>
      <div style={{ color: over() ? APP.err : APP.muted }}>
        {over()
          ? "⚠ sprites grew +24 KiB this build — 12 KiB over the 4 MBit cart budget"
          : "572 / 512+64 KiB — every build diffs against the last"}
      </div>
    </div>
  );
};

const WelcomePanel: Component = () => {
  const phase = usePhase([3600, 3600]);
  const RECENTS: [string, string][] = [
    ["inex-demo", "~/projects/inex-demo"],
    ["pocket-platformer", "~/projects/pocket-platformer"],
    ["biome-game", "~/code/biome-game"],
  ];
  return (
    <div class="min-h-full grid place-items-center p-4 animate-rise">
      <Show
        when={phase() === 1}
        fallback={
          <div class="w-full max-w-[340px] space-y-3 text-[11px]">
            <div class="text-center space-y-1">
              <div
                class="text-lg font-semibold tracking-tight"
                style={{ color: APP.text }}
              >
                inex studio
              </div>
              <div class="text-[10px]" style={{ color: APP.faint }}>
                Nintendo Development Toolkit · 0.1-dev
              </div>
            </div>
            <div class="flex justify-center gap-2">
              <span
                class="px-2.5 py-1 rounded"
                style={{ background: APP.panel2, color: APP.text }}
              >
                Open Project…
              </span>
              <span
                class="px-2.5 py-1 rounded"
                style={{ background: APP.sel, color: APP.onSel }}
              >
                + New Project…
              </span>
            </div>
            <div class="pt-1 text-[10px]" style={{ color: APP.faint }}>
              Recent projects
            </div>
            <div class="space-y-1">
              <For each={RECENTS}>
                {([name, path]) => (
                  <div
                    class="flex justify-between gap-2 rounded border px-2 py-1"
                    style={{ "border-color": APP.line, background: APP.panel }}
                  >
                    <span style={{ color: APP.text }}>{name}</span>
                    <span class="truncate" style={{ color: APP.faint }}>
                      {path}
                    </span>
                  </div>
                )}
              </For>
            </div>
          </div>
        }
      >
        <div class="w-full max-w-[280px] space-y-2.5 text-[11px] animate-rise">
          <div class="text-[10px]" style={{ color: APP.faint }}>
            NEW PROJECT
          </div>
          <div
            class="rounded border px-2 py-1"
            style={{ "border-color": APP.line, color: APP.text }}
          >
            my-game<span class="animate-blink">▏</span>
          </div>
          <div class="flex gap-1.5">
            <For each={["GBA", "NDS", "DSi"]}>
              {(p, i) => (
                <span
                  class="px-2 py-0.5 rounded text-[10px]"
                  style={{
                    background: i() === 1 ? APP.sel : APP.panel2,
                    color: i() === 1 ? APP.onSel : APP.muted,
                  }}
                >
                  {p}
                </span>
              )}
            </For>
          </div>
          <div class="text-[10px]" style={{ color: APP.faint }}>
            ~/projects/my-game — cargo project + inex.toml + assets/
          </div>
          <span
            class="inline-block px-3 py-1 rounded"
            style={{ background: APP.sel, color: APP.onSel }}
          >
            Create
          </span>
        </div>
      </Show>
    </div>
  );
};

const PANELS = {
  welcome: WelcomePanel,
  code: CodePanel,
  project: ProjectPanel,
  assets: AssetsPanel,
  files: FilesPanel,
  build: BuildPanel,
  debugger: DebuggerPanel,
  cpu: CpuPanel,
  video: VideoPanel,
  trace: TracePanel,
  timetravel: TimeTravelPanel,
  lockstep: LockstepPanel,
  tuning: TuningPanel,
  provenance: ProvenancePanel,
  crashbox: CrashPanel,
  treemap: TreemapPanel,
  inputreplay: InputReplayPanel,
  hotasset: HotAssetPanel,
  scanline: ScanlinePanel,
  testrunner: TestRunnerPanel,
  orchestra: OrchestraPanel,
  cartshare: CartSharePanel,
  sio: SioAnalyzerPanel,
  multiboot: MultibootPanel,
  wiredwireless: WiredWirelessPanel,
  wm: WmSequencePanel,
  dlplay: DlPlayPanel,
  netplay: NetplayPanel,
  choreographer: ChoreographerPanel,
  peripheralbench: PeripheralBenchPanel,
  slot2: Slot2Panel,
  gbprinter: GbPrinterPanel,
  gbcamera: GbCameraPanel,
  ir: IrLabPanel,
  joybus: JoybusPanel,
  solar: SolarCurvePanel,
  printerdesigner: PrinterDesignerPanel,
  rumbledesigner: RumbleDesignerPanel,
  dotcode: DotcodeDesignerPanel,
  lobby: LobbyDesignerPanel,
  sdat: SdatTrackerPanel,
  font: FontDesignerPanel,
  saveworkshop: SaveWorkshopPanel,
  tilemap: TilemapLivePanel,
  scanner: ScannerPanel,
  protocolfuzz: ProtocolFuzzPanel,
  channelmixer: ChannelMixerPanel,
  swar: SwarEditorPanel,
  mic: MicLabPanel,
  teakdsp: TeakDspPanel,
  cameralab: CameraLabPanel,
  rtc: RtcPanel,
  touch: TouchLabPanel,
  poly3d: Poly3dPanel,
  paletteproof: PaletteProofPanel,
} satisfies Record<string, Component>;

type PanelId = keyof typeof PANELS;

const RAIL_AUTHOR: [string, typeof IconCode, string][] = [
  ["code", IconCode, "Code"],
  ["project", IconFolder, "Project"],
  ["assets", IconPalette, "Assets"],
  ["files", IconSitemap, "Files"],
  ["build", IconHammer, "Build"],
];
const RAIL_DEBUG: [string, typeof IconCode, string][] = [
  ["debugger", IconBug, "Debug"],
  ["cpu", IconCpu, "CPU"],
  ["video", IconDeviceDesktop, "Video"],
  ["trace", IconActivity, "Trace"],
];

const byId = (id: string) => STOPS.find((s) => s.id === id)!;

const [current, setCurrent] = createSignal<Stop>(byId("video"));
const [view, setView] = createSignal<PanelId>("video");

const select = (stop: Stop) => {
  setCurrent(stop);
  if (stop.view) setView(stop.view);
  if (globalThis.location?.pathname.endsWith("/docs/guides/studio")) {
    history.replaceState(null, "", `#${stop.id}`);
  }
};
const selectId = (id: string) => select(byId(id));

const pressable = (fn: () => void, label: string) => ({
  role: "button" as const,
  tabindex: 0,
  "aria-label": label,
  onKeyDown: (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      e.stopPropagation();
      fn();
    }
  },
});

export const StudioTourNav: Component = () => {
  return (
    <nav class="space-y-4">
      <For each={GROUP_ORDER}>
        {(group) => (
          <div class="space-y-1">
            <div class="sticky top-0 z-10 bg-surface py-1 text-[10px] font-semibold text-muted/70 uppercase tracking-widest">
              {group}
            </div>
            <For each={STOPS.filter((s) => s.group === group)}>
              {(s) => (
                <button
                  type="button"
                  onClick={() => select(s)}
                  class={`flex w-full items-center gap-2 rounded-md px-2 py-1 text-[13px] text-left transition-colors cursor-pointer ${
                    current().id === s.id
                      ? "bg-accent/12 text-accent"
                      : "text-ink-2 hover:bg-panel hover:text-ink"
                  }`}
                >
                  <span
                    class={`size-1.5 shrink-0 rounded-full ${
                      s.status === "concept" ? "opacity-60" : ""
                    }`}
                    style={{ background: STATUS[s.status].color }}
                  />
                  {s.label}
                </button>
              )}
            </For>
          </div>
        )}
      </For>
    </nav>
  );
};

export const StudioTour: Component = () => {
  onMount(() => {
    const id = globalThis.location?.hash.slice(1);
    const stop = id && STOPS.find((s) => s.id === id);
    if (stop) select(stop);
  });

  const Ring = (props: { region: Region }) => (
    <Show when={current().region === props.region}>
      <span
        class="pointer-events-none absolute inset-0 z-20 rounded-md border-2"
        style={{ "border-color": APP.sel }}
      />
    </Show>
  );

  const viewStop = () => STOPS.find((s) => s.view === view())!;
  const paletteOpen = () => current().id === "palette";

  const task = usePhase([5200, 350, 350, 350, 350, 350, 2200]);

  const [dockTab, setDockTab] = createSignal(0);
  const diag = usePhase([2600, 2600, 900, 2600]);

  const logs = usePhase(Array(6).fill(1500));
  const LOG: [string, string, string][] = [
    ["14:02:10.114", "INF", "connected — Pocket Debug Cartridge FW 1.00"],
    ["14:02:14.630", "INF", "build: Finished `release` in 3.4s"],
    ["14:02:15.288", "INF", "deploy inex-demo.nds: 412 KB in 0.6s"],
    ["14:02:15.291", "DBG", "video stream up — keyframe interval 60"],
    ["14:02:18.902", "INF", "gdb: editor attached on :2345"],
    ["14:02:19.443", "WRN", "diagnostics: 1 finding (assets/ereader/)"],
  ];

  const railIcon = (id: string, Icon: typeof IconCode, label: string) => (
    <button
      type="button"
      title={byId(id).title}
      onClick={(e) => {
        e.stopPropagation();
        selectId(id);
      }}
      class="w-[60px] h-11 rounded-md flex flex-col items-center justify-center gap-0.5 cursor-pointer"
      style={{
        background: view() === id
          ? "color-mix(in srgb, var(--app-sel) 28%, transparent)"
          : "transparent",
        color: view() === id ? APP.text : APP.muted,
      }}
    >
      <Icon size={16} stroke-width={1.75} />
      <span class="text-[9px] leading-none">{label}</span>
    </button>
  );

  return (
    <div class="space-y-3">
      <div class="xl:hidden flex flex-wrap gap-1">
        <For each={STOPS}>
          {(s) => (
            <button
              type="button"
              onClick={() => select(s)}
              class={`flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs transition-colors cursor-pointer ${
                current().id === s.id
                  ? "border-accent/40 bg-accent/12 text-accent"
                  : "border-line text-ink-2 hover:bg-panel hover:text-ink"
              }`}
            >
              <span
                class={`size-1.5 shrink-0 rounded-full ${
                  s.status === "concept" ? "opacity-60" : ""
                }`}
                style={{ background: STATUS[s.status].color }}
              />
              {s.label}
            </button>
          )}
        </For>
      </div>

      <div
        class="flex flex-col rounded-lg overflow-hidden border shadow-lg h-[26rem] lg:h-auto lg:aspect-[16/10]"
        style={{ "border-color": APP.line, background: APP.bg }}
      >
        <div
          class="relative flex items-center gap-1.5 px-2 py-1.5 border-b text-[10px] cursor-pointer"
          style={{
            "border-color": APP.line,
            background: APP.panel,
            color: APP.text,
          }}
          onClick={() => selectId("toolbar")}
          {...pressable(() => selectId("toolbar"), byId("toolbar").title)}
        >
          <Ring region="toolbar" />
          <span class="px-2 py-0.5 rounded" style={{ color: APP.text }}>
            File
          </span>
          <span
            class="px-2 py-0.5 rounded flex items-center gap-1.5"
            style={{ background: APP.panel2 }}
          >
            <span>inex-demo</span>
            <span style={{ color: APP.muted }}>[NDS]</span>
            <span style={{ color: APP.muted }}>AINE</span>
          </span>
          <span
            class="px-2 py-0.5 rounded"
            style={{ background: APP.pocket, color: "#f5f6f6" }}
          >
            ⌁ Pocket Debug Cartridge
          </span>
          <span class="hidden sm:inline" style={{ color: APP.ok }}>
            GDB :4242
          </span>
          <span
            class="absolute left-1/2 -translate-x-1/2 hidden lg:inline"
            style={{ color: APP.faint }}
          >
            inex studio — {viewStop().label}
          </span>
          <span
            class="ml-auto grid place-items-center w-6"
            style={{ color: APP.muted }}
          >
            <IconX size={13} stroke-width={2} />
          </span>
        </div>

        <div
          class="flex-1 min-h-0 grid grid-cols-[72px_minmax(0,1fr)] md:grid-cols-[72px_minmax(0,1fr)_176px] grid-rows-[minmax(0,1fr)_auto]"
          style={{ color: APP.text }}
        >
          <div
            class="relative border-r cursor-pointer min-h-0"
            style={{
              "border-color": APP.line,
              background: APP.panel,
            }}
            onClick={() => selectId("rail")}
            {...pressable(() => selectId("rail"), byId("rail").title)}
          >
            <Ring region="rail" />
            <Scroll class="h-full">
              <div class="flex flex-col items-center gap-1 py-2">
                <For each={RAIL_AUTHOR}>
                  {([id, I, l]) => railIcon(id, I, l)}
                </For>
                <span
                  class="w-8 h-px my-1 shrink-0"
                  style={{ background: APP.line }}
                />
                <For each={RAIL_DEBUG}>
                  {([id, I, l]) => railIcon(id, I, l)}
                </For>
              </div>
            </Scroll>
          </div>

          <div
            class="relative flex flex-col min-w-0 min-h-0 cursor-pointer"
            onClick={() => select(viewStop())}
            {...pressable(() => select(viewStop()), "main panel")}
          >
            <Ring region="main" />
            <Scroll class="flex-1 min-h-0">
              <Dynamic component={PANELS[view()]} />
            </Scroll>
            <Show when={viewStop().status === "concept"}>
              <span
                class="absolute top-2 right-2 px-1.5 py-0.5 rounded border border-dashed text-[9px] uppercase tracking-widest"
                style={{
                  "border-color": APP.selSoft,
                  color: APP.selSoft,
                  background:
                    "color-mix(in srgb, var(--app-bg) 80%, transparent)",
                }}
              >
                concept
              </span>
            </Show>

            <Show when={paletteOpen()}>
              <div
                class="absolute left-1/2 -translate-x-1/2 top-6 w-80 max-w-[92%] rounded-md border shadow-xl animate-rise z-10"
                style={{
                  "border-color": APP.line,
                  background: APP.panel,
                  "box-shadow":
                    `0 8px 24px rgba(0,0,0,0.5), inset 0 0 0 2px ${APP.sel}`,
                }}
              >
                <div
                  class="flex items-center gap-1 px-3 py-2 border-b text-[11px]"
                  style={{ "border-color": APP.line, color: APP.text }}
                >
                  <span>go</span>
                  <span
                    class="w-1.5 h-3.5 animate-blink"
                    style={{ background: APP.sel }}
                  />
                  <span class="pl-1" style={{ color: APP.faint }}>
                    Type to filter commands…
                  </span>
                </div>
                <div class="py-1 text-[11px]">
                  <For
                    each={[
                      ["View", "Go to: Code"],
                      ["View", "Go to: Project"],
                      ["View", "Go to: Assets"],
                      ["View", "Go to: Filesystem"],
                      ["View", "Go to: Build"],
                    ]}
                  >
                    {([group, cmd], i) => (
                      <div
                        class="px-3 py-1 flex items-baseline gap-2"
                        style={{
                          background: i() === 0
                            ? "color-mix(in srgb, var(--app-sel) 25%, transparent)"
                            : "transparent",
                        }}
                      >
                        <span
                          class="w-9 text-[9px]"
                          style={{ color: APP.faint }}
                        >
                          {group}
                        </span>
                        <span
                          style={{ color: i() === 0 ? APP.text : APP.muted }}
                        >
                          {cmd}
                        </span>
                      </div>
                    )}
                  </For>
                </div>
              </div>
            </Show>

            <div
              class="relative shrink-0 border-t text-[10px]"
              style={{ "border-color": APP.line }}
              onClick={(e) => {
                e.stopPropagation();
                selectId("dock");
              }}
              {...pressable(() => selectId("dock"), byId("dock").title)}
            >
              <Ring region="dock" />
              <SubTabs
                tabs={["Log", "Debug Console", "Debug Server", "Diagnostics"]}
                active={dockTab()}
                onPick={(i) => {
                  setDockTab(i);
                  selectId("dock");
                }}
              />
              <div class="px-2.5 py-1.5 h-14 overflow-hidden space-y-0.5 font-mono">
                <Switch>
                  <Match when={dockTab() === 0}>
                    <For each={LOG.slice(Math.max(0, logs() - 2), logs() + 1)}>
                      {([t, lvl, msg], i) => (
                        <div
                          class={`truncate ${
                            i() === Math.min(logs(), 2) ? "animate-rise" : ""
                          }`}
                        >
                          <span style={{ color: APP.faint }}>{t}</span>
                          <span
                            style={{
                              color: lvl === "WRN"
                                ? APP.warn
                                : lvl === "INF"
                                ? APP.ok
                                : APP.faint,
                            }}
                          >
                            {"  " + lvl + "  "}
                          </span>
                          <span style={{ color: APP.muted }}>{msg}</span>
                        </div>
                      )}
                    </For>
                  </Match>
                  <Match when={dockTab() === 1}>
                    <div class="truncate">
                      <span style={{ color: APP.faint }}>14:02:16.001</span>
                      <span style={{ color: "#78C8FF" }} class="px-[2ch]">
                        ARM9
                      </span>
                      <span style={{ color: APP.muted }}>
                        nitrofs mounted (42 files)
                      </span>
                    </div>
                    <div class="truncate">
                      <span style={{ color: APP.faint }}>14:02:16.180</span>
                      <span style={{ color: "#FFB478" }} class="px-[2ch]">
                        ARM7
                      </span>
                      <span style={{ color: APP.muted }}>
                        audio: sdat player ready
                      </span>
                    </div>
                    <div class="truncate">
                      <span style={{ color: APP.faint }}>14:02:16.202</span>
                      <span style={{ color: "#78C8FF" }} class="px-[2ch]">
                        ARM9
                      </span>
                      <span style={{ color: APP.muted }}>
                        vblank loop up — 60 fps
                      </span>
                    </div>
                  </Match>
                  <Match when={dockTab() === 2}>
                    <div>
                      <span style={{ color: APP.muted }}>
                        Studio GDB server: localhost:2345
                      </span>{" "}
                      <span style={{ color: APP.ok }}>running</span>
                    </div>
                    <div style={{ color: APP.faint }}>
                      attach your editor with `target remote :2345` — the panels
                      stay live (multiplexed)
                    </div>
                  </Match>
                  <Match when={dockTab() === 3}>
                    <Show
                      when={diag() >= 1 && diag() <= 2}
                      fallback={
                        <div style={{ color: APP.ok }}>
                          ✓ project healthy — 0 findings
                        </div>
                      }
                    >
                      <div style={{ color: APP.warn }}>
                        ⚠ e-Reader feature is off but assets/ereader/ still
                        exists
                      </div>
                      <span
                        class="inline-block px-2 py-0.5 rounded text-[10px]"
                        style={{
                          background: diag() === 2 ? APP.panel2 : APP.sel,
                          color: diag() === 2 ? APP.muted : APP.onSel,
                        }}
                      >
                        {diag() === 2
                          ? "removing folder…"
                          : "Fix: remove folder"}
                      </span>
                    </Show>
                  </Match>
                </Switch>
              </div>
            </div>
          </div>

          <div
            class="relative hidden md:block border-l cursor-pointer min-h-0"
            style={{
              "border-color": APP.line,
              background: APP.panel,
            }}
            onClick={() => selectId("inspector")}
            {...pressable(() => selectId("inspector"), byId("inspector").title)}
          >
            <Ring region="inspector" />
            <Scroll class="h-full">
              <div class="flex flex-col gap-2 p-3 font-mono text-[10px]">
                <div
                  class="flex items-center gap-1.5 font-semibold"
                  style={{ color: APP.text }}
                >
                  <IconPlug size={12} stroke-width={2} />
                  Device
                </div>
                <div class="flex items-start gap-2 pt-1">
                  <IconDeviceGamepad2
                    size={26}
                    stroke-width={1.5}
                    style={{ color: APP.pocket }}
                  />
                  <div class="min-w-0">
                    <div
                      class="text-[12px] font-semibold leading-tight"
                      style={{ color: APP.text }}
                    >
                      Pocket Debug Cartridge
                    </div>
                    <div style={{ color: APP.ok }}>● Connected</div>
                  </div>
                </div>
                <div style={{ color: APP.faint }}>
                  RP2354 debug cartridge in the Pocket's cart slot
                </div>
                <div class="space-y-0.5">
                  <For
                    each={[
                      ["Type", "pocket-debug"],
                      ["Serial", "PICO2TB00"],
                      ["FW", "1.00"],
                      ["Target", "GBA"],
                    ]}
                  >
                    {([k, v]) => (
                      <div class="flex justify-between gap-2">
                        <span style={{ color: APP.muted }}>{k}</span>
                        <span class="truncate" style={{ color: APP.text }}>
                          {v}
                        </span>
                      </div>
                    )}
                  </For>
                </div>
                <span class="h-px w-full" style={{ background: APP.line }} />
                <div class="font-semibold" style={{ color: APP.text }}>
                  Firmware
                </div>
                <div class="flex justify-between gap-2">
                  <span style={{ color: APP.muted }}>installed</span>
                  <span style={{ color: APP.text }}>v0.1.0</span>
                </div>
                <div
                  class="rounded border px-2 py-1"
                  style={{ "border-color": APP.line, color: APP.muted }}
                >
                  ⬆ update to v0.2.0
                </div>
                <span class="h-px w-full" style={{ background: APP.line }} />
                <div
                  class="flex items-center gap-1"
                  style={{ color: APP.muted }}
                >
                  <IconChevronRight size={11} stroke-width={2} />
                  Advanced
                </div>
              </div>
            </Scroll>
          </div>

          <div
            class="relative col-span-2 md:col-span-3 flex items-center gap-2 border-t px-2 py-1 text-[10px] cursor-pointer"
            style={{
              "border-color": APP.line,
              background: APP.panel,
              color: APP.muted,
            }}
            onClick={() => selectId("bottombar")}
            {...pressable(() => selectId("bottombar"), byId("bottombar").title)}
          >
            <Ring region="bottombar" />
            <span class="px-1.5 truncate">
              <span style={{ color: APP.ok }}>▶</span>{" "}
              <span style={{ color: APP.text }}>Running</span>
            </span>
            <span
              class="px-2 py-0.5 rounded shrink-0"
              style={{ background: APP.panel2, color: APP.text }}
            >
              ▶ Build & Run
            </span>
            <span
              class="px-2 py-0.5 rounded hidden sm:inline"
              style={{ background: APP.panel2 }}
            >
              ⟳ Run Last
            </span>
            <For
              each={[
                ["⏸ Halt", false],
                ["▶ Continue", false],
                ["⇥ Step", true],
                ["↺ Reset", false],
              ] as [string, boolean][]}
            >
              {([b, dim]) => (
                <span
                  class="px-2 py-0.5 rounded hidden lg:inline"
                  style={{
                    background: APP.panel2,
                    color: dim ? APP.faint : APP.muted,
                  }}
                >
                  {b}
                </span>
              )}
            </For>
            <span
              class="px-2 py-0.5 rounded hidden xl:inline"
              style={{ background: APP.panel2 }}
            >
              ⏺ Record
            </span>
            <span class="ml-auto shrink-0 flex items-center gap-1.5">
              <span class="hidden sm:flex items-center justify-end gap-1.5 w-48">
                <Show when={task() >= 1}>
                  <Show
                    when={task() <= 5}
                    fallback={
                      <span style={{ color: APP.ok }}>
                        ✓ deployed 412 KiB in 0.6s
                      </span>
                    }
                  >
                    <span style={{ color: APP.muted }}>
                      deploy inex-demo.nds
                    </span>
                    <span
                      class="w-16 h-1 rounded-sm overflow-hidden"
                      style={{ background: APP.panel2 }}
                    >
                      <span
                        class="block h-full"
                        style={{
                          width: `${(task() - 1) * 25}%`,
                          background: APP.sel,
                          transition: "width 0.3s steps(3)",
                        }}
                      />
                    </span>
                  </Show>
                </Show>
              </span>
              <span style={{ color: APP.faint }}>⚠ 0</span>
              <button
                type="button"
                title="Command palette (Ctrl+P)"
                class="px-2 py-0.5 rounded border cursor-pointer"
                style={{
                  "border-color": paletteOpen() ? APP.sel : APP.line,
                  color: paletteOpen() ? APP.selSoft : APP.muted,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  selectId("palette");
                }}
              >
                ⌕ Commands
              </button>
            </span>
          </div>
        </div>
      </div>

      <Show when={current()} keyed>
        {(c) => (
          <div class="rounded-lg border border-line bg-panel p-4 space-y-1.5 animate-rise">
            <div class="flex items-center gap-2.5 flex-wrap">
              <h3 class="text-sm font-semibold text-ink">{c.title}</h3>
              <span
                class="rounded-full border px-2 py-0.5 text-[10px]"
                style={{
                  color: STATUS[c.status].color,
                  "border-color": `${STATUS[c.status].color}55`,
                  "border-style": c.status === "concept" ? "dashed" : "solid",
                }}
              >
                {STATUS[c.status].label}
              </span>
              <Show when={c.hint}>
                <span class="font-mono text-[11px] text-muted">{c.hint}</span>
              </Show>
            </div>
            <p class="text-sm text-ink-2 leading-relaxed">{c.body}</p>
          </div>
        )}
      </Show>
    </div>
  );
};
