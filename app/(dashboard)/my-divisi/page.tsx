import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/utils/supabase/server";
import { divisions, intiGroup } from "@/lib/divisions";
import { getMemberLabel, isPicOf, resolveDivisionGroup } from "@/lib/permissions";
import { MemberGrid, type Member } from "./MemberGrid";

export default async function MyDivisiPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: me } = await supabase
    .from("User")
    .select("id, jabatan, role")
    .eq("id", user.id)
    .single();

  if (me?.role !== "asisten_lab" || !me.jabatan) {
    redirect("/dashboard");
  }

  const group = resolveDivisionGroup(me.jabatan);

  const { data: members } = await supabase
    .from("User")
    .select("id, name, nim, nomorWa, photoUrl, jabatan, hasProkerAccess")
    .eq("role", "asisten_lab")
    .order("name", { ascending: true });

  // The profile page (app/(dashboard)/profile/page.tsx) treats each user's own
  // auth `user_metadata.photoUrl` as authoritative over the User table's
  // `photoUrl` column when both exist — mirror that here so a member's card
  // always shows the same photo they see on their own profile.
  const photoUrlBySupabaseId = new Map<string, string>();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (supabaseUrl && serviceRoleKey) {
    const adminDb = createSupabaseClient(supabaseUrl, serviceRoleKey);
    const { data: authUsers } = await adminDb.auth.admin.listUsers({ perPage: 1000 });
    for (const authUser of authUsers?.users ?? []) {
      const metadataPhotoUrl = authUser.user_metadata?.photoUrl;
      if (metadataPhotoUrl) photoUrlBySupabaseId.set(authUser.id, metadataPhotoUrl);
    }
  }

  const divisionMembers: Member[] = (members ?? [])
    .filter((m) => resolveDivisionGroup(m.jabatan) === group)
    .map((m) => {
      const isPic = isPicOf(m.jabatan, group);
      return {
        id: m.id,
        name: m.name ?? "Tanpa Nama",
        nim: m.nim,
        nomorWa: m.nomorWa,
        photoUrl: photoUrlBySupabaseId.get(m.id) ?? m.photoUrl,
        label: getMemberLabel(m.jabatan, group, isPic),
        hasProkerAccess: !!m.hasProkerAccess,
        isPic,
      };
    })
    .sort((a, b) => (a.isPic === b.isPic ? 0 : a.isPic ? -1 : 1));

  const banner =
    group === "INTI"
      ? {
          title: "Eksekutif Laboratorium",
          label: "Divisi Prodigi @ DTC LAB",
          color: intiGroup.color,
          textColor: "#ffffff",
        }
      : (() => {
          const division = divisions.find((d) => d.name === group);
          return {
            title: division?.orgName ?? "Divisi",
            label: "Divisi Prodigi @ DTC LAB",
            color: division?.color ?? "#0A1024",
            textColor: "#ffffff",
          };
        })();

  const canManageAccess = isPicOf(me.jabatan, group);

  return (
    <div className="min-h-screen bg-[#FBFBFB] p-4 sm:p-6 lg:p-8">
      <h1 className="text-[22px] sm:text-3xl md:text-4xl font-bold text-[#0A1024] mb-8">MyDivisi</h1>

      <div
        className="relative overflow-hidden rounded-2xl px-5 sm:px-8 py-10 h-40 flex flex-col justify-center mb-8"
        style={{ backgroundColor: banner.color }}
      >
        <div className="absolute bottom-0 right-0 pointer-events-none w-24 h-16 sm:w-40 sm:h-28 md:w-56 md:h-40 select-none flex items-end justify-end opacity-100 [filter:brightness(0)_invert(1)]">
          <img
            src="/assets/matchmaking/cropped-yellowcircle.svg"
            alt=""
            className="object-right-bottom object-contain m-0 p-0 block w-full h-full"
          />
        </div>
        <div className="relative">
          <p className="text-xs font-semibold mb-1" style={{ color: banner.textColor, opacity: 0.8 }}>
            {banner.label}
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: banner.textColor }}>
            {banner.title}
          </h2>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6">
        <h3 className="font-bold text-lg text-[#0A1024] mb-4">Daftar Anggota</h3>
        <MemberGrid members={divisionMembers} canManageAccess={canManageAccess} />
      </div>
    </div>
  );
}
