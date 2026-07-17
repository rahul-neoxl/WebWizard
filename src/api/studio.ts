import type {MsgVersion, SigEntDeployStatus} from "./types";
import {assertSig, rpcCall} from "../net/rpc";
import {getBearerToken} from "./user";

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
