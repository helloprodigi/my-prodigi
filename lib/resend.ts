import { Resend } from "resend";

if (!process.env.RESEND_API_KEY) {
  throw new Error("RESEND_API_KEY belum di-set.");
}

export const resend = new Resend(process.env.RESEND_API_KEY);

export const RESEND_FROM = process.env.RESEND_FROM_EMAIL ?? "HelloProdigi <onboarding@resend.dev>";
