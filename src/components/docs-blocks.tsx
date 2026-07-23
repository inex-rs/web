import {
  type Component,
  createMemo,
  createSignal,
  For,
  type ParentComponent,
  Show,
} from "solid-js";
import { inline } from "./md-inline.tsx";

export const ErrorBox: Component<{ kind: string; err: string }> = (props) => {
  return (
    <div class="rounded-lg border border-danger/40 bg-danger/10 p-3 text-[13px] text-ink-2">
      <span class="font-mono text-danger">{props.kind}</span> — could not parse:
      {" "}
      {props.err}
    </div>
  );
};

export const HUES = [265, 192, 28, 330, 152, 90, 220];
export const tint = (i: number, pct = 55) =>
  `color-mix(in oklab, oklch(72% 0.13 ${
    HUES[i % HUES.length]
  }) ${pct}%, var(--color-panel))`;

export const HL = "ring-2 ring-inset ring-accent/70";

const Caption: ParentComponent = (props) => {
  return (
    <div class="mt-2 text-[11px] leading-snug text-muted">{props.children}</div>
  );
};

const Title: ParentComponent = (props) => {
  return (
    <div class="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted/70">
      {props.children}
    </div>
  );
};

type FigureSpec = {
  src?: string;
  alt?: string;
  caption?: string;
  images?: { src: string; alt?: string; caption?: string }[];
};

function imgSrc(src: string): string | null {
  if (/(^https?:)|(:\/\/)|(^data:)/i.test(src)) return null;
  return src.startsWith("/") ? src : `/img/devkits/${src}`;
}

const Fig: Component<{ src: string; alt?: string; caption?: string }> = (
  props,
) => {
  const url = imgSrc(props.src);
  if (!url) return <ErrorBox kind="figure" err={`unsafe src: ${props.src}`} />;
  return (
    <figure class="m-0">
      <img
        src={url}
        alt={props.alt ?? props.caption ?? ""}
        loading="lazy"
        class="mx-auto max-h-[420px] w-auto rounded-lg border border-line bg-panel/40 object-contain"
      />
      <Show when={props.caption}>
        <figcaption class="mt-2 text-center text-[11px] leading-snug text-muted">
          {inline(props.caption!)}
        </figcaption>
      </Show>
    </figure>
  );
};

export const Figure: Component<{ body: string }> = (props) => {
  const spec = JSON.parse(props.body) as FigureSpec;
  if (spec.images?.length) {
    return (
      <div class="grid gap-3 sm:grid-cols-2">
        <For each={spec.images}>
          {(im) => <Fig src={im.src} alt={im.alt} caption={im.caption} />}
        </For>
      </div>
    );
  }
  if (!spec.src) return <ErrorBox kind="figure" err="missing src" />;
  return <Fig src={spec.src} alt={spec.alt} caption={spec.caption} />;
};

type BitFieldSpec = {
  title?: string;
  width: number;
  unit?: "bit" | "byte";
  value?: string;
  note?: string;
  fields: {
    bits?: string;
    bytes?: number;
    name: string;
    desc?: string;
  }[];
};

function bitRange(spec: string): [hi: number, lo: number] {
  const [a, b] = spec.split(":").map((s) => parseInt(s.trim(), 10));
  return Number.isFinite(b) ? [a, b] : [a, a];
}

export const BitField: Component<{ body: string }> = (props) => {
  const spec = JSON.parse(props.body) as BitFieldSpec;
  const byteMode = spec.unit === "byte";

  const [val, setVal] = createSignal(spec.value ?? "");
  const parsed = createMemo(() => {
    if (!spec.value) return null;
    const raw = val().trim() || "0";
    return /^([+-]?\d+|0[xX][\da-fA-F]+|0[oO][0-7]+|0[bB][01]+)$/.test(raw)
      ? BigInt(raw)
      : null;
  });
  const [hover, setHover] = createSignal<number | null>(null);

  const segments = createMemo(() => {
    if (byteMode) return [];
    const fs = spec.fields.map((f, i) => {
      const [hi, lo] = bitRange(f.bits ?? "0");
      return { ...f, hi, lo, i };
    }).sort((a, b) => b.hi - a.hi);
    const out: (typeof fs[number] & { reserved?: boolean })[] = [];
    let cur = spec.width - 1;
    for (const f of fs) {
      if (f.hi < cur) {
        out.push({ hi: cur, lo: f.hi + 1, name: "—", i: -1, reserved: true });
      }
      out.push(f);
      cur = f.lo - 1;
    }
    if (cur >= 0) {
      out.push({ hi: cur, lo: 0, name: "—", i: -1, reserved: true });
    }
    return out;
  });

  const extract = (hi: number, lo: number) => {
    const v = parsed();
    if (v === null) return null;
    const w = BigInt(hi - lo + 1);
    return (v >> BigInt(lo)) & ((1n << w) - 1n);
  };

  return (
    <div class="rounded-lg border border-line bg-panel/40 p-3">
      <Show when={spec.title}>
        <Title>{spec.title}</Title>
      </Show>

      <Show
        when={!byteMode}
        fallback={
          <div class="overflow-x-auto">
            <div class="flex min-w-max gap-1">
              <For each={spec.fields}>
                {(f, i) => {
                  const offset = () =>
                    spec.fields.slice(0, i()).reduce(
                      (a, x) => a + (x.bytes ?? 1),
                      0,
                    );
                  return (
                    <div
                      class="flex flex-col"
                      onMouseEnter={() => setHover(i())}
                      onMouseLeave={() => setHover(null)}
                    >
                      <div
                        class="flex overflow-hidden rounded-md border border-line/70 transition-all"
                        classList={{ [HL]: hover() === i() }}
                        style={{ background: tint(i(), 46) }}
                      >
                        <For each={Array.from({ length: f.bytes ?? 1 })}>
                          {(_, b) => (
                            <div class="grid h-8 w-8 place-items-center border-r border-line/40 font-mono text-[10px] text-ink/50 last:border-r-0">
                              {offset() + b()}
                            </div>
                          )}
                        </For>
                      </div>
                      <div class="truncate px-1 pt-1 text-center text-[10px] font-medium text-ink-2">
                        {f.name}
                      </div>
                    </div>
                  );
                }}
              </For>
            </div>
          </div>
        }
      >
        <div class="flex overflow-hidden rounded-md border border-line/70">
          <For each={segments()}>
            {(s) => (
              <div
                class={`min-w-[1.6rem] border-r border-line/50 last:border-r-0 px-1 py-1.5 text-center transition-all ${
                  s.reserved ? "text-muted/60" : "text-ink cursor-default"
                } ${hover() === s.i && s.i >= 0 ? HL : ""}`}
                style={{
                  "flex-grow": s.hi - s.lo + 1,
                  "flex-basis": "0",
                  background: s.reserved ? "var(--color-panel-2)" : tint(s.i),
                }}
                onMouseEnter={() => setHover(s.i)}
                onMouseLeave={() => setHover(null)}
              >
                <div class="font-mono text-[9px] text-ink/50">
                  {s.hi === s.lo ? s.hi : `${s.hi}:${s.lo}`}
                </div>
                <div class="truncate text-[10.5px] font-medium leading-tight">
                  {s.name}
                </div>
              </div>
            )}
          </For>
        </div>
      </Show>

      <Show when={!byteMode && spec.value}>
        <div class="mt-3 flex items-center gap-2 text-[13px]">
          <span class="text-muted">decode</span>
          <input
            value={val()}
            onInput={(e) => setVal(e.currentTarget.value)}
            spellcheck={false}
            autocomplete="off"
            class={`w-40 rounded-md border bg-panel px-2 py-1 font-mono text-[12px] outline-none focus:border-accent/60 ${
              parsed() === null ? "border-danger/60" : "border-line"
            }`}
          />
          <Show when={parsed() === null}>
            <span class="text-[11px] text-danger">not a number</span>
          </Show>
        </div>
      </Show>

      <div class="mt-3 space-y-1">
        <For each={spec.fields}>
          {(f, i) => {
            const [hi, lo] = byteMode ? [0, 0] : bitRange(f.bits ?? "0");
            const v = () => (byteMode ? null : extract(hi, lo));
            return (
              <Show when={f.name !== "—"}>
                <div
                  class="flex items-baseline gap-2 rounded px-1 text-[12.5px] transition-colors"
                  classList={{ "bg-accent/10": hover() === i() }}
                  onMouseEnter={() => setHover(i())}
                  onMouseLeave={() => setHover(null)}
                >
                  <span
                    class="mt-1.5 size-2.5 shrink-0 rounded-[3px]"
                    style={{ background: tint(i()) }}
                  />
                  <span class="font-mono text-[11px] text-muted">
                    {byteMode
                      ? `+${f.bytes}B`
                      : hi === lo
                      ? `[${hi}]`
                      : `[${hi}:${lo}]`}
                  </span>
                  <span class="font-medium text-ink">{f.name}</span>
                  <Show when={f.desc}>
                    <span class="text-ink-2">— {f.desc}</span>
                  </Show>
                  <Show when={v() !== null}>
                    <span class="ml-auto shrink-0 font-mono text-[11px] text-accent">
                      {`0x${v()!.toString(16).toUpperCase()}`}
                      <span class="text-muted">{` (${v()!.toString()})`}</span>
                    </span>
                  </Show>
                </div>
              </Show>
            );
          }}
        </For>
      </div>
      <Show when={spec.note}>
        <Caption>{spec.note}</Caption>
      </Show>
    </div>
  );
};

type SeqMsg =
  | { kind: "msg"; from: number; to: number; text: string; dashed: boolean }
  | { kind: "note"; a: number; b: number; text: string };

function parseSeq(body: string) {
  const lines = body.split("\n").map((l) => l.trim()).filter(Boolean);
  const parts: string[] = [];
  const idx = (name: string) => {
    const n = name.trim();
    let i = parts.indexOf(n);
    if (i < 0) {
      parts.push(n);
      i = parts.length - 1;
    }
    return i;
  };
  const rows: SeqMsg[] = [];
  for (const line of lines) {
    if (line.startsWith("@")) {
      for (const p of line.slice(1).split(",")) idx(p);
      continue;
    }
    const note = line.match(/^note\s+([^:]+):\s*(.*)$/i);
    if (note) {
      const cols = note[1].split(",").map(idx);
      rows.push({
        kind: "note",
        a: Math.min(...cols),
        b: Math.max(...cols),
        text: note[2],
      });
      continue;
    }
    const m = line.match(/^(.+?)\s*(-->|->)\s*(.+?)\s*:\s*(.*)$/);
    if (m) {
      rows.push({
        kind: "msg",
        from: idx(m[1]),
        to: idx(m[3]),
        text: m[4],
        dashed: m[2] === "-->",
      });
    }
  }
  return { parts, rows };
}

export const Sequence: Component<{ body: string }> = (props) => {
  const { parts, rows } = parseSeq(props.body);
  if (parts.length < 1 || !rows.length) {
    return (
      <ErrorBox kind="seq" err="need @participants and at least one message" />
    );
  }
  const n = parts.length;
  const cx = (i: number) => ((i + 0.5) / n) * 100;
  const [hov, setHov] = createSignal<number | null>(null);
  const activeMsg = () => {
    const h = hov();
    const r = h === null ? null : rows[h];
    return r && r.kind === "msg" ? r : null;
  };

  return (
    <div class="rounded-lg border border-line bg-panel/40 p-3">
      <div class="flex">
        <For each={parts}>
          {(p, i) => (
            <div
              class="truncate rounded-md bg-panel-2 px-1 py-1 text-center text-[11px] font-medium text-ink transition-all"
              classList={{
                [HL]: activeMsg()?.from === i() || activeMsg()?.to === i(),
              }}
              style={{ width: `${100 / n}%` }}
            >
              {p}
            </div>
          )}
        </For>
      </div>

      <div class="relative mt-1">
        <For each={parts}>
          {(_, i) => (
            <div
              class="absolute top-0 bottom-0 w-px bg-line"
              style={{ left: `${cx(i())}%` }}
            />
          )}
        </For>
        <For each={rows}>
          {(r, i) => (
            <Show
              when={r.kind === "msg"}
              fallback={(() => {
                const nt = r as Extract<SeqMsg, { kind: "note" }>;
                return (
                  <div class="relative py-2">
                    <div
                      class="mx-auto rounded-md border border-accent/25 bg-accent/10 px-2 py-1 text-center text-[11px] text-ink-2"
                      style={{
                        "margin-left": `${(nt.a / n) * 100}%`,
                        width: `${((nt.b - nt.a + 1) / n) * 100}%`,
                      }}
                    >
                      {nt.text}
                    </div>
                  </div>
                );
              })()}
            >
              {(() => {
                const m = r as Extract<SeqMsg, { kind: "msg" }>;
                const left = Math.min(cx(m.from), cx(m.to));
                const width = Math.abs(cx(m.to) - cx(m.from));
                const right = m.to > m.from;
                const self = m.from === m.to;
                const on = () => hov() === i();
                const col = () =>
                  on() ? "var(--color-accent)" : "var(--color-muted)";
                return (
                  <div
                    class="relative h-9 rounded transition-colors"
                    classList={{ "bg-accent/10": on() }}
                    onMouseEnter={() => setHov(i())}
                    onMouseLeave={() => setHov(null)}
                  >
                    <div
                      class="absolute top-0 -translate-x-1/2 whitespace-nowrap px-1 font-mono text-[10.5px] transition-colors"
                      classList={{
                        "text-accent font-medium": on(),
                        "text-ink-2": !on(),
                      }}
                      style={{ left: `${(cx(m.from) + cx(m.to)) / 2}%` }}
                    >
                      {m.text}
                    </div>
                    <Show
                      when={!self}
                      fallback={
                        <div
                          class="absolute top-6 h-3 w-6 rounded-r-full border border-l-0"
                          style={{
                            left: `${cx(m.from)}%`,
                            "border-color": col(),
                          }}
                        />
                      }
                    >
                      <div
                        class={`absolute top-6 h-px ${
                          m.dashed ? "border-t border-dashed" : ""
                        }`}
                        style={{
                          left: `${left}%`,
                          width: `${width}%`,
                          ...(m.dashed
                            ? { "border-top-color": col() }
                            : { background: col() }),
                        }}
                      />
                      <div
                        class="absolute size-0 border-y-[4px] border-y-transparent"
                        style={{
                          left: `${cx(m.to)}%`,
                          top: "calc(1.5rem - 4px)",
                          transform: right ? "translateX(-6px)" : "none",
                          ...(right
                            ? { "border-left": `6px solid ${col()}` }
                            : { "border-right": `6px solid ${col()}` }),
                        }}
                      />
                      <div
                        class="absolute top-[calc(1.5rem-3px)] size-1.5 rounded-full"
                        style={{
                          left: `${cx(m.from)}%`,
                          transform: "translateX(-50%)",
                          background: col(),
                        }}
                      />
                    </Show>
                  </div>
                );
              })()}
            </Show>
          )}
        </For>
      </div>
    </div>
  );
};

type MemRow = {
  at: string;
  at2?: string;
  end?: string;
  name: string;
  type?: string;
  size?: string;
  desc?: string;
  muted?: boolean;
  children?: MemRow[];
};
type MemSide = { label?: string; space?: string; rows: MemRow[] };
type MemMapSpec = {
  title?: string;
  note?: string;
  key?: string;
  view?: "map" | "table" | "bytes";
  space?: string;
  alias?: string;
  occupancy?: boolean;
  rows?: MemRow[];
  regions?: MemRow[];
  compare?: { left: MemSide; right: MemSide };
};

const clampN = (n: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, n));
const numFrom = (s?: string): number => {
  const m = s?.match(/0x[0-9a-fA-F]+|\d+/);
  return m ? Number(m[0]) : NaN;
};
const sizeFrom = (s?: string): number => {
  const m = s?.trim().match(
    /^(0x[0-9a-fA-F]+|\d+)(?:\s*(?:ea\.?|bytes?|B))?$/i,
  );
  return m ? Number(m[1]) : NaN;
};
const typeBytes = (t?: string): number => {
  const m = t?.match(/(8|16|32|64)/);
  return m ? Number(m[1]) / 8 : NaN;
};
const hx = (n: number) => `0x${n.toString(16).toUpperCase()}`;
const human = (b: number): string =>
  b >= 0x100000 && b % 0x100000 === 0
    ? `${b / 0x100000} MB`
    : b >= 0x400 && b % 0x400 === 0
    ? `${b / 0x400} KB`
    : `${b} B`;
const alignOf = (n: number) => n > 0 && n < 2 ** 31 ? (n & -n) : 0;

function autoView(rows: MemRow[]): "map" | "table" {
  const allNum = rows.length > 0 &&
    rows.every((r) => Number.isFinite(numFrom(r.at)));
  const someSize = rows.some((r) => Number.isFinite(sizeFrom(r.size)));
  return allNum && someSize ? "map" : "table";
}

export const MemMap: Component<{ body: string }> = (props) => {
  const spec = JSON.parse(props.body) as MemMapSpec;
  if (spec.compare) return <CompareView spec={spec} />;
  const rows = spec.rows ?? spec.regions ?? [];
  const view = spec.view ?? (spec.space ? "map" : autoView(rows));
  return (
    <div class="rounded-lg border border-line bg-panel/40 p-3">
      <Show when={spec.title}>
        <Title>{spec.title}</Title>
      </Show>
      <Show when={view === "map"}>
        <SpatialMap
          rows={rows}
          space={spec.space}
          alias={spec.alias}
          occupancy={spec.occupancy}
        />
      </Show>
      <Show when={view === "bytes"}>
        <ByteStrip rows={rows} keyLabel={spec.key} />
      </Show>
      <Show when={view === "table"}>
        <MemTable rows={rows} keyLabel={spec.key} />
      </Show>
      <Show when={spec.note}>
        <Caption>{spec.note}</Caption>
      </Show>
    </div>
  );
};

function MemTable(props: {
  rows: MemRow[];
  keyLabel?: string;
  active?: () => string | null;
  onActive?: (n: string | null) => void;
}) {
  const [hover, setHover] = createSignal<number | null>(null);
  const hasType = props.rows.some((r) => r.type);
  const hasSize = props.rows.some((r) => r.size);
  return (
    <div class="overflow-x-auto rounded-md border border-line/70">
      <table class="w-full border-collapse font-mono text-[12px]">
        <Show when={props.keyLabel}>
          <thead>
            <tr class="bg-panel-2/40 text-[9.5px] uppercase tracking-wider text-muted/70">
              <th class="px-2.5 py-1 text-left font-medium">
                {props.keyLabel}
              </th>
              <Show when={hasType}>
                <th class="px-2 py-1 text-left font-medium">type</th>
              </Show>
              <th class="px-2.5 py-1 text-left font-medium" />
              <Show when={hasSize}>
                <th class="px-2.5 py-1 text-right font-medium">size</th>
              </Show>
            </tr>
          </thead>
        </Show>
        <tbody>
          <For each={props.rows}>
            {(r, i) => (
              <tr
                class="border-b border-line/50 last:border-0 transition-colors"
                style={{
                  background: hover() === i() || props.active?.() === r.name
                    ? "color-mix(in oklab, var(--color-accent) 14%, var(--color-panel))"
                    : r.muted
                    ? undefined
                    : tint(i(), 18),
                }}
                onMouseEnter={() => {
                  setHover(i());
                  props.onActive?.(r.name);
                }}
                onMouseLeave={() => {
                  setHover(null);
                  props.onActive?.(null);
                }}
              >
                <td class="whitespace-nowrap border-r border-line/50 bg-panel-2/50 px-2.5 py-1.5 align-top text-muted">
                  {r.at}
                </td>
                <Show when={hasType}>
                  <td class="whitespace-nowrap px-2 py-1.5 align-top text-muted/70">
                    {r.type}
                  </td>
                </Show>
                <td class="w-full px-2.5 py-1.5 align-top font-sans">
                  <span
                    class={r.muted
                      ? "italic text-muted/70"
                      : "font-medium text-ink"}
                  >
                    {inline(r.name)}
                  </span>
                  <Show when={r.desc}>
                    <span class="text-ink-2">— {inline(r.desc!)}</span>
                  </Show>
                </td>
                <Show when={hasSize}>
                  <td class="whitespace-nowrap px-2.5 py-1.5 text-right align-top text-muted">
                    {r.size}
                  </td>
                </Show>
              </tr>
            )}
          </For>
        </tbody>
      </table>
    </div>
  );
}

type Laid = { row: MemRow; start: number; end: number };
function layout(rows: MemRow[], space?: string): {
  laid: Laid[];
  lo: number;
  hi: number;
  span: number;
} {
  const spaceEnd = numFrom(space);
  const laid: Laid[] = rows.map((row) => ({
    row,
    start: numFrom(row.at),
    end: NaN,
  }));
  for (let i = 0; i < laid.length; i++) {
    const cur = laid[i];
    const next = laid[i + 1];
    const sz = sizeFrom(cur.row.size);
    let end = numFrom(cur.row.end);
    if (!Number.isFinite(end) && Number.isFinite(sz)) end = cur.start + sz;
    if (!Number.isFinite(end) && next && Number.isFinite(next.start)) {
      end = next.start;
    }
    if (!Number.isFinite(end) && Number.isFinite(spaceEnd)) end = spaceEnd;
    cur.end = Number.isFinite(end) ? Math.max(end, cur.start) : cur.start;
  }
  const lo = Math.min(...laid.map((l) => l.start));
  const hi = Math.max(
    Number.isFinite(spaceEnd) ? spaceEnd : lo,
    ...laid.map((l) => l.end),
  );
  return { laid, lo, hi, span: Math.max(1, hi - lo) };
}

const HATCH =
  "repeating-linear-gradient(45deg, var(--color-panel-2), var(--color-panel-2) 5px, transparent 5px, transparent 11px)";

function SpatialMap(props: {
  rows: MemRow[];
  space?: string;
  alias?: string;
  occupancy?: boolean;
  hl?: () => string | null;
  onHl?: (n: string | null) => void;
}) {
  const L = createMemo(() => layout(props.rows, props.space));
  const [hover, setHover] = createSignal<number | null>(null);
  const [open, setOpen] = createSignal<Set<number>>(new Set());
  const toggle = (i: number) =>
    setOpen((s) => {
      const n = new Set(s);
      n.has(i) ? n.delete(i) : n.add(i);
      return n;
    });
  const heightOf = (l: Laid) =>
    l.row.muted
      ? 26
      : clampN(Math.round(((l.end - l.start) / L().span) * 380), 34, 130);
  const used = () =>
    L().laid.filter((l) => !l.row.muted).reduce(
      (a, l) => a + (l.end - l.start),
      0,
    );

  return (
    <div>
      <Show when={props.occupancy !== false}>
        <div class="mb-2 flex items-center gap-2 text-[10.5px] text-muted">
          <span class="shrink-0">
            {Math.round((used() / L().span) * 100)}% provisioned
          </span>
          <div class="h-1.5 flex-1 overflow-hidden rounded-full bg-panel-2">
            <div
              class="h-full rounded-full bg-accent/60"
              style={{ width: `${(used() / L().span) * 100}%` }}
            />
          </div>
          <span class="shrink-0 font-mono">{human(L().span)}</span>
        </div>
      </Show>

      <div class="flex gap-1.5">
        <div class="flex-1 overflow-hidden rounded-md border border-line/70">
          <For each={L().laid}>
            {(l, i) => (
              <>
                <div
                  class="flex border-b border-line/50 last:border-b-0"
                  style={{ height: `${heightOf(l)}px` }}
                  onMouseEnter={() => {
                    setHover(i());
                    props.onHl?.(l.row.name);
                  }}
                  onMouseLeave={() => {
                    setHover(null);
                    props.onHl?.(null);
                  }}
                >
                  <div
                    class="shrink-0 border-r border-line/50 bg-panel-2/50 px-2 pt-1 font-mono text-[10px] text-muted"
                    classList={{
                      "w-[4.5rem]": !l.row.at2,
                      "w-[6.5rem]": !!l.row.at2,
                    }}
                  >
                    <div>{l.row.at}</div>
                    <Show when={l.row.at2}>
                      <div class="text-[9px] text-muted/60">{l.row.at2}</div>
                    </Show>
                  </div>
                  <div
                    class="relative flex flex-1 items-center justify-between gap-2 px-3 transition-all"
                    classList={{
                      [HL]: hover() === i() || props.hl?.() === l.row.name,
                    }}
                    style={{
                      background: l.row.muted ? HATCH : tint(i(), 46),
                    }}
                  >
                    <span class="truncate text-[12px]">
                      <Show
                        when={!l.row.muted}
                        fallback={
                          <span class="italic text-muted/70">⋯ empty</span>
                        }
                      >
                        <Show when={l.row.children}>
                          <button
                            type="button"
                            onClick={() => toggle(i())}
                            class="mr-1 text-muted/60 hover:text-ink cursor-pointer"
                          >
                            {open().has(i()) ? "▾" : "▸"}
                          </button>
                        </Show>
                        <span class="font-medium text-ink">
                          {inline(l.row.name)}
                        </span>
                      </Show>
                    </span>
                    <span class="shrink-0 font-mono text-[10px] text-muted">
                      {l.row.muted && !l.row.name
                        ? ""
                        : (l.row.size ?? human(l.end - l.start))}
                    </span>
                  </div>
                </div>
                <Show when={l.row.children && open().has(i())}>
                  <div class="border-b border-line/50 bg-panel/25 py-2 pr-2 pl-6">
                    <SpatialMap
                      rows={l.row.children!}
                      space={hx(l.end - l.start)}
                    />
                  </div>
                </Show>
              </>
            )}
          </For>
        </div>

        <Show when={props.alias}>
          <div class="flex w-6 shrink-0 items-center justify-center rounded-md border border-dashed border-line text-muted">
            <span class="[writing-mode:vertical-rl] rotate-180 whitespace-nowrap text-[9.5px] tracking-wide">
              mirrored → {props.alias}
            </span>
          </div>
        </Show>
      </div>

      <div class="mt-2 h-4 font-mono text-[11px] text-muted">
        <Show when={hover() !== null}>
          {(() => {
            const l = L().laid[hover()!];
            const sz = l.end - l.start;
            const al = alignOf(l.start);
            return (
              <span class="flex flex-wrap gap-x-3">
                <span>{l.row.at}–{hx(l.end)}</span>
                <span>{human(sz)} ({sz.toLocaleString()} B)</span>
                <span>{((sz / L().span) * 100).toFixed(1)}%</span>
                <Show when={al}>
                  <span>{human(al)}-aligned</span>
                </Show>
              </span>
            );
          })()}
        </Show>
      </div>
    </div>
  );
}

function ByteStrip(props: { rows: MemRow[]; keyLabel?: string }) {
  const widthOf = (r: MemRow) => {
    const t = typeBytes(r.type);
    if (Number.isFinite(t)) return t;
    const s = sizeFrom(r.size);
    return Number.isFinite(s) ? s : 1;
  };
  const total = () => props.rows.reduce((a, r) => a + widthOf(r), 0);
  const [active, setActive] = createSignal<string | null>(null);
  return (
    <div>
      <div class="flex overflow-hidden rounded-md border border-line/70">
        <For each={props.rows}>
          {(r, i) => (
            <div
              class="min-w-[2.2rem] border-r border-line/50 px-1 py-2 text-center transition-all last:border-r-0"
              classList={{ [HL]: active() === r.name }}
              style={{
                "flex-grow": widthOf(r),
                "flex-basis": "0",
                background: tint(i(), 46),
              }}
              title={`${r.at} · ${widthOf(r)}B`}
              onMouseEnter={() => setActive(r.name)}
              onMouseLeave={() => setActive(null)}
            >
              <div class="truncate text-[10px] font-medium text-ink">
                {inline(r.name)}
              </div>
              <div class="font-mono text-[9px] text-muted">
                {r.type ?? `${widthOf(r)}B`}
              </div>
            </div>
          )}
        </For>
      </div>
      <div class="mt-1 flex justify-between font-mono text-[9px] text-muted/70">
        <span>{props.rows[0]?.at}</span>
        <span>{total()} bytes</span>
      </div>
      <div class="mt-2">
        <MemTable
          rows={props.rows}
          keyLabel={props.keyLabel}
          active={active}
          onActive={setActive}
        />
      </div>
    </div>
  );
}

function CompareView(props: { spec: MemMapSpec }) {
  const { left, right } = props.spec.compare!;
  const [hl, setHl] = createSignal<string | null>(null);
  const side = (s: MemSide) => (
    <div class="min-w-0 flex-1">
      <Show when={s.label}>
        <div class="mb-1 text-[11px] font-semibold text-ink">{s.label}</div>
      </Show>
      <SpatialMap
        rows={s.rows}
        space={s.space}
        hl={hl}
        onHl={setHl}
      />
    </div>
  );
  return (
    <div class="rounded-lg border border-line bg-panel/40 p-3">
      <Show when={props.spec.title}>
        <Title>{props.spec.title}</Title>
      </Show>
      <div class="flex gap-4">
        {side(left)}
        {side(right)}
      </div>
      <Show when={props.spec.note}>
        <Caption>{props.spec.note}</Caption>
      </Show>
    </div>
  );
}

type HeatSpec = {
  title?: string;
  note?: string;
  bands: { label: string; pct: number; note?: string }[];
};

export const Heatmap: Component<{ body: string }> = (props) => {
  const spec = JSON.parse(props.body) as HeatSpec;
  const [hov, setHov] = createSignal<number | null>(null);
  const heat = (pct: number) =>
    `color-mix(in oklab, oklch(65% 0.2 25) ${
      Math.max(6, pct)
    }%, var(--color-panel-2))`;
  return (
    <div class="rounded-lg border border-line bg-panel/40 p-3">
      <Show when={spec.title}>
        <Title>{spec.title}</Title>
      </Show>
      <div class="space-y-1.5">
        <For each={spec.bands}>
          {(b, i) => (
            <div
              class="flex items-center gap-3 rounded transition-colors"
              classList={{ "bg-accent/10": hov() === i() }}
              onMouseEnter={() => setHov(i())}
              onMouseLeave={() => setHov(null)}
            >
              <div
                class="w-40 shrink-0 truncate text-right text-[12px] transition-colors"
                classList={{
                  "text-ink font-medium": hov() === i(),
                  "text-ink-2": hov() !== i(),
                }}
              >
                {b.label}
              </div>
              <div
                class="relative h-6 flex-1 overflow-hidden rounded-md border border-line/60 transition-all"
                classList={{ [HL]: hov() === i() }}
                style={{ background: heat(b.pct) }}
              >
                <span class="absolute inset-0 grid place-items-center font-mono text-[11px] font-medium text-ink">
                  {b.pct}% differ
                </span>
              </div>
              <Show when={b.note}>
                <span class="w-28 shrink-0 text-[10.5px] leading-tight text-muted">
                  {b.note}
                </span>
              </Show>
            </div>
          )}
        </For>
      </div>
      <Show when={spec.note}>
        <Caption>{spec.note}</Caption>
      </Show>
    </div>
  );
};

type DiagramSpec = {
  title?: string;
  note?: string;
  hub: { label: string; sub?: string };
  spokes: { label: string; via?: string; sub?: string }[];
};

export const Diagram: Component<{ body: string }> = (props) => {
  const spec = JSON.parse(props.body) as DiagramSpec;
  const [hov, setHov] = createSignal<number | null>(null);
  return (
    <div class="rounded-lg border border-line bg-panel/40 p-3">
      <Show when={spec.title}>
        <Title>{spec.title}</Title>
      </Show>
      <div
        class="grid items-center gap-x-2 gap-y-2"
        style={{ "grid-template-columns": "auto 1fr auto" }}
      >
        <div
          class="grid place-content-center rounded-lg border border-accent/40 bg-accent/10 px-3 py-2 text-center"
          style={{
            "grid-row": `1 / ${spec.spokes.length + 1}`,
            "grid-column": "1",
          }}
        >
          <div class="text-[12px] font-semibold text-ink">{spec.hub.label}</div>
          <Show when={spec.hub.sub}>
            <div class="font-mono text-[10px] text-muted">{spec.hub.sub}</div>
          </Show>
        </div>
        <For each={spec.spokes}>
          {(s, i) => (
            <>
              <div
                class="relative flex items-center"
                style={{ "grid-row": `${i() + 1}`, "grid-column": "2" }}
                onMouseEnter={() => setHov(i())}
                onMouseLeave={() => setHov(null)}
              >
                <div
                  class="h-px w-full transition-colors"
                  classList={{
                    "bg-accent": hov() === i(),
                    "bg-line": hov() !== i(),
                  }}
                />
                <div
                  class="absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap bg-panel/40 px-1 font-mono text-[9.5px] transition-colors"
                  classList={{
                    "text-accent": hov() === i(),
                    "text-muted": hov() !== i(),
                  }}
                >
                  {s.via}
                </div>
                <span
                  class="absolute right-0 -translate-y-1/2 text-[11px] leading-none transition-colors"
                  classList={{
                    "text-accent": hov() === i(),
                    "text-line": hov() !== i(),
                  }}
                >
                  ▸
                </span>
              </div>
              <div
                class="rounded-md border border-line px-3 py-1.5 text-[12px] transition-shadow"
                classList={{ [HL]: hov() === i() }}
                style={{
                  "grid-row": `${i() + 1}`,
                  "grid-column": "3",
                  background: tint(i(), 34),
                }}
                onMouseEnter={() => setHov(i())}
                onMouseLeave={() => setHov(null)}
              >
                <div class="font-medium text-ink">{s.label}</div>
                <Show when={s.sub}>
                  <div class="font-mono text-[10px] text-muted">{s.sub}</div>
                </Show>
              </div>
            </>
          )}
        </For>
      </div>
      <Show when={spec.note}>
        <Caption>{spec.note}</Caption>
      </Show>
    </div>
  );
};
