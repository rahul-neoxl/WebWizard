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
 * Fire-and-forget: lead capture must never block or fail the wizard flow.
 */
export function submitContactUsBestEffort(input: ContactUsInput): void {
  void submitContactUs(input).catch((err) => {
    console.warn("contactUs failed:", err);
  });
}
