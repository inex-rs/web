import {
  type Component,
  createResource,
  createSignal,
  Match,
  Show,
  Switch,
} from "solid-js";
import { useSearchParams } from "@solidjs/router";
import { IconDeviceDesktop, IconKey } from "@tabler/icons-solidjs";
import {
  busy,
  decideLogin,
  describeLogin,
  session,
  signIn,
} from "../lib/auth.ts";
import { useTitle } from "../lib/title.ts";

export const Authorize: Component = () => {
  useTitle(() => "Authorize a device");
  const [params] = useSearchParams();
  const code = () => (typeof params.code === "string" ? params.code : "");

  const [decision, setDecision] = createSignal<"approved" | "denied" | "">("");
  const [error, setError] = createSignal("");

  const [info] = createResource(
    () => (session().signedIn && code() ? code() : null),
    (c) => describeLogin(c),
  );

  const decide = (approve: boolean) => {
    setError("");
    decideLogin(code(), approve)
      .then(() => setDecision(approve ? "approved" : "denied"))
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  };

  return (
    <div class="flex-1 grid place-items-center p-6">
      <div class="w-full max-w-sm rounded-xl border border-line bg-panel shadow-xl p-6 space-y-4">
        <div class="flex items-center gap-2">
          <IconDeviceDesktop size={18} class="text-accent" />
          <h1 class="text-base font-semibold text-ink">Authorize a device</h1>
        </div>

        <Switch>
          <Match when={!code()}>
            <p class="text-sm text-ink-2">
              This link is missing its request code. Start the sign-in again
              from your terminal.
            </p>
          </Match>

          <Match when={decision()}>
            <p class="text-sm text-ink-2">
              {decision() === "approved"
                ? "Approved — return to your terminal, you're signed in."
                : "Denied. Nothing was granted."}
            </p>
          </Match>

          <Match when={!session().signedIn}>
            <p class="text-xs text-ink-2">
              Sign in with your passkey to confirm this request as yourself.
            </p>
            <button
              type="button"
              onClick={() => {
                setError("");
                signIn().catch((e) =>
                  setError(e instanceof Error ? e.message : String(e))
                );
              }}
              disabled={busy()}
              class="w-full flex items-center justify-center gap-2 rounded-md bg-accent text-on-accent hover:opacity-90 transition-opacity px-3 py-2 text-sm font-medium disabled:opacity-60 cursor-pointer"
            >
              <IconKey size={15} />
              {busy() ? "…" : "Sign in with passkey"}
            </button>
          </Match>

          <Match when={session().signedIn}>
            <Show
              when={info()?.found}
              fallback={
                <p class="text-sm text-ink-2">
                  <Show when={!info.loading} fallback="Looking up the request…">
                    That request wasn't found — it may have expired. Start the
                    sign-in again from your terminal.
                  </Show>
                </p>
              }
            >
              <div class="rounded-md border border-line bg-panel-2 px-3 py-2 text-sm">
                <div class="text-ink-2">
                  <span class="font-mono text-ink">{info()?.label}</span>{" "}
                  wants to sign in as{" "}
                  <span class="font-medium text-ink">{session().username}
                  </span>.
                </div>
                <div class="mt-1 font-mono text-xs text-muted">
                  code {code()}
                </div>
              </div>
              <p class="text-[11px] text-muted">
                Only approve if you just started this from your own terminal.
              </p>
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => decide(true)}
                  class="flex-1 rounded-md bg-accent text-on-accent hover:opacity-90 transition-opacity px-3 py-2 text-sm font-medium cursor-pointer"
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => decide(false)}
                  class="rounded-md border border-line hover:border-accent/60 hover:text-accent transition-colors px-3 py-2 text-sm cursor-pointer"
                >
                  Deny
                </button>
              </div>
            </Show>
          </Match>
        </Switch>

        <Show when={error()}>
          <p class="text-xs text-danger">{error()}</p>
        </Show>
      </div>
    </div>
  );
};
