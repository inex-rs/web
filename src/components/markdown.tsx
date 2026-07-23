import {
  type Component,
  createMemo,
  createResource,
  ErrorBoundary,
  For,
  type JSX,
  Show,
} from "solid-js";
import type { ListItem, RootContent } from "mdast";
import { Clipboard } from "@ark-ui/solid/clipboard";
import { highlight } from "../lib/highlight.ts";
import { CliPlayground } from "./cli-playground.tsx";
import {
  BitField,
  Diagram,
  ErrorBox,
  Figure,
  Heatmap,
  MemMap,
  Sequence,
} from "./docs-blocks.tsx";
import { parseMd, renderInline, textOf } from "./md-inline.tsx";

const RICH: Record<string, (body: string) => JSX.Element> = {
  "inex-cli": () => <CliPlayground />,
  bitfield: (b) => <BitField body={b} />,
  seq: (b) => <Sequence body={b} />,
  memmap: (b) => <MemMap body={b} />,
  heatmap: (b) => <Heatmap body={b} />,
  diagram: (b) => <Diagram body={b} />,
  figure: (b) => <Figure body={b} />,
};

export function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const CodeBlock: Component<{ lang: string; body: string }> = (props) => {
  const [toks] = createResource(
    () => [props.lang, props.body] as const,
    ([lang, body]) => highlight(body, lang),
  );
  return (
    <div class="group relative rounded-lg border border-term-line bg-term overflow-hidden">
      <pre class="overflow-x-auto p-4 font-mono text-[12.5px] leading-relaxed text-term-ink">
        <Show when={toks()} fallback={props.body}>
          <For each={toks()!}>
            {(line, i) => (
              <>
                <For each={line}>
                  {(t) => (
                    <span
                      style={{
                        color: t.color,
                        "font-style": t.italic ? "italic" : undefined,
                        "font-weight": t.bold ? "600" : undefined,
                      }}
                    >
                      {t.content}
                    </span>
                  )}
                </For>
                {i() < toks()!.length - 1 ? "\n" : ""}
              </>
            )}
          </For>
        </Show>
      </pre>
      <div class="absolute top-2 right-2 flex items-center gap-2">
        <Show when={props.lang}>
          <span class="font-mono text-[10px] text-term-ink-2">
            {props.lang}
          </span>
        </Show>
        <Clipboard.Root value={props.body} timeout={1200}>
          <Clipboard.Trigger
            aria-label="copy code"
            class="rounded border border-term-line px-1.5 py-0.5 font-mono text-[10px] text-term-ink-2 opacity-0 group-hover:opacity-100 hover:text-term-ink transition-all cursor-pointer"
          >
            <Clipboard.Indicator copied="copied">copy</Clipboard.Indicator>
          </Clipboard.Trigger>
        </Clipboard.Root>
      </div>
    </div>
  );
};

export function headings(
  src: string,
): { depth: number; text: string; id: string }[] {
  return parseMd(src).children
    .filter((b) => b.type === "heading" && b.depth >= 2)
    .map((b) => {
      const text = textOf(b);
      return { depth: (b as { depth: number }).depth, text, id: slugify(text) };
    });
}

function listItem(item: ListItem, seen: Set<string>): JSX.Element {
  return (
    <li>
      <Show when={item.checked != null}>
        <input
          type="checkbox"
          checked={item.checked ?? false}
          disabled
          class="mr-1.5 align-middle accent-accent"
        />
      </Show>
      {item.children.map((child) =>
        child.type === "paragraph"
          ? renderInline(child.children, seen)
          : renderBlock(child, seen)
      )}
    </li>
  );
}

function renderBlock(b: RootContent, seen: Set<string>): JSX.Element {
  switch (b.type) {
    case "heading": {
      const text = textOf(b);
      const id = slugify(text);
      // Headings render without `seen` — no glossary underlines in titles.
      if (b.depth === 1) {
        return (
          <h1 id={id} class="scroll-mt-6 text-xl font-semibold text-ink pt-2">
            {renderInline(b.children)}
          </h1>
        );
      }
      return (
        <h2
          id={id}
          class={`scroll-mt-6 font-semibold text-ink ${
            b.depth === 2 ? "text-base pt-4" : "text-sm pt-2"
          }`}
        >
          {renderInline(b.children)}
        </h2>
      );
    }
    case "paragraph":
      return <p>{renderInline(b.children, seen)}</p>;
    case "list": {
      const cls = `${b.ordered ? "list-decimal" : "list-disc"} pl-5 space-y-1`;
      return b.ordered
        ? (
          <ol class={cls}>
            <For each={b.children}>{(item) => listItem(item, seen)}</For>
          </ol>
        )
        : (
          <ul class={cls}>
            <For each={b.children}>{(item) => listItem(item, seen)}</For>
          </ul>
        );
    }
    case "code": {
      const rich = RICH[b.lang ?? ""];
      if (rich) {
        return (
          <ErrorBoundary
            fallback={(err) => (
              <ErrorBox
                kind={b.lang ?? ""}
                err={err instanceof Error ? err.message : String(err)}
              />
            )}
          >
            {rich(b.value)}
          </ErrorBoundary>
        );
      }
      return <CodeBlock lang={b.lang ?? ""} body={b.value} />;
    }
    case "blockquote":
      return (
        <blockquote class="border-l-2 border-accent/40 bg-accent/10 rounded-r-md px-4 py-2.5 text-ink-2 space-y-2">
          {b.children.map((child) => renderBlock(child, seen))}
        </blockquote>
      );
    case "thematicBreak":
      return <hr class="border-line" />;
    case "table": {
      const [head, ...rows] = b.children;
      const align = b.align ?? [];
      return (
        <div class="overflow-x-auto rounded-lg border border-line">
          <table class="w-full border-collapse text-[13px]">
            <thead>
              <tr class="bg-panel-2/60">
                <For each={head?.children ?? []}>
                  {(cell) => (
                    <th class="border-b border-line px-3 py-2 text-left font-semibold text-ink whitespace-nowrap">
                      {renderInline(cell.children)}
                    </th>
                  )}
                </For>
              </tr>
            </thead>
            <tbody>
              <For each={rows}>
                {(row) => (
                  <tr class="align-top border-b border-line/50 last:border-0">
                    <For each={row.children}>
                      {(cell, i) => (
                        <td
                          class="px-3 py-2"
                          style={align[i()]
                            ? { "text-align": align[i()]! }
                            : undefined}
                        >
                          {renderInline(cell.children, seen)}
                        </td>
                      )}
                    </For>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </div>
      );
    }
    case "html":
      return b.value.startsWith("<!--") ? null : <p>{b.value}</p>;
    case "definition":
    case "footnoteDefinition":
      return null;
    default:
      return <p>{textOf(b)}</p>;
  }
}

export const Markdown: Component<{ text: string }> = (props) => {
  const blocks = createMemo(() => parseMd(props.text).children);
  // `blocks()` dep → fresh Set per document, so glossary "first use" re-scopes.
  const seen = createMemo(() => {
    blocks();
    return new Set<string>();
  });
  return (
    <div class="space-y-3 text-sm text-ink-2 leading-relaxed">
      <For each={blocks()}>{(b) => renderBlock(b, seen())}</For>
    </div>
  );
};
