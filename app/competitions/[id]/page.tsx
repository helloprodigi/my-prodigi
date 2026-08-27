import { cookies } from "next/headers";
import type { Metadata } from "next";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/lib/supabase-admin";
import Link from "next/link";
import Image from "next/image";
import { Calendar, Building, Users, ExternalLink } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const adminDb = createAdminClient();
  const { data: comp } = await adminDb
    .from("Competition")
    .select("title, organizer, deadline")
    .eq("id", id)
    .single();

  if (!comp) return { title: "Lomba Tidak Ditemukan | MyProdigi" };

  const deadlineLabel = new Date(comp.deadline).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const description = `Diselenggarakan oleh ${comp.organizer}. Deadline ${deadlineLabel}. Cek detailnya di MyProdigi!`;

  return {
    title: `${comp.title} | MyProdigi`,
    description,
    openGraph: { title: comp.title, description, type: "website" },
    twitter: { card: "summary", title: comp.title, description },
  };
}

const getTagColors = (skill: string) => {
  if (skill.includes("UI/UX")) return "bg-blue-50 text-blue-700";
  if (skill.includes("Innovation")) return "bg-green-50 text-green-700";
  if (skill.includes("Web") || skill.includes("Frontend")) return "bg-yellow-50 text-yellow-700";
  if (skill.includes("Business")) return "bg-red-50 text-red-700";
  return "bg-gray-50 text-gray-600";
};

// Public, unauthenticated-friendly page — this is the link ShareCompetitionButton
// hands out, so it must render for visitors who aren't logged in at all. It
// lives outside the (dashboard) route group on purpose (no sidebar chrome)
// and reads with the admin client so it never depends on a viewer's RLS session.
export default async function CompetitionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const adminDb = createAdminClient();
  const { data: comp, error } = await adminDb
    .from("Competition")
    .select("*")
    .eq("id", id)
    .single();

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  const buatTimHref = user
    ? `/matchmaking?competitionId=${id}`
    : `/login?redirect=${encodeURIComponent(`/matchmaking?competitionId=${id}`)}`;

  if (error || !comp) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center p-6 gap-4">
        <h1 className="text-xl md:text-2xl font-bold text-red-500 text-center">Lomba Tidak Ditemukan</h1>
        <Link href="/" className="text-blue-500 hover:underline">
          Kembali ke MyProdigi
        </Link>
      </div>
    );
  }

  const deadlineLabel = new Date(comp.deadline).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center px-4 py-8 sm:py-12">
      <Link href="/" className="mb-6 sm:mb-8">
        <Image src="/assets/myprodigi-sidebar.svg" alt="MyProdigi" width={40} height={40} className="w-10 h-10 object-contain" />
      </Link>

      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="h-32 sm:h-40 bg-gradient-to-r from-[#FFF9E6] to-[#FFE380] relative">
          {comp.category && (
            <div className="absolute top-4 right-4 bg-white/50 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-semibold text-[#0A1024]">
              {comp.category}
            </div>
          )}
        </div>

        <div className="p-5 sm:p-8">
          <h1 className="text-xl sm:text-3xl font-bold text-[#0A1024] mb-4">{comp.title}</h1>

          {comp.skills && comp.skills.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6 sm:mb-8">
              {comp.skills.map((skill: string) => (
                <span key={skill} className={`px-3 py-1 text-xs sm:text-sm font-medium rounded-full ${getTagColors(skill)}`}>
                  {skill}
                </span>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 sm:mb-8">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50">
              <Building className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Penyelenggara</p>
                <p className="text-[#0A1024] font-semibold text-sm sm:text-base break-words">{comp.organizer}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50">
              <Calendar className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Terakhir Registrasi</p>
                <p className="text-red-500 font-semibold text-sm sm:text-base">{deadlineLabel}</p>
              </div>
            </div>
          </div>

          {comp.description && (
            <div className="mb-6 sm:mb-8">
              <h2 className="text-lg font-bold text-[#0A1024] mb-3">Deskripsi</h2>
              <div className="text-gray-600 text-sm sm:text-base whitespace-pre-wrap leading-relaxed">{comp.description}</div>
            </div>
          )}

          <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row gap-3">
            <Link
              href={buatTimHref}
              className="flex-1 bg-[#FFC700] hover:bg-[#e6b400] text-[#0A1024] font-bold py-3 sm:py-4 px-4 rounded-xl transition-colors text-sm sm:text-base flex items-center justify-center gap-2 shadow-sm text-center"
            >
              <Users className="w-5 h-5 shrink-0" />
              <span>Buat Tim untuk Lomba Ini</span>
            </Link>

            {comp.link && (
              <a
                href={comp.link.startsWith("http") ? comp.link : `https://${comp.link}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-white border border-gray-200 hover:bg-gray-50 text-[#0A1024] font-bold py-3 sm:py-4 px-4 rounded-xl transition-colors text-sm sm:text-base flex items-center justify-center gap-2 text-center"
              >
                <ExternalLink className="w-5 h-5 shrink-0" />
                <span>Lihat Detail Lomba</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
