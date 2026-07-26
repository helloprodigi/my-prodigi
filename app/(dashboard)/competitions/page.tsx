import { cookies } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { FileText } from "lucide-react";
import AdminCompetitionActions from "@/components/AdminCompetitionActions";
import CompetitionsHeader from "@/components/CompetitionsHeader";
import PreviewLombaCard from "@/components/PreviewLombaCard";
import { createAdminClient } from "@/lib/supabase-admin";
import { createClient } from "@/utils/supabase/server";

type DraftCompetitionTab = "Guidebook" | "Proposal" | "Pitch Deck";

type DraftCompetitionRecord = {
  id: string;
  title: string;
  organizer: string;
  tab: string;
  skills: string[];
  description: string | null;
  link: string | null;
};

const getTagColors = (skill: string) => {
  if (skill.includes("UI/UX")) return "bg-blue-50 text-blue-700";
  if (skill.includes("Innovation")) return "bg-green-50 text-green-700";
  if (skill.includes("Web") || skill.includes("Frontend")) return "bg-yellow-50 text-yellow-700";
  if (skill.includes("Business")) return "bg-red-50 text-red-700";
  return "bg-gray-50 text-gray-600";
};

export default async function CompetitionsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; page?: string }>;
}) {
  const params = await searchParams;
  const currentTab = params.tab || "Belmawa";
  const currentPage = Number.parseInt(params.page || "1", 10);
  const limit = 8;
  const from = (currentPage - 1) * limit;
  const to = from + limit - 1;

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  try {
    const adminDb = createAdminClient();
    const today = new Date().toISOString();
    await adminDb.from("Competition").delete().lt("deadline", today);
  } catch (error) {
    console.warn("Skipping expired competition cleanup:", error);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let role = "talent";
  if (user) {
    const { data: publicUser } = await supabase.from("User").select("role").eq("id", user.id).single();
    role = publicUser?.role || "talent";
  }

  if (role === "asisten_lab") {
    const draftTabs: DraftCompetitionTab[] = ["Guidebook", "Proposal", "Pitch Deck"];
    const requestedTab = draftTabs.includes(currentTab as DraftCompetitionTab) ? (currentTab as DraftCompetitionTab) : "Guidebook";

    const { data: draftCompetitions, error: draftError } = await supabase
      .from("DraftCompetition")
      .select("id,title,organizer,tab,skills,description,link,createdAt")
      .eq("tab", requestedTab)
      .order("createdAt", { ascending: false });

    return (
      <div className="min-h-screen bg-[#FAFAFA] p-4 sm:p-6 md:p-10 w-full overflow-hidden">
        <div className="mb-6 sm:mb-8 flex items-center justify-between">
          <h1 className="text-[22px] font-bold text-[#0A1024] sm:text-3xl md:text-4xl">Draft Competition</h1>
        </div>

        <div className="mb-6 flex w-full gap-4 overflow-x-auto border-b border-gray-200 pb-1 sm:mb-8 sm:gap-6">
          {draftTabs.map((tab) => {
            const isActive = requestedTab === tab;
            return (
              <Link
                key={tab}
                href={`/competitions?tab=${tab}`}
                className={`whitespace-nowrap px-1 pb-2 text-[14px] font-medium transition-colors sm:pb-3 sm:text-base ${
                  isActive ? "border-b-2 border-[#FFC700] text-[#0A1024]" : "text-gray-500 hover:text-gray-800"
                }`}
              >
                {tab}
              </Link>
            );
          })}
        </div>

        {draftError ? (
          <div className="text-red-500">Error loading draft competition: {draftError.message}</div>
        ) : draftCompetitions && draftCompetitions.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4 md:gap-8">
            {draftCompetitions.map((item: DraftCompetitionRecord) => (
              <div key={item.id} className="flex h-full flex-col rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                <p className="mb-4 text-[11px] font-semibold text-[#FFC700]">{item.tab}</p>
                <div className="mb-4 flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#FFF6D8]">
                    <FileText className="h-6 w-6 text-[#FFC700]" />
                  </div>
                  <h2 className="text-lg font-bold leading-tight text-[#0A1024] sm:text-xl">{item.title}</h2>
                </div>
                <p className="mb-4 text-sm text-gray-500">Dibuat Oleh : {item.organizer}</p>
                <p className="mb-5 flex-1 text-sm leading-relaxed text-gray-500">
                  {item.description || "Panduan lengkap mengenai kompetisi, alur pendaftaran, teknis pelaksanaan, serta penilaian"}
                </p>
                <div className="mb-6 flex flex-wrap gap-2">
                  {(item.skills || []).map((tag) => (
                    <span key={tag} className={`rounded-full px-3 py-1 text-xs font-medium ${getTagColors(tag)}`}>
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="mt-auto flex gap-3">
                  <Link
                    href={item.link ? (item.link.startsWith("http") ? item.link : `https://${item.link}`) : "/admin/staging"}
                    className="flex-1 rounded-lg bg-amber-50 py-2.5 text-center text-sm font-semibold text-[#0A1024] transition-colors hover:bg-amber-100"
                  >
                    Lihat
                  </Link>
                  <a
                    href={item.link ? (item.link.startsWith("http") ? item.link : `https://${item.link}`) : "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 rounded-lg bg-[#FFC700] py-2.5 text-center text-sm font-semibold text-[#0A1024] transition-colors hover:bg-[#e6b400]"
                  >
                    Download
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="relative mb-6 h-64 w-64">
              <Image src="/assets/competitions/nocompetitions.svg" alt="No Competitions" fill className="object-contain" />
            </div>
            <h2 className="mb-2 text-2xl font-bold text-[#0A1024]">Belum ada draft competition tersedia</h2>
            <p className="max-w-md text-gray-500">Saat ini belum ada data draft competition untuk tab ini.</p>
          </div>
        )}
      </div>
    );
  }

  const today = new Date().toISOString();
  let query = supabase.from("Competition").select("*, createdBy:User(name)", { count: "exact" });

  if (currentTab === "Preview Lomba") {
    query = query.eq("status", "PENDING");
  } else {
    query = query.eq("category", currentTab).eq("status", "APPROVED");
  }

  query = query.gte("deadline", today).order("createdAt", { ascending: false }).range(from, to);

  const { data: competitions, error, count } = await query;
  const totalPages = count ? Math.ceil(count / limit) : 0;

  const tabs = ["Belmawa", "Non-Belmawa", "Internal"];
  if (role === "admin") {
    tabs.push("Preview Lomba");
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] p-4 sm:p-6 md:p-10 w-full overflow-hidden">
      <div className="mb-6 flex items-center justify-between sm:mb-8">
        <h1 className="text-[22px] font-bold text-[#0A1024] sm:text-3xl md:text-4xl">Competitions</h1>
        <div className="flex-shrink-0">
          <CompetitionsHeader role={role} />
        </div>
      </div>

      <div className="mb-6 flex w-full gap-4 overflow-x-auto border-b border-gray-200 pb-1 sm:mb-8 sm:gap-6">
        {tabs.map((tab) => {
          const isActive = currentTab === tab;
          return (
            <Link
              key={tab}
              href={`/competitions?tab=${tab}`}
              className={`whitespace-nowrap px-1 pb-2 text-[14px] font-medium transition-colors sm:pb-3 sm:text-base ${
                isActive ? "border-b-2 border-[#FFC700] text-[#0A1024]" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              {tab}
            </Link>
          );
        })}
      </div>

      {error ? (
        <div className="text-red-500">Error loading competitions: {error.message}</div>
      ) : competitions && competitions.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:gap-6">
          {competitions.map((comp: any) => {
            if (currentTab === "Preview Lomba" && role === "admin") {
              return (
                <div key={comp.id}>
                  <PreviewLombaCard competition={comp} />
                </div>
              );
            }

            return (
              <div key={comp.id} className="relative flex h-full flex-col rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
                <div className="mb-2 flex items-start justify-between">
                  <p className="text-[11px] font-semibold text-[#FFC700] sm:text-xs">
                    Deadline • {new Date(comp.deadline).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                  {role === "admin" && <AdminCompetitionActions competition={comp} />}
                </div>
                <h3 className="mb-2 line-clamp-2 text-[15px] font-bold leading-tight text-[#0A1024] sm:text-lg">{comp.title}</h3>
                <p className="mb-4 flex-1 text-[13px] leading-relaxed text-gray-500 sm:text-sm">Diselenggarakan oleh : {comp.organizer}</p>
                <div className="mb-4 flex flex-wrap gap-1.5 sm:gap-2">
                  {comp.skills && comp.skills.map((skill: string) => (
                    <span key={skill} className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium sm:text-xs ${getTagColors(skill)}`}>
                      {skill}
                    </span>
                  ))}
                </div>
                <div className="mt-auto flex flex-row gap-2 pt-2 sm:gap-3">
                  {role !== "admin" && (
                    <Link href={`/matchmaking?competitionId=${comp.id}`} className="flex flex-1 items-center justify-center rounded-lg bg-[#FFF9E6] py-2 text-center text-[12px] font-semibold text-[#0A1024] transition-colors hover:bg-[#ffe380] sm:text-sm">
                      Buat Tim
                    </Link>
                  )}
                  <Link href={comp.link || "#"} target="_blank" rel="noopener noreferrer" className="flex flex-1 items-center justify-center rounded-lg bg-[#FFC700] py-2 text-center text-[12px] font-semibold text-[#0A1024] transition-colors hover:bg-[#e6b400] sm:text-sm">
                    Lihat Detail
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="relative mb-6 h-64 w-64">
            <Image src="/assets/competitions/nocompetitions.svg" alt="No Competitions" fill className="object-contain" />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-[#0A1024]">Belum ada kompetisi tersedia</h2>
          <p className="max-w-md text-gray-500">Saat ini belum ada kompetisi yang tersedia. Pantau terus untuk mendapatkan informasi kompetisi terbaru!</p>
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-8 mb-4 flex flex-wrap items-center justify-center gap-3 md:mt-12 md:mb-8 md:gap-4">
          {currentPage > 1 ? (
            <Link href={`/competitions?tab=${currentTab}&page=${currentPage - 1}`} className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-50">
              Previous
            </Link>
          ) : (
            <button disabled className="cursor-not-allowed rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-400">
              Previous
            </button>
          )}

          <span className="text-sm font-medium text-gray-600">Page {currentPage} of {totalPages}</span>

          {currentPage < totalPages ? (
            <Link href={`/competitions?tab=${currentTab}&page=${currentPage + 1}`} className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-50">
              Next
            </Link>
          ) : (
            <button disabled className="cursor-not-allowed rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-400">
              Next
            </button>
          )}
        </div>
      )}
    </div>
  );
}
