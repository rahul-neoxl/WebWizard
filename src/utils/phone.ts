import {parsePhoneNumberFromString} from "libphonenumber-js/min";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[0-9]{6,15}$/;

const timezoneDialCodes: Record<string, string> = {
  "Asia/Kolkata": "+91",
  "America/New_York": "+1",
  "America/Los_Angeles": "+1",
  "America/Chicago": "+1",
  "Europe/London": "+44",
  "Europe/Paris": "+33",
  "Europe/Berlin": "+49",
  "Asia/Singapore": "+65",
  "Asia/Dubai": "+971",
  "Australia/Sydney": "+61",
};

export function isValidHandle(handle: string): boolean {
  const value = handle.trim();
  if (!value) {
    return false;
  }
  return (
    EMAIL_REGEX.test(value) ||
    PHONE_REGEX.test(value.replace(/[\s-]/g, ""))
  );
}

export function normalizeHandle(handle: string): string {
  const trimmed = handle.trim();

  if (!/^[0-9]+$/.test(trimmed)) {
    return trimmed;
  }

  try {
    const timeZoneName = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const dialCode = timezoneDialCodes[timeZoneName] || "+91";
    const candidate = dialCode + trimmed;
    const parsed = parsePhoneNumberFromString(candidate);
    if (parsed?.isValid()) {
      return candidate;
    }
  } catch {
    // fall through
  }

  return trimmed;
}
