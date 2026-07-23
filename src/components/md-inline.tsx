import type { JSX } from "solid-js";
import type { Nodes, PhrasingContent, Root } from "mdast";
import { fromMarkdown } from "mdast-util-from-markdown";
import { gfmFromMarkdown } from "mdast-util-gfm";
import { gfm } from "micromark-extension-gfm";
import { Glossary, glossaryMatch } from "./glossary.tsx";

export function parseMd(text: string): Root {
  return fromMarkdown(text, {
    extensions: [gfm()],
    mdastExtensions: [gfmFromMarkdown()],
  });
}

// same-site only: http(s) or /path, but NOT //host (protocol-relative → off-site)
const SAFE_URL = /^(https?:\/\/|\/(?!\/))/;

export function textOf(node: Nodes): string {
  if ("value" in node) return node.value;
  if ("children" in node) return node.children.map(textOf).join("");
  return "";
}

function textRun(text: string, seen?: Set<string>): JSX.Element {
  if (!seen) return text;
  const out: JSX.Element[] = [];
  let buf = "";
  let i = 0;
  while (i < text.length) {
    const len = glossaryMatch(text, i);
    if (len) {
      const term = text.slice(i, i + len);
      const key = term.replace(/s$/, "");
      if (!seen.has(key)) {
        seen.add(key);
        if (buf) {
          out.push(buf);
          buf = "";
        }
        out.push(<Glossary term={term} />);
        i += len;
        continue;
      }
    }
    buf += text[i];
    i++;
  }
  if (buf) out.push(buf);
  return out;
}

export function renderInline(
  nodes: PhrasingContent[],
  seen?: Set<string>,
): JSX.Element[] {
  return nodes.map((n): JSX.Element => {
    switch (n.type) {
      case "text":
        return textRun(n.value, seen);
      case "inlineCode":
        return (
          <code class="rounded bg-panel-2 border border-line px-1 py-px font-mono text-[0.85em]">
            {n.value}
          </code>
        );
      case "strong":
        return (
          <strong class="font-semibold text-ink">
            {renderInline(n.children, seen)}
          </strong>
        );
      case "emphasis":
        return <em class="italic">{renderInline(n.children, seen)}</em>;
      case "delete":
        return <del>{renderInline(n.children, seen)}</del>;
      case "link": {
        if (!SAFE_URL.test(n.url)) return renderInline(n.children, seen);
        const external = /^https?:\/\//.test(n.url);
        return (
          <a
            href={n.url}
            rel={external ? "noopener noreferrer" : undefined}
            class="text-accent underline decoration-accent/40 hover:decoration-accent"
          >
            {renderInline(n.children, seen)}
          </a>
        );
      }
      case "image":
        return SAFE_URL.test(n.url)
          ? (
            <img
              src={n.url}
              alt={n.alt ?? ""}
              loading="lazy"
              class="rounded-lg border border-line"
            />
          )
          : null;
      case "break":
        return <br />;
      // raw HTML → literal text, never innerHTML
      default:
        return textOf(n);
    }
  });
}

export function inline(text: string, seen?: Set<string>): JSX.Element[] {
  return parseMd(text).children.flatMap((b) =>
    b.type === "paragraph" ? renderInline(b.children, seen) : [textOf(b)]
  );
}
