import { createSignal, type Signal } from "solid-js";
import { makePersisted } from "@solid-primitives/storage";

export type ThemeDef = {
  id: string;
  label: string;
  note: string;
  surface: string;
  accent: string;
};

export const THEMES: ThemeDef[] = [
  {
    id: "",
    label: "paper+violet",
    note: "the default",
    surface: "#faf8f4",
    accent: "#7c3aed",
  },
  {
    id: "studio",
    label: "studio",
    note: "the real app — black + blue",
    surface: "#000000",
    accent: "#3b82f6",
  },
  {
    id: "dmg",
    label: "dmg pea",
    note: "original game boy",
    surface: "#c5d1a5",
    accent: "#2b331a",
  },
  {
    id: "famicom",
    label: "famicom",
    note: "cream + crimson",
    surface: "#f3e8d7",
    accent: "#a3232e",
  },
  {
    id: "vb",
    label: "virtual boy",
    note: "black + red LED",
    surface: "#0d0a0a",
    accent: "#ff3b3b",
  },
  {
    id: "amber",
    label: "amber",
    note: "vintage terminal",
    surface: "#141008",
    accent: "#ffb020",
  },
  {
    id: "eink",
    label: "e-ink",
    note: "high-contrast grayscale",
    surface: "#f2f2ef",
    accent: "#111111",
  },
];

// Identity serialize keeps a RAW (non-JSON) id so index.html can read this key pre-bundle.
const [stored, setStored] = makePersisted<string, Signal<string>>(
  createSignal(""),
  { name: "inex-theme", serialize: (v) => v, deserialize: (v) => v },
);

export function currentTheme(): string {
  const t = stored();
  return THEMES.some((x) => x.id === t) ? t : "";
}

export function applyTheme(id: string) {
  if (id) document.documentElement.dataset.theme = id;
  else delete document.documentElement.dataset.theme;
  setStored(id);
  dispatchEvent(new CustomEvent("inex-themechange"));
}
