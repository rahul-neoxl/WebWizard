/**
 * GA4 (gtag.js) event helpers for the onboarding wizard funnel.
 *
 * The gtag bootstrap lives in index.html (measurement id G-DG89L8TY93 — the
 * same property the old wizard reported to). Every event is tagged with
 * `environment` so development/staging traffic can be filtered out of (or
 * compared against) production in GA4 — all environments report to the same
 * measurement id, same as the old app.
 */
import {config} from "../config";

type GtagParams = Record<string, unknown>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

/** The set of wizard analytics events (parity with the old wizard's events). */
export type WizardEvent =
  | "wizard_open" // wizard app opened
  | "wizard_otp" // OTP entry view appeared
  | "wizard_otp_verified" // OTP verified successfully
  | "wizard_enterprise_deployed" // enterprise deployed successfully
  | "wizard_enterprise_deploy_failed"; // enterprise deployment failed

/** Fire a wizard GA4 event. Safe no-op when gtag is unavailable (blocked / not yet loaded). */
export function trackWizardEvent(event: WizardEvent, params?: GtagParams): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") {
    return;
  }

  window.gtag("event", event, {
    environment: config.environment,
    ...params,
  });
}
