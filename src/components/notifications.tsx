import {
  type Component,
  createEffect,
  createMemo,
  createSignal,
  For,
  Show,
} from "solid-js";
import { Portal } from "solid-js/web";
import { useNavigate } from "@solidjs/router";
import { Popover } from "@ark-ui/solid/popover";
import { auth_pb } from "@inex/protobufs";
import {
  IconBell,
  IconChecks,
  IconCircleCheck,
  IconCircleX,
  IconLogin,
  IconPackage,
} from "@tabler/icons-solidjs";
import { auth } from "../lib/client.ts";
import { session } from "../lib/auth.ts";
import { relativeTime } from "../lib/format.ts";
import { createWatch } from "../lib/watch.ts";

const Kind = auth_pb.NotificationKind;

const KIND_ICON: Record<number, typeof IconBell> = {
  [Kind.SUBMISSION_APPROVED]: IconCircleCheck,
  [Kind.SUBMISSION_REJECTED]: IconCircleX,
  [Kind.NEW_FIRMWARE]: IconPackage,
  [Kind.NEW_SIGN_IN]: IconLogin,
};
const KIND_TONE: Record<number, string> = {
  [Kind.SUBMISSION_APPROVED]: "text-accent",
  [Kind.SUBMISSION_REJECTED]: "text-danger",
  [Kind.NEW_FIRMWARE]: "text-accent",
  [Kind.NEW_SIGN_IN]: "text-warn",
};

export const NotificationBell: Component = () => (
  <Show when={session().signedIn}>
    <Bell />
  </Show>
);

function Bell() {
  const navigate = useNavigate();
  const [notes, setNotes] = createSignal<auth_pb.Notification[]>([]);
  const [open, setOpen] = createSignal(false);

  const unread = createMemo(() => notes().filter((n) => !n.read).length);
  const badge = () => (unread() > 9 ? "9+" : String(unread()));

  createEffect(() => {
    if (!session().signedIn) return;
    createWatch(
      (signal) => auth.watchNotifications({ limit: 50 }, { signal }),
      (msg) => setNotes(msg.notifications),
    );
  });

  const markAll = () => {
    auth.markAllNotificationsRead({}).catch(() => {});
  };

  const openNote = (n: auth_pb.Notification) => {
    setOpen(false);
    if (!n.read) auth.markNotificationRead({ id: n.id }).catch(() => {});
    if (n.link) navigate(n.link);
  };

  return (
    <Popover.Root
      open={open()}
      onOpenChange={(d) => setOpen(d.open)}
      positioning={{ placement: "top-end", gutter: 8 }}
    >
      <Popover.Trigger
        aria-label="Notifications"
        title="Notifications"
        class="relative grid size-7 place-items-center rounded-md text-muted hover:bg-panel-2 hover:text-ink transition-colors cursor-pointer data-[state=open]:text-ink data-[state=open]:bg-panel-2"
      >
        <IconBell size={17} />
        <Show when={unread() > 0}>
          <span class="absolute -right-1 -top-1 grid min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-semibold leading-4 text-on-accent">
            {badge()}
          </span>
        </Show>
      </Popover.Trigger>

      <Portal>
        <Popover.Positioner class="z-50">
          <Popover.Content class="animate-rise w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-line bg-panel shadow-xl focus:outline-none">
            <header class="flex items-center gap-2 border-b border-line px-3 py-2">
              <span class="text-sm font-semibold text-ink">Notifications</span>
              <Show when={unread() > 0}>
                <span class="font-mono text-[11px] text-muted">
                  {unread()} unread
                </span>
              </Show>
              <button
                type="button"
                onClick={markAll}
                disabled={unread() === 0}
                class="ml-auto inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] text-muted transition-colors hover:text-accent disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-muted cursor-pointer"
              >
                <IconChecks size={13} /> Mark all read
              </button>
            </header>

            <div class="max-h-[min(70vh,26rem)] overflow-y-auto">
              <Show
                when={notes().length}
                fallback={
                  <p class="px-3 py-10 text-center text-xs text-muted">
                    You're all caught up.
                  </p>
                }
              >
                <ul class="divide-y divide-line">
                  <For each={notes()}>
                    {(n) => {
                      const Icon = KIND_ICON[n.kind] ?? IconBell;
                      return (
                        <li>
                          <button
                            type="button"
                            onClick={() => openNote(n)}
                            class="flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-panel-2/60 cursor-pointer"
                            classList={{ "bg-accent/10": !n.read }}
                          >
                            <Icon
                              size={16}
                              class={`mt-0.5 shrink-0 ${
                                KIND_TONE[n.kind] ?? "text-muted"
                              }`}
                            />
                            <span class="min-w-0 flex-1">
                              <span class="flex items-center gap-2">
                                <span class="truncate text-sm font-semibold text-ink">
                                  {n.title}
                                </span>
                                <Show when={!n.read}>
                                  <span
                                    class="ml-auto size-1.5 shrink-0 rounded-full bg-accent"
                                    aria-label="unread"
                                  />
                                </Show>
                              </span>
                              <Show when={n.detail}>
                                <span class="mt-0.5 block text-xs text-ink-2 line-clamp-2">
                                  {n.detail}
                                </span>
                              </Show>
                              <span class="mt-0.5 block font-mono text-[10px] text-muted">
                                {relativeTime(n.at)}
                              </span>
                            </span>
                          </button>
                        </li>
                      );
                    }}
                  </For>
                </ul>
              </Show>
            </div>
          </Popover.Content>
        </Popover.Positioner>
      </Portal>
    </Popover.Root>
  );
}
