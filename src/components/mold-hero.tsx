import { type Component, onCleanup, onMount } from "solid-js";
import { createEventListener } from "@solid-primitives/event-listener";
import { debounce } from "@solid-primitives/scheduled";
import { useReducedMotion } from "../lib/media.ts";
import { barSegments, type ProductMark } from "./logo.tsx";

const MARK = { x: 0.74, y: 0.5, r: 0.26 };

const rgbCache = new Map<string, [number, number, number]>();
function rgb(hex: string): [number, number, number] {
  let c = rgbCache.get(hex);
  if (!c) {
    c = [
      parseInt(hex.slice(1, 3), 16),
      parseInt(hex.slice(3, 5), 16),
      parseInt(hex.slice(5, 7), 16),
    ];
    rgbCache.set(hex, c);
  }
  return c;
}

export const MoldHero: Component = () => {
  let wrap!: HTMLDivElement;
  let canvas!: HTMLCanvasElement;

  const reducedMotion = useReducedMotion();
  onMount(() => {
    const reduced = reducedMotion();
    const mix = (a: string, b: string, f: number) => {
      const pa = rgb(a), pb = rgb(b);
      return "#" +
        pa.map((v, i) =>
          Math.round(v + (pb[i] - v) * f).toString(16).padStart(2, "0")
        ).join("");
    };
    let fieldHi = "#ddd6fe", fieldMid = "#7c3aed", fieldLo = "#4b3182";
    const readField = () => {
      const cs = getComputedStyle(document.documentElement);
      const get = (n: string, fb: string) =>
        cs.getPropertyValue(n).trim() || fb;
      const accent = get("--color-accent", "#7c3aed");
      const accentHi = get("--color-accent-hi", "#c4b5fd");
      const term = get("--color-term", "#171412");
      const [r, g, bch] = rgb(accent);
      const mid = 0.299 * r + 0.587 * g + 0.114 * bch < 70 ? accentHi : accent;
      fieldHi = mix(accentHi, "#ffffff", 0.35);
      fieldMid = mid;
      fieldLo = mix(mid, term, 0.62);
    };
    readField();
    const SHADE = (v: number) =>
      v > 0.7 ? fieldHi : v > 0.4 ? fieldMid : v > 0.15 ? fieldLo : null;

    let cleanup = () => {};

    const boot = () => {
      cleanup();
      cleanup = () => {};

      const rect = wrap.getBoundingClientRect();
      if (rect.width < 60 || rect.height < 60) return;
      const H = 160;
      const W = Math.max(
        180,
        Math.min(560, Math.round(H * rect.width / Math.max(1, rect.height))),
      );
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d")!;

      const N = Math.round(W * H / 42);
      const SD = 9, TURN = 0.35, SPEED = 1.7, JIT = 0.25;
      let trail = new Float32Array(W * H);
      let scratch = new Float32Array(W * H);
      const ag = new Float32Array(N * 3);
      for (let i = 0; i < N; i++) {
        ag[i * 3] = ((i * 2654435761) % W + W) % W;
        ag[i * 3 + 1] = ((i * 40503) % H + H) % H;
        ag[i * 3 + 2] = ((i * 7919) % 628) / 100;
      }

      const RX = MARK.x * W, RY = MARK.y * H;
      const holeR = MARK.r * H * 0.5;
      let mouse: { x: number; y: number } | null = null;
      let t = 0;

      const showMark = rect.width >= 640;
      const mkScale = (MARK.r * 2 * H) / 24; // 24-unit mark space → cells
      const FAR = 64;
      const dmA = new Float32Array(W * H).fill(FAR);
      const dmB = new Float32Array(W * H).fill(FAR);
      const mfA = new Float32Array(W * H);
      const mfB = new Float32Array(W * H);
      const ampA = new Float32Array(W * H).fill(1);
      const ampB = new Float32Array(W * H).fill(1);
      const gapA = new Uint8Array(W * H);
      const gapB = new Uint8Array(W * H);
      const barOfB = new Int8Array(W * H).fill(-1);
      let holeWA = 0, holeWB = 0;
      let mix = 1;
      const reach = MARK.r * H + 18;
      const bx0 = Math.max(0, Math.floor(RX - reach)),
        bx1 = Math.min(W - 1, Math.ceil(RX + reach)),
        by0 = Math.max(0, Math.floor(RY - reach)),
        by1 = Math.min(H - 1, Math.ceil(RY + reach));
      let markProduct: ProductMark | "" = "";
      const buildMark = (product: ProductMark) => {
        if (!showMark || product === markProduct) return;
        markProduct = product;
        for (let y = by0; y <= by1; y++) {
          for (let x = bx0; x <= bx1; x++) {
            const i = y * W + x;
            dmA[i] += (dmB[i] - dmA[i]) * mix;
            mfA[i] += (mfB[i] - mfA[i]) * mix;
            ampA[i] += (ampB[i] - ampA[i]) * mix;
            if (mix >= 0.5) gapA[i] = gapB[i];
          }
        }
        holeWA += (holeWB - holeWA) * mix;
        holeWB = product === "inex" ? 1 : 0;
        const caps = barSegments(product).map((sg, _, arr) => ({
          x: RX + (sg.cx - 12) * mkScale,
          y0: RY + (sg.y0 - 12) * mkScale,
          y1: RY + (sg.y1 - 12) * mkScale,
          r: (sg.w / 2) * mkScale,
          o: sg.o,
          col: [...new Set(arr.map((s) => s.cx))].indexOf(sg.cx),
        }));
        const xL = Math.min(...caps.map((c) => c.x), Infinity);
        const xR = Math.max(...caps.map((c) => c.x), -Infinity);
        for (let y = by0; y <= by1; y++) {
          for (let x = bx0; x <= bx1; x++) {
            let best = FAR, bc = -1, bo = 1, bside = false;
            for (const c of caps) {
              const cy = Math.max(c.y0 + c.r, Math.min(c.y1 - c.r, y + 0.5));
              const d = Math.hypot(x + 0.5 - c.x, y + 0.5 - cy) - c.r;
              if (d < best) {
                best = d;
                bc = c.col;
                bo = c.o;
                bside = cy === y + 0.5;
              }
            }
            const i = y * W + x;
            dmB[i] = best;
            mfB[i] = Math.max(0, 1.1 - best * 0.6) * (0.6 + 0.4 * bo);
            barOfB[i] = bc;
            ampB[i] = bo;
            gapB[i] = bside && x + 0.5 > xL && x + 0.5 < xR ? 1 : 0;
          }
        }
        mix = 0;
      };
      buildMark("inex");
      mix = 1;

      const wander = [[0, 0], [0, 0]];
      const updWander = () => {
        wander[0][0] = W * (0.30 + 0.22 * Math.sin(t * 0.0037));
        wander[0][1] = H * (0.50 + 0.36 * Math.sin(t * 0.0053 + 1.7));
        wander[1][0] = W * (0.55 + 0.30 * Math.sin(t * 0.0029 + 4.1));
        wander[1][1] = H * (0.45 + 0.38 * Math.sin(t * 0.0041 + 0.6));
      };

      const food = (x: number, y: number) => {
        let v = 0;
        if (showMark) {
          const ix = (Math.floor(x) + W) % W, iy = (Math.floor(y) + H) % H;
          const i = iy * W + ix;
          const d = mix >= 1 ? dmB[i] : dmA[i] + (dmB[i] - dmA[i]) * mix;
          if (d < 0.5) {
            const amp = mix >= 1
              ? ampB[i]
              : ampA[i] + (ampB[i] - ampA[i]) * mix;
            v += 1.5 * amp *
              (0.88 + 0.12 * Math.sin(t * 0.01 + barOfB[i] * 1.7));
          } else if (d < 30) {
            v += 0.4 * (1 - d / 30);
          }
          const hw = holeWA + (holeWB - holeWA) * mix;
          if (hw > 0.01) {
            const dc2 = (x - RX) ** 2 + (y - RY) ** 2;
            if (dc2 < holeR * holeR) {
              v -= 0.7 * hw * (1 - dc2 / (holeR * holeR));
            }
          }
        }
        for (const [fx, fy] of wander) {
          const d2 = (x - fx) ** 2 + (y - fy) ** 2;
          v += 40 / (30 + d2);
        }
        if (mouse) {
          const d2 = (x - mouse.x) ** 2 + (y - mouse.y) ** 2;
          v += 55 / (18 + d2);
        }
        return v;
      };

      const sense = (x: number, y: number, a: number) => {
        const sx = x + Math.cos(a) * SD, sy = y + Math.sin(a) * SD;
        const ix = (Math.floor(sx) + W) % W, iy = (Math.floor(sy) + H) % H;
        return trail[iy * W + ix] + food(sx, sy);
      };

      const SPORES = Math.max(1, N >> 10);
      const step = () => {
        t++;
        if (mix < 1) mix = Math.min(1, mix + 0.016);
        updWander();
        const decay = 0.958 -
          0.012 * Math.max(0, Math.sin(t * 0.002) - 0.7) / 0.3;
        for (let i = 0; i < N; i++) {
          let x = ag[i * 3], y = ag[i * 3 + 1], a = ag[i * 3 + 2];
          const l = sense(x, y, a - 0.5);
          const c = sense(x, y, a);
          const r = sense(x, y, a + 0.5);
          if (c < l || c < r) a += l > r ? -TURN : TURN;
          a += (Math.random() - 0.5) * JIT;
          x = (x + Math.cos(a) * SPEED + W) % W;
          y = (y + Math.sin(a) * SPEED + H) % H;
          const idx = Math.floor(y) * W + Math.floor(x);
          trail[idx] = Math.min(1.6, trail[idx] + 1);
          ag[i * 3] = x;
          ag[i * 3 + 1] = y;
          ag[i * 3 + 2] = a;
        }
        // random (not k-indexed): SPORES is tiny, k-indexing would pin a fixed share to the mark
        for (let k = 0; k < SPORES; k++) {
          const i = ((t * 131 + k * 977) >>> 0) % N;
          if (showMark && Math.random() < 0.12) {
            const a2 = Math.random() * 6.283;
            const r2 = Math.random() * MARK.r * H * 1.4;
            ag[i * 3] = Math.min(W - 1, Math.max(0, RX + Math.cos(a2) * r2));
            ag[i * 3 + 1] = Math.min(
              H - 1,
              Math.max(0, RY + Math.sin(a2) * r2),
            );
          } else {
            ag[i * 3] = Math.random() * W;
            ag[i * 3 + 1] = Math.random() * H;
          }
          ag[i * 3 + 2] = Math.random() * 6.283;
        }
        for (let y = 0; y < H; y++) {
          const up = ((y - 1 + H) % H) * W,
            dn = ((y + 1) % H) * W,
            row = y * W;
          for (let x = 0; x < W; x++) {
            const lf = (x - 1 + W) % W, rt = (x + 1) % W;
            scratch[row + x] = (trail[row + x] * 0.6 +
              (trail[up + x] + trail[dn + x] + trail[row + lf] +
                  trail[row + rt]) * 0.1) * decay;
          }
        }
        [trail, scratch] = [scratch, trail];
        if (showMark) {
          const wB = mix, wA = 1 - mix;
          const hw = holeWA + (holeWB - holeWA) * mix;
          for (let y = by0; y <= by1; y++) {
            for (let x = bx0; x <= bx1; x++) {
              const i = y * W + x;
              let f = 1;
              const dB = dmB[i];
              if (dB > 0.6) {
                if (dB < 6 && gapB[i]) f *= 1 - 0.5 * wB;
                else if (dB < 2) f *= 1 - 0.2 * wB;
              }
              if (wA > 0.01) {
                const dA = dmA[i];
                if (dA > 0.6) {
                  if (dA < 6 && gapA[i]) f *= 1 - 0.5 * wA;
                  else if (dA < 2) f *= 1 - 0.2 * wA;
                }
              }
              if (
                hw > 0.01 && dB > 2.5 &&
                (x - RX) ** 2 + (y - RY) ** 2 < holeR * holeR * 0.72
              ) {
                f *= 1 - 0.2 * hw;
              }
              if (f < 1) trail[i] *= f;
            }
          }
        }
      };

      const img = ctx.createImageData(W, H);
      const px = img.data;
      const put = (o: number, c: [number, number, number]) => {
        px[o] = c[0];
        px[o + 1] = c[1];
        px[o + 2] = c[2];
        px[o + 3] = 255;
      };
      const draw = () => {
        px.fill(0);
        for (let i = 0; i < W * H; i++) {
          const mf = mix >= 1 ? mfB[i] : mfA[i] + (mfB[i] - mfA[i]) * mix;
          const color = SHADE(Math.max(trail[i], mf * 0.45));
          if (color) put(i * 4, rgb(color));
        }
        ctx.putImageData(img, 0, 0);
      };

      for (let i = 0; i < (reduced ? 600 : 300); i++) step();
      draw();
      if (reduced) return;

      let visible = true, raf = 0;
      const io = new IntersectionObserver(([e]) => {
        visible = e.isIntersecting;
      });
      io.observe(wrap);
      const loop = () => {
        if (visible) {
          step();
          draw();
        }
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);

      const onMove = (e: MouseEvent) => {
        const r = wrap.getBoundingClientRect();
        mouse = {
          x: (e.clientX - r.left) / r.width * W,
          y: (e.clientY - r.top) / r.height * H,
        };
      };
      const onLeave = () => {
        mouse = null;
      };
      const onMark = (e: Event) => {
        const p = (e as CustomEvent).detail;
        if (p === "inex" || p === "saros" || p === "penumbra") buildMark(p);
      };
      wrap.addEventListener("mousemove", onMove);
      wrap.addEventListener("mouseleave", onLeave);
      globalThis.addEventListener("inex-mark", onMark);
      cleanup = () => {
        cancelAnimationFrame(raf);
        io.disconnect();
        wrap.removeEventListener("mousemove", onMove);
        wrap.removeEventListener("mouseleave", onLeave);
        globalThis.removeEventListener("inex-mark", onMark);
      };
    };

    requestAnimationFrame(boot);

    const reboot = debounce(boot, 200);
    let lastW = 0, lastH = 0;
    const ro = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect;
      if (lastW === 0) {
        lastW = width;
        lastH = height;
        return;
      }
      if (
        Math.abs(width - lastW) / Math.max(1, lastW) < 0.04 &&
        Math.abs(height - lastH) / Math.max(1, lastH) < 0.04
      ) return;
      lastW = width;
      lastH = height;
      reboot();
    });
    ro.observe(wrap);

    createEventListener(
      globalThis.window,
      "inex-themechange",
      () => readField(),
    );
    onCleanup(() => {
      reboot.clear();
      ro.disconnect();
      cleanup();
    });
  });

  return (
    <div ref={wrap} class="absolute inset-0" aria-hidden="true">
      <canvas
        ref={canvas}
        class="w-full h-full"
        style={{ "image-rendering": "pixelated" }}
      />
    </div>
  );
};
