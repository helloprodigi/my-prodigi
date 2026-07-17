import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";
import { getCreatableDivisionNames } from "@/lib/permissions";

function getAdminDb() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return null;
  return createSupabaseClient(supabaseUrl, serviceRoleKey);
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
      .select("role, jabatan, hasProkerAccess")
      .eq("id", user.id)
      .single();

    if (publicUser?.role !== "asisten_lab") {
      return NextResponse.json({ error: "Hanya Asisten Lab yang dapat membuat laporan" }, { status: 403 });
    }

    const body = await req.json();
    const { programKerjaId, catatan, fileUrl } = body;

    if (!programKerjaId || !fileUrl) {
      return NextResponse.json({ error: "Program kerja dan file laporan wajib diisi" }, { status: 400 });
    }

    const { data: programKerja } = await adminDb
      .from("ProgramKerja")
      .select("id, divisi")
      .eq("id", programKerjaId)
      .single();

    if (!programKerja) {
      return NextResponse.json({ error: "Program kerja tidak ditemukan" }, { status: 404 });
    }

    const allowedDivisions = getCreatableDivisionNames(publicUser.jabatan, publicUser.hasProkerAccess);
    if (!allowedDivisions.includes(programKerja.divisi)) {
      return NextResponse.json(
        { error: "Anda tidak memiliki akses untuk membuat laporan di divisi ini" },
        { status: 403 }
      );
    }

    const now = new Date().toISOString();
    const laporanData = {
      id: crypto.randomUUID(),
      programKerjaId,
      catatan: catatan || null,
      fileUrl,
      createdById: user.id,
      updatedAt: now,
    };

    const { error: laporanError } = await adminDb.from("Laporan").insert(laporanData);
    if (laporanError) {
      console.error("Database Insert Error:", laporanError);
      return NextResponse.json({ error: laporanError.message }, { status: 500 });
    }

    const { error: updateError } = await adminDb
      .from("ProgramKerja")
      .update({ status: "SELESAI", updatedAt: now })
      .eq("id", programKerjaId);

    if (updateError) {
      console.error("Database Update Error:", updateError);
    }

    return NextResponse.json({ success: true, laporan: laporanData });
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ error: error.message ?? "Terjadi kesalahan" }, { status: 500 });
  }
}
