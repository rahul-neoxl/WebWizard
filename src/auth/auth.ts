import {otpSignIn, otpVerify} from "../api/otp";
import {callerProfilePatch, grantBearerToken} from "../api/user";
import {assertSig} from "../net/rpc";
import {normalizeHandle} from "../utils/phone";

export type RequestOtpResult =
  | {kind: "otpSent"; verifyKey: string}
  | {kind: "alreadySignedIn"};

export async function requestOtp(handle: string): Promise<RequestOtpResult> {
  const normalized = normalizeHandle(handle);
  const envSig = await otpSignIn({
    deviceName: navigator.userAgent,
    deviceType: "web",
    handle: normalized,
    rememberMe: true,
  });

  // Existing session: not an error — skip OTP verification and authenticate
  // with the session's refresh token (parity with the old app's sign-in pages,
  // which call rpcGrantBearerToken directly on alreadySignedIn).
  if (envSig.error?.errorCode === "alreadySignedIn") {
    await grantBearerToken();
    return {kind: "alreadySignedIn"};
  }

  const sig = assertSig(envSig);
  return {kind: "otpSent", verifyKey: sig.verifyKey};
}

export async function verifyOtpAndAuth(
  verifyKey: string,
  otp: string,
  fullName: string,
): Promise<void> {
  await otpVerify({verifyKey, otp});
  await grantBearerToken();

  const trimmed = fullName.trim();
  if (trimmed) {
    // Best-effort: user is already authenticated, so a profile-name
    // failure must not block onboarding — the name can be set later.
    try {
      await callerProfilePatch({nickName: trimmed});
    } catch {
      // ignore
    }
  }
}
