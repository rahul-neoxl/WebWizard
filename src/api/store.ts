import type {
  MsgStoreItemEntMergeDeploy,
  SigStoreItemEntMerge,
} from "./types";
import {ENT_ID_GLOBAL, assertSig, rpcCall} from "../net/rpc";
import {getBearerToken} from "./user";

/**
 * Merges the given template codes into the supplied StudioEnt, creates the enterprise,
 * and kicks off deployment — all in one server call. Replaces the old storeItemListGet
 * + storeItemEntMerge + studioEntCreate + studioEntDeploy sequence. Returns a jobKey
 * identifying the async deploy job (completion is tracked via studioEntDeployStatusGet).
 */
export async function storeItemEntMergeDeploy(
  msg: MsgStoreItemEntMergeDeploy,
): Promise<SigStoreItemEntMerge> {
  const token = getBearerToken();
  if (!token) {
    throw new Error("Not authenticated.");
  }
  const envSig = await rpcCall<SigStoreItemEntMerge>(
    ENT_ID_GLOBAL,
    "store",
    "storeItemEntMergeDeploy",
    {msg, bearer: token},
  );
  return assertSig(envSig);
}
