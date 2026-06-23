import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createVerificationRecord, getVerificationRecordByEmail } from "@/lib/email-verification-store";

const resendApiKey = process.env.RESEND_API_KEY;
const resendFrom = process.env.RESEND_FROM_EMAIL ?? "HelloProdigi <onboarding@resend.dev>";

export async function POST(request: Request) {
  try {
    if (!resendApiKey) {
      return NextResponse.json({ error: "RESEND_API_KEY belum di-set." }, { status: 500 });
    }

    const payload = await request.json().catch(() => null);
    const email = typeof payload?.email === "string" ? payload.email.trim() : "";
    const name = typeof payload?.name === "string" ? payload.name.trim() : "";
    const password = typeof payload?.password === "string" ? payload.password : "";

    if (!email) {
      return NextResponse.json({ error: "Email wajib diisi." }, { status: 400 });
    }

    const origin = new URL(request.url).origin;
    const existingRecord = getVerificationRecordByEmail(email);
    const record = password
      ? createVerificationRecord(email, name || existingRecord?.name || "Pengguna MyProdigi", password)
      : existingRecord
        ? createVerificationRecord(
            email,
            existingRecord.name || name || "Pengguna MyProdigi",
            existingRecord.password,
          )
        : null;

    if (!record) {
      return NextResponse.json({ error: "Data registrasi belum ditemukan. Silakan daftar ulang." }, { status: 400 });
    }

    const verificationUrl = `${origin}/verify-otp?email=${encodeURIComponent(email)}&token=${encodeURIComponent(record.token)}`;
    const brandLogoUrl = `${origin}/assets/myprodigi.svg`;

    const resend = new Resend(resendApiKey);
    const { error } = await resend.emails.send({
      from: resendFrom,
      to: email,
      subject: "Verifikasi email akun MyProdigi",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827; background:#ffffff; padding: 8px 0; max-width: 600px; margin: 0 auto;">
          <div style="margin: 0 0 16px;">
            <img src="${brandLogoUrl}" alt="MyProdigi" style="display:block; width: 180px; height: auto;" />
          </div>
          <h2 style="margin: 0 0 12px; font-size: 24px; line-height: 1.3;">Halo ${name || "Pengguna"},</h2>
          <p style="margin: 0 0 16px; font-size: 15px; color:#374151;">Terima kasih telah mendaftar di MyProdigi.</p>
          <p style="margin: 0 0 16px; font-size: 15px; color:#374151;">Satu langkah sebelum kemenangan, silakan masukkan kode verifikasi berikut di halaman pendaftaran:</p>
          <div style="margin: 32px 0; text-align: center;">
            <span style="display:inline-block; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #111827; background: #f3f4f6; padding: 16px 32px; border-radius: 12px; border: 1px solid #e5e7eb;">
              ${record.token}
            </span>
          </div>
          <p style="margin: 24px 0 0; font-size: 13px; color:#6B7280;">Kode ini akan kedaluwarsa dalam 15 menit. Email ini dikirim otomatis. Jika kamu tidak mendaftar di MyProdigi, abaikan pesan ini.</p>
        </div>
      `,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, email: record.email });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "Gagal mengirim verifikasi." }, { status: 500 });
  }
}
