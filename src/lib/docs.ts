import { ALL_CRATES } from "./crates.ts";
import { DOCS_TREE as GENERATED } from "./docs-generated.ts";

export type DocNode = {
  slug: string;
  title: string;
  order: number;
  summary?: string;
  interactive?: boolean;
  file?: string;
  children?: DocNode[];
};

export const DOCS_TREE: DocNode[] = GENERATED.map((n) =>
  n.slug !== "framework" ? n : {
    ...n,
    children: [
      ...(n.children ?? []),
      ...ALL_CRATES.map((c, i) => ({
        slug: c.slug,
        title: c.name,
        summary: c.blurb,
        order: 100 + i,
        file: `${c.slug}.md`,
      })),
    ],
  }
);

function flatten(nodes: DocNode[], out: DocNode[] = []): DocNode[] {
  for (const n of nodes) {
    out.push(n);
    if (n.children) flatten(n.children, out);
  }
  return out;
}

export const DOCS: DocNode[] = flatten(DOCS_TREE);

export function docBySlug(slug: string): DocNode | undefined {
  return DOCS.find((d) => d.slug === slug);
}

export function docNeighbours(
  slug: string,
): { prev?: DocNode; next?: DocNode } {
  const i = DOCS.findIndex((d) => d.slug === slug);
  if (i < 0) return {};
  return { prev: DOCS[i - 1], next: DOCS[i + 1] };
}

export function ancestorSlugs(slug: string): string[] {
  const parts = slug.split("/");
  return parts.slice(0, -1).map((_, i) => parts.slice(0, i + 1).join("/"));
}

export function stripFrontmatter(text: string): string {
  return text.replace(/^---\n[\s\S]*?\n---\n?/, "");
}
