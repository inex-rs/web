import { faviconSvg } from "../components/logo-geometry.ts";
import { currentTheme, THEMES } from "./theme.ts";

export function applyThemedFavicon() {
  const theme = THEMES.find((t) => t.id === currentTheme()) ?? THEMES[0];
  const href = `data:image/svg+xml,${
    encodeURIComponent(faviconSvg(theme.surface, theme.accent))
  }`;

  let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.append(link);
  }
  link.type = "image/svg+xml";
  link.href = href;

  document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
    ?.setAttribute("content", theme.surface);
}
