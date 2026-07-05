import { Resend } from "resend";

if (!process.env.RESEND_API_KEY) {
  throw new Error("RESEND_API_KEY belum di-set.");
}

export const resend = new Resend(process.env.RESEND_API_KEY);

export const RESEND_FROM = process.env.RESEND_FROM_EMAIL ?? "HelloProdigi <onboarding@resend.dev>";

const RESEND_LIMIT_ERROR_NAMES = new Set([
  "rate_limit_exceeded",
  "daily_quota_exceeded",
  "monthly_quota_exceeded",
]);

export function isResendLimitError(error: { name?: string; statusCode?: number | null } | null | undefined) {
  if (!error) return false;
  return error.statusCode === 429 || RESEND_LIMIT_ERROR_NAMES.has(error.name ?? "");
}

export class ResendLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ResendLimitError";
  }
}
