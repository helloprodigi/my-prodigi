import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";
import { getCreatableDivisionNames, isKetuaOrWakilKetua } from "@/lib/permissions";
import { createNotification } from "@/lib/notifications";

function getAdminDb() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return null;
  return createSupabaseClient(supabaseUrl, serviceRoleKey);
}

async function getCurrentUserJabatan(adminDb: ReturnType<typeof getAdminDb>) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized", status: 401 } as const;

  const { data: publicUser } = await adminDb!
    .from("User")
    .select("jabatan, hasProkerAccess")
    .eq("id", user.id)
    .single();

  return {
    user,
    jabatan: publicUser?.jabatan as string | null,
    hasProkerAccess: publicUser?.hasProkerAccess as boolean | null,
  } as const;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const adminDb = getAdminDb();
  if (!adminDb) {
    return NextResponse.json({ error: "Missing Supabase configuration" }, { status: 500 });
  }

  const { data, error } = await adminDb
    .from("ProgramKerja")
    .select("id, divisi, nama, deskripsi, tanggalMulai, tanggalSelesai, status")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Program kerja tidak ditemukan" }, { status: 404 });
  }

  return NextResponse.json({ programKerja: data });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const adminDb = getAdminDb();
  if (!adminDb) {
    return NextResponse.json({ error: "Missing Supabase configuration" }, { status: 500 });
  }

  const { data: existing } = await adminDb
    .from("ProgramKerja")
    .select("divisi, nama, status, createdById")
    .eq("id", id)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "Program kerja tidak ditemukan" }, { status: 404 });
  }

  const auth = await getCurrentUserJabatan(adminDb);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await req.json();
  const { nama, deskripsi, tanggalMulai, tanggalSelesai, status } = body;

  const editingFields = [nama, deskripsi, tanggalMulai, tanggalSelesai].some((v) => v !== undefined);
  if (editingFields && !getCreatableDivisionNames(auth.jabatan, auth.hasProkerAccess).includes(existing.divisi)) {
    return NextResponse.json(
      { error: "Hanya Ketua/Wakil Ketua atau PIC divisi yang dapat mengedit program kerja" },
      { status: 403 }
    );
  }
  if (status !== undefined && !isKetuaOrWakilKetua(auth.jabatan)) {
    return NextResponse.json(
      { error: "Hanya Ketua/Wakil Ketua yang dapat menandai program kerja selesai" },
      { status: 403 }
    );
  }

  const updateData: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  if (nama !== undefined) updateData.nama = nama;
  if (deskripsi !== undefined) updateData.deskripsi = deskripsi || null;
  if (tanggalMulai !== undefined) updateData.tanggalMulai = new Date(tanggalMulai).toISOString();
  if (tanggalSelesai !== undefined) updateData.tanggalSelesai = new Date(tanggalSelesai).toISOString();
  if (status !== undefined) {
    if (status !== "SELESAI" && status !== "BELUM_SELESAI") {
      return NextResponse.json({ error: "Status tidak valid" }, { status: 400 });
    }
    updateData.status = status;
  }

  const { error } = await adminDb.from("ProgramKerja").update(updateData).eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (status === "SELESAI" && existing.status !== "SELESAI" && existing.createdById) {
    await createNotification(existing.createdById, {
      type: "proker_acc",
      title: "Program Kerja Disetujui",
      description: `Program kerja "${existing.nama}" telah di-ACC oleh Ketua/Wakil Ketua.`,
    }).catch((err) => console.error("[Notification] proker ACC failed:", err));
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const adminDb = getAdminDb();
  if (!adminDb) {
    return NextResponse.json({ error: "Missing Supabase configuration" }, { status: 500 });
  }

  const { data: existing } = await adminDb
    .from("ProgramKerja")
    .select("divisi")
    .eq("id", id)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "Program kerja tidak ditemukan" }, { status: 404 });
  }

  const auth = await getCurrentUserJabatan(adminDb);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  if (!getCreatableDivisionNames(auth.jabatan, auth.hasProkerAccess).includes(existing.divisi)) {
    return NextResponse.json(
      { error: "Hanya Ketua/Wakil Ketua atau PIC divisi yang dapat membatalkan program kerja" },
      { status: 403 }
    );
  }

  const { error } = await adminDb.from("ProgramKerja").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
