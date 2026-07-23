import { createResource, createRoot, createSignal } from "solid-js";
import {
  startAuthentication,
  startRegistration,
} from "@simplewebauthn/browser";
import { auth_pb } from "@inex/protobufs";
import { auth as authClient } from "./client.ts";

export type Session = {
  signedIn: boolean;
  username: string;
  admin: boolean;
  email: string;
};

const SIGNED_OUT: Session = {
  signedIn: false,
  username: "",
  admin: false,
  email: "",
};

const [session, { refetch: refetchSession }] = createRoot(() =>
  createResource(
    () => true,
    (): Promise<Session> =>
      authClient.whoAmI({})
        .then((who) => ({
          signedIn: !!who.username,
          username: who.username,
          admin: who.admin,
          email: who.email,
        }))
        .catch(() => SIGNED_OUT),
    { initialValue: SIGNED_OUT },
  )
);

export { session };

const [busy, setBusy] = createSignal(false);
export { busy };

function optionsOf(json: string): Record<string, unknown> {
  const parsed = JSON.parse(json);
  return parsed.publicKey ?? parsed;
}

function passkey(username: string, email = ""): Promise<void> {
  if (busy()) return Promise.resolve();
  setBusy(true);
  return runPasskey(username, email).finally(() => setBusy(false));
}

async function runPasskey(username: string, email: string): Promise<void> {
  const begin = await authClient.beginPasskey({ username });
  const optionsJSON = optionsOf(begin.optionsJson) as never;
  const credential = begin.mode === auth_pb.PasskeyMode.REGISTER
    ? await startRegistration({ optionsJSON })
    : await startAuthentication({ optionsJSON });
  await authClient.finishPasskey({
    flowId: begin.flowId,
    credentialJson: JSON.stringify(credential),
    email,
  });
  refetchSession();
}

export const register = (username: string, email = ""): Promise<void> =>
  passkey(username, email);

export const signIn = (): Promise<void> => passkey("");

export async function createApiToken(name: string): Promise<string> {
  const resp = await authClient.createApiToken({ name });
  return resp.token;
}

export const listCredentials = () =>
  authClient.listCredentials({}).then((r) => r.credentials);

export function addPasskey(label: string): Promise<void> {
  if (busy()) return Promise.resolve();
  setBusy(true);
  return runAddPasskey(label).finally(() => setBusy(false));
}

async function runAddPasskey(label: string): Promise<void> {
  const begin = await authClient.beginAddCredential({});
  const optionsJSON = optionsOf(begin.optionsJson) as never;
  const credential = await startRegistration({ optionsJSON });
  await authClient.finishAddCredential({
    flowId: begin.flowId,
    credentialJson: JSON.stringify(credential),
    label,
  });
}

export const removeCredential = (id: string): Promise<void> =>
  authClient.removeCredential({ id }).then(() => undefined);

export const revokeSession = (id: string): Promise<void> =>
  authClient.revokeSession({ id }).then(() => undefined);

export const revokeOtherSessions = (): Promise<number> =>
  authClient.revokeOtherSessions({}).then((r) => r.revoked);

export async function setEmail(email: string): Promise<void> {
  await authClient.setEmail({ email });
  refetchSession();
}

export async function describeLogin(userCode: string) {
  return await authClient.describeLogin({ userCode });
}

export async function decideLogin(
  userCode: string,
  approve: boolean,
): Promise<void> {
  await authClient.decideLogin({ userCode, approve });
}

export function signOut(): Promise<void> {
  return authClient.logout({})
    .then(() => undefined)
    .finally(() => refetchSession());
}
