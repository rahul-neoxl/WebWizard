import type {
  MsgStudioEntCreate,
  MsgStudioEntDeploy,
  MsgVersion,
  SigDone,
  SigEntDeployStatus,
} from "./types";
import {ENT_ID_GLOBAL, assertOk, assertSig, rpcCall} from "../net/rpc";
import {getBearerToken} from "./user";

export async function studioEntCreate(msg: MsgStudioEntCreate): Promise<void> {
  const token = getBearerToken();
  if (!token) {
    throw new Error("Not authenticated.");
  }
  const envSig = await rpcCall<SigDone>(
    ENT_ID_GLOBAL,
    "studioDrawer",
    "studioEntCreate",
    {msg, bearer: token},
  );
  // Success envelope carries no sig (SigDone) — error-absence is success.
  assertOk(envSig);
}

export async function studioEntDeploy(entId: string): Promise<void> {
  const token = getBearerToken();
  if (!token) {
    throw new Error("Not authenticated.");
  }
  const msg: MsgStudioEntDeploy = {sendInvites: false};
  const envSig = await rpcCall<SigDone>(
    entId,
    "studioDrawer",
    "studioEntDeploy",
    {msg, bearer: token},
  );
  assertOk(envSig);
}

export async function studioEntDeployStatusGet(
  entId: string,
): Promise<SigEntDeployStatus> {
  const token = getBearerToken();
  if (!token) {
    throw new Error("Not authenticated.");
  }
  const msg: MsgVersion = {};
  const envSig = await rpcCall<SigEntDeployStatus>(
    entId,
    "studioMain",
    "studioEntDeployStatusGet",
    {method: "get", msg, bearer: token},
  );
  return assertSig(envSig);
}
