import { type Component, createSignal, For, type JSX } from "solid-js";
import { Tooltip } from "@ark-ui/solid/tooltip";
import { applyTheme, currentTheme, THEMES } from "../lib/theme.ts";
import { HoverReveal } from "./ui.tsx";

type Theme = (typeof THEMES)[number];

const Swatch: Component<{ t: Theme; active: boolean; onClick?: () => void }> = (
  props,
) => {
  return (
    <Tooltip.Root
      openDelay={250}
      closeDelay={0}
      positioning={{ placement: "top" }}
    >
      <Tooltip.Trigger
        asChild={(
          triggerProps: () => JSX.HTMLAttributes<HTMLButtonElement>,
        ) => (
          <button
            {...triggerProps()}
            type="button"
            onClick={props.onClick}
            aria-label={props.t.label}
            class={`size-6 sm:size-7 rounded-lg border grid place-items-center transition-colors ${
              props.onClick ? "cursor-pointer" : "cursor-default"
            } ${
              props.active
                ? "border-ink/20"
                : "border-ink/20 hover:border-ink/40"
            }`}
            style={{ background: props.t.surface }}
          >
            <span
              class="size-2.5 sm:size-3 rounded-full"
              style={{ background: props.t.accent }}
            />
          </button>
        )}
      />
      <Tooltip.Positioner>
        <Tooltip.Content class="rounded-md border border-line bg-panel px-2 py-1 text-[11px] text-ink shadow-md">
          {props.t.label} — {props.t.note}
        </Tooltip.Content>
      </Tooltip.Positioner>
    </Tooltip.Root>
  );
};

export const ThemePicker: Component = () => {
  const [cur, setCur] = createSignal(currentTheme());
  const active = () => THEMES.find((t) => t.id === cur()) ?? THEMES[0];
  const pick = (id: string) => {
    applyTheme(id);
    setCur(id);
  };
  return (
    <HoverReveal
      bare
      side="left"
      title="Theme"
      reveal="group-hover:max-w-[20rem] group-focus-within:max-w-[20rem]"
      trigger={<Swatch t={active()} active />}
    >
      <div class="flex items-center gap-2 pr-2">
        <For each={THEMES.filter((t) => t.id !== cur())}>
          {(t) => <Swatch t={t} active={false} onClick={() => pick(t.id)} />}
        </For>
      </div>
    </HoverReveal>
  );
};
