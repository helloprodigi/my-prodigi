import { cookies } from "next/headers";
import Link from "next/link";

import { createClient } from "@/utils/supabase/server";
import { divisions } from "@/lib/divisions";
import { canEditProker, getCreatableDivisionNames, isKetuaOrWakilKetua } from "@/lib/permissions";
import { ProkerGrid } from "./ProkerGrid";

export default async function AslabProkerPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();

  const { data: kepalaDivisi } = await supabase
    .from("User")
    .select("name, jabatan")
    .ilike("jabatan", "%(Kepala Divisi)%");

  const picByOrgName = new Map(
    (kepalaDivisi ?? []).map((u) => [u.jabatan?.replace(" (Kepala Divisi)", "").trim(), u.name])
  );

  const { data: programKerja } = await supabase
    .from("ProgramKerja")
    .select("divisi, status");

  const statsByDivisi = new Map<string, { selesai: number; total: number }>();
  for (const pk of programKerja ?? []) {
    const stat = statsByDivisi.get(pk.divisi) || { selesai: 0, total: 0 };
    stat.total += 1;
    if (pk.status === "SELESAI") stat.selesai += 1;
    statsByDivisi.set(pk.divisi, stat);
  }

  let isKetua = false;
  let myDivisionName: string | null = null;
  let canEditMyDivision = false;
  let canCreateAnything = false;
  if (user) {
    const { data: currentUser } = await supabase
      .from("User")
      .select("jabatan, hasProkerAccess")
      .eq("id", user.id)
      .single();
    isKetua = isKetuaOrWakilKetua(currentUser?.jabatan);
    const myOrgName = currentUser?.jabatan?.replace(" (Kepala Divisi)", "").trim();
    myDivisionName = divisions.find((d) => d.orgName === myOrgName)?.name ?? null;
    canEditMyDivision = canEditProker(currentUser?.jabatan, myDivisionName ?? "", currentUser?.hasProkerAccess);
    canCreateAnything = getCreatableDivisionNames(currentUser?.jabatan, currentUser?.hasProkerAccess).length > 0;
  }

  const divisionsData = divisions.map((division) => {
    const stat = statsByDivisi.get(division.name) || { selesai: 0, total: 0 };
    return {
      ...division,
      pic: picByOrgName.get(division.orgName) || "Belum ditentukan",
      selesai: stat.selesai,
      total: stat.total,
    };
  });

  return (
    <div className="min-h-screen bg-[#FBFBFB] p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <h1 className="text-[22px] sm:text-3xl md:text-4xl font-bold text-[#0A1024]">Program Kerja</h1>
        {canCreateAnything && (
          <div className="flex items-center gap-3">
            <Link
              href="/aslab-proker/buat-laporan"
              className="bg-[#0A1024] text-white font-semibold px-5 py-2.5 rounded-lg text-sm hover:bg-[#1E2538] transition-colors"
            >
              Buat Laporan
            </Link>
            <Link
              href="/aslab-proker/buat-proker"
              className="bg-[#FFC700] text-[#0A1024] font-semibold px-5 py-2.5 rounded-lg text-sm hover:bg-[#e6b400] transition-colors"
            >
              Buat Proker
            </Link>
          </div>
        )}
      </div>

      <ProkerGrid
        divisionsData={divisionsData}
        isKetua={isKetua}
        myDivisionName={myDivisionName}
        canEditMyDivision={canEditMyDivision}
      />
    </div>
  );
}
