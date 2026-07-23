import { type Timestamp, timestampDate } from "@bufbuild/protobuf/wkt";

const compactFmt = new Intl.NumberFormat(undefined, {
  notation: "compact",
  maximumFractionDigits: 1,
});
const relativeFmt = new Intl.RelativeTimeFormat(undefined, {
  style: "narrow",
  numeric: "always",
});
const durationFmt = new Intl.DurationFormat(undefined, { style: "narrow" });

export function compactNum(n: number): string {
  return compactFmt.format(n);
}

export function relativeTime(ts?: Timestamp): string {
  if (!ts || ts.seconds === 0n) return "";
  const date = timestampDate(ts);
  const secs = Math.floor((Date.now() - date.getTime()) / 1000);
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return relativeFmt.format(-mins, "minute");
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return relativeFmt.format(-hrs, "hour");
  const days = Math.floor(hrs / 24);
  if (days < 7) return relativeFmt.format(-days, "day");
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function uptime(seconds: bigint): string {
  const s = Number(seconds);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  return durationFmt.format(
    d > 0
      ? { days: d, hours: h }
      : h > 0
      ? { hours: h, minutes: m }
      : m > 0
      ? { minutes: m }
      : { seconds: s },
  );
}
