import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";
import { divisions } from "@/lib/divisions";

const DIVISION_NAMES = divisions.map((d) => d.name);

function getAdminDb() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return null;
  return createSupabaseClient(supabaseUrl, serviceRoleKey);
}

export async function GET(req: Request) {
  const adminDb = getAdminDb();
  if (!adminDb) {
    return NextResponse.json({ error: "Missing Supabase configuration" }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const divisi = searchParams.get("divisi");

  let query = adminDb
    .from("ProgramKerja")
    .select("id, divisi, nama, deskripsi, tanggalMulai, tanggalSelesai, status, createdAt")
    .order("createdAt", { ascending: false });

  if (divisi) query = query.eq("divisi", divisi);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ programKerja: data ?? [] });
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminDb = getAdminDb();
    if (!adminDb) {
      return NextResponse.json({ error: "Missing Supabase configuration" }, { status: 500 });
    }

    const { data: publicUser } = await adminDb
      .from("User")
      .select("role")
      .eq("id", user.id)
      .single();

    if (publicUser?.role !== "asisten_lab") {
      return NextResponse.json({ error: "Hanya Asisten Lab yang dapat membuat program kerja" }, { status: 403 });
    }

    const body = await req.json();
    const { divisi, nama, deskripsi, tanggalMulai, tanggalSelesai } = body;

    if (!divisi || !DIVISION_NAMES.includes(divisi)) {
      return NextResponse.json({ error: "Divisi tidak valid" }, { status: 400 });
    }
    if (!nama || !tanggalMulai || !tanggalSelesai) {
      return NextResponse.json({ error: "Nama program kerja dan waktu pelaksanaan wajib diisi" }, { status: 400 });
    }

    const now = new Date().toISOString();
    const programKerjaData = {
      id: crypto.randomUUID(),
      divisi,
      nama,
      deskripsi: deskripsi || null,
      tanggalMulai: new Date(tanggalMulai).toISOString(),
      tanggalSelesai: new Date(tanggalSelesai).toISOString(),
      status: "BELUM_SELESAI",
      createdById: user.id,
      updatedAt: now,
    };

    const { error } = await adminDb.from("ProgramKerja").insert(programKerjaData);

    if (error) {
      console.error("Database Insert Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, programKerja: programKerjaData });
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ error: error.message ?? "Terjadi kesalahan" }, { status: 500 });
  }
}
