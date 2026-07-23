import {
  type Component,
  createEffect,
  createMemo,
  createSignal,
  For,
  onMount,
  Show,
} from "solid-js";
import { useNavigate, useParams } from "@solidjs/router";
import { createEventListener } from "@solid-primitives/event-listener";
import { IconBellFilled, IconBellPlus } from "@tabler/icons-solidjs";
import { Tabs } from "@ark-ui/solid/tabs";
import { saros_pb } from "@inex/protobufs";
import {
  blobs as blobClient,
  firmware,
  humanSize,
  totalBlobBytes,
} from "../lib/client.ts";
import { session } from "../lib/auth.ts";
import { createWatch } from "../lib/watch.ts";
import { Chip, Copyable, Skeleton } from "../components/ui.tsx";
import { HashMatrix } from "../components/hashmatrix.tsx";
import { useTitle } from "../lib/title.ts";
import {
  ChangelogRail,
  cmpVersions,
  DownloadStat,
  LiveDot,
  SlotMap,
  tsDate,
  VersionDiff,
  VersionRail,
} from "../components/saros-viz.tsx";
import { DeviceModel } from "../components/device-model.tsx";

function upsert<T>(prev: T[], incoming: T[], key: (t: T) => string): T[] {
  if (incoming.length === 0) return prev;
  const by = new Map(prev.map((t) => [key(t), t]));
  for (const t of incoming) by.set(key(t), t);
  return [...by.values()];
}

const [follows, setFollows] = createSignal<Set<string>>(new Set());

export const Saros: Component = () => {
  const params = useParams<{ device?: string; version?: string }>();
  const navigate = useNavigate();

  const [all, setAll] = createSignal<saros_pb.Firmware[]>([]);
  const [devices, setDevices] = createSignal<saros_pb.Device[]>([]);
  const [state, setState] = createSignal<
    "connecting" | "live" | "reconnecting"
  >("connecting");
  const [fresh, setFresh] = createSignal<Set<string>>(new Set());
  const markFresh = (keys: string[]) => {
    setFresh((s) => new Set([...s, ...keys]));
    setTimeout(
      () =>
        setFresh((s) => {
          const n = new Set(s);
          for (const k of keys) n.delete(k);
          return n;
        }),
      1800,
    );
  };
  const freshDevices = createMemo(() =>
    new Set([...fresh()].map((k) => k.split("/")[0]))
  );

  onMount(() => {
    createWatch(
      (signal) => firmware.watchFirmware({}, { signal }),
      (delta, snapshot) => {
        setAll((prev) =>
          upsert(prev, delta.firmware, (f) => `${f.deviceId} ${f.version}`)
        );
        if (!snapshot && delta.firmware.length) {
          markFresh(delta.firmware.map((f) => `${f.deviceId}/${f.version}`));
        }
      },
      setState,
    );
    createWatch(
      (signal) => firmware.watchDevices({}, { signal }),
      (delta) => setDevices((prev) => upsert(prev, delta.devices, (d) => d.id)),
    );
  });

  createEffect(() => {
    if (!session().signedIn) {
      setFollows(new Set<string>());
      return;
    }
    firmware.listFollows({})
      .then((r) => setFollows(new Set(r.deviceIds)))
      .catch(() => {});
  });

  const [query, setQuery] = createSignal("");
  let searchBox: HTMLInputElement | undefined;

  createEventListener(document, "keydown", (e) => {
    if (e.key === "/" && document.activeElement !== searchBox) {
      e.preventDefault();
      searchBox?.focus();
    }
  });

  const latestKeys = createMemo(() => {
    const best = new Map<string, saros_pb.Firmware>();
    for (const fw of all()) {
      const cur = best.get(fw.deviceId);
      if (!cur || cmpVersions(fw.version, cur.version) > 0) {
        best.set(fw.deviceId, fw);
      }
    }
    return new Set(
      [...best.values()].map((f) => `${f.deviceId}/${f.version}`),
    );
  });
  const isLatest = (fw: saros_pb.Firmware) =>
    latestKeys().has(`${fw.deviceId}/${fw.version}`);

  const deviceOf = (id: string) => devices().find((d) => d.id === id);
  const slotName = (deviceId: string, slot: number) =>
    deviceOf(deviceId)?.slots[slot]?.name ?? "";

  const versionsOf = (id: string) => all().filter((f) => f.deviceId === id);
  const latestOf = (id: string) =>
    [...versionsOf(id)].sort((a, b) => cmpVersions(b.version, a.version))[0]
      ?.version;

  const downloadTotals = createMemo(() => {
    const m = new Map<string, number>();
    for (const f of all()) {
      m.set(f.deviceId, (m.get(f.deviceId) ?? 0) + Number(f.downloads));
    }
    return m;
  });
  const downloadsOf = (id: string) => downloadTotals().get(id) ?? 0;

  useTitle(() =>
    params.version
      ? `${params.device} v${params.version} · saros`
      : params.device
      ? `${params.device} · saros`
      : "Saros · inex"
  );

  const stats = createMemo(() => {
    const blobs = all().flatMap((f) => f.blobs);
    return {
      versions: all().length,
      blobs: blobs.length,
      bytes: totalBlobBytes(blobs),
    };
  });

  const [reviewing, setReviewing] = createSignal(false);
  const [staged, setStaged] = createSignal<saros_pb.StagedFirmware[]>([]);

  createEffect(() => {
    if (!session().admin) return;
    createWatch(
      (signal) => firmware.watchStagedFirmware({}, { signal }),
      (msg) => setStaged(msg.staged),
    );
  });

  const [reviewError, setReviewError] = createSignal("");
  const review = async (fw: saros_pb.Firmware, approve: boolean) => {
    setReviewError("");
    await firmware.reviewStagedFirmware({
      deviceId: fw.deviceId,
      version: fw.version,
      approve,
    });
  };
  const onReviewError = (e: unknown) =>
    setReviewError(e instanceof Error ? e.message : String(e));
  const approve = (fw: saros_pb.Firmware) =>
    review(fw, true).catch(onReviewError);
  const reject = (fw: saros_pb.Firmware) =>
    review(fw, false).catch(onReviewError);

  return (
    <div class="flex-1 grid lg:grid-cols-[260px_1fr]">
      <aside class="border-b lg:border-b-0 lg:border-r border-line p-4 space-y-4 lg:flex lg:flex-col lg:gap-4 lg:space-y-0 lg:min-h-[calc(100vh-3.5rem)]">
        <span class="block font-mono text-[11px] uppercase tracking-widest text-muted/70">
          Registry
        </span>

        <div class="relative">
          <input
            ref={searchBox}
            value={query()}
            onInput={(e) => setQuery(e.currentTarget.value)}
            placeholder="Search firmware…"
            class="w-full rounded-md border border-line bg-panel px-3 py-1.5 text-sm placeholder:text-muted/70 focus:outline-none focus:border-accent/60"
          />
          <kbd class="absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-ink/25 px-1.5 text-[10px] text-muted font-mono">
            /
          </kbd>
        </div>

        <nav class="space-y-1">
          <RailEntry
            active={!params.device && !reviewing()}
            onClick={() => {
              setReviewing(false);
              navigate("/saros");
            }}
            title="All devices"
            sub={`${stats().versions} versions`}
          />
          <Show
            when={state() !== "connecting"}
            fallback={
              <div class="space-y-2 pt-1">
                <Skeleton class="h-12" />
                <Skeleton class="h-12" />
              </div>
            }
          >
            <For each={devices()}>
              {(d) => (
                <RailEntry
                  active={params.device === d.id && !reviewing()}
                  onClick={() => {
                    setReviewing(false);
                    navigate(`/saros/${d.id}`);
                  }}
                  title={d.name}
                  sub={`${d.firmwareCount} version${
                    d.firmwareCount === 1 ? "" : "s"
                  }`}
                  fresh={freshDevices().has(d.id)}
                />
              )}
            </For>
          </Show>
        </nav>

        <Show when={session().admin}>
          <div class="-mx-4 px-4 pt-2 border-t border-line">
            <RailEntry
              active={reviewing()}
              onClick={() => setReviewing(true)}
              title="Review staged"
              sub={staged().length
                ? `${staged().length} awaiting approval`
                : "submissions land here"}
            />
          </div>
        </Show>

        <div class="-mx-4 px-4 pt-4 border-t border-line lg:mt-auto flex items-center justify-between gap-3">
          <LiveDot state={state()} />
          <div class="hidden lg:block font-mono text-[11px] text-muted/70">
            {stats().blobs} blobs · {humanSize(stats().bytes)}
          </div>
        </div>
      </aside>

      <section class="p-4 sm:p-6 space-y-4">
        <Show when={reviewing() && session().admin} fallback={<MainPanel />}>
          <StagingQueue />
        </Show>
      </section>
    </div>
  );

  function MainPanel() {
    return (
      <Show when={params.device} fallback={<DeviceGrid />} keyed>
        {(dev) => <DeviceTab device={dev} />}
      </Show>
    );
  }

  function DeviceGrid() {
    const list = createMemo(() => {
      const q = query().toLowerCase();
      return devices().filter((d) =>
        !q || `${d.id} ${d.name}`.toLowerCase().includes(q)
      );
    });
    return (
      <>
        <header class="flex flex-wrap items-center justify-between gap-y-2">
          <h1 class="text-lg font-semibold">Devices</h1>
          <div class="flex items-center gap-3">
            <span class="text-xs text-muted">
              {list().length} device{list().length === 1 ? "" : "s"}
            </span>
          </div>
        </header>
        <Show
          when={state() !== "connecting" || devices().length > 0}
          fallback={
            <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <Skeleton class="h-28" />
              <Skeleton class="h-28" />
            </div>
          }
        >
          <Show when={list().length > 0} fallback={<EmptyState />}>
            <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <For each={list()}>
                {(d) => (
                  <DeviceCard
                    device={d}
                    latest={latestOf(d.id)}
                    downloads={downloadsOf(d.id)}
                    fresh={freshDevices().has(d.id)}
                    onClick={() => navigate(`/saros/${d.id}`)}
                  />
                )}
              </For>
            </div>
          </Show>
        </Show>
      </>
    );
  }

  function DeviceTab(props: { device: string }) {
    const versions = createMemo(() =>
      [...versionsOf(props.device)].sort((a, b) =>
        cmpVersions(b.version, a.version)
      )
    );
    const selectedVersion = () =>
      params.version ?? versions()[0]?.version ?? "";
    const selectedFw = () =>
      versions().find((v) => v.version === selectedVersion());
    return (
      <div class="animate-rise space-y-5">
        <DeviceHero
          device={props.device}
          info={deviceOf(props.device)}
          downloads={downloadsOf(props.device)}
        />
        <Show when={versions().length > 0} fallback={<EmptyState />}>
          <div class="grid items-stretch gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
            <VersionRail
              versions={versions()}
              selected={selectedVersion()}
              isLatest={isLatest}
              onSelect={(v) =>
                navigate(`/saros/${props.device}/${v}`, { replace: true })}
            />
            <Show when={selectedFw()} keyed>
              {(fw) => (
                <VersionBreakdown
                  fw={fw}
                  isLatest={isLatest(fw)}
                  versions={versions()}
                  slotName={(s) => slotName(props.device, s)}
                />
              )}
            </Show>
          </div>
        </Show>
      </div>
    );
  }

  function StagingQueue() {
    return (
      <div class="animate-rise space-y-4">
        <header class="flex items-baseline justify-between">
          <h1 class="text-lg font-semibold">Review staged</h1>
          <span class="text-xs text-muted">
            {staged().length} submission{staged().length === 1 ? "" : "s"}
          </span>
        </header>
        <Show when={reviewError()}>
          <p class="text-sm text-danger">{reviewError()}</p>
        </Show>
        <Show
          when={staged().length}
          fallback={
            <div class="rounded-xl border border-dashed border-line p-10 text-center">
              <p class="text-sm text-ink-2">
                Nothing awaiting approval.
              </p>
              <p class="font-mono text-xs text-muted/70 pt-1">
                non-admin publishes land here for review
              </p>
            </div>
          }
        >
          <div class="space-y-3">
            <For each={staged()}>
              {(s) => (
                <div class="rounded-xl border border-line bg-panel p-4 space-y-3">
                  <div class="flex items-start justify-between gap-3">
                    <div>
                      <div class="font-mono text-sm text-ink">
                        {s.firmware?.deviceId} v{s.firmware?.version}
                      </div>
                      <div class="text-xs text-muted">
                        {s.firmware?.blobs.length} blob{s.firmware?.blobs
                            .length === 1
                          ? ""
                          : "s"} · submitted by{" "}
                        <span class="text-ink-2">{s.submittedBy}</span>
                      </div>
                    </div>
                    <div class="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => s.firmware && reject(s.firmware)}
                        class="rounded-md border border-ink/25 hover:border-danger/60 hover:text-danger transition-colors px-3 py-1.5 text-xs font-medium cursor-pointer"
                      >
                        reject
                      </button>
                      <button
                        type="button"
                        onClick={() => s.firmware && approve(s.firmware)}
                        class="rounded-md bg-accent text-on-accent hover:opacity-90 transition-opacity px-3 py-1.5 text-xs font-medium cursor-pointer"
                      >
                        approve
                      </button>
                    </div>
                  </div>
                  <Show when={s.firmware?.changelog.length}>
                    <div class="border-t border-line pt-2">
                      <ChangelogRail changes={s.firmware?.changelog ?? []} />
                    </div>
                  </Show>
                </div>
              )}
            </For>
          </div>
        </Show>
      </div>
    );
  }
};

const PLATFORM_BADGE: Record<number, string> = {
  [saros_pb.Platform.DMG]: "GB",
  [saros_pb.Platform.CGB]: "GBC",
  [saros_pb.Platform.AGB]: "GBA",
  [saros_pb.Platform.NTR]: "NDS",
  [saros_pb.Platform.TWL]: "DSi",
  [saros_pb.Platform.CTR]: "3DS",
};

const FollowButton: Component<{ deviceId: string }> = (props) => {
  const [busy, setBusy] = createSignal(false);
  const following = () => follows().has(props.deviceId);
  const toggle = () => {
    if (busy()) return;
    setBusy(true);
    const runToggle = async () => {
      const resp = await firmware.followDevice({
        deviceId: props.deviceId,
        follow: !following(),
      });
      setFollows((s) => {
        const n = new Set(s);
        if (resp.following) n.add(props.deviceId);
        else n.delete(props.deviceId);
        return n;
      });
    };
    runToggle()
      .catch(() => {
      })
      .finally(() => setBusy(false));
  };
  return (
    <Show when={session().signedIn}>
      <button
        type="button"
        onClick={toggle}
        disabled={busy()}
        title={following() ? "Stop following" : "Follow for new firmware"}
        class="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-60 cursor-pointer"
        classList={{
          "bg-accent text-on-accent hover:opacity-90": following(),
          "border border-ink/25 text-ink-2 hover:border-accent/60 hover:text-accent":
            !following(),
        }}
      >
        {following()
          ? <IconBellFilled size={14} />
          : <IconBellPlus size={14} />}
        {following() ? "Following" : "Follow"}
      </button>
    </Show>
  );
};

type DeviceHeroProps = {
  device: string;
  info?: saros_pb.Device;
  downloads?: number;
};

const DeviceHero: Component<DeviceHeroProps> = (props) => {
  const color = () => props.info?.colour || "#7c3aed";
  const name = () => props.info?.name || props.device;
  const platforms = () => props.info?.platforms ?? [];
  return (
    <div class="animate-rise overflow-hidden rounded-xl border border-line bg-panel shadow-sm">
      <div class="flex items-center gap-5 p-5">
        <Show when={props.device} keyed>
          {(dev) => (
            <div class="shrink-0" title={dev}>
              <DeviceModel colour={color()} size={116} />
            </div>
          )}
        </Show>
        <div class="min-w-0 flex-1 space-y-2">
          <div class="flex items-center gap-3 flex-wrap">
            <h1 class="text-xl font-semibold">{name()}</h1>
            <span class="font-mono text-xs text-muted">{props.device}</span>
            <For each={platforms()}>
              {(p) => (
                <span class="rounded border border-line px-1.5 font-mono text-[10px] text-muted">
                  {PLATFORM_BADGE[p] ?? ""}
                </span>
              )}
            </For>
            <Show when={(props.downloads ?? 0) > 0}>
              <DownloadStat n={props.downloads!} />
            </Show>
            <span class="ml-auto shrink-0">
              <FollowButton deviceId={props.device} />
            </span>
          </div>
          <Show when={props.info?.description}>
            <p class="text-sm text-ink-2 max-w-2xl leading-relaxed">
              {props.info?.description}
            </p>
          </Show>
          <Show when={props.info?.slots.length}>
            <div class="flex flex-wrap gap-1.5 pt-1">
              <For each={props.info?.slots}>
                {(slot) => <Chip>{slot.name}</Chip>}
              </For>
            </div>
          </Show>
        </div>
      </div>
    </div>
  );
};

type DeviceCardProps = {
  device: saros_pb.Device;
  latest?: string;
  downloads?: number;
  fresh?: boolean;
  onClick: () => void;
};

const DeviceCard: Component<DeviceCardProps> = (props) => {
  const d = () => props.device;
  const colour = () => d().colour || "#7c3aed";
  const count = () => d().firmwareCount ?? 0;
  return (
    <button
      type="button"
      onClick={props.onClick}
      class="group animate-rise relative flex items-center gap-4 rounded-xl border border-line bg-panel p-4 text-left shadow-sm transition-colors hover:border-accent/40 cursor-pointer"
      classList={{ "animate-flash": props.fresh }}
    >
      <div class="shrink-0">
        <DeviceModel colour={colour()} size={84} />
      </div>

      <div class="min-w-0 flex-1 space-y-1">
        <div class="truncate text-base font-semibold text-ink">{d().name}</div>
        <div class="flex flex-wrap items-center gap-1 pt-0.5">
          <For each={d().platforms}>
            {(p) => (
              <span class="rounded border border-line px-1.5 font-mono text-[10px] text-muted">
                {PLATFORM_BADGE[p] ?? ""}
              </span>
            )}
          </For>
        </div>
        <div class="flex items-center justify-between pt-1 font-mono text-[11px] text-muted">
          <span class="flex items-center gap-2">
            <span>{count()} version{count() === 1 ? "" : "s"}</span>
            <Show when={(props.downloads ?? 0) > 0}>
              <DownloadStat n={props.downloads!} />
            </Show>
          </span>
          <Show when={props.latest}>
            <span class="text-accent">latest v{props.latest}</span>
          </Show>
        </div>
      </div>
    </button>
  );
};

type RailEntryProps = {
  active: boolean;
  onClick: () => void;
  title: string;
  sub: string;
  mono?: boolean;
  fresh?: boolean;
};

const RailEntry: Component<RailEntryProps> = (props) => {
  return (
    <button
      type="button"
      onClick={props.onClick}
      class={`group relative flex w-full items-center gap-2.5 overflow-hidden rounded-md py-2 pl-3 pr-2 text-left transition-colors cursor-pointer ${
        props.active
          ? "bg-accent/10 text-accent"
          : "text-ink-2 hover:bg-panel hover:text-ink"
      }`}
      classList={{ "animate-flash": props.fresh }}
    >
      <span class="min-w-0 flex-1">
        <span class={`block truncate text-sm ${props.mono ? "font-mono" : ""}`}>
          {props.title}
        </span>
        <span class="block truncate text-[11px] text-muted">{props.sub}</span>
      </span>
    </button>
  );
};

const BREAKDOWN_TABS = [
  { id: "layout", label: "Layout" },
  { id: "blobs", label: "Blobs" },
  { id: "changelog", label: "Changelog" },
  { id: "compare", label: "Compare" },
] as const;
type BreakdownTab = typeof BREAKDOWN_TABS[number]["id"];

type VersionBreakdownProps = {
  fw: saros_pb.Firmware;
  isLatest: boolean;
  versions: saros_pb.Firmware[];
  slotName: (slot: number) => string;
};

const VersionBreakdown: Component<VersionBreakdownProps> = (props) => {
  const fw = () => props.fw;
  const maxBlob = () =>
    Math.max(1, ...fw().blobs.map((b) => Number(b.sizeBytes ?? 0)));
  const [tab, setTab] = createSignal<BreakdownTab>("layout");

  return (
    <div class="space-y-4">
      <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
        <h1 class="font-mono text-2xl font-semibold text-ink">
          v{fw().version}
        </h1>
        <Show when={props.isLatest}>
          <Chip tone="accent">LATEST</Chip>
        </Show>
        <For each={fw().tags}>{(t) => <Chip>{t}</Chip>}</For>
        <DownloadStat n={Number(fw().downloads)} class="ml-auto" />
        <Show when={fw().builtAt} keyed>
          {(ts) => (
            <span class="font-mono text-xs text-muted">
              built {tsDate(ts)}
            </span>
          )}
        </Show>
      </div>

      <Tabs.Root
        class="space-y-4"
        value={tab()}
        onValueChange={(d) => setTab(d.value as BreakdownTab)}
      >
        <Tabs.List class="flex items-center gap-1 border-b border-line">
          <For each={BREAKDOWN_TABS}>
            {(t) => (
              <Tabs.Trigger
                value={t.id}
                class="-mb-px cursor-pointer border-b-2 px-3 py-2 text-sm font-medium transition-colors"
                classList={{
                  "border-accent text-ink": tab() === t.id,
                  "border-transparent text-muted hover:text-ink":
                    tab() !== t.id,
                }}
              >
                {t.label}
              </Tabs.Trigger>
            )}
          </For>
          <span class="ml-auto pr-1 font-mono text-[11px] text-muted">
            {fw().blobs.length} blob{fw().blobs.length === 1 ? "" : "s"} ·{" "}
            {humanSize(totalBlobBytes(fw().blobs))}
          </span>
        </Tabs.List>

        <div class="min-h-[380px]">
          <Tabs.Content value="layout">
            <SlotMap blobs={fw().blobs} slotName={props.slotName} />
          </Tabs.Content>
          <Tabs.Content value="blobs">
            <Blobs />
          </Tabs.Content>
          <Tabs.Content value="changelog">
            <div class="rounded-xl border border-line bg-panel p-5 shadow-sm">
              <Show
                when={fw().changelog.length}
                fallback={
                  <p class="text-xs italic text-muted/70">No changelog.</p>
                }
              >
                <ChangelogRail changes={fw().changelog} />
              </Show>
            </div>
          </Tabs.Content>
          <Tabs.Content value="compare">
            <div class="rounded-xl border border-line bg-panel p-5 shadow-sm">
              <VersionDiff
                target={fw()}
                versions={props.versions}
                slotName={props.slotName}
              />
            </div>
          </Tabs.Content>
        </div>
      </Tabs.Root>

      <Copyable
        text={`saros fetch --device ${fw().deviceId} --version ${fw().version}`}
      />
    </div>
  );

  function Blobs() {
    return (
      <section class="rounded-xl border border-line bg-panel shadow-sm divide-y divide-line overflow-hidden">
        <For each={fw().blobs}>
          {(b) => (
            <div class="relative p-4 bg-panel hover:bg-panel-2/60 transition-colors">
              <div
                class="absolute bottom-0 left-0 h-[2px] bg-accent/70"
                style={{
                  width: `${(Number(b.sizeBytes ?? 0) / maxBlob()) * 100}%`,
                }}
              />
              <div class="flex items-center gap-4 flex-wrap">
                <HashMatrix sha256={b.sha256} />
                <div class="space-y-0.5 min-w-0 flex-1">
                  <div class="text-sm">
                    <span class="text-ink">
                      {props.slotName(b.slot) || `slot ${b.slot}`}
                    </span>
                  </div>
                  <div class="text-muted/70 text-xs font-mono">
                    {b.filename}
                  </div>
                </div>
                <div class="flex items-center gap-4 shrink-0">
                  <span class="text-xs text-muted font-mono">
                    {humanSize(b.sizeBytes)}
                  </span>
                  <BlobDownload sha256={b.sha256} filename={b.filename} />
                </div>
              </div>
            </div>
          )}
        </For>
      </section>
    );
  }
};

const BlobDownload: Component<{ sha256: string; filename: string }> = (
  props,
) => {
  const [busy, setBusy] = createSignal(false);
  const [error, setError] = createSignal("");
  const save = () => {
    setBusy(true);
    setError("");
    const runSave = async () => {
      const resp = await blobClient.download({ sha256: props.sha256 });
      const name = props.filename || `${props.sha256}.bin`;
      const a = document.createElement("a");
      let objectUrl: string | undefined;
      if (resp.url) {
        a.href = resp.url;
      } else {
        objectUrl = URL.createObjectURL(
          new Blob([new Uint8Array(resp.content)], {
            type: "application/octet-stream",
          }),
        );
        a.href = objectUrl;
      }
      a.download = name;
      a.rel = "noopener";
      a.click();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
    runSave()
      .catch((e) =>
        setError(e instanceof Error ? e.message : "download failed")
      )
      .finally(() => setBusy(false));
  };
  const disabled = () => !session().signedIn || busy();
  return (
    <div class="flex items-center gap-2">
      <Show when={error()}>
        <span class="text-[11px] text-danger" title={error()}>
          download failed
        </span>
      </Show>
      <button
        type="button"
        onClick={save}
        disabled={disabled()}
        class="rounded-md border border-ink/25 hover:border-accent/60 hover:text-accent transition-colors px-3 py-1.5 text-xs font-medium disabled:opacity-40 disabled:hover:border-ink/25 disabled:hover:text-inherit disabled:cursor-not-allowed cursor-pointer"
        title={session().signedIn ? "" : "Sign in to download"}
      >
        {busy() ? "…" : "download"}
      </button>
    </div>
  );
};

const EmptyState: Component = () => {
  return (
    <div class="rounded-xl border border-dashed border-line p-10 text-center space-y-3">
      <p class="text-sm text-ink-2">Nothing published here yet.</p>
      <p class="font-mono text-xs text-muted/70">
        inex dump-firmware --publish-to &lt;saros-url&gt;
      </p>
    </div>
  );
};
