export interface EnvError {
  errorCode: string;
  errorMessage?: string;
  errorParams?: unknown[];
  validationErrors?: Record<string, string>;
}

export interface EnvSignal<S = unknown> {
  cookieRememberMe?: boolean;
  cookieValue?: string;
  error?: EnvError;
  requestId?: string;
  serverName?: string;
  serverTime?: number;
  serviceName?: string;
  /** Absent on void-style success responses (sigName: "SigDone") — see assertOk. */
  sig?: S;
  sigName?: string;
}

export interface SigVerifyKey {
  verifyKey: string;
}

export interface SigBearerToken {
  bearerToken: string;
  caller?: unknown;
  /** When true the server requires a refresh-token rotation via user/grantRefreshToken. */
  updateRefreshToken?: boolean;
}

export interface SigDone {
  done?: boolean;
}

export interface SigCallback {
  callback?: boolean;
}

export type SigRefreshToken = SigCallback;

export interface MsgOtpSignIn {
  deviceName: string;
  deviceType: "web";
  handle: string;
  rememberMe?: boolean;
}

export interface MsgOtpVerify {
  verifyKey: string;
  otp: string;
}

export interface MsgGrantBearerToken {
  appVersion: string;
  sendCaller?: boolean;
  tabId: string;
}

export interface MsgCallerProfilePatch {
  nickName: string;
  about?: string;
}

export interface StudioEntDetails {
  name: string;
  about?: string;
  timeZone?: string;
  displayDateFormat?: string;
  avatarId?: string;
  templateCodes?: string[];
}

export interface StudioEntMap {
  keys: string[];
  map: Record<string, unknown>;
}

export interface StudioEnt {
  entId: string;
  version: string;
  versionCode: number;
  lastUpdateTime: string;
  createdBy: string;
  creationTime: string;
  lastUpdateBy: string;
  details: StudioEntDetails;
  varMap: StudioEntMap;
  translationMap: StudioEntMap;
  actionMap: StudioEntMap;
  automationMap: StudioEntMap;
  driveSheetMap: StudioEntMap;
  formMap: StudioEntMap;
  moduleMap: StudioEntMap;
  groupMap: StudioEntMap;
  pluginMap: StudioEntMap;
  roleMap: StudioEntMap;
  reportMap: StudioEntMap;
  deeplinkMap: StudioEntMap;
  spreadsheetMap: StudioEntMap;
  deployVarMap: StudioEntMap;
}

/**
 * Single-call enterprise pipeline. The server merges the given template codes into the
 * supplied StudioEnt, creates the enterprise, and starts deployment — replacing the
 * separate merge + create + deploy calls.
 */
export interface MsgStoreItemEntMergeDeploy {
  studioEnt: StudioEnt;
  templateCodes: string[];
}

export interface SigStoreItemEntMerge {
  jobKey: string;
}

export interface MsgVersion {
  version?: string;
}

export type DeployExecutionState =
  | "created"
  | "initiated"
  | "inProgress"
  | "completed"
  | "failed";

export interface SigEntDeployStatus {
  entId: string;
  executionState: DeployExecutionState;
  jobKey: string;
  lastUpdate: string;
  message: string;
}
