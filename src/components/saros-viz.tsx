import { type Component, createMemo, createSignal, For, Show } from "solid-js";
import { IconDownload } from "@tabler/icons-solidjs";
import { saros_pb } from "@inex/protobufs";
import { timestampDate } from "@bufbuild/protobuf/wkt";
import { humanSize, totalBlobBytes } from "../lib/client.ts";
import { compactNum } from "../lib/format.ts";
import { Chip } from "./ui.tsx";
import { HL, tint } from "./docs-blocks.tsx";

export const KIND_LABEL: Record<number, string> = {
  1: "added",
  2: "changed",
  3: "fixed",
  4: "removed",
  5: "security",
};
export const KIND_TONE: Record<
  number,
  "accent" | "warn" | "danger" | "neutral"
> = {
  1: "accent",
  2: "neutral",
  3: "warn",
  4: "danger",
  5: "danger",
};

export function changelogText(fw: saros_pb.Firmware): string {
  return fw.changelog.map((c) => c.description).join(" · ");
}

export function cmpVersions(a: string, b: string): number {
  const as = a.split("."), bs = b.split(".");
  for (let i = 0; i < Math.max(as.length, bs.length); i++) {
    const [x, y] = [as[i], bs[i]];
    if (x === undefined) return -1;
    if (y === undefined) return 1;
    const [nx, ny] = [Number(x), Number(y)];
    const ord = Number.isFinite(nx) && Number.isFinite(ny)
      ? nx - ny
      : x.localeCompare(y);
    if (ord !== 0) return ord;
  }
  return 0;
}

export function tsDate(ts: Parameters<typeof timestampDate>[0]): string {
  return timestampDate(ts).toISOString().slice(0, 10);
}

export const hasSecurity = (fw: saros_pb.Firmware) =>
  fw.changelog.some((c) => c.kind === 5);

export const DownloadStat: Component<{ n: number; class?: string }> = (
  props,
) => {
  return (
    <span
      class={`inline-flex items-center gap-1 font-mono text-[11px] text-muted ${
        props.class ?? ""
      }`}
      title={`${props.n.toLocaleString()} download${props.n === 1 ? "" : "s"}`}
    >
      <IconDownload size={12} class="opacity-70" />
      {compactNum(props.n)}
    </span>
  );
};

export const LiveDot: Component<{
  state: "connecting" | "live" | "reconnecting";
}> = (props) => {
  const live = () => props.state === "live";
  const label = () =>
    live()
      ? "live"
      : props.state === "reconnecting"
      ? "reconnecting…"
      : "linking…";
  return (
    <span class="inline-flex items-center gap-1.5 rounded-full border border-line bg-panel px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted">
      <span class="relative grid size-2 place-items-center">
        <Show when={live()}>
          <span class="absolute inline-flex size-2 rounded-full bg-accent opacity-60 animate-ping" />
        </Show>
        <span
          class="relative inline-flex size-2 rounded-full"
          classList={{
            "bg-accent": live(),
            "bg-warn animate-blink": !live(),
          }}
        />
      </span>
      {label()}
    </span>
  );
};

export const BlobGlyphStrip: Component<{ blobs: saros_pb.FirmwareBlob[] }> = (
  props,
) => {
  return (
    <div class="flex items-center gap-1" aria-hidden="true">
      <For each={props.blobs.slice(0, 6)}>
        {(b) => <MiniGlyph sha256={b.sha256} />}
      </For>
      <Show when={props.blobs.length > 6}>
        <span class="font-mono text-[10px] text-muted">
          +{props.blobs.length - 6}
        </span>
      </Show>
    </div>
  );
};

function MiniGlyph(props: { sha256: string }) {
  const cells = createMemo(() => {
    const hex = props.sha256;
    if (!/^[0-9a-f]{64}$/.test(hex)) return [] as { x: number; y: number }[];
    const out: { x: number; y: number }[] = [];
    for (let i = 0; i < 64; i++) {
      const nib = parseInt(hex[i], 16);
      for (let b = 0; b < 4; b++) {
        if (nib & (8 >> b)) {
          const idx = i * 4 + b;
          out.push({ x: idx % 16, y: Math.floor(idx / 16) });
        }
      }
    }
    return out;
  });
  return (
    <svg
      viewBox="0 0 16 16"
      class="size-5 rounded-[3px] border border-line bg-panel p-px text-ink/70"
      shape-rendering="crispEdges"
    >
      <For each={cells()}>
        {(c) => (
          <rect x={c.x} y={c.y} width="1" height="1" fill="currentColor" />
        )}
      </For>
    </svg>
  );
}

export const SlotMap: Component<{
  blobs: saros_pb.FirmwareBlob[];
  slotName: (slot: number) => string;
}> = (props) => {
  const rows = createMemo(() =>
    [...props.blobs]
      .sort((a, b) => a.slot - b.slot)
      .map((b, i) => ({
        b,
        i,
        size: Number(b.sizeBytes ?? 0n),
        name: props.slotName(b.slot) || `slot ${b.slot}`,
      }))
  );
  const total = createMemo(() =>
    Math.max(1, rows().reduce((a, r) => a + r.size, 0))
  );
  const [active, setActive] = createSignal<number | null>(null);
  const pct = (n: number) => ((n / total()) * 100);

  return (
    <div class="rounded-xl border border-line bg-panel p-4 shadow-sm">
      <div class="flex items-baseline justify-between pb-2">
        <div class="text-[10px] font-semibold uppercase tracking-widest text-muted/70">
          Image layout
        </div>
        <div class="font-mono text-[10px] text-muted">
          {rows().length} slot{rows().length === 1 ? "" : "s"} ·{" "}
          {humanSize(totalBlobBytes(props.blobs))}
        </div>
      </div>

      <div class="flex h-9 overflow-hidden rounded-md border border-line/70">
        <For each={rows()}>
          {(r) => (
            <div
              class="min-w-[6px] cursor-default border-r border-panel/60 transition-all last:border-r-0"
              classList={{ [HL]: active() === r.i }}
              style={{
                "flex-grow": Math.max(r.size, 1),
                "flex-basis": "0",
                background: tint(r.i, 55),
              }}
              onMouseEnter={() => setActive(r.i)}
              onMouseLeave={() => setActive(null)}
              title={`${r.name} · ${humanSize(r.b.sizeBytes)}`}
            />
          )}
        </For>
      </div>

      <div class="divide-y divide-line/60 pt-1">
        <For each={rows()}>
          {(r) => (
            <div
              class="flex items-center gap-3 rounded-md px-1.5 py-1.5 transition-colors"
              classList={{ [HL]: active() === r.i }}
              style={{
                background: active() === r.i
                  ? "color-mix(in oklab, var(--color-accent) 12%, var(--color-panel))"
                  : undefined,
              }}
              onMouseEnter={() => setActive(r.i)}
              onMouseLeave={() => setActive(null)}
            >
              <span
                class="size-2.5 shrink-0 rounded-[2px]"
                style={{ background: tint(r.i, 70) }}
              />
              <span class="min-w-0 flex-1 truncate text-sm text-ink">
                {r.name}
                <span class="pl-2 font-mono text-[11px] text-muted/70">
                  {r.b.filename}
                </span>
              </span>
              <span class="shrink-0 font-mono text-[11px] text-muted">
                {humanSize(r.b.sizeBytes)}
              </span>
              <span class="w-10 shrink-0 text-right font-mono text-[11px] text-muted/70">
                {pct(r.size).toFixed(pct(r.size) < 10 ? 1 : 0)}%
              </span>
            </div>
          )}
        </For>
      </div>
    </div>
  );
};

export const ChangelogRail: Component<{
  changes: saros_pb.Change[];
  compact?: boolean;
}> = (props) => {
  return (
    <ul class="space-y-2">
      <For each={props.changes}>
        {(c) => (
          <li class="flex items-start gap-2 text-sm text-ink-2">
            <Chip tone={KIND_TONE[c.kind] ?? "neutral"}>
              {KIND_LABEL[c.kind] ?? "changed"}
            </Chip>
            <span class="leading-snug">{c.description}</span>
          </li>
        )}
      </For>
    </ul>
  );
};

type VersionRailProps = {
  versions: saros_pb.Firmware[];
  selected: string;
  isLatest: (fw: saros_pb.Firmware) => boolean;
  onSelect: (version: string) => void;
};

export const VersionRail: Component<VersionRailProps> = (props) => {
  const [hover, setHover] = createSignal<number | null>(null);
  const selectedIndex = createMemo(() => {
    const i = props.versions.findIndex((v) => v.version === props.selected);
    return i < 0 ? 0 : i;
  });
  const active = () => hover() ?? selectedIndex();
  const last = () => props.versions.length - 1;

  return (
    <div class="flex h-full flex-col rounded-xl border border-line bg-panel p-1.5 shadow-sm">
      <div class="px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-muted/70">
        {props.versions.length} version{props.versions.length === 1 ? "" : "s"}
      </div>
      <div class="flex-1 overflow-y-auto">
        <For each={props.versions}>
          {(fw, i) => {
            const isSel = () => i() === selectedIndex();
            const sec = () => hasSecurity(fw);
            return (
              <button
                type="button"
                onClick={() => props.onSelect(fw.version ?? "")}
                onMouseEnter={() => setHover(i())}
                onMouseLeave={() => setHover(null)}
                class="flex w-full items-stretch gap-2.5 rounded-lg px-2 py-2 text-left transition-colors"
                classList={{
                  "bg-accent/10": isSel(),
                  "hover:bg-panel-2/60": !isSel(),
                }}
              >
                <span class="relative flex w-3 shrink-0 flex-col items-center">
                  <span
                    class="w-px flex-1"
                    classList={{ "opacity-0": i() === 0 }}
                    style={{
                      background: i() <= active()
                        ? "var(--color-accent)"
                        : "var(--color-line)",
                    }}
                  />
                  <span
                    class="z-10 size-3 rounded-full border-2 transition-transform"
                    classList={{ "scale-125": i() === active() }}
                    style={{
                      "border-color": sec()
                        ? "var(--color-danger)"
                        : i() <= active()
                        ? "var(--color-accent)"
                        : "var(--color-line)",
                      background: isSel()
                        ? (sec()
                          ? "var(--color-danger)"
                          : "var(--color-accent)")
                        : "var(--color-surface)",
                    }}
                  />
                  <span
                    class="w-px flex-1"
                    classList={{ "opacity-0": i() === last() }}
                    style={{
                      background: i() < active()
                        ? "var(--color-accent)"
                        : "var(--color-line)",
                    }}
                  />
                </span>
                <span class="min-w-0 flex-1 py-px">
                  <span class="flex items-center gap-1.5">
                    <span
                      class="font-mono text-sm"
                      classList={{
                        "text-accent font-semibold": isSel(),
                        "text-ink": !isSel(),
                      }}
                    >
                      v{fw.version}
                    </span>
                    <Show when={props.isLatest(fw)}>
                      <span class="rounded-sm bg-accent/10 px-1 text-[8.5px] font-semibold uppercase tracking-wide text-accent">
                        latest
                      </span>
                    </Show>
                    <Show when={sec()}>
                      <span class="rounded-sm bg-danger/10 px-1 text-[8.5px] font-semibold uppercase tracking-wide text-danger">
                        sec
                      </span>
                    </Show>
                  </span>
                  <Show when={fw.builtAt} keyed>
                    {(ts) => (
                      <span class="block pt-0.5 font-mono text-[10px] text-muted">
                        {tsDate(ts)}
                      </span>
                    )}
                  </Show>
                </span>
              </button>
            );
          }}
        </For>
      </div>
    </div>
  );
};

type DiffRow = {
  slot: number;
  name: string;
  base?: saros_pb.FirmwareBlob;
  target?: saros_pb.FirmwareBlob;
  status: "same" | "changed" | "added" | "removed";
};

const DIFF_TONE: Record<DiffRow["status"], string> = {
  same: "var(--color-muted)",
  changed: "var(--color-warn)",
  added: "var(--color-accent)",
  removed: "var(--color-danger)",
};

type VersionDiffProps = {
  target: saros_pb.Firmware;
  versions: saros_pb.Firmware[];
  slotName: (slot: number) => string;
};

export const VersionDiff: Component<VersionDiffProps> = (props) => {
  const others = createMemo(() =>
    props.versions
      .filter((v) => v.version !== props.target.version)
      .sort((a, b) => cmpVersions(b.version, a.version))
  );
  const [baseVer, setBaseVer] = createSignal<string>("");
  const base = createMemo(() => {
    const pick = baseVer() ||
      others().find((v) => cmpVersions(v.version, props.target.version) < 0)
        ?.version ||
      others()[0]?.version || "";
    return props.versions.find((v) => v.version === pick);
  });

  const diff = createMemo<DiffRow[]>(() => {
    const b = base();
    if (!b) return [];
    const slots = new Set<number>([
      ...b.blobs.map((x) => x.slot),
      ...props.target.blobs.map((x) => x.slot),
    ]);
    return [...slots].sort((x, y) => x - y).map((slot) => {
      const base = b.blobs.find((x) => x.slot === slot);
      const target = props.target.blobs.find((x) => x.slot === slot);
      const status: DiffRow["status"] = !base
        ? "added"
        : !target
        ? "removed"
        : base.sha256 === target.sha256
        ? "same"
        : "changed";
      return {
        slot,
        name: props.slotName(slot) || `slot ${slot}`,
        base,
        target,
        status,
      };
    });
  });

  const counts = createMemo(() => {
    const c = { same: 0, changed: 0, added: 0, removed: 0 };
    for (const r of diff()) c[r.status]++;
    return c;
  });
  const delta = createMemo(() => {
    const b = base();
    if (!b) return 0;
    return Number(totalBlobBytes(props.target.blobs)) -
      Number(totalBlobBytes(b.blobs));
  });

  return (
    <Show
      when={others().length > 0}
      fallback={
        <p class="font-mono text-[11px] text-muted/70 italic">
          nothing to compare — this is the only release
        </p>
      }
    >
      <div class="space-y-3">
        <div class="flex flex-wrap items-center gap-2 text-sm">
          <span class="text-muted">compare against</span>
          <select
            value={base()?.version ?? ""}
            onChange={(e) => setBaseVer(e.currentTarget.value)}
            class="rounded-md border border-line bg-panel px-2 py-1 font-mono text-xs text-ink focus:border-accent/60 focus:outline-none"
          >
            <For each={others()}>
              {(v) => <option value={v.version}>v{v.version}</option>}
            </For>
          </select>
          <span class="font-mono text-xs text-muted">
            → v{props.target.version}
          </span>
        </div>

        <div class="flex flex-wrap gap-1.5">
          <For
            each={[
              ["changed", counts().changed],
              ["added", counts().added],
              ["removed", counts().removed],
              ["same", counts().same],
            ] as const}
          >
            {([k, n]) => (
              <Show when={n > 0}>
                <span
                  class="inline-flex items-center gap-1.5 rounded-full border border-line px-2 py-0.5 font-mono text-[11px]"
                  style={{ color: DIFF_TONE[k] }}
                >
                  <span
                    class="size-2 rounded-full"
                    style={{ background: DIFF_TONE[k] }}
                  />
                  {n} {k}
                </span>
              </Show>
            )}
          </For>
          <Show when={delta() !== 0}>
            <span class="inline-flex items-center rounded-full border border-line px-2 py-0.5 font-mono text-[11px] text-muted">
              {delta() > 0 ? "+" : "−"}
              {humanSize(Math.abs(delta()))}
            </span>
          </Show>
        </div>

        <div class="divide-y divide-line/60 rounded-lg border border-line bg-panel">
          <For each={diff()}>
            {(r) => (
              <div class="flex items-center gap-3 px-3 py-2">
                <span
                  class="w-16 shrink-0 font-mono text-[10px] uppercase tracking-wide"
                  style={{ color: DIFF_TONE[r.status] }}
                >
                  {r.status}
                </span>
                <div class="flex items-center gap-1.5">
                  <Show
                    when={r.base}
                    fallback={<GlyphGhost />}
                    keyed
                  >
                    {(b) => <MiniGlyph sha256={b.sha256} />}
                  </Show>
                  <span class="text-[11px] text-muted/60">→</span>
                  <Show
                    when={r.target}
                    fallback={<GlyphGhost />}
                    keyed
                  >
                    {(t) => <MiniGlyph sha256={t.sha256} />}
                  </Show>
                </div>
                <span class="min-w-0 flex-1 truncate text-sm text-ink">
                  {r.name}
                </span>
                <span class="shrink-0 font-mono text-[11px] text-muted">
                  {humanSize((r.target ?? r.base)?.sizeBytes)}
                </span>
              </div>
            )}
          </For>
        </div>
      </div>
    </Show>
  );
};

function GlyphGhost() {
  return (
    <span class="grid size-5 place-items-center rounded-[3px] border border-dashed border-line text-[10px] text-muted/50">
      ∅
    </span>
  );
}
