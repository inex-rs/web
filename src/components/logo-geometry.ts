export type ProductMark = "inex" | "saros" | "penumbra";

export const LOGO_BARS = 7;

const R = 9.2;
const PUNCH: Record<ProductMark, [number, number, number] | null> = {
  inex: [13.3, 10.7, 6],
  saros: null,
  penumbra: [15.5, 8.5, 7.2],
};
const XS = Array.from(
  { length: LOGO_BARS },
  (_, i) => 4.4 + (i * 15.2) / (LOGO_BARS - 1),
);
const BAR_W = 1.5;

function segs(
  cx: number,
  punch: [number, number, number] | null,
  minH: number,
): { y: number; h: number }[] {
  const half = Math.sqrt(Math.max(0, R * R - (cx - 12) ** 2));
  if (half < 0.7) return [];
  let out: [number, number][] = [[12 - half, 12 + half]];
  if (punch) {
    const [px, py, pr] = punch;
    const sh = pr * pr - (cx - px) ** 2;
    if (sh > 0) {
      const s0 = py - Math.sqrt(sh), s1 = py + Math.sqrt(sh);
      const next: [number, number][] = [];
      for (const [a, b] of out) {
        if (s1 <= a || s0 >= b) next.push([a, b]);
        else {
          if (s0 > a) next.push([a, s0]);
          if (s1 < b) next.push([s1, b]);
        }
      }
      out = next;
    }
  }
  return out.filter(([a, b]) => b - a > minH).map(([a, b]) => ({
    y: a,
    h: b - a,
  }));
}

type Bar = { cx: number; w: number; y0: number; y1: number; o: number };

export function barSegments(product: ProductMark = "inex"): Bar[] {
  const out: Bar[] = [];
  XS.forEach((cx, i) => {
    if (product === "saros") {
      const c = i % 2 === 0 ? 10.6 : 13.4;
      const half = Math.sqrt(Math.max(0, 8.6 ** 2 - (cx - c) ** 2));
      if (half > 0.7) {
        out.push({
          cx,
          w: BAR_W,
          y0: 12 - half,
          y1: 12 + half,
          o: i % 2 === 0 ? 1 : 0.55,
        });
      }
      return;
    }
    for (const seg of segs(cx, PUNCH[product], BAR_W * 0.65)) {
      out.push({ cx, w: BAR_W, y0: seg.y, y1: seg.y + seg.h, o: 1 });
    }
  });
  return out;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function faviconSvg(surface: string, accent: string): string {
  const rects = barSegments("inex").map((b) =>
    `<rect x="${round2(b.cx - b.w / 2)}" y="${round2(b.y0)}" width="${
      round2(b.w)
    }" height="${round2(b.y1 - b.y0)}" rx="${
      round2(Math.min(b.w, b.y1 - b.y0) / 2)
    }"/>`
  ).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect width="24" height="24" rx="4.5" fill="${surface}"/><g fill="${accent}" transform="translate(12 12) scale(0.78) translate(-12 -12)">${rects}</g></svg>`;
}
