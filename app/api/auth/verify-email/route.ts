import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getVerificationRecord, markVerificationUsed } from "@/lib/email-verification-store";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") ?? "";
  const email = url.searchParams.get("email") ?? "";

  return handleVerification(email, token);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = body.email ?? "";
    const token = body.token ?? "";

    return handleVerification(email, token);
  } catch (err: any) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
}

async function handleVerification(email: string, token: string) {
  if (!token || !email) {
    return NextResponse.json({ error: "Token atau email tidak lengkap." }, { status: 400 });
  }

  const record = getVerificationRecord(token);

  if (!record || record.email.toLowerCase() !== email.toLowerCase()) {
    return NextResponse.json({ error: "Kode verifikasi tidak valid atau sudah kedaluwarsa." }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      {
        ok: false,
        error: "SUPABASE_SERVICE_ROLE_KEY belum di-set. Email sudah diverifikasi, tapi user Supabase belum dibuat.",
        email: record.email ?? email,
        name: record.name,
      },
      { status: 500 },
    );
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { error: createUserError } = await supabaseAdmin.auth.admin.createUser({
    email: record.email,
    password: record.password,
    email_confirm: true,
    user_metadata: {
      full_name: record.name,
    },
  });

  if (createUserError) {
    return NextResponse.json({ error: createUserError.message }, { status: 500 });
  }

  const verified = markVerificationUsed(token);

  return NextResponse.json({
    ok: true,
    email: verified?.email ?? record.email,
    name: verified?.name ?? record.name,
  });
}
