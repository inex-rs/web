import { barSegments } from "../components/logo-geometry.ts";

export type OgCardOpts = {
  title?: string;
  subtitle?: string;
  kind?: string;
};

const W = 1200, H = 630;

const hex = (s: string) => [
  parseInt(s.slice(1, 3), 16),
  parseInt(s.slice(3, 5), 16),
  parseInt(s.slice(5, 7), 16),
];
const BG = hex("#faf8f4"), INK = hex("#7c3aed");
const FAINT = [hex("#e9e3f7"), hex("#ded6f2")];
const mix = (a: number[], b: number[], t: number) =>
  a.map((v, i) => Math.round(v + (b[i] - v) * t));
const MUTED = mix(INK, BG, 0.45);

const FONT: Record<string, string[]> = {
  a: [".11.", "...1", ".111", "1..1", ".111"],
  b: ["1...", "1...", "111.", "1..1", "111."],
  c: [".111", "1...", "1...", "1...", ".111"],
  d: ["...1", "...1", ".111", "1..1", ".111"],
  e: [".11.", "1..1", "1111", "1...", ".111"],
  f: [".11", "1..", "111", "1..", "1.."],
  g: [".111", "1..1", ".111", "...1", "111."],
  h: ["1...", "1...", "111.", "1..1", "1..1"],
  i: ["1", ".", "1", "1", "1"],
  j: ["..1", "...", "..1", "..1", "11."],
  k: ["1...", "1.1.", "11..", "1.1.", "1..1"],
  l: ["1", "1", "1", "1", "1"],
  m: ["11.1.", "1.1.1", "1.1.1", "1.1.1", "1.1.1"],
  n: ["111.", "1..1", "1..1", "1..1", "1..1"],
  o: [".11.", "1..1", "1..1", "1..1", ".11."],
  p: ["111.", "1..1", "111.", "1...", "1..."],
  q: [".111", "1..1", ".111", "...1", "...1"],
  r: ["1.1", "11.", "1..", "1..", "1.."],
  s: [".111", "1...", ".11.", "...1", "111."],
  t: ["1..", "111", "1..", "1..", ".11"],
  u: ["1..1", "1..1", "1..1", "1..1", ".111"],
  v: ["1.1", "1.1", "1.1", "1.1", ".1."],
  w: ["1.1.1", "1.1.1", "1.1.1", "1.1.1", ".1.1."],
  x: ["1..1", "1..1", ".11.", "1..1", "1..1"],
  y: ["1..1", "1..1", ".111", "...1", "111."],
  z: ["1111", "..1.", ".1..", "1...", "1111"],
  "0": [".11.", "1..1", "1..1", "1..1", ".11."],
  "1": [".1.", "11.", ".1.", ".1.", "111"],
  "2": ["111.", "...1", ".11.", "1...", "1111"],
  "3": ["111.", "...1", ".11.", "...1", "111."],
  "4": ["1..1", "1..1", "1111", "...1", "...1"],
  "5": ["1111", "1...", "111.", "...1", "111."],
  "6": [".111", "1...", "111.", "1..1", ".11."],
  "7": ["1111", "...1", "..1.", ".1..", ".1.."],
  "8": [".11.", "1..1", ".11.", "1..1", ".11."],
  "9": [".11.", "1..1", ".111", "...1", "111."],
  " ": ["..", "..", "..", "..", ".."],
  ".": [".", ".", ".", ".", "1"],
  ",": ["..", "..", "..", ".1", "1."],
  "-": ["...", "...", "111", "...", "..."],
  ":": [".", "1", ".", "1", "."],
  "/": ["...1", "..1.", "..1.", ".1..", "1..."],
  "+": ["...", ".1.", "111", ".1.", "..."],
  "·": [".", ".", "1", ".", "."],
  "&": [".1..", "1.1.", ".1..", "1.11", ".11."],
};

function glyphs(text: string): string[][] {
  return [...text.toLowerCase()].map((c) =>
    FONT[c] ?? FONT[c === "—" ? "-" : ""]
  )
    .filter((g): g is string[] => !!g);
}

function measure(text: string): number {
  const gs = glyphs(text);
  return gs.reduce((a, g) => a + g[0].length, 0) + Math.max(0, gs.length - 1);
}

function fill(
  px: Uint8Array,
  x: number,
  y: number,
  w: number,
  h: number,
  c: number[],
) {
  for (let yy = y; yy < y + h; yy++) {
    for (let xx = x; xx < x + w; xx++) {
      const o = (yy * W + xx) * 4;
      px[o] = c[0];
      px[o + 1] = c[1];
      px[o + 2] = c[2];
      px[o + 3] = 255;
    }
  }
}

function drawText(
  px: Uint8Array,
  text: string,
  x: number,
  y: number,
  S: number,
  c: number[],
): number {
  let ox = x;
  for (const g of glyphs(text)) {
    g.forEach((row, gy) => {
      for (let gx = 0; gx < row.length; gx++) {
        if (row[gx] === "1") fill(px, ox + gx * S, y + gy * S, S, S, c);
      }
    });
    ox += (g[0].length + 1) * S;
  }
  return ox - x - S;
}

function capsule(
  px: Uint8Array,
  bx: number,
  yTop: number,
  yBot: number,
  brad: number,
  op: number,
) {
  const cy0 = yTop + brad, cy1 = yBot - brad;
  for (let y = Math.floor(yTop) - 1; y <= Math.ceil(yBot) + 1; y++) {
    for (
      let x = Math.floor(bx - brad) - 1;
      x <= Math.ceil(bx + brad) + 1;
      x++
    ) {
      let cover = 0;
      for (let sy = 0; sy < 3; sy++) {
        for (let sx = 0; sx < 3; sx++) {
          const fx = x + (sx + 0.5) / 3, fy = y + (sy + 0.5) / 3;
          const ny = Math.max(cy0, Math.min(cy1, fy));
          if ((fx - bx) ** 2 + (fy - ny) ** 2 <= brad * brad) cover++;
        }
      }
      if (!cover) continue;
      const a = (cover / 9) * op;
      const o = (y * W + x) * 4;
      px[o] = Math.round(px[o] + (INK[0] - px[o]) * a);
      px[o + 1] = Math.round(px[o + 1] + (INK[1] - px[o + 1]) * a);
      px[o + 2] = Math.round(px[o + 2] + (INK[2] - px[o + 2]) * a);
    }
  }
}

function drawMark(px: Uint8Array, mcx: number, mcy: number, K: number) {
  for (const b of barSegments("inex")) {
    capsule(
      px,
      mcx + (b.cx - 12) * K,
      mcy + (b.y0 - 12) * K,
      mcy + (b.y1 - 12) * K,
      (b.w / 2) * K,
      b.o,
    );
  }
}

function scatter(px: Uint8Array) {
  let seed = 0x1e5c0de;
  const rng = () => {
    seed |= 0;
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = 0; i < 90; i++) {
    const x = Math.floor(rng() * (W - 32));
    const y = Math.floor(rng() * (H - 32));
    if (y > 60 && y < 575) continue;
    fill(px, x & ~3, y & ~3, 16, 16, FAINT[i % 2]);
  }
}

function fit(text: string, maxCols: number): string {
  if (measure(text) <= maxCols) return text;
  let t = text;
  while (t.length > 1 && measure(t + "...") > maxCols) {
    t = t.slice(0, -1).trimEnd();
  }
  return t + "...";
}

function wrap(text: string, maxCols: number): string[] {
  if (measure(text) <= maxCols) return [text];
  const words = text.split(" ");
  let best = [text], bestDiff = Infinity;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(" "), b = words.slice(i).join(" ");
    const diff = Math.abs(measure(a) - measure(b));
    if (measure(a) <= maxCols && diff < bestDiff) {
      best = [a, b];
      bestDiff = diff;
    }
  }
  if (best.length === 1) return [fit(text, maxCols)];
  return [best[0], fit(best[1], maxCols)];
}

function brandCard(px: Uint8Array) {
  const S = 38, GAP = 58, K = 10;
  const wordCols = measure("inex");
  const blockH = 24 * K + GAP + 5 * S;
  const top = Math.round((H - blockH) / 2);
  drawMark(px, W / 2, top + 12 * K, K);
  drawText(
    px,
    "inex",
    Math.round((W - wordCols * S) / 2),
    top + 24 * K + GAP,
    S,
    INK,
  );
}

function pageCard(px: Uint8Array, opts: OgCardOpts) {
  const M = 80, K = 3.4;
  drawMark(px, M + 12 * K, 78 + 12 * K, K);
  drawText(px, "inex", M + 24 * K + 26, 78 + 12 * K - 27, 11, INK);

  if (opts.kind) drawText(px, fit(opts.kind, 40), M, 236, 10, MUTED);

  const maxW = W - 2 * M;
  let S = 32;
  let lines = wrap(opts.title ?? "", Math.floor(maxW / S));
  if (lines.length === 2) {
    S = Math.min(
      24,
      Math.floor(maxW / Math.max(measure(lines[0]), measure(lines[1]))),
    );
    lines = wrap(opts.title ?? "", Math.floor(maxW / S));
  } else {
    S = Math.max(18, Math.min(32, Math.floor(maxW / measure(lines[0]))));
    lines = [fit(lines[0], Math.floor(maxW / S))];
  }
  const top = 300;
  lines.forEach((line, i) => drawText(px, line, M, top + i * 6 * S, S, INK));

  if (opts.subtitle) {
    const sy = top + (lines.length === 1 ? 5 * S : 11 * S) + 46;
    drawText(px, fit(opts.subtitle, Math.floor(maxW / 11)), M, sy, 11, MUTED);
  }
}

const CRC_TABLE = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(bytes: Uint8Array) {
  let c = 0xFFFFFFFF;
  for (const b of bytes) c = CRC_TABLE[(c ^ b) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}
function chunk(type: string, data: Uint8Array) {
  const out = new Uint8Array(12 + data.length);
  const dv = new DataView(out.buffer);
  dv.setUint32(0, data.length);
  for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i);
  out.set(data, 8);
  dv.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)));
  return out;
}

async function encodePng(px: Uint8Array): Promise<Uint8Array<ArrayBuffer>> {
  const raw = new Uint8Array(H * (1 + W * 4));
  for (let y = 0; y < H; y++) {
    raw.set(px.subarray(y * W * 4, (y + 1) * W * 4), y * (1 + W * 4) + 1);
  }
  const idat = new Uint8Array(
    await new Response(
      new Blob([raw]).stream().pipeThrough(new CompressionStream("deflate")),
    ).arrayBuffer(),
  );
  const ihdr = new Uint8Array(13);
  const dv = new DataView(ihdr.buffer);
  dv.setUint32(0, W);
  dv.setUint32(4, H);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const parts = [
    new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", new Uint8Array(0)),
  ];
  const png = new Uint8Array(parts.reduce((a, p) => a + p.length, 0));
  let off = 0;
  for (const p of parts) {
    png.set(p, off);
    off += p.length;
  }
  return png;
}

export async function renderOgCard(
  opts: OgCardOpts = {},
): Promise<Uint8Array<ArrayBuffer>> {
  const px = new Uint8Array(W * H * 4);
  fill(px, 0, 0, W, H, BG);
  scatter(px);
  if (opts.title) pageCard(px, opts);
  else brandCard(px);
  return await encodePng(px);
}
