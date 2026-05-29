import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { ArrowLeft, Calendar, Building, Link as LinkIcon, Users } from "lucide-react";
import Image from "next/image";

const getTagColors = (skill: string) => {
  if (skill.includes("Data Science")) return "bg-blue-50 text-blue-600";
  if (skill.includes("UI/UX")) return "bg-purple-50 text-purple-600";
  if (skill.includes("Business")) return "bg-red-50 text-red-600";
  if (skill.includes("Web") || skill.includes("Frontend")) return "bg-yellow-50 text-yellow-600";
  return "bg-gray-50 text-gray-600";
};

export default async function CompetitionDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: comp, error } = await supabase
    .from("Competition")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !comp) {
    return (
      <div className="p-10 w-full flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-red-500 mb-4">Kompetisi Tidak Ditemukan</h1>
        <Link href="/competitions" className="text-blue-500 hover:underline">
          Kembali ke Daftar Kompetisi
        </Link>
      </div>
    );
  }

  return (
    <div className="p-10 w-full max-w-4xl mx-auto">
      <Link href="/competitions" className="inline-flex items-center gap-2 text-gray-500 hover:text-[#0A1024] font-medium mb-8 transition-colors">
        <ArrowLeft className="w-5 h-5" />
        Kembali ke Daftar Kompetisi
      </Link>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Cover / Header Area */}
        <div className="h-40 bg-gradient-to-r from-[#FFF9E6] to-[#FFE380] relative">
          <div className="absolute top-4 right-4 bg-white/50 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-semibold text-[#0A1024]">
            {comp.category}
          </div>
        </div>

        <div className="p-8">
          <h1 className="text-3xl font-bold text-[#0A1024] mb-4">{comp.title}</h1>
          
          <div className="flex flex-wrap gap-2 mb-8">
            {comp.skills && comp.skills.map((skill: string) => (
              <span key={skill} className={`px-4 py-1.5 text-sm font-medium rounded-full ${getTagColors(skill)}`}>
                {skill}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-50">
              <Building className="w-6 h-6 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Penyelenggara</p>
                <p className="text-[#0A1024] font-semibold">{comp.organizer}</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-50">
              <Calendar className="w-6 h-6 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Terakhir Registrasi</p>
                <p className="text-red-500 font-semibold">
                  {new Date(comp.deadline).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 md:col-span-2">
              <LinkIcon className="w-6 h-6 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Link Informasi / Pendaftaran</p>
                {comp.link ? (
                  <a href={comp.link.startsWith("http") ? comp.link : `https://${comp.link}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600 font-medium underline break-all">
                    {comp.link}
                  </a>
                ) : (
                  <p className="text-gray-500 italic">Belum ada link yang ditambahkan</p>
                )}
              </div>
            </div>
          </div>

          {comp.description && (
            <div className="mb-8">
              <h2 className="text-xl font-bold text-[#0A1024] mb-4">Deskripsi</h2>
              <div className="text-gray-600 whitespace-pre-wrap leading-relaxed">
                {comp.description}
              </div>
            </div>
          )}

          <div className="pt-6 border-t border-gray-100 flex gap-4">
            <button className="flex-1 bg-[#FFC700] hover:bg-[#e6b400] text-[#0A1024] font-bold py-4 rounded-xl transition-colors text-lg flex items-center justify-center gap-2 shadow-sm">
              <Users className="w-5 h-5" />
              Buat Tim untuk Lomba Ini
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
