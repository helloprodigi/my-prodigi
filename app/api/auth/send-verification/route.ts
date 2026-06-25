import { NextResponse } from "next/server";
import { resend, RESEND_FROM } from "@/lib/resend";
import { createVerificationRecord, getVerificationRecordByEmail } from "@/lib/email-verification-store";
import { verificationEmailHtml } from "@/lib/email-templates";

export async function POST(request: Request) {
  try {
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

    const { error } = await resend.emails.send({
      from: RESEND_FROM,
      to: email,
      subject: `${record.token} — Kode Verifikasi MyProdigi kamu`,
      html: verificationEmailHtml({
        recipientName: name || "Pengguna",
        otpCode: record.token,
      }),
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, email: record.email });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "Gagal mengirim verifikasi." }, { status: 500 });
  }
}
