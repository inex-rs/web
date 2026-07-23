import { BarsMark } from "./logo.tsx";
import { ThemePicker } from "./theme-picker.tsx";
import { SignIn } from "./sign-in.tsx";
import { NotificationBell } from "./notifications.tsx";
import { Scroll } from "./scroll.tsx";
import { BootSplash } from "./boot-splash.tsx";
import {
  type Component,
  createEffect,
  ErrorBoundary,
  type ParentComponent,
} from "solid-js";
import { A, useLocation } from "@solidjs/router";
import { IconAlertTriangle } from "@tabler/icons-solidjs";

const RouteError: Component<{ err: unknown; reset: () => void }> = (props) => {
  const msg = () =>
    props.err instanceof Error ? props.err.message : String(props.err);
  return (
    <div class="min-h-[60vh] grid place-items-center p-6">
      <div class="w-full max-w-md rounded-lg border border-line bg-panel p-6 text-center space-y-3">
        <div class="mx-auto grid size-10 place-items-center rounded-full bg-danger/10 text-danger">
          <IconAlertTriangle size={20} stroke-width={1.75} />
        </div>
        <h1 class="text-lg font-semibold text-ink">Something went wrong</h1>
        <p class="text-sm text-muted break-words">{msg()}</p>
        <div class="flex items-center justify-center gap-2 pt-1">
          <button
            type="button"
            onClick={props.reset}
            class="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-on-accent hover:opacity-90 transition-opacity cursor-pointer"
          >
            Try again
          </button>
          <button
            type="button"
            onClick={() => location.reload()}
            class="rounded-md border border-ink/25 px-3 py-1.5 text-sm font-medium hover:border-accent/60 hover:text-accent transition-colors cursor-pointer"
          >
            Reload
          </button>
        </div>
      </div>
    </div>
  );
};

export const Layout: ParentComponent = (props) => {
  const loc = useLocation();
  const inSaros = () => loc.pathname.startsWith("/saros");
  const inDocs = () => loc.pathname.startsWith("/docs");
  const navCls = (active: boolean) =>
    `transition-colors ${
      active ? "text-ink font-semibold" : "text-muted hover:text-ink"
    }`;

  return (
    <div class="h-screen flex flex-col">
      <BootSplash />
      <Scroll element="main" class="flex-1 min-h-0">
        <ErrorBoundary
          fallback={(err, reset) => {
            createEffect<string | undefined>((prev) => {
              const path = loc.pathname;
              if (prev !== undefined && prev !== path) reset();
              return path;
            });
            return <RouteError err={err} reset={reset} />;
          }}
        >
          {props.children}
        </ErrorBoundary>
      </Scroll>
      <footer class="shrink-0 border-t border-line bg-surface">
        <div class="px-4 sm:px-6 h-14 flex items-center gap-5 sm:gap-7 text-sm">
          <A href="/" class="flex items-center gap-2 shrink-0">
            <BarsMark size={36} class="text-accent" />
            <span class="hidden sm:inline text-accent font-semibold font-mono text-lg">
              inex
            </span>
          </A>
          <nav class="flex items-center gap-4 sm:gap-5 font-medium">
            <A href="/saros" class={navCls(inSaros())}>Saros</A>
            <A href="/docs" class={navCls(inDocs())}>Docs</A>
            <a
              href="https://github.com/inex-rs/inex"
              class="hidden sm:inline text-muted hover:text-ink transition-colors"
            >
              GitHub
            </a>
          </nav>
          <span class="ml-auto flex items-center gap-3">
            <ThemePicker />
            <NotificationBell />
            <SignIn />
          </span>
        </div>
      </footer>
    </div>
  );
};
