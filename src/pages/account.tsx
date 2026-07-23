import {
  type Component,
  createEffect,
  createResource,
  createSignal,
  For,
  type JSX,
  type ParentComponent,
  Show,
} from "solid-js";
import { Portal } from "solid-js/web";
import { A } from "@solidjs/router";
import { Dialog } from "@ark-ui/solid/dialog";
import { Clipboard } from "@ark-ui/solid/clipboard";
import { Tabs } from "@ark-ui/solid/tabs";
import { timestampDate } from "@bufbuild/protobuf/wkt";
import type { Timestamp } from "@bufbuild/protobuf/wkt";
import { auth_pb, saros_pb } from "@inex/protobufs";
import {
  IconChartBar,
  IconDownload,
  IconHistory,
  IconKey,
  IconLogout,
  IconMail,
  IconPackage,
  IconPlus,
  IconShieldLock,
  IconTerminal2,
  IconTrash,
  IconWorld,
} from "@tabler/icons-solidjs";
import { debounce } from "@solid-primitives/scheduled";
import {
  addPasskey,
  busy,
  createApiToken,
  listCredentials,
  removeCredential,
  revokeOtherSessions,
  revokeSession,
  session,
  setEmail,
  signOut,
} from "../lib/auth.ts";
import { auth, firmware, humanSize } from "../lib/client.ts";
import { compactNum, relativeTime, uptime } from "../lib/format.ts";
import { useTitle } from "../lib/title.ts";
import { createWatch } from "../lib/watch.ts";
import { Avatar, Chip, Skeleton } from "../components/ui.tsx";
import { Sparkline } from "../components/sparkline.tsx";

function when(ts?: Timestamp): string {
  if (!ts || ts.seconds === 0n) return "unknown";
  return timestampDate(ts).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function whenExact(ts?: Timestamp): string {
  if (!ts || ts.seconds === 0n) return "—";
  return timestampDate(ts).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const AUDIT_LABEL: Record<number, string> = {
  [saros_pb.AuditAction.FIRMWARE_SUBMITTED]: "firmware submitted",
  [saros_pb.AuditAction.FIRMWARE_APPROVED]: "firmware approved",
  [saros_pb.AuditAction.FIRMWARE_REJECTED]: "firmware rejected",
  [saros_pb.AuditAction.ACCOUNT_REGISTERED]: "account registered",
  [saros_pb.AuditAction.SIGNED_IN]: "signed in",
  [saros_pb.AuditAction.TOKEN_CREATED]: "token created",
  [saros_pb.AuditAction.SESSION_REVOKED]: "session revoked",
  [saros_pb.AuditAction.CREDENTIAL_ADDED]: "passkey added",
  [saros_pb.AuditAction.CREDENTIAL_REMOVED]: "passkey removed",
  [saros_pb.AuditAction.EMAIL_CHANGED]: "email changed",
};
const AUDIT_TONE: Record<number, "accent" | "warn" | "danger" | "neutral"> = {
  [saros_pb.AuditAction.FIRMWARE_SUBMITTED]: "warn",
  [saros_pb.AuditAction.FIRMWARE_APPROVED]: "accent",
  [saros_pb.AuditAction.FIRMWARE_REJECTED]: "danger",
  [saros_pb.AuditAction.ACCOUNT_REGISTERED]: "accent",
  [saros_pb.AuditAction.SIGNED_IN]: "neutral",
  [saros_pb.AuditAction.TOKEN_CREATED]: "warn",
  [saros_pb.AuditAction.SESSION_REVOKED]: "danger",
  [saros_pb.AuditAction.CREDENTIAL_ADDED]: "warn",
  [saros_pb.AuditAction.CREDENTIAL_REMOVED]: "danger",
  [saros_pb.AuditAction.EMAIL_CHANGED]: "warn",
};
const auditLabel = (a: number) => AUDIT_LABEL[a] ?? "activity";
const auditTone = (a: number) => AUDIT_TONE[a] ?? "neutral";

const CATEGORY_DOT: Record<number, string> = {
  [saros_pb.AuditCategory.SECURITY]: "bg-warn",
  [saros_pb.AuditCategory.MODERATION]: "bg-accent",
  [saros_pb.AuditCategory.ROUTINE]: "bg-ink/25",
};
const CATEGORY_NAME: Record<number, string> = {
  [saros_pb.AuditCategory.UNSPECIFIED]: "all",
  [saros_pb.AuditCategory.SECURITY]: "security",
  [saros_pb.AuditCategory.MODERATION]: "moderation",
  [saros_pb.AuditCategory.ROUTINE]: "routine",
};
const categoryDot = (c: number) => CATEGORY_DOT[c] ?? "bg-ink/25";
const categoryName = (c: number) => CATEGORY_NAME[c] ?? "routine";

const CATEGORY_OPTIONS: { value: number; label: string }[] = [
  { value: saros_pb.AuditCategory.UNSPECIFIED, label: "All categories" },
  { value: saros_pb.AuditCategory.SECURITY, label: "Security" },
  { value: saros_pb.AuditCategory.MODERATION, label: "Moderation" },
  { value: saros_pb.AuditCategory.ROUTINE, label: "Routine" },
];

function auditRow(e: saros_pb.AuditEntry): JSX.Element {
  return (
    <li class="flex items-center gap-3 px-4 py-3">
      <span
        class={`size-1.5 shrink-0 rounded-full ${categoryDot(e.category)}`}
        title={categoryName(e.category)}
      />
      <span class="shrink-0">
        <Chip tone={auditTone(e.action)}>{auditLabel(e.action)}</Chip>
      </span>
      <div class="min-w-0 flex-1">
        <p class="truncate text-sm text-ink">{e.actor || "anonymous"}</p>
        <Show when={e.target}>
          <p class="truncate font-mono text-[11px] text-muted">{e.target}</p>
        </Show>
      </div>
      <span class="shrink-0 font-mono text-[11px] text-muted">
        {whenExact(e.at)}
      </span>
    </li>
  );
}

const SUBMISSION_LABEL: Record<number, string> = {
  [saros_pb.SubmissionStatus.PENDING]: "pending review",
  [saros_pb.SubmissionStatus.APPROVED]: "approved",
  [saros_pb.SubmissionStatus.REJECTED]: "not accepted",
};
const SUBMISSION_TONE: Record<
  number,
  "accent" | "warn" | "danger" | "neutral"
> = {
  [saros_pb.SubmissionStatus.PENDING]: "warn",
  [saros_pb.SubmissionStatus.APPROVED]: "accent",
  [saros_pb.SubmissionStatus.REJECTED]: "danger",
};
const submissionLabel = (s: number) => SUBMISSION_LABEL[s] ?? "submitted";
const submissionTone = (s: number) => SUBMISSION_TONE[s] ?? "neutral";

function submissionRow(s: saros_pb.Submission): JSX.Element {
  const approved = s.status === saros_pb.SubmissionStatus.APPROVED;
  const reviewed = !!s.reviewedAt && s.reviewedAt.seconds !== 0n;
  // Fresh nodes per call so the two Show branches never share a DOM node.
  const coord = () => (
    <>
      {s.deviceId} · <span class="font-mono">{s.version}</span>
    </>
  );
  return (
    <li class="flex items-center gap-3 px-4 py-3">
      <span class="shrink-0">
        <Chip tone={submissionTone(s.status)}>{submissionLabel(s.status)}</Chip>
      </span>
      <div class="min-w-0 flex-1">
        <Show
          when={approved}
          fallback={<p class="truncate text-sm text-ink">{coord()}</p>}
        >
          <A
            href={`/saros/${s.deviceId}/${s.version}`}
            class="block truncate text-sm text-ink hover:text-accent transition-colors"
          >
            {coord()}
          </A>
        </Show>
        <Show when={reviewed}>
          <p class="font-mono text-[11px] text-muted">
            reviewed {relativeTime(s.reviewedAt)}
          </p>
        </Show>
      </div>
      <span
        class="shrink-0 font-mono text-[11px] text-muted"
        title={whenExact(s.submittedAt)}
      >
        {relativeTime(s.submittedAt) || whenExact(s.submittedAt)}
      </span>
    </li>
  );
}

function auditIso(ts?: Timestamp): string {
  if (!ts || ts.seconds === 0n) return "";
  return timestampDate(ts).toISOString();
}

const csvCell = (v: string) => `"${v.replace(/"/g, '""')}"`;

function auditCsv(rows: saros_pb.AuditEntry[]): string {
  const lines = [
    ["time", "category", "action", "actor", "target"].map(csvCell)
      .join(","),
  ];
  for (const e of rows) {
    lines.push(
      [
        auditIso(e.at),
        categoryName(e.category),
        auditLabel(e.action),
        e.actor,
        e.target,
      ].map(csvCell).join(","),
    );
  }
  return lines.join("\r\n");
}

function downloadText(text: string, name: string, type: string): void {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

type TabId = "account" | "admin";

export const Account: Component = () => {
  useTitle(() => "Account · inex");
  const [tab, setTab] = createSignal<TabId>("account");
  const active = (): TabId =>
    tab() === "admin" && session().admin ? "admin" : "account";

  return (
    <div class="flex-1 p-4 sm:p-6">
      <div class="mx-auto max-w-2xl space-y-6 animate-rise">
        <Show
          when={session().signedIn}
          fallback={
            <div class="grid place-items-center py-24 text-center text-sm text-ink-2">
              <IconKey size={28} class="text-muted mb-3" />
              <p>Sign in to manage your account.</p>
            </div>
          }
        >
          <Header />

          <Tabs.Root
            value={active()}
            onValueChange={(d) => setTab(d.value as TabId)}
          >
            <Tabs.List class="flex items-center gap-1 border-b border-line">
              <TabTrigger value="account" current={active()}>
                Account
              </TabTrigger>
              <Show when={session().admin}>
                <TabTrigger value="admin" current={active()}>
                  Admin
                </TabTrigger>
              </Show>
            </Tabs.List>

            <Tabs.Content value="account" class="space-y-6 pt-6">
              <Email />
              <Passkeys />
              <Sessions active={() => active() === "account"} />
              <MySubmissions active={() => active() === "account"} />
              <SecurityActivity active={() => active() === "account"} />
            </Tabs.Content>
            <Show when={session().admin}>
              <Tabs.Content value="admin" class="space-y-6 pt-6">
                <Admin active={() => active() === "admin"} />
                <AuditLog active={() => active() === "admin"} />
              </Tabs.Content>
            </Show>
          </Tabs.Root>
        </Show>
      </div>
    </div>
  );
};

const TabTrigger: Component<
  { value: TabId; current: TabId; children: JSX.Element }
> = (props) => (
  <Tabs.Trigger
    value={props.value}
    class="-mb-px cursor-pointer border-b-2 px-3 py-2 text-sm font-medium transition-colors"
    classList={{
      "border-accent text-ink": props.current === props.value,
      "border-transparent text-muted hover:text-ink":
        props.current !== props.value,
    }}
  >
    {props.children}
  </Tabs.Trigger>
);

const Header: Component = () => {
  return (
    <div class="flex items-center gap-3">
      <Avatar
        name={session().username}
        email={session().email}
        size={40}
        class="rounded-lg text-base"
      />
      <div>
        <h1 class="text-lg font-semibold text-ink leading-tight">
          {session().username}
        </h1>
        <Show when={session().admin}>
          <Chip tone="accent">admin</Chip>
        </Show>
      </div>
    </div>
  );
};

const Email: Component = () => {
  const [value, setValue] = createSignal(session().email);
  const [saving, setSaving] = createSignal(false);
  const [error, setError] = createSignal("");
  const dirty = () => value().trim() !== session().email;

  const run = (fn: () => Promise<void>) => {
    setError("");
    setSaving(true);
    fn()
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setSaving(false));
  };
  const save = () => run(() => setEmail(value().trim()));
  const clear = () =>
    run(async () => {
      await setEmail("");
      setValue("");
    });

  return (
    <Card
      title="Recovery email"
      icon={<IconMail size={16} />}
      action={
        <Show when={session().email}>
          <GhostButton
            tone="danger"
            onClick={clear}
            disabled={saving()}
            title="Remove email"
          >
            <IconTrash size={14} /> Remove
          </GhostButton>
        </Show>
      }
    >
      <p class="text-xs text-ink-2 mb-3">
        Used for account recovery and to resolve your avatar — only its hash is
        shared with Gravatar, never the address.
      </p>
      <div class="flex items-center gap-2">
        <input
          type="email"
          value={value()}
          onInput={(e) => setValue(e.currentTarget.value)}
          onKeyDown={(e) => e.key === "Enter" && dirty() && save()}
          placeholder="you@example.com"
          class="min-w-0 flex-1 rounded-md border border-line bg-panel-2 px-3 py-2 text-sm placeholder:text-muted/70 focus:outline-none focus:border-accent/60"
        />
        <button
          type="button"
          onClick={save}
          disabled={saving() || !dirty()}
          class="rounded-md bg-accent text-on-accent hover:opacity-90 transition-opacity px-3 py-2 text-sm font-medium disabled:opacity-50 cursor-pointer"
        >
          {saving() ? "…" : "Save"}
        </button>
      </div>
      <Show when={error()}>
        <p class="mt-2 text-xs text-danger">{error()}</p>
      </Show>
    </Card>
  );
};

type CardProps = {
  title: string;
  icon: JSX.Element;
  action?: JSX.Element;
  bodyClass?: string;
};

const Card: ParentComponent<CardProps> = (props) => {
  return (
    <section class="overflow-hidden rounded-xl border border-line bg-panel shadow-sm">
      <header class="flex items-center gap-2 border-b border-line px-4 py-3">
        <span class="text-accent">{props.icon}</span>
        <h2 class="text-sm font-semibold text-ink">{props.title}</h2>
        <span class="ml-auto">{props.action}</span>
      </header>
      <div class={props.bodyClass ?? "p-4"}>{props.children}</div>
    </section>
  );
};

type GhostButtonProps = {
  onClick: () => void;
  disabled?: boolean;
  title?: string;
  tone?: "danger";
};

const GhostButton: ParentComponent<GhostButtonProps> = (props) => {
  const tone = props.tone === "danger"
    ? "hover:border-danger/60 hover:text-danger"
    : "hover:border-accent/60 hover:text-accent";
  return (
    <button
      type="button"
      onClick={() => props.onClick()}
      disabled={props.disabled}
      title={props.title}
      class={`inline-flex items-center gap-1.5 rounded-md border border-line px-2.5 py-1.5 text-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${tone}`}
    >
      {props.children}
    </button>
  );
};

const Passkeys: Component = () => {
  const [creds, { refetch }] = createResource(listCredentials);
  const [open, setOpen] = createSignal(false);
  const [label, setLabel] = createSignal("");
  const [error, setError] = createSignal("");

  const add = () => {
    setError("");
    addPasskey(label().trim() || "passkey")
      .then(() => {
        setOpen(false);
        setLabel("");
        refetch();
      })
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  };

  const remove = (id: string) => {
    setError("");
    removeCredential(id)
      .then(() => refetch())
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  };

  return (
    <Card
      title="Passkeys"
      icon={<IconKey size={16} />}
      bodyClass="p-0"
      action={
        <Dialog.Root open={open()} onOpenChange={(d) => setOpen(d.open)}>
          <Dialog.Trigger class="inline-flex items-center gap-1 rounded-md bg-accent text-on-accent hover:opacity-90 transition-opacity px-2.5 py-1.5 text-xs font-medium cursor-pointer">
            <IconPlus size={14} /> Add
          </Dialog.Trigger>
          <Portal>
            <Dialog.Backdrop class="fixed inset-0 bg-black/50 z-40" />
            <Dialog.Positioner class="fixed inset-0 z-50 grid place-items-center p-4">
              <Dialog.Content class="w-full max-w-sm rounded-xl border border-line bg-panel shadow-xl p-6 space-y-4">
                <div class="flex items-center gap-2">
                  <IconKey size={18} class="text-accent" />
                  <Dialog.Title class="text-base font-semibold text-ink">
                    Add a passkey
                  </Dialog.Title>
                </div>
                <p class="text-xs text-ink-2">
                  Register another device or authenticator to this account. Give
                  it a name so you can tell them apart.
                </p>
                <input
                  autofocus
                  value={label()}
                  onInput={(e) => setLabel(e.currentTarget.value)}
                  onKeyDown={(e) => e.key === "Enter" && add()}
                  placeholder="e.g. MacBook Touch ID"
                  class="w-full rounded-md border border-line bg-panel-2 px-3 py-2 text-sm placeholder:text-muted/70 focus:outline-none focus:border-accent/60"
                />
                <Show when={error()}>
                  <p class="text-xs text-danger">{error()}</p>
                </Show>
                <button
                  type="button"
                  onClick={add}
                  disabled={busy()}
                  class="w-full rounded-md bg-accent text-on-accent hover:opacity-90 transition-opacity px-3 py-2 text-sm font-medium disabled:opacity-60 cursor-pointer"
                >
                  {busy() ? "…" : "Create passkey"}
                </button>
              </Dialog.Content>
            </Dialog.Positioner>
          </Portal>
        </Dialog.Root>
      }
    >
      <Show
        when={!creds.loading}
        fallback={<Skeleton class="m-4 h-10" />}
      >
        <Show
          when={(creds() ?? []).length}
          fallback={
            <p class="px-4 py-3 text-xs text-muted">No passkeys yet.</p>
          }
        >
          <ul class="divide-y divide-line">
            <For each={creds()}>
              {(c) => (
                <li class="flex items-center gap-3 px-4 py-3">
                  <IconKey size={16} class="text-muted shrink-0" />
                  <div class="min-w-0 flex-1">
                    <p class="text-sm text-ink truncate">{c.label}</p>
                    <p class="font-mono text-[11px] text-muted">
                      added {when(c.addedAt)}
                    </p>
                  </div>
                  <GhostButton
                    tone="danger"
                    onClick={() => remove(c.id)}
                    disabled={(creds() ?? []).length <= 1}
                    title={(creds() ?? []).length <= 1
                      ? "Add another passkey before removing this one"
                      : "Remove passkey"}
                  >
                    <IconTrash size={14} />
                  </GhostButton>
                </li>
              )}
            </For>
          </ul>
        </Show>
        <Show when={error() && !open()}>
          <p class="px-4 pb-3 text-xs text-danger">{error()}</p>
        </Show>
      </Show>
    </Card>
  );
};

const Sessions: Component<{ active: () => boolean }> = (props) => {
  const [sessions, setSessions] = createSignal<auth_pb.Session[]>([]);
  const [ready, setReady] = createSignal(false);
  const [token, setToken] = createSignal("");
  const [open, setOpen] = createSignal(false);
  const [name, setName] = createSignal("");

  createEffect(() => {
    if (!session().signedIn || !props.active()) return;
    createWatch(
      (signal) => auth.watchSessions({}, { signal }),
      (msg) => {
        setSessions(msg.sessions);
        setReady(true);
      },
    );
  });

  const mint = async () => {
    setToken(await createApiToken(name().trim() || "api token"));
    setOpen(true);
    setName("");
  };

  const revoke = async (id: string, current: boolean) => {
    if (current) {
      await signOut();
      return;
    }
    await revokeSession(id);
  };

  const [signingOutOthers, setSigningOutOthers] = createSignal(false);
  const revokeOthers = () => {
    if (signingOutOthers()) return;
    setSigningOutOthers(true);
    revokeOtherSessions().finally(() => setSigningOutOthers(false));
  };

  return (
    <Card
      title="Sessions & tokens"
      icon={<IconWorld size={16} />}
      bodyClass="p-0"
      action={
        <div class="flex items-center gap-2">
          <Show when={sessions().length > 1}>
            <GhostButton
              tone="danger"
              onClick={revokeOthers}
              disabled={signingOutOthers()}
              title="Revoke every other session and token"
            >
              <IconLogout size={14} />
              {signingOutOthers() ? "Signing out…" : "Sign out others"}
            </GhostButton>
          </Show>
          <Dialog.Root open={open()} onOpenChange={(d) => setOpen(d.open)}>
            <button
              type="button"
              onClick={mint}
              class="inline-flex items-center gap-1 rounded-md border border-line hover:border-accent/60 hover:text-accent transition-colors px-2.5 py-1.5 text-xs cursor-pointer"
            >
              <IconTerminal2 size={14} /> New token
            </button>
            <Portal>
              <Dialog.Backdrop class="fixed inset-0 bg-black/50 z-40" />
              <Dialog.Positioner class="fixed inset-0 z-50 grid place-items-center p-4">
                <Dialog.Content class="w-full max-w-md rounded-xl border border-line bg-panel shadow-xl p-6 space-y-3">
                  <Dialog.Title class="text-base font-semibold text-ink">
                    API token
                  </Dialog.Title>
                  <p class="text-xs text-ink-2">
                    Paste this into{" "}
                    <span class="font-mono">saros login --token</span>{" "}
                    or the studio's Saros settings. It won't be shown again.
                  </p>
                  <Clipboard.Root value={token()} timeout={1500}>
                    <Clipboard.Trigger class="w-full flex items-center gap-2 rounded-md border border-line bg-panel-2 px-3 py-2 text-left font-mono text-xs cursor-pointer hover:border-accent/60">
                      <span class="truncate flex-1">{token()}</span>
                      <Clipboard.Indicator
                        copied="copied ✓"
                        class="shrink-0 text-muted"
                      >
                        copy
                      </Clipboard.Indicator>
                    </Clipboard.Trigger>
                  </Clipboard.Root>
                </Dialog.Content>
              </Dialog.Positioner>
            </Portal>
          </Dialog.Root>
        </div>
      }
    >
      <Show when={ready()} fallback={<Skeleton class="m-4 h-10" />}>
        <ul class="divide-y divide-line">
          <For each={sessions()}>
            {(s) => {
              const isApi = s.kind === auth_pb.SessionKind.API;
              const seen = relativeTime(s.lastSeen);
              const detail = [s.device, seen && `active ${seen}`]
                .filter(Boolean).join(" · ");
              return (
                <li class="flex items-center gap-3 px-4 py-3">
                  {isApi
                    ? <IconTerminal2 size={16} class="text-muted shrink-0" />
                    : <IconWorld size={16} class="text-muted shrink-0" />}
                  <div class="min-w-0 flex-1">
                    <p class="flex items-center gap-2 text-sm text-ink truncate">
                      <span class="truncate">{s.label}</span>
                      <Show when={s.current}>
                        <Chip tone="accent">this session</Chip>
                      </Show>
                    </p>
                    <Show when={detail}>
                      <p class="text-xs text-ink-2 truncate">{detail}</p>
                    </Show>
                    <p class="font-mono text-[11px] text-muted">
                      {isApi ? "token" : "browser"} · added {when(s.createdAt)}
                      {" · expires "}
                      {when(s.expiresAt)}
                      <Show when={s.ip}>
                        {" · "}
                        {s.ip}
                      </Show>
                    </p>
                  </div>
                  <GhostButton
                    tone="danger"
                    onClick={() => revoke(s.id, s.current)}
                    title={s.current ? "Sign out" : "Revoke"}
                  >
                    {s.current
                      ? <IconLogout size={14} />
                      : <IconTrash size={14} />}
                  </GhostButton>
                </li>
              );
            }}
          </For>
        </ul>
      </Show>
    </Card>
  );
};

const StatGrid: Component<{
  label: string;
  cells: { label: string; value: string }[];
}> = (props) => {
  return (
    <div>
      <div class="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted/70">
        {props.label}
      </div>
      <dl class="grid grid-cols-3 gap-3">
        <For each={props.cells}>
          {(c) => (
            <div class="rounded-lg border border-line bg-panel-2 px-3 py-2">
              <dt class="text-[11px] uppercase tracking-wide text-muted">
                {c.label}
              </dt>
              <dd class="mt-0.5 font-mono text-lg text-ink">{c.value}</dd>
            </div>
          )}
        </For>
      </dl>
    </div>
  );
};

const Admin: Component<{ active: () => boolean }> = (props) => {
  const [stats, setStats] = createSignal<saros_pb.WatchServerStatsResponse>();

  createEffect(() => {
    if (!props.active()) return;
    createWatch(
      (signal) => firmware.watchServerStats({}, { signal }),
      (msg) => setStats(msg),
    );
  });

  const catalogue = () => {
    const s = stats();
    if (!s) return [];
    return [
      { label: "users", value: String(s.users) },
      { label: "devices", value: String(s.devices) },
      { label: "firmware", value: String(s.firmware) },
      { label: "staged", value: String(s.staged) },
      { label: "blobs", value: String(s.blobs) },
      { label: "storage", value: humanSize(s.blobBytes) },
    ];
  };
  const activity = () => {
    const s = stats();
    if (!s) return [];
    return [
      { label: "uptime", value: uptime(s.uptimeSeconds) },
      { label: "downloads", value: String(s.downloads) },
      { label: "uploads", value: String(s.uploads) },
      { label: "submissions", value: String(s.submissions) },
      { label: "reviews", value: String(s.reviews) },
      { label: "sign-ins", value: String(s.signIns) },
    ];
  };

  const samples = (): saros_pb.MetricsSample[] => stats()?.history ?? [];
  const series = (pick: (s: saros_pb.MetricsSample) => bigint): number[] =>
    samples().map((s) => Number(pick(s)));
  const span = () => {
    const ss = samples();
    if (!ss.length) return "";
    return `${whenExact(ss[0].at)} → ${whenExact(ss[ss.length - 1].at)}`;
  };

  return (
    <Card
      title="Admin"
      icon={<IconChartBar size={16} />}
      action={
        <div class="flex items-center gap-2">
          <Show when={stats()} keyed>
            {(s) => (
              <Chip tone={s.mirrorConfigured ? "accent" : "neutral"}>
                egress mirror {s.mirrorConfigured ? "on" : "off"}
              </Chip>
            )}
          </Show>
          <A
            href="/saros"
            class="inline-flex items-center gap-1 rounded-md border border-line hover:border-accent/60 hover:text-accent transition-colors px-2.5 py-1.5 text-xs cursor-pointer"
          >
            Review staged
          </A>
        </div>
      }
    >
      <Show when={stats()} fallback={<Skeleton class="h-40" />}>
        <div class="space-y-4">
          <StatGrid label="catalogue" cells={catalogue()} />
          <StatGrid label="since boot" cells={activity()} />
          <Show when={samples().length}>
            <div>
              <div class="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted/70">
                trends
              </div>
              <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <TrendCard label="users" values={series((s) => s.users)} />
                <TrendCard
                  label="downloads"
                  values={series((s) => s.downloads)}
                />
                <TrendCard label="sign-ins" values={series((s) => s.signIns)} />
                <TrendCard
                  label="submissions"
                  values={series((s) => s.submissions)}
                />
              </div>
              <p class="mt-3 text-right font-mono text-[10px] text-muted/60">
                {samples().length} sample{samples().length === 1 ? "" : "s"}
                {" "}
                · hourly · {span()}
              </p>
            </div>
          </Show>
        </div>
      </Show>
    </Card>
  );
};

const TrendCard: Component<{ label: string; values: number[] }> = (props) => {
  const latest = () =>
    props.values.length ? props.values[props.values.length - 1] : 0;
  return (
    <div class="rounded-lg border border-line bg-panel-2 px-3 py-2.5">
      <div class="flex items-baseline justify-between gap-2">
        <span class="text-[11px] uppercase tracking-wide text-muted">
          {props.label}
        </span>
        <span class="font-mono text-sm text-ink">{compactNum(latest())}</span>
      </div>
      <div class="mt-2 h-10">
        <Sparkline values={props.values} class="h-full w-full" />
      </div>
    </div>
  );
};

type AuditMode = "live" | "history";
const AUDIT_MODES: { id: AuditMode; label: string }[] = [
  { id: "live", label: "Live" },
  { id: "history", label: "History" },
];

const AuditLog: Component<{ active: () => boolean }> = (props) => {
  const [mode, setMode] = createSignal<AuditMode>("live");
  const [category, setCategory] = createSignal<number>(
    saros_pb.AuditCategory.UNSPECIFIED,
  );
  const [actorInput, setActorInput] = createSignal("");
  const [actor, setActor] = createSignal("");
  const applyActor = debounce((v: string) => setActor(v), 300);
  const onActor = (v: string) => {
    setActorInput(v);
    applyActor(v.trim());
  };

  const [live, setLive] = createSignal<saros_pb.AuditEntry[]>([]);
  const [liveReady, setLiveReady] = createSignal(false);
  const [hist, setHist] = createSignal<saros_pb.AuditEntry[]>([]);
  const [histReady, setHistReady] = createSignal(false);
  const [histCursor, setHistCursor] = createSignal(0n);
  const [histBusy, setHistBusy] = createSignal(false);
  const [exporting, setExporting] = createSignal(false);
  let histToken = 0;

  const entries = () => mode() === "live" ? live() : hist();
  const ready = () => mode() === "live" ? liveReady() : histReady();

  createEffect(() => {
    if (!props.active() || mode() !== "live") return;
    const cat = category();
    const act = actor();
    createWatch(
      (signal) =>
        firmware.watchAuditLog(
          { limit: 100, category: cat, actor: act },
          { signal },
        ),
      (msg, snapshot) => {
        if (snapshot) {
          setLive(msg.entries);
          setLiveReady(true);
        } else if (msg.entries.length) {
          setLive((prev) => [...msg.entries, ...prev]);
        }
      },
    );
  });

  createEffect(() => {
    if (!props.active() || mode() !== "history") return;
    const cat = category();
    const act = actor();
    const token = ++histToken;
    setHistReady(false);
    setHistBusy(true);
    firmware.listAuditLog({
      limit: 100,
      beforeCursor: 0n,
      category: cat,
      actor: act,
    })
      .then((resp) => {
        if (token !== histToken) return;
        setHist(resp.entries);
        setHistCursor(resp.nextCursor);
      })
      .catch(() => {
        if (token === histToken) setHist([]);
      })
      .finally(() => {
        if (token === histToken) {
          setHistReady(true);
          setHistBusy(false);
        }
      });
  });

  const loadOlder = () => {
    if (histBusy() || histCursor() === 0n) return;
    const token = histToken;
    setHistBusy(true);
    firmware.listAuditLog({
      limit: 100,
      beforeCursor: histCursor(),
      category: category(),
      actor: actor(),
    })
      .then((resp) => {
        if (token !== histToken) return;
        setHist((prev) => [...prev, ...resp.entries]);
        setHistCursor(resp.nextCursor);
      })
      .catch(() => {
      })
      .finally(() => {
        if (token === histToken) setHistBusy(false);
      });
  };

  const runExport = async () => {
    const CAP = 50_000;
    const rows: saros_pb.AuditEntry[] = [];
    let cursor = 0n;
    do {
      const resp = await firmware.listAuditLog({
        limit: 500,
        beforeCursor: cursor,
        category: category(),
        actor: actor(),
      });
      rows.push(...resp.entries);
      cursor = resp.nextCursor;
    } while (cursor !== 0n && rows.length < CAP);
    const stamp = new Date().toISOString().slice(0, 10);
    downloadText(
      auditCsv(rows.slice(0, CAP)),
      `audit-log-${stamp}.csv`,
      "text/csv;charset=utf-8",
    );
  };
  const exportCsv = () => {
    if (exporting()) return;
    setExporting(true);
    runExport()
      .catch(() => {
      })
      .finally(() => setExporting(false));
  };

  const inputBase =
    "rounded-md border border-line bg-panel-2 px-2.5 py-1.5 text-xs focus:outline-none focus:border-accent/60";

  return (
    <Card
      title="Audit log"
      icon={<IconHistory size={16} />}
      bodyClass="p-0"
      action={
        <GhostButton
          onClick={exportCsv}
          disabled={exporting()}
          title="Export the filtered history as CSV"
        >
          <IconDownload size={14} /> {exporting() ? "Exporting…" : "Export CSV"}
        </GhostButton>
      }
    >
      <div class="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3">
        <div class="flex items-center gap-1">
          <For each={AUDIT_MODES}>
            {(m) => (
              <button
                type="button"
                onClick={() => setMode(m.id)}
                class="-mb-px cursor-pointer border-b-2 px-2.5 py-1 text-xs font-medium transition-colors"
                classList={{
                  "border-accent text-ink": mode() === m.id,
                  "border-transparent text-muted hover:text-ink": mode() !==
                    m.id,
                }}
              >
                {m.label}
              </button>
            )}
          </For>
        </div>
        <select
          value={String(category())}
          onChange={(e) => setCategory(Number(e.currentTarget.value))}
          class={`${inputBase} cursor-pointer`}
        >
          <For each={CATEGORY_OPTIONS}>
            {(o) => <option value={String(o.value)}>{o.label}</option>}
          </For>
        </select>
        <input
          type="text"
          value={actorInput()}
          onInput={(e) => onActor(e.currentTarget.value)}
          placeholder="Filter by actor…"
          class={`${inputBase} min-w-0 flex-1 placeholder:text-muted/70`}
        />
      </div>

      <Show when={ready()} fallback={<Skeleton class="m-4 h-24" />}>
        <Show
          when={entries().length}
          fallback={
            <p class="px-4 py-3 text-xs text-muted">No matching activity.</p>
          }
        >
          <ul class="divide-y divide-line">
            <For each={entries()}>{(e) => auditRow(e)}</For>
          </ul>
        </Show>
        <Show when={mode() === "history" && histCursor() !== 0n}>
          <div class="border-t border-line px-4 py-3">
            <button
              type="button"
              onClick={loadOlder}
              disabled={histBusy()}
              class="inline-flex items-center gap-1 rounded-md border border-line hover:border-accent/60 hover:text-accent transition-colors px-2.5 py-1.5 text-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {histBusy() ? "Loading…" : "Load older"}
            </button>
          </div>
        </Show>
      </Show>
    </Card>
  );
};

const MySubmissions: Component<{ active: () => boolean }> = (props) => {
  const [subs, setSubs] = createSignal<saros_pb.Submission[]>([]);
  const [ready, setReady] = createSignal(false);

  createEffect(() => {
    if (!session().signedIn || !props.active()) return;
    createWatch(
      (signal) => firmware.watchMySubmissions({}, { signal }),
      (msg) => {
        setSubs(msg.submissions);
        setReady(true);
      },
    );
  });

  return (
    <Card
      title="My submissions"
      icon={<IconPackage size={16} />}
      bodyClass="p-0"
    >
      <Show when={ready()} fallback={<Skeleton class="m-4 h-24" />}>
        <Show
          when={subs().length}
          fallback={
            <p class="px-4 py-3 text-xs text-muted">No submissions yet.</p>
          }
        >
          <ul class="divide-y divide-line">
            <For each={subs()}>{(s) => submissionRow(s)}</For>
          </ul>
        </Show>
      </Show>
    </Card>
  );
};

const SecurityActivity: Component<{ active: () => boolean }> = (props) => {
  const [entries, setEntries] = createSignal<saros_pb.AuditEntry[]>([]);
  const [ready, setReady] = createSignal(false);

  createEffect(() => {
    if (!session().signedIn || !props.active()) return;
    createWatch(
      (signal) => auth.watchOwnActivity({ limit: 50 }, { signal }),
      (msg, snapshot) => {
        if (snapshot) {
          setEntries(msg.entries);
          setReady(true);
        } else if (msg.entries.length) {
          setEntries((prev) => [...msg.entries, ...prev]);
        }
      },
    );
  });

  return (
    <Card
      title="Security activity"
      icon={<IconShieldLock size={16} />}
      bodyClass="p-0"
    >
      <Show when={ready()} fallback={<Skeleton class="m-4 h-24" />}>
        <Show
          when={entries().length}
          fallback={
            <p class="px-4 py-3 text-xs text-muted">No recent activity.</p>
          }
        >
          <ul class="divide-y divide-line">
            <For each={entries()}>{(e) => auditRow(e)}</For>
          </ul>
        </Show>
      </Show>
    </Card>
  );
};
