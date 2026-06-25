import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { Search } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import CompetitionsHeader from "@/components/CompetitionsHeader";
import AdminApproveButtons from "@/components/AdminApproveButtons";
import PreviewLombaCard from "@/components/PreviewLombaCard";
import AdminCompetitionActions from "@/components/AdminCompetitionActions";

const getTagColors = (skill: string) => {
  if (skill.includes("Data Science")) return "bg-blue-50 text-blue-600";
  if (skill.includes("UI/UX")) return "bg-purple-50 text-purple-600";
  if (skill.includes("Business")) return "bg-red-50 text-red-600";
  if (skill.includes("Web") || skill.includes("Frontend")) return "bg-yellow-50 text-yellow-600";
  return "bg-gray-50 text-gray-600";
};

export default async function CompetitionsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; page?: string }>;
}) {
  const params = await searchParams;
  const currentTab = params.tab || "Belmawa";
  const currentPage = parseInt(params.page || "1", 10);
  const limit = 8;
  const from = (currentPage - 1) * limit;
  const to = from + limit - 1;

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // Lazy cleanup: hapus otomatis kompetisi yang melewati batas waktu
  const adminDb = createAdminClient();
  const today = new Date().toISOString();
  await adminDb.from("Competition").delete().lt("deadline", today);

  const { data: { user } } = await supabase.auth.getUser();
  let role = "talent";

  if (user) {
    const { data: publicUser } = await supabase
      .from("User")
      .select("role")
      .eq("id", user?.id)
      .single();
    if (publicUser) {
      role = publicUser.role;
    }
  }

  let query = supabase.from("Competition").select("*, createdBy:User(name)", { count: "exact" });
  
  if (currentTab === "Preview Lomba") {
    // Only show pending ones for Preview Lomba tab
    query = query.eq("status", "PENDING");
  } else {
    // Show approved ones for specific category
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
    <div className="p-4 sm:p-6 md:p-10 w-full max-w-full overflow-hidden bg-[#FAFAFA] min-h-screen">
      <div className="flex justify-between items-center mb-6 sm:mb-8">
        <h1 className="text-[22px] sm:text-3xl md:text-4xl font-bold text-[#0A1024]">Competitions</h1>
        <div className="flex-shrink-0">
          <CompetitionsHeader role={role} />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 sm:gap-6 w-full overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] border-b border-gray-200 mb-6 sm:mb-8">
        {tabs.map((t) => {
          const isActive = currentTab === t;
          return (
            <Link
              key={t}
              href={`/competitions?tab=${t}`}
              className={`whitespace-nowrap pb-2 sm:pb-3 px-1 font-medium text-[14px] sm:text-base transition-colors ${
                isActive
                  ? "text-[#0A1024] border-b-2 border-[#FFC700]"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              {t}
            </Link>
          );
        })}
      </div>

      {/* Content */}
      {error ? (
        <div className="text-red-500">Error loading competitions: {error.message}</div>
      ) : competitions && competitions.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {competitions.map((comp: any) => {
            if (currentTab === "Preview Lomba" && role === "admin") {
              return (
                <div key={comp.id}>
                  <PreviewLombaCard competition={comp} />
                </div>
              );
            }

            return (
              <div key={comp.id} className="relative bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex flex-col h-full hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-[#FFC700] text-[11px] sm:text-xs font-semibold">
                    Deadline • {new Date(comp.deadline).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                  {role === "admin" && (
                    <AdminCompetitionActions competition={comp} />
                  )}
                </div>
                <h3 className="text-[15px] sm:text-lg font-bold text-[#0A1024] leading-tight mb-2 line-clamp-2">
                  {comp.title}
                </h3>
                <p className="text-gray-500 text-[13px] sm:text-sm mb-4 flex-1 leading-relaxed">
                  Diselenggarakan oleh : {comp.organizer}
                </p>
                
                <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-4">
                  {comp.skills && comp.skills.map((skill: string) => (
                    <span key={skill} className={`px-2.5 py-0.5 text-[11px] sm:text-xs font-medium rounded-full ${getTagColors(skill)}`}>
                      {skill}
                    </span>
                  ))}
                </div>

                <div className="flex gap-2 sm:gap-3 mt-auto flex-row pt-2">
                  {role !== "admin" && (
                    <Link
                      href={`/matchmaking?competitionId=${comp.id}`}
                      className="flex-1 bg-[#FFF9E6] text-[#0A1024] font-semibold py-2 rounded-lg text-[12px] sm:text-sm hover:bg-[#ffe380] transition-colors text-center flex items-center justify-center"
                    >
                      Buat Tim
                    </Link>
                  )}
                  <Link 
                    href={comp.link || "#"} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex-1 bg-[#FFC700] text-[#0A1024] font-semibold py-2 rounded-lg text-[12px] sm:text-sm hover:bg-[#e6b400] transition-colors text-center flex items-center justify-center"
                  >
                    Lihat Detail
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="relative w-64 h-64 mb-6">
            <Image src="/assets/competitions/nocompetitions.svg" alt="No Competitions" fill className="object-contain" />
          </div>
          <h2 className="text-2xl font-bold text-[#0A1024] mb-2">Belum ada kompetisi tersedia</h2>
          <p className="text-gray-500 max-w-md">
            Saat ini belum ada kompetisi yang tersedia. Pantau terus untuk mendapatkan informasi kompetisi terbaru!
          </p>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-3 md:gap-4 mt-8 md:mt-12 mb-4 md:mb-8 flex-wrap">
          {currentPage > 1 ? (
            <Link 
              href={`/competitions?tab=${currentTab}&page=${currentPage - 1}`}
              className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Previous
            </Link>
          ) : (
            <button disabled className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-400 cursor-not-allowed">
              Previous
            </button>
          )}
          
          <span className="text-sm font-medium text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          
          {currentPage < totalPages ? (
            <Link 
              href={`/competitions?tab=${currentTab}&page=${currentPage + 1}`}
              className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Next
            </Link>
          ) : (
            <button disabled className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-400 cursor-not-allowed">
              Next
            </button>
          )}
        </div>
      )}
    </div>
  );
}
