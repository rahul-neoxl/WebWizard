import {config} from "../config";
import {isEmailHandle, normalizeHandle} from "../utils/phone";

/** Same options / values as the website Book-a-Demo dialog. */
export const COMPANY_SIZE_OPTIONS = [
  {label: "1–10 employees", value: "1to10"},
  {label: "11–50 employees", value: "11to50"},
  {label: "51–200 employees", value: "51to200"},
  {label: "201–500 employees", value: "201to500"},
  {label: "500+ employees", value: "moreThan500"},
] as const;

export type CompanySizeValue = (typeof COMPANY_SIZE_OPTIONS)[number]["value"];

export interface ContactUsInput {
  fullName: string;
  /** Mobile number or email from the registration "Mobile or email" field. */
  handle: string;
  companyName: string;
  companySize?: string;
}

/** Keys already sent or in-flight this page load — blocks double-submit / retries. */
const contactUsKeys = new Set<string>();

function contactUsKey(input: ContactUsInput): string {
  const handle = input.handle.trim();
  const normalized = isEmailHandle(handle)
    ? handle.toLowerCase()
    : normalizeHandle(handle);
  return [
    input.fullName.trim().toLowerCase(),
    normalized,
    input.companyName.trim().toLowerCase(),
    input.companySize ?? "",
  ].join("|");
}

/**
 * Same endpoint + payload shape as the website Book-a-Demo / Contact form
 * (`user/contactUs`). Maps the wizard's single handle into email or phone.
 */
export async function submitContactUs(input: ContactUsInput): Promise<void> {
  const handle = input.handle.trim();
  const isEmail = isEmailHandle(handle);

  const response = await fetch(
    `${config.apiBaseUrl}/global/rpc/v1/user/contactUs`,
    {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        fullName: input.fullName.trim(),
        mobileNumber: isEmail ? "" : normalizeHandle(handle),
        email: isEmail ? handle : "",
        companyName: input.companyName.trim(),
        attrMap: {
          source: "wizard",
          subject: "Free trial signup",
          ...(input.companySize ? {companySize: input.companySize} : {}),
        },
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`contactUs failed with status ${response.status}`);
  }
}

/**
 * Fire-and-forget lead capture. Dedupes identical payloads for this page load
 * so double-clicks, OTP retries, and "edit contact" resubmits with the same
 * data do not spam the server. Must never block or fail the wizard flow.
 */
export function submitContactUsBestEffort(input: ContactUsInput): void {
  const key = contactUsKey(input);
  if (contactUsKeys.has(key)) {
    return;
  }
  // Reserve immediately so a second concurrent call cannot race past the check.
  contactUsKeys.add(key);

  void submitContactUs(input).catch((err) => {
    // Allow a later retry if the network/API call itself failed.
    contactUsKeys.delete(key);
    console.warn("contactUs failed:", err);
  });
}
