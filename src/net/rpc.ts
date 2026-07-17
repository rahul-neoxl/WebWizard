import axios, {type AxiosRequestConfig, type Method} from "axios";
import {config} from "../config";
import {ENT_ID_GLOBAL, nextRequestId} from "./ids";
import type {EnvError, EnvSignal} from "../api/types";

const RPC = axios.create({
  timeout: 180000,
  withCredentials: true,
  headers: {
    accept: "application/json",
    "content-type": "application/json;charset=utf-8",
  },
});

let refreshTokenValue: string | undefined;

export function getErrorMessage(envError?: EnvError): string {
  if (!envError) {
    return "Something went wrong. Please try again.";
  }
  if (envError.errorMessage) {
    let message = String(envError.errorMessage);
    if (envError.errorParams?.length) {
      for (const param of envError.errorParams) {
        message = message.replace("%s", String(param));
      }
    }
    return message;
  }
  if (envError.errorCode === "networkError") {
    return "Unable to connect. Check your internet connection.";
  }
  return envError.errorCode || "Something went wrong. Please try again.";
}

function storeCookieFromSignal<S>(envSig: EnvSignal<S>): void {
  const cookieValue = envSig.cookieValue;
  if (cookieValue !== undefined) {
    // Server semantics (see WebCore RpcCall + LocalCookie): a present-but-empty
    // cookieValue means "delete the refresh token".
    refreshTokenValue = cookieValue.length > 0 ? cookieValue : undefined;
  }
}

export interface RpcOptions {
  method?: Method;
  msg?: unknown;
  bearer?: string;
  refresh?: boolean;
  /** Internal: set when a call is retried after re-granting the bearer token. */
  retried?: boolean;
}

type BearerRefresher = () => Promise<string>;

let bearerRefresher: BearerRefresher | undefined;

/**
 * Registered by api/user.ts (setter injection avoids a circular import).
 * Enables the retry-on-unauthorizedBearerToken behavior below, mirroring
 * RpcCallWithRetry in the old app.
 */
export function setBearerRefresher(fn: BearerRefresher): void {
  bearerRefresher = fn;
}

export async function rpcCall<S>(
  entId: string,
  serviceName: string,
  apiName: string,
  options: RpcOptions = {},
): Promise<EnvSignal<S>> {
  const envSig = await rpcCallOnce<S>(entId, serviceName, apiName, options);
  const errorCode = envSig.error?.errorCode;

  if (errorCode === "unauthorizedRefreshToken") {
    // Refresh token is dead — clear it so a restarted flow begins clean
    // (analog of the old app's sign-out + LocalCookie.remove()).
    refreshTokenValue = undefined;
    return envSig;
  }

  // Bearer token expired mid-flow (e.g. during deploy polling): re-grant once
  // and retry the original call, mirroring RpcCallWithRetry in the old app.
  if (
    errorCode === "unauthorizedBearerToken" &&
    options.bearer &&
    bearerRefresher &&
    !options.retried
  ) {
    try {
      const freshBearer = await bearerRefresher();
      return await rpcCall<S>(entId, serviceName, apiName, {
        ...options,
        bearer: freshBearer,
        retried: true,
      });
    } catch {
      return envSig;
    }
  }

  return envSig;
}

async function rpcCallOnce<S>(
  entId: string,
  serviceName: string,
  apiName: string,
  options: RpcOptions = {},
): Promise<EnvSignal<S>> {
  const {method = "post", msg, bearer, refresh = false} = options;
  const headers: Record<string, string> = {
    "X-Request-Id": nextRequestId(),
  };

  if (bearer) {
    headers.Authorization = bearer;
  }

  if (refresh && refreshTokenValue) {
    headers["X-Auth-Token"] = refreshTokenValue;
  }

  const url = `${config.apiBaseUrl}/${entId}/rpc/v1/${serviceName}/${apiName}`;
  const axiosConfig: AxiosRequestConfig = {method, url, headers};

  if (method === "get" || method === "delete") {
    axiosConfig.params = msg;
  } else {
    axiosConfig.data = msg;
  }

  try {
    const response = await RPC.request<EnvSignal<S>>(axiosConfig);
    const envSig = response.data ?? {error: {errorCode: "networkError"}};
    storeCookieFromSignal(envSig);
    return envSig;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.data) {
      const envSig = err.response.data as EnvSignal<S>;
      storeCookieFromSignal(envSig);
      if (envSig.error) {
        return envSig;
      }
    }
    const detail =
      axios.isAxiosError(err) && err.message ? err.message : undefined;
    return {
      error: {
        errorCode: "networkError",
        errorMessage:
          detail === "Network Error"
            ? "Unable to reach the server. If you're running locally, restart the dev server so the API proxy is active."
            : detail ?? "Network request failed",
      },
    };
  }
}

/** For calls whose response must carry a sig payload (data reads). */
export function assertSig<S>(
  envSig: EnvSignal<S>,
): S {
  if (envSig.error) {
    throw new Error(getErrorMessage(envSig.error));
  }
  if (!envSig.sig) {
    throw new Error("Empty response from server.");
  }
  return envSig.sig;
}

/**
 * For void-style calls (SigDone etc.): a success envelope carries NO sig field
 * at all — success is simply the absence of error. E.g. callerProfilePatch returns
 * {requestId, serverTime, serviceName, sigName: "SigDone", serverName}.
 */
export function assertOk<S>(envSig: EnvSignal<S>): S | undefined {
  if (envSig.error) {
    throw new Error(getErrorMessage(envSig.error));
  }
  return envSig.sig;
}

export {ENT_ID_GLOBAL};
