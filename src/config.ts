export const APP_SELECTION_URL = "https://neome.ai/app-selection/";

export const WIZARD_FREE_TRIAL_DAYS = 15;
export const WIZARD_MAX_USERS = 5;
export const WIZARD_MAX_TEMPLATE_SELECTIONS = 3;

export const OTP_TOTAL_SECONDS = 120;
export const MAX_RESEND_LIMIT = 3;
export const OTP_LENGTH = 6;

export const STUDIO_ENT_VERSION = 5;
export const APP_VERSION = "wizard-v2";

const ssl = import.meta.env.VITE_SSL !== "false";
const apiHost = import.meta.env.VITE_API_HOST as string;

/** In dev, use same-origin paths so Vite proxies to the API (CORS only allows deployed origins). */
function getApiBaseUrl(): string {
  if (import.meta.env.DEV) {
    return "";
  }
  return `${ssl ? "https" : "http"}://${apiHost}`;
}

export const config = {
  apiHost,
  webHost: import.meta.env.VITE_WEB_HOST as string,
  ssl,
  appStoreUrl: import.meta.env.VITE_APPSTORE_URL as string,
  playStoreUrl: import.meta.env.VITE_PLAYSTORE_URL as string,
  apiBaseUrl: getApiBaseUrl(),
  webBaseUrl: `${ssl ? "https" : "http"}://${import.meta.env.VITE_WEB_HOST}`,
};
