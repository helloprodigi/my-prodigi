import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";
import { isPicOf, resolveDivisionGroup } from "@/lib/permissions";

function getAdminDb() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return null;
  return createSupabaseClient(supabaseUrl, serviceRoleKey);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: targetId } = await params;
  const adminDb = getAdminDb();
  if (!adminDb) {
    return NextResponse.json({ error: "Missing Supabase configuration" }, { status: 500 });
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { hasProkerAccess } = body;
  if (typeof hasProkerAccess !== "boolean") {
    return NextResponse.json({ error: "hasProkerAccess wajib berupa boolean" }, { status: 400 });
  }

  const { data: caller } = await adminDb
    .from("User")
    .select("jabatan, role")
    .eq("id", user.id)
    .single();

  if (caller?.role !== "asisten_lab") {
    return NextResponse.json({ error: "Hanya Asisten Lab yang dapat mengatur akses" }, { status: 403 });
  }

  const group = resolveDivisionGroup(caller.jabatan);
  if (!group || !isPicOf(caller.jabatan, group)) {
    return NextResponse.json(
      { error: "Hanya Ketua/PIC divisi yang dapat memberikan atau mencabut akses" },
      { status: 403 }
    );
  }

  const { data: target } = await adminDb
    .from("User")
    .select("id, jabatan")
    .eq("id", targetId)
    .single();

  if (!target) {
    return NextResponse.json({ error: "Anggota tidak ditemukan" }, { status: 404 });
  }

  if (target.id === user.id || isPicOf(target.jabatan, group) || resolveDivisionGroup(target.jabatan) !== group) {
    return NextResponse.json({ error: "Anggota ini tidak dapat diatur aksesnya" }, { status: 403 });
  }

  const { error } = await adminDb
    .from("User")
    .update({ hasProkerAccess, updatedAt: new Date().toISOString() })
    .eq("id", targetId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
