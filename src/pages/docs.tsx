import {
  type Component,
  createEffect,
  createMemo,
  createResource,
  createSignal,
  For,
  Match,
  onCleanup,
  Show,
  type Signal,
  Switch,
} from "solid-js";
import { A, useLocation, useNavigate, useParams } from "@solidjs/router";
import { headings, Markdown } from "../components/markdown.tsx";
import { Skeleton } from "../components/ui.tsx";
import {
  ancestorSlugs,
  docBySlug,
  docNeighbours,
  type DocNode,
  DOCS,
  DOCS_TREE,
  stripFrontmatter,
} from "../lib/docs.ts";
import { useTitle } from "../lib/title.ts";
import { StackViz } from "../components/stack-viz.tsx";
import { DocsGraph } from "../components/docs-graph.tsx";
import { Collapsible } from "@ark-ui/solid/collapsible";
import { createEventListener } from "@solid-primitives/event-listener";
import { makePersisted } from "@solid-primitives/storage";
import { StudioTour, StudioTourNav } from "../components/studio-tour.tsx";
import { Scroll } from "../components/scroll.tsx";

const STUDIO = "guides/studio";

type Hit = {
  slug: string;
  page: string;
  heading?: string;
  id?: string;
  snippet: string;
};

function useSearchIndex() {
  const [index] = createResource(async () => {
    const sections: {
      slug: string;
      page: string;
      heading?: string;
      id?: string;
      body: string;
    }[] = [];
    await Promise.all(DOCS.map(async (d) => {
      if (!d.file) {
        sections.push({
          slug: d.slug,
          page: d.title,
          body: d.summary ??
            "interactive tour of the studio shell — panels, devices, debugging",
        });
        return;
      }
      const res = await fetch(`/docs/${d.file}`);
      if (!res.ok) return;
      const text = stripFrontmatter(await res.text());
      let current = {
        slug: d.slug,
        page: d.title,
        body: "",
      } as (typeof sections)[number];
      sections.push(current);
      const hs = headings(text);
      let rest = text;
      for (const h of hs) {
        const marker = new RegExp(
          `^#{2,3}\\s+${h.text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`,
          "m",
        );
        const at = rest.search(marker);
        if (at < 0) continue;
        current.body = rest.slice(0, at);
        rest = rest.slice(at).replace(/^.*$/m, "");
        current = {
          slug: d.slug,
          page: d.title,
          heading: h.text,
          id: h.id,
          body: "",
        };
        sections.push(current);
      }
      current.body = rest;
    }));
    return sections;
  });

  return (query: string): Hit[] => {
    const q = query.trim().toLowerCase();
    const idx = index();
    if (!q || !idx) return [];
    const hits: Hit[] = [];
    for (const s of idx) {
      const hay = `${s.heading ?? ""}\n${s.body}`.toLowerCase();
      const at = hay.indexOf(q);
      if (at < 0) continue;
      const snippet = `${s.heading ?? ""}\n${s.body}`
        .slice(Math.max(0, at - 30), at + q.length + 50)
        .replace(/\s+/g, " ")
        .trim();
      hits.push({
        slug: s.slug,
        page: s.page,
        heading: s.heading,
        id: s.id,
        snippet,
      });
      if (hits.length >= 8) break;
    }
    return hits;
  };
}

export const Docs: Component = () => {
  const params = useParams<{ slug?: string }>();
  const loc = useLocation();
  const navigate = useNavigate();
  const slug = () => params.slug?.replace(/\/$/, "") || DOCS[0].slug;
  const page = createMemo(() => docBySlug(slug()));
  useTitle(() => `${page()?.title ?? "Not found"} · inex docs`);

  const [content] = createResource(slug, async (s) => {
    const p = docBySlug(s);
    if (!p || !p.file) return undefined;
    const res = await fetch(`/docs/${p.file}`);
    if (!res.ok) throw new Error(`${res.status}`);
    return stripFrontmatter(await res.text());
  });

  const toc = createMemo(() => (content() ? headings(content()!) : []));

  // Explicit type args: makePersisted's Signal | [Store,Setter] overload otherwise collapses T to unknown.
  const [openMap, setOpenMap] = makePersisted<
    Record<string, boolean>,
    Signal<Record<string, boolean>>
  >(createSignal<Record<string, boolean>>({}), { name: "inex-docs-nav" });
  const setNode = (s: string, open: boolean) =>
    setOpenMap({ ...openMap(), [s]: open });
  createEffect(() => {
    const open = [...ancestorSlugs(slug()), slug()];
    setOpenMap((prev) => {
      const next = { ...prev };
      for (const a of open) next[a] = true;
      return next;
    });
  });

  const search = useSearchIndex();
  const [query, setQuery] = createSignal("");
  const hits = createMemo(() => search(query()));
  let searchBox: HTMLInputElement | undefined;
  createEventListener(document, "keydown", (e) => {
    if (e.key === "/" && document.activeElement !== searchBox) {
      e.preventDefault();
      searchBox?.focus();
    }
  });
  const go = (hit: Hit) => {
    setQuery("");
    navigate(`/docs/${hit.slug}${hit.id ? `#${hit.id}` : ""}`);
  };

  const [active, setActive] = createSignal("");
  let tocWrap: HTMLDivElement | undefined;
  const [tocLine, setTocLine] = createSignal({ top: 0, height: 0, prog: 0 });
  createEffect(() => {
    active();
    toc();
    requestAnimationFrame(() => {
      const items = tocWrap?.querySelectorAll<HTMLElement>("[data-station]");
      if (!items?.length) {
        setTocLine({ top: 0, height: 0, prog: 0 });
        return;
      }
      const centre = (el: HTMLElement) => el.offsetTop + el.offsetHeight / 2;
      const top = centre(items[0]);
      const height = Math.max(0, centre(items[items.length - 1]) - top);
      const act = tocWrap!.querySelector<HTMLElement>('[data-active="true"]');
      const prog = act ? Math.max(0, centre(act) - top) : 0;
      setTocLine({ top, height, prog });
    });
  });
  createEffect(() => {
    if (!content()) return;
    const ids = toc().map((h) => h.id);
    if (loc.hash) {
      requestAnimationFrame(() => {
        document.getElementById(loc.hash.slice(1))?.scrollIntoView();
      });
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(e.target.id);
        }
      },
      { rootMargin: "-10% 0px -75% 0px" },
    );
    requestAnimationFrame(() => {
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el) observer.observe(el);
      }
    });
    onCleanup(() => observer.disconnect());
  });

  function NavLink(props: { node: DocNode; depth: number; label?: string }) {
    return (
      <A
        href={`/docs/${props.node.slug}`}
        class={`block truncate rounded-md py-1.5 pr-3 text-sm transition-colors ${
          slug() === props.node.slug
            ? "bg-accent/10 text-accent"
            : "text-ink-2 hover:bg-panel hover:text-ink"
        }`}
        style={{ "padding-left": `${0.75 + props.depth * 0.75}rem` }}
      >
        {props.label ?? props.node.title}
      </A>
    );
  }

  function NavCategory(props: { node: DocNode; depth: number }) {
    const isOpen = () => openMap()[props.node.slug] ?? props.depth === 0;
    return (
      <Collapsible.Root open={isOpen()}>
        <button
          type="button"
          aria-expanded={isOpen()}
          onClick={() => setNode(props.node.slug, !isOpen())}
          class="group flex w-full items-center gap-1 rounded-md py-1 pr-2 text-left cursor-pointer"
          style={{ "padding-left": `${0.25 + props.depth * 0.75}rem` }}
        >
          <svg
            viewBox="0 0 8 8"
            class={`size-2 shrink-0 text-muted/50 group-hover:text-ink transition-transform duration-200 ${
              isOpen() ? "rotate-90" : ""
            }`}
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M2 0L7 4L2 8Z" />
          </svg>
          <span class="flex-1 min-w-0 truncate text-[10px] font-semibold uppercase tracking-widest text-muted/70 group-hover:text-ink transition-colors">
            {props.node.title}
          </span>
          <span class="shrink-0 font-mono text-[9px] text-muted/50">
            {props.node.children!.length}
          </span>
        </button>
        <Collapsible.Content class="docs-fold overflow-hidden">
          <div class="space-y-0.5 pb-1">
            <Show when={props.node.file}>
              <NavLink
                node={props.node}
                depth={props.depth + 1}
                label="Overview"
              />
            </Show>
            <NavTree nodes={props.node.children!} depth={props.depth + 1} />
          </div>
        </Collapsible.Content>
      </Collapsible.Root>
    );
  }

  function NavTree(props: { nodes: DocNode[]; depth: number }) {
    return (
      <For each={props.nodes}>
        {(node) => (
          <Show
            when={node.children?.length}
            fallback={<NavLink node={node} depth={props.depth} />}
          >
            <NavCategory node={node} depth={props.depth} />
          </Show>
        )}
      </For>
    );
  }

  return (
    <div class="flex-1 min-h-0 lg:h-full grid lg:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[240px_minmax(0,1fr)_300px]">
      <div class="border-b lg:border-b-0 lg:border-r border-line lg:h-full lg:min-h-0 flex flex-col">
        <div class="p-4 pb-3 shrink-0">
          <div class="relative">
            <input
              ref={searchBox}
              value={query()}
              onInput={(e) => setQuery(e.currentTarget.value)}
              placeholder="Search docs…"
              aria-label="Search docs"
              class="w-full rounded-md border border-line bg-panel px-3 py-1.5 text-sm placeholder:text-muted/70 shadow-sm focus:outline-none focus:border-accent/60"
            />
            <kbd class="absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-ink/25 px-1.5 text-[10px] text-muted/70 font-mono">
              /
            </kbd>
          </div>
        </div>
        <Scroll class="flex-1 min-h-0">
          <div class="px-4 pb-4">
            <Show
              when={!query()}
              fallback={
                <nav class="space-y-1">
                  <For
                    each={hits()}
                    fallback={
                      <p class="px-3 text-xs text-muted/70">No matches.</p>
                    }
                  >
                    {(hit) => (
                      <button
                        type="button"
                        onClick={() => go(hit)}
                        class="w-full text-left rounded-md px-3 py-2 hover:bg-panel transition-colors cursor-pointer"
                      >
                        <div class="text-sm text-ink">
                          {hit.page}
                          <Show when={hit.heading}>
                            <span class="text-muted">› {hit.heading}</span>
                          </Show>
                        </div>
                        <div class="text-[11px] text-muted/70 truncate">
                          {hit.snippet}
                        </div>
                      </button>
                    )}
                  </For>
                </nav>
              }
            >
              <nav class="space-y-1">
                <NavTree nodes={DOCS_TREE} depth={0} />
              </nav>
            </Show>
          </div>
        </Scroll>
      </div>

      <div class="lg:h-full lg:min-h-0 flex flex-col">
        <Scroll class="flex-1 min-h-0">
          <section class="p-4 sm:p-8">
            <Show
              when={page()}
              fallback={
                <p class="text-sm text-muted">
                  No such page.{" "}
                  <A href="/docs" class="text-accent">Docs home →</A>
                </p>
              }
            >
              {(p) => (
                <article
                  class={`space-y-5 animate-rise ${
                    slug() === STUDIO ? "" : "max-w-3xl"
                  }`}
                >
                  <Show when={slug() !== STUDIO}>
                    <header class="space-y-1">
                      <h1 class="text-2xl font-semibold">{p().title}</h1>
                      <Show when={p().summary}>
                        <p class="text-sm text-muted">{p().summary}</p>
                      </Show>
                    </header>
                  </Show>

                  <Show when={slug() === STUDIO}>
                    <StudioTour />
                  </Show>

                  <Show when={slug() !== STUDIO}>
                    <Show
                      when={!content.loading}
                      fallback={
                        <div class="space-y-3 pt-2">
                          <Skeleton class="h-4 w-4/5" />
                          <Skeleton class="h-4 w-3/5" />
                          <Skeleton class="h-32" />
                        </div>
                      }
                    >
                      <Show
                        when={!content.error && content()}
                        fallback={
                          <p class="text-sm text-danger">
                            Failed to load this page ({String(content.error)}).
                          </p>
                        }
                      >
                        {(text) => <Markdown text={text()} />}
                      </Show>
                    </Show>
                  </Show>
                </article>
              )}
            </Show>
          </section>
        </Scroll>
        <Show when={page()}>
          <div class="shrink-0 border-t border-line bg-surface px-4 sm:px-8 py-3 flex justify-between text-sm">
            <Show when={docNeighbours(slug()).prev} fallback={<span />}>
              {(prev) => (
                <A
                  href={`/docs/${prev().slug}`}
                  class="text-ink-2 hover:text-accent"
                >
                  ← {prev().title}
                </A>
              )}
            </Show>
            <Show when={docNeighbours(slug()).next} fallback={<span />}>
              {(next) => (
                <A
                  href={`/docs/${next().slug}`}
                  class="text-ink-2 hover:text-accent"
                >
                  {next().title} →
                </A>
              )}
            </Show>
          </div>
        </Show>
      </div>

      <aside class="hidden xl:flex flex-col p-5 border-l border-line xl:h-full min-h-0">
        <div class="flex-1 basis-0 min-h-0 pb-4 overflow-hidden">
          <Switch
            fallback={
              <Scroll class="h-full text-[13px]">
                <nav class="pl-1">
                  <div class="text-[10px] font-semibold text-muted/70 uppercase tracking-widest mb-3">
                    On this page
                  </div>
                  <div ref={tocWrap} class="relative">
                    <span
                      class="absolute left-[3px] w-px bg-line"
                      style={{
                        top: `${tocLine().top}px`,
                        height: `${tocLine().height}px`,
                      }}
                    />
                    <span
                      class="absolute left-[3px] w-px bg-accent transition-[height] duration-300 ease-out"
                      style={{
                        top: `${tocLine().top}px`,
                        height: `${tocLine().prog}px`,
                      }}
                    />
                    <For each={toc()}>
                      {(h) => {
                        const isActive = () => active() === h.id;
                        const passed = () => {
                          const ids = toc().map((t) => t.id);
                          const ai = ids.indexOf(active());
                          return ai >= 0 && ids.indexOf(h.id) < ai;
                        };
                        return (
                          <a
                            href={`#${h.id}`}
                            data-station
                            data-active={isActive() ? "true" : undefined}
                            class={`group relative block py-1 leading-snug transition-colors duration-200 ${
                              h.depth === 3 ? "pl-9 text-xs" : "pl-5"
                            } ${
                              isActive()
                                ? "text-accent font-medium"
                                : passed()
                                ? "text-ink-2 hover:text-ink"
                                : "text-muted hover:text-ink"
                            }`}
                          >
                            <span
                              class={`absolute top-1/2 -translate-y-1/2 rounded-full transition-all duration-200 ${
                                h.depth === 3
                                  ? "left-[1.5px] size-1"
                                  : "left-0 size-[7px]"
                              } ${
                                isActive()
                                  ? "bg-accent ring-2 ring-accent/25 scale-125"
                                  : passed()
                                  ? "bg-[color-mix(in_oklab,var(--color-accent)_45%,var(--color-surface))] group-hover:bg-[color-mix(in_oklab,var(--color-accent)_70%,var(--color-surface))]"
                                  : "bg-surface border border-ink/25 group-hover:border-ink/60"
                              }`}
                            />
                            <span class="block truncate">{h.text}</span>
                          </a>
                        );
                      }}
                    </For>
                  </div>
                </nav>
              </Scroll>
            }
          >
            <Match when={slug() === STUDIO}>
              <Scroll class="h-full">
                <StudioTourNav />
              </Scroll>
            </Match>
            <Match when={slug() === "framework" || slug().startsWith("crate-")}>
              <div class="h-full">
                <StackViz
                  active={slug().startsWith("crate-") ? slug() : undefined}
                />
              </div>
            </Match>
          </Switch>
        </div>
        <div class="flex-1 basis-0 min-h-0 border-t border-line pt-4 -mx-5 px-5">
          <DocsGraph current={slug()} />
        </div>
      </aside>
    </div>
  );
};
