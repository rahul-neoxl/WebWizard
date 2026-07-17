import {customAlphabet} from "nanoid";

const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const nanoId25 = customAlphabet(alphabet, 25);
const nanoId32 = customAlphabet(alphabet, 32);

export const ENT_ID_GLOBAL = "global";

const PREFIX_ENT_ID = "e";
const PREFIX_ADMIN_ID = "ea";
const PREFIX_REQUEST_ID = "req";
const PREFIX_TAB_ID = "t";

export type EntId = string;
export type AdminId = string;
export type RequestId = string;
export type TabId = string;
export type StoreItemId = string;
export type MetaId = string;

export function newGuid(): string {
  return nanoId25();
}

function nextId<T extends string>(prefix: string): T {
  return `${prefix}-${newGuid()}` as T;
}

function nextIdBig<T extends string>(prefix: string): T {
  return `${prefix}-${nanoId32()}` as T;
}

export function nextEntId(): EntId {
  return nextId<EntId>(PREFIX_ENT_ID);
}

export function nextAdminId(): AdminId {
  return nextId<AdminId>(PREFIX_ADMIN_ID);
}

export function nextRequestId(): RequestId {
  return nextIdBig<RequestId>(PREFIX_REQUEST_ID);
}

function nextTabId(): TabId {
  return nextId<TabId>(PREFIX_TAB_ID);
}

const KEY_TAB_ID = "tabId";

/**
 * Stable per-browser-tab id (sessionStorage-backed), mirroring the old app's
 * LocalTabId. The server correlates the auth session with this id, so it must
 * stay the same across grantBearerToken calls in a tab.
 */
export function getSessionTabId(): TabId {
  try {
    let tabId = sessionStorage.getItem(KEY_TAB_ID);
    if (!tabId) {
      tabId = nextTabId();
      sessionStorage.setItem(KEY_TAB_ID, tabId);
    }
    return tabId as TabId;
  } catch {
    return nextTabId();
  }
}
