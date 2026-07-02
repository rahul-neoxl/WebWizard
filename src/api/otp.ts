import type {
  EnvSignal,
  MsgOtpSignIn,
  MsgOtpVerify,
  SigCallback,
  SigVerifyKey,
} from "./types";
import {ENT_ID_GLOBAL, assertOk, rpcCall} from "../net/rpc";

/**
 * Returns the raw envelope: callers must inspect error.errorCode themselves —
 * "alreadySignedIn" is not a failure (existing session, OTP not needed).
 */
export async function otpSignIn(
  msg: MsgOtpSignIn,
): Promise<EnvSignal<SigVerifyKey>> {
  return rpcCall<SigVerifyKey>(
    ENT_ID_GLOBAL,
    "user",
    "otpSignIn",
    {msg, refresh: true},
  );
}

export async function otpVerify(msg: MsgOtpVerify): Promise<void> {
  const envSig = await rpcCall<SigCallback>(
    ENT_ID_GLOBAL,
    "otp",
    "otpVerify",
    {msg},
  );
  // Old StepAuth checks error only — the success envelope may carry no sig.
  assertOk(envSig);
}
