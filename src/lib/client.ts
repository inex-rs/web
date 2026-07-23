import { createClient } from "@connectrpc/connect";
import { createConnectTransport } from "@connectrpc/connect-web";
import { auth_pb, blob_pb, saros_pb } from "@inex/protobufs";

const sarosUrl: string =
  (import.meta as { env?: Record<string, string> }).env?.VITE_SAROS_URL ??
    globalThis.location.origin;

const transport = createConnectTransport({
  baseUrl: sarosUrl,
  useBinaryFormat: true,
  fetch: (input, init) =>
    globalThis.fetch(input, { ...init, credentials: "include" }),
});

export const firmware = createClient(saros_pb.FirmwareService, transport);
export const blobs = createClient(blob_pb.BlobService, transport);
export const auth = createClient(auth_pb.AuthService, transport);

export function humanSize(bytes: bigint | number | undefined): string {
  let n = Number(bytes ?? 0);
  for (const unit of ["B", "KiB", "MiB", "GiB"]) {
    if (n < 1024 || unit === "GiB") {
      return `${n < 10 && unit !== "B" ? n.toFixed(1) : Math.round(n)} ${unit}`;
    }
    n /= 1024;
  }
  return `${n} B`;
}

export function totalBlobBytes(
  blobs: readonly { sizeBytes?: bigint }[],
): number {
  return blobs.reduce((n, b) => n + Number(b.sizeBytes ?? 0), 0);
}
