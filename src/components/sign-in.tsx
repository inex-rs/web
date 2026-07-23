import { type Component, createSignal, Show } from "solid-js";
import { Portal } from "solid-js/web";
import { A } from "@solidjs/router";
import { Dialog } from "@ark-ui/solid/dialog";
import { IconKey, IconLogout } from "@tabler/icons-solidjs";
import { busy, register, session, signIn, signOut } from "../lib/auth.ts";
import { Avatar, HoverReveal } from "./ui.tsx";

export const SignIn: Component = () => (
  <Show when={session().signedIn} fallback={<SignedOut />}>
    <SignedIn />
  </Show>
);

function SignedOut() {
  const [open, setOpen] = createSignal(false);
  const [username, setUsername] = createSignal("");
  const [email, setEmail] = createSignal("");
  const [error, setError] = createSignal("");

  const start = () => {
    setError("");
    signIn().catch(() => {
      setOpen(true);
    });
  };

  const doRegister = () => {
    setError("");
    const u = username().trim();
    if (!u) {
      setError("enter a username");
      return;
    }
    register(u, email().trim())
      .then(() => {
        setOpen(false);
        setUsername("");
        setEmail("");
      })
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  };

  return (
    <>
      <button
        type="button"
        onClick={start}
        disabled={busy()}
        class="font-mono text-xs text-muted hover:text-ink transition-colors disabled:opacity-60 cursor-pointer"
      >
        {busy() ? "…" : "sign in"}
      </button>

      <Dialog.Root open={open()} onOpenChange={(d) => setOpen(d.open)}>
        <Portal>
          <Dialog.Backdrop class="fixed inset-0 bg-black/50 z-40" />
          <Dialog.Positioner class="fixed inset-0 z-50 grid place-items-center p-4">
            <Dialog.Content class="w-full max-w-sm rounded-xl border border-line bg-panel shadow-xl p-6 space-y-4">
              <div class="flex items-center gap-2">
                <IconKey size={18} class="text-accent" />
                <Dialog.Title class="text-base font-semibold text-ink">
                  Create an account
                </Dialog.Title>
              </div>
              <p class="text-xs text-ink-2">
                No passkey on this device yet. Pick a username and we'll
                register one. An email is optional — it's for account recovery
                and your avatar.
              </p>
              <input
                autofocus
                value={username()}
                onInput={(e) => setUsername(e.currentTarget.value)}
                onKeyDown={(e) => e.key === "Enter" && doRegister()}
                placeholder="username"
                class="w-full rounded-md border border-line bg-panel-2 px-3 py-2 text-sm placeholder:text-muted/70 focus:outline-none focus:border-accent/60"
              />
              <input
                type="email"
                value={email()}
                onInput={(e) => setEmail(e.currentTarget.value)}
                onKeyDown={(e) => e.key === "Enter" && doRegister()}
                placeholder="email (optional)"
                class="w-full rounded-md border border-line bg-panel-2 px-3 py-2 text-sm placeholder:text-muted/70 focus:outline-none focus:border-accent/60"
              />
              <Show when={error()}>
                <p class="text-xs text-danger">{error()}</p>
              </Show>
              <button
                type="button"
                onClick={doRegister}
                disabled={busy()}
                class="w-full rounded-md bg-accent text-on-accent hover:opacity-90 transition-opacity px-3 py-2 text-sm font-medium disabled:opacity-60 cursor-pointer"
              >
                {busy() ? "…" : "Create account"}
              </button>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  );
}

function SignedIn() {
  return (
    <HoverReveal
      title={session().username}
      reveal="group-hover:max-w-[16rem] group-focus-within:max-w-[16rem]"
      trigger={
        <A href="/account" aria-label="Account">
          <Avatar
            name={session().username}
            email={session().email}
            size={28}
            class="text-[11px] hover:text-accent transition-colors"
          />
        </A>
      }
    >
      <A
        href="/account"
        class="whitespace-nowrap pl-2 font-mono text-xs text-ink-2 hover:text-accent transition-colors"
      >
        {session().username}
      </A>
      <button
        type="button"
        onClick={() => signOut().catch(() => {})}
        title="Sign out"
        aria-label="Sign out"
        class="ml-2 mr-1.5 grid size-6 shrink-0 place-items-center rounded-md text-muted hover:bg-panel-2 hover:text-ink transition-colors cursor-pointer"
      >
        <IconLogout size={15} />
      </button>
    </HoverReveal>
  );
}
