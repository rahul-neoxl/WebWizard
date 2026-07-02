import type {
  MsgCallerProfilePatch,
  MsgGrantBearerToken,
  SigBearerToken,
  SigDone,
  SigRefreshToken,
} from "./types";
import {APP_VERSION} from "../config";
import {ENT_ID_GLOBAL, assertOk, assertSig, rpcCall, setBearerRefresher} from "../net/rpc";
import {getSessionTabId} from "../net/ids";

let bearerToken: string | undefined;
let grantInFlight: Promise<string> | undefined;

export function getBearerToken(): string | undefined {
  return bearerToken;
}

export function clearBearerToken(): void {
  bearerToken = undefined;
}

/**
 * Rotates the refresh token. The old app (SrvcAuth) calls this whenever
 * grantBearerToken responds with updateRefreshToken=true; the rotated token
 * arrives via envSig.cookieValue and is captured by the rpc layer (and by the
 * browser through Set-Cookie).
 */
async function grantRefreshToken(): Promise<void> {
  const envSig = await rpcCall<SigRefreshToken>(
    ENT_ID_GLOBAL,
    "user",
    "grantRefreshToken",
    {method: "get", refresh: true},
  );
  // Void-style response (old SrvcAuth checks error only).
  assertOk(envSig);
}

async function doGrantBearerToken(): Promise<string> {
  const msg: MsgGrantBearerToken = {
    appVersion: APP_VERSION,
    sendCaller: true,
    tabId: getSessionTabId(),
  };
  const envSig = await rpcCall<SigBearerToken>(
    ENT_ID_GLOBAL,
    "user",
    "grantBearerToken",
    {method: "get", msg, refresh: true},
  );
  const sig = assertSig(envSig);
  bearerToken = sig.bearerToken;

  if (sig.updateRefreshToken) {
    // Old app: SrvcAuth fires grantRefreshToken and signs out on failure.
    // Here a failed rotation is non-fatal: deploy continues on the bearer
    // token; worst case the hand-off to the web client asks to sign in again.
    try {
      await grantRefreshToken();
    } catch (err) {
      console.warn("grantRefreshToken failed:", err);
    }
  }

  return sig.bearerToken;
}

/**
 * Deduplicates concurrent grants (parity with SrvcAuth.grantBearerTokenInFlight):
 * simultaneous callers await the same in-flight request.
 */
export function grantBearerToken(): Promise<string> {
  if (!grantInFlight) {
    grantInFlight = doGrantBearerToken().finally(() => {
      grantInFlight = undefined;
    });
  }
  return grantInFlight;
}

// Lets the rpc layer transparently re-grant + retry a bearer call that failed
// with unauthorizedBearerToken (parity with RpcCallWithRetry in the old app).
setBearerRefresher(grantBearerToken);

export async function callerProfilePatch(msg: MsgCallerProfilePatch): Promise<void> {
  const token = bearerToken;
  if (!token) {
    throw new Error("Not authenticated.");
  }
  const envSig = await rpcCall<SigDone>(
    ENT_ID_GLOBAL,
    "drawer",
    "callerProfilePatch",
    {method: "patch", msg, bearer: token},
  );
  assertOk(envSig);
}
