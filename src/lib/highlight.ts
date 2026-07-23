import type { HighlighterCore } from "shiki/core";

const ALIAS: Record<string, string> = {
  shell: "bash",
  sh: "bash",
  bash: "bash",
  zsh: "bash",
  rust: "rust",
  rs: "rust",
  json: "json",
};

export type Tok = {
  content: string;
  color?: string;
  italic?: boolean;
  bold?: boolean;
};

let hl: Promise<HighlighterCore> | null = null;

function loadHighlighter(): Promise<HighlighterCore> {
  if (!hl) {
    hl = (async () => {
      const [{ createHighlighterCore }, { createJavaScriptRegexEngine }] =
        await Promise.all([
          import("shiki/core"),
          import("shiki/engine/javascript"),
        ]);
      return await createHighlighterCore({
        themes: [import("shiki/themes/vitesse-dark.mjs")],
        langs: [
          import("shiki/langs/bash.mjs"),
          import("shiki/langs/rust.mjs"),
          import("shiki/langs/json.mjs"),
        ],
        engine: createJavaScriptRegexEngine({ forgiving: true }),
      });
    })();
  }
  return hl;
}

export function highlight(
  code: string,
  lang: string,
): Promise<Tok[][] | null> {
  const grammar = ALIAS[lang];
  if (!grammar) return Promise.resolve(null);
  return loadHighlighter()
    .then((h) => {
      const { tokens } = h.codeToTokens(code, {
        lang: grammar,
        theme: "vitesse-dark",
      });
      return tokens.map((line) =>
        line.map((t) => ({
          content: t.content,
          color: t.color,
          italic: ((t.fontStyle ?? 0) & 1) !== 0,
          bold: ((t.fontStyle ?? 0) & 2) !== 0,
        }))
      );
    })
    .catch(() => null);
}
