import type {
  DtoStoreItemAvatar,
  MsgStoreFilters,
  MsgStudioEntMerge,
  SigStoreItemListGet,
  SigStudioEntMerge,
} from "./types";
import {ENT_ID_GLOBAL, assertOk, assertSig, rpcCall} from "../net/rpc";
import {getBearerToken} from "./user";

export async function storeItemListGet(): Promise<DtoStoreItemAvatar[]> {
  const token = getBearerToken();
  if (!token) {
    throw new Error("Not authenticated.");
  }
  const msg: MsgStoreFilters = {
    artifactKindSet: ["ent"],
    pageSize: 100,
  };
  const envSig = await rpcCall<SigStoreItemListGet>(
    ENT_ID_GLOBAL,
    "store",
    "storeItemListGet",
    {method: "get", msg, bearer: token},
  );
  // Tolerate a missing sig (old app: envSig.sig?.storeItemList ?? []).
  const sig = assertOk(envSig);
  return sig?.storeItemList ?? [];
}

export async function storeItemEntMerge(
  msg: MsgStudioEntMerge,
): Promise<SigStudioEntMerge> {
  const token = getBearerToken();
  if (!token) {
    throw new Error("Not authenticated.");
  }
  const envSig = await rpcCall<SigStudioEntMerge>(
    ENT_ID_GLOBAL,
    "store",
    "storeItemEntMerge",
    {msg, bearer: token},
  );
  return assertSig(envSig);
}
