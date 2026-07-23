import {
  type Component,
  createEffect,
  createResource,
  createSignal,
  type JSX,
  on,
  Show,
} from "solid-js";
import { Clipboard } from "@ark-ui/solid/clipboard";

async function gravatarHash(email: string): Promise<string> {
  const data = new TextEncoder().encode(email.trim().toLowerCase());
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(
    new Uint8Array(digest),
    (b) => b.toString(16).padStart(2, "0"),
  )
    .join("");
}

export const Avatar: Component<{
  name: string;
  email?: string;
  size: number;
  class?: string;
}> = (props) => {
  const [broken, setBroken] = createSignal(false);
  const [hash] = createResource(
    () => props.email?.trim() || undefined,
    gravatarHash,
  );
  createEffect(on(() => props.email, () => setBroken(false)));
  const letter = () => (props.name.trim()[0] ?? "?").toUpperCase();
  return (
    <span
      class={`grid place-items-center overflow-hidden shrink-0 bg-panel-2 font-mono text-ink-2 ${
        props.class ?? ""
      }`}
      style={{ width: `${props.size}px`, height: `${props.size}px` }}
    >
      <Show when={hash() && !broken()} fallback={<>{letter()}</>}>
        <img
          src={`https://www.gravatar.com/avatar/${hash()}?s=${
            props.size * 2
          }&d=404`}
          alt=""
          class="size-full object-cover"
          onError={() => setBroken(true)}
        />
      </Show>
    </span>
  );
};

export const HoverReveal: Component<{
  trigger: JSX.Element;
  reveal: string;
  children: JSX.Element;
  class?: string;
  title?: string;
  side?: "left" | "right";
  bare?: boolean;
}> = (props) => {
  const chrome = props.bare
    ? ""
    : "overflow-hidden rounded-lg border border-ink/20 bg-panel transition-colors hover:border-ink/40 focus-within:border-ink/40";
  return (
    <div
      title={props.title}
      class={`group inline-flex items-center ${
        props.side === "left" ? "flex-row-reverse" : ""
      } ${chrome} ${props.class ?? ""}`}
    >
      <div class="shrink-0">{props.trigger}</div>
      <div
        class={`flex items-center overflow-hidden max-w-0 opacity-0 transition-all duration-500 ease-out group-hover:opacity-100 group-focus-within:opacity-100 ${props.reveal}`}
      >
        {props.children}
      </div>
    </div>
  );
};

export const Chip: Component<{
  tone?: "accent" | "success" | "warn" | "danger" | "neutral";
  children: JSX.Element;
}> = (props) => {
  const tones: Record<string, string> = {
    accent: "border-accent/40 bg-accent/10 text-accent",
    success: "border-success/40 bg-success/10 text-success",
    warn: "border-warn/40 bg-warn/10 text-warn",
    danger: "border-danger/40 bg-danger/10 text-danger",
    neutral: "border-ink/25 bg-panel-2 text-ink-2",
  };
  return (
    <span
      class={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium leading-4 ${
        tones[props.tone ?? "neutral"]
      }`}
    >
      {props.children}
    </span>
  );
};

export const Copyable: Component<{ text: string; label?: string }> = (
  props,
) => {
  return (
    <Clipboard.Root value={props.text} timeout={1200} class="inline-flex">
      <Clipboard.Trigger
        title={`copy ${props.text}`}
        class="group inline-flex items-center gap-1.5 font-mono text-xs text-muted hover:text-ink transition-colors cursor-pointer"
      >
        <span>{props.label ?? props.text}</span>
        <Clipboard.Indicator
          copied={<span class="text-accent text-[10px]">copied</span>}
        >
          <svg
            class="size-3 opacity-0 group-hover:opacity-60 transition-opacity"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
          >
            <rect x="5" y="5" width="8" height="8" rx="1" />
            <path d="M11 5V4a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h1" />
          </svg>
        </Clipboard.Indicator>
      </Clipboard.Trigger>
    </Clipboard.Root>
  );
};

export const Skeleton: Component<{ class?: string }> = (props) => (
  <div class={`animate-pulse rounded-md bg-ink/10 ${props.class ?? ""}`} />
);
