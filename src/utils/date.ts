export function isoDateTimeNow(): string {
  return new Date().toISOString();
}

export function getCurrentTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata";
  } catch {
    return "Asia/Kolkata";
  }
}

export function getLocalDateFormat(): string {
  return "dd/MM/yyyy, HH:mm:ss";
}

export function formatTrialEndDate(daysFromNow: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
