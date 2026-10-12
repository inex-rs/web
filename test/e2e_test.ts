// TS↔Rust wire-compat e2e: drive a live `saros` with the same generated
// schemas + connect-web transport (binary format) the UI uses. Gated on
// SAROS_E2E_URL + SAROS_E2E_TOKEN (the server's SAROS_TOKEN service token) so
// a plain `deno task test` with no server skips cleanly.

import { Code, ConnectError, createClient } from "@connectrpc/connect";
import { createConnectTransport } from "@connectrpc/connect-web";
import { auth_pb, blob_pb, saros_pb } from "@inex/protobufs";

const url = Deno.env.get("SAROS_E2E_URL");
const token = Deno.env.get("SAROS_E2E_TOKEN");

// A real catalogue device: unknown ids fail the publish precondition.
const DEVICE = "pocket-debug";

function check(ok: boolean, msg: string): void {
  if (!ok) throw new Error(msg);
}

// The first frame of a server stream, then abort it (watches are infinite).
function first<T>(
  open: (signal: AbortSignal) => AsyncIterable<T>,
): Promise<T> {
  const ab = new AbortController();
  return open(ab.signal)[Symbol.asyncIterator]().next()
    .then((r) => {
      check(!r.done, "stream ended before its first frame");
      return r.value as T;
    })
    .finally(() => ab.abort());
}

// Resolve to the ConnectError code a call rejects with; fail if it succeeds.
function codeOf(p: Promise<unknown>): Promise<Code> {
  return p.then(
    () => {
      throw new Error("call unexpectedly succeeded");
    },
    (e) => ConnectError.from(e).code,
  );
}

Deno.test({
  name: "connect-web round-trip against a live saros",
  ignore: !url || !token,
  async fn() {
    const transport = createConnectTransport({
      baseUrl: url!,
      useBinaryFormat: true,
    });
    const firmware = createClient(saros_pb.FirmwareService, transport);
    const blobs = createClient(blob_pb.BlobService, transport);
    const auth = createClient(auth_pb.AuthService, transport);
    const bearer = { headers: { Authorization: `Bearer ${token}` } };

    // Identity: anonymous vs the service token (admin).
    const anon = await auth.whoAmI({});
    check(anon.username === "", `anonymous whoAmI: ${anon.username}`);
    const me = await auth.whoAmI({}, bearer);
    check(me.admin, "service token should be admin");

    const text = "e2e firmware bytes from deno";
    const content = new TextEncoder().encode(text);
    check(
      (await codeOf(blobs.upload({ content }))) === Code.Unauthenticated,
      "anonymous upload must be Unauthenticated",
    );
    const up = await blobs.upload({ content }, bearer);
    check(
      up.sha256.length === 64 && up.sizeBytes === BigInt(content.length),
      `bad upload response: ${up.sha256} ${up.sizeBytes}`,
    );

    // Unique per run — published versions are immutable.
    const version = `0.0.${Date.now() % 1_000_000}`;
    const manifest = {
      deviceId: DEVICE,
      version,
      tags: ["deno-e2e"],
      blobs: [{
        slot: 0,
        filename: `${DEVICE}-v${version}.bin`,
        sizeBytes: BigInt(content.length),
        sha256: up.sha256,
      }],
    };

    // Publish stages; an admin approves it live.
    await firmware.publishFirmware({ firmware: manifest }, bearer);
    const staged = await first((signal) =>
      firmware.watchStagedFirmware({}, { ...bearer, signal })
    );
    check(
      staged.staged.some((s) => s.firmware?.version === version),
      `v${version} missing from the staged queue`,
    );
    await firmware.reviewStagedFirmware(
      { deviceId: DEVICE, version, approve: true },
      bearer,
    );
    check(
      (await codeOf(
        firmware.publishFirmware({ firmware: manifest }, bearer),
      )) === Code.AlreadyExists,
      "re-publishing a live version must be AlreadyExists",
    );

    // The catalogue watches the UI renders from.
    const live = await first((signal) =>
      firmware.watchFirmware({ deviceId: DEVICE }, { signal })
    );
    const fw = live.firmware.find((f) => f.version === version);
    check(fw !== undefined, `v${version} not in the live catalogue`);
    check(fw!.blobs[0]?.sha256 === up.sha256, "manifest blob sha mismatch");
    const devices = await first((signal) =>
      firmware.watchDevices({}, { signal })
    );
    check(
      devices.devices.some((d) =>
        d.id === DEVICE && (d.firmwareCount ?? 0) > 0
      ),
      `${DEVICE} missing from watchDevices`,
    );

    // Bytes back: inline content, or a mirror URL when S3 egress is configured.
    const down = await blobs.download({ sha256: up.sha256 }, bearer);
    const bytes = down.url
      ? new Uint8Array(await (await fetch(down.url)).arrayBuffer())
      : down.content;
    check(new TextDecoder().decode(bytes) === text, "blob round-trip mismatch");
  },
});
