import { renderOgCard } from "../src/lib/og-card.ts";
import { docBySlug } from "../src/lib/docs.ts";

interface RwElement {
  setAttribute(name: string, value: string): void;
}
declare class HTMLRewriter {
  on(
    selector: string,
    handlers: { element?(el: RwElement): void },
  ): HTMLRewriter;
  transform(res: Response): Response;
}
type Ctx = { waitUntil(p: Promise<unknown>): void };
const edgeCache = () => (caches as unknown as { default: Cache }).default;

type PageMeta = { title: string; description: string; card: URLSearchParams };

function card(t: string, s?: string, k?: string): URLSearchParams {
  const p = new URLSearchParams({ t });
  if (s) p.set("s", s);
  if (k) p.set("k", k);
  return p;
}

function pageMeta(path: string): PageMeta | null {
  const parts = path.replace(/\/+$/, "").split("/").filter(Boolean);

  if (parts[0] === "docs" && parts.length > 1) {
    const doc = docBySlug(parts.slice(1).join("/"));
    if (!doc) return null;
    const description = doc.summary ??
      `${doc.title} — inex documentation.`;
    return {
      title: `${doc.title} · inex docs`,
      description,
      card: card(doc.title, doc.summary, "docs"),
    };
  }

  if (parts[0] === "saros") {
    const [, device, version] = parts;
    if (version) {
      return {
        title: `${device} v${version} · saros`,
        description:
          `Firmware ${version} for ${device} on saros, the inex firmware registry.`,
        card: card(`${device} v${version}`, "firmware release", "saros"),
      };
    }
    if (device) {
      return {
        title: `${device} · saros`,
        description:
          `Firmware for ${device} on saros, the inex firmware registry.`,
        card: card(device, "device firmware", "saros"),
      };
    }
    return {
      title: "saros · inex",
      description:
        "saros — the inex firmware registry: browse, follow, and fetch device firmware.",
      card: card("saros", "the inex firmware registry"),
    };
  }

  return null;
}

async function cardResponse(url: URL): Promise<Response> {
  const cached = await edgeCache().match(url.toString());
  if (cached) return cached;

  const png = await renderOgCard({
    title: (url.searchParams.get("t") ?? "").slice(0, 120) || undefined,
    subtitle: (url.searchParams.get("s") ?? "").slice(0, 200) || undefined,
    kind: (url.searchParams.get("k") ?? "").slice(0, 40) || undefined,
  });
  return new Response(png, {
    headers: {
      "content-type": "image/png",
      "cache-control": "public, max-age=604800",
    },
  });
}

const set = (content: string) => ({
  element: (el: RwElement) => el.setAttribute("content", content),
});

export default {
  async fetch(request: Request, _env: unknown, ctx: Ctx): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/og/card.png") {
      const res = await cardResponse(url);
      ctx.waitUntil(edgeCache().put(url.toString(), res.clone()));
      return res;
    }

    const res = await fetch(request);
    if (request.method !== "GET") return res;
    const meta = pageMeta(url.pathname);
    if (!meta || !(res.headers.get("content-type") ?? "").includes("html")) {
      return res;
    }

    const image = `${url.origin}/og/card.png?${meta.card}`;
    return new HTMLRewriter()
      .on('meta[property="og:title"]', set(meta.title))
      .on('meta[property="og:description"]', set(meta.description))
      .on('meta[property="og:image"]', set(image))
      .on('meta[name="description"]', set(meta.description))
      .transform(res);
  },
};
