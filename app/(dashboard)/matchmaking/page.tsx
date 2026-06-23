"use client";
import React, { useState, useTransition, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SelectedCompetitionCard from "@/components/SelectedCompetitionCard";
import { ChevronDown } from "lucide-react";
import toast from "react-hot-toast";
import Image from "next/image";
import Link from "next/link";
import { createTeamAction } from "./actions";
import type { CreateTeamInput } from "@/types/team";

const SKILL_OPTIONS = [
  "UI/UX Design",
  "Frontend Developer",
  "Backend Developer",
  "Mobile Developer",
  "AI/ML Engineering",
  "Data Science",
  "Cybersecurity",
  "Business Plan",
  "Public Speaking",
  "Video Editing/Multimedia",
];

export default function MatchmakingPage() {
    const searchParams = useSearchParams();
    const [selectedCompetition, setSelectedCompetition] = useState<any>(null);
    const [competitionId, setCompetitionId] = useState<string>("");
    // Auto-populate from query params (competitionId, or all data for demo)
    useEffect(() => {
      const compId = searchParams.get("competitionId");
      if (compId) {
        setCompetitionId(compId);
        fetch(`/api/competitions/${compId}`)
          .then(res => res.json())
          .then(data => {
            if (data && data.competition) {
              setSelectedCompetition(data.competition);
              setCompetitionLink(data.competition.link || "");
              const hasOptions = (data.competition.skills?.length > 0) || (data.competition.categories?.length > 0);
              if (!hasOptions) {
                setCompetitionCategory(data.competition.category || "");
              } else {
                setCompetitionCategory("");
              }
            }
          });
      }
    }, [searchParams]);
  const [teamName, setTeamName] = useState("");
  const [memberCount, setMemberCount] = useState<number | "">("");
  const [competitionLink, setCompetitionLink] = useState("");
  const [competitionCategory, setCompetitionCategory] = useState("");
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSkillToggle = (skill: string) => {
    setRequiredSkills((prev) =>
      prev.includes(skill)
        ? prev.filter((s) => s !== skill)
        : [...prev, skill]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const count = Number(memberCount);
    if (!teamName.trim() || !competitionLink.trim() || !competitionCategory.trim() || requiredSkills.length < 1) {
      toast.error("Semua field wajib diisi dan minimal 1 skill dipilih.");
      return;
    }
    if (!memberCount || count < 1 || count > 99) {
      toast.error("Jumlah anggota tim yang valid adalah 1 - 99 orang.");
      return;
    }
    startTransition(async () => {
      const input: CreateTeamInput = {
        teamName,
        memberCount: count,
        competitionId,
        competitionLink,
        competitionCategory,
        requiredSkills,
      };
      const result = await createTeamAction(input);
      if (result.success) {
        toast.success("Tim berhasil dibuat!");
        setTeamName("");
        setMemberCount("");
        setRequiredSkills([]);
        router.push("/dashboard");
      } else {
        toast.error(result.error || "Gagal membuat tim.");
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#FBFBFB] relative overflow-hidden flex flex-col justify-between">
      {/* Wrapper Konten Utama */}
      <div className="w-full z-10 max-w-[1400px] pl-6 pr-4">
        {/* Header */}
        <div className="flex items-center justify-between pt-8 pb-4 w-full">
          <h1 className="text-3xl font-bold text-[#0A1024]">Matchmaking</h1>
          <Link href="/competitions">
            <button className="bg-[#FFC700] text-[#0A1024] font-bold px-9 py-3 rounded-[8px] text-sm hover:brightness-95 transition-all shadow-sm">
              Cari Lomba
            </button>
          </Link>
        </div>

        {/* Selected Competition Card (if any) */}
        {selectedCompetition && (
          <SelectedCompetitionCard
            title={selectedCompetition.title}
            deadline={selectedCompetition.deadline}
            organizer={selectedCompetition.organizer}
            categories={selectedCompetition.skills || selectedCompetition.categories || []}
          />
        )}

        {/* Form Section */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col lg:flex-row gap-5 py-2 items-stretch justify-start mb-24">
          {/* Card 1: Informasi Tim */}
          <div className="bg-white rounded-[8px] p-5 flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <span className="w-7 h-7 flex items-center justify-center rounded-full bg-[#FFC917] text-white font-bold text-sm">1</span>
                <span className="text-md font-semibold text-[#0A1024]">Informasi Tim</span>
              </div>
              <div className="flex gap-3 mb-3 items-end">
                <div className="w-2/3 flex flex-col">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Nama Tim</label>
                  <div className="flex h-10 rounded-[6px] bg-[#F4F5F6] overflow-hidden">
                    <span className="flex items-center pl-3 text-xs font-semibold text-[#0A1024] whitespace-nowrap">
                      Tim :
                    </span>
                    <input
                      type="text"
                      className="flex-1 h-full bg-transparent px-2 text-black focus:outline-none text-xs border-none ring-0"
                      placeholder="masukkan nama tim"
                      value={teamName}
                      onChange={e => setTeamName(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="w-1/3 flex flex-col">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Jumlah Anggota</label>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    className="w-full h-10 rounded-[6px] bg-[#F4F5F6] px-3 text-black focus:outline-none text-left font-medium text-xs border-none ring-0"
                    placeholder="0"
                    value={memberCount}
                    onChange={e => {
                      const val = e.target.value;
                      setMemberCount(val === "" ? "" : Number(val));
                    }}
                    required
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Link Lomba</label>
                <input
                  type="text"
                  className="w-full h-10 rounded-[6px] bg-[#F4F5F6] px-3 text-black focus:outline-none text-xs border-none ring-0"
                  placeholder="https://contoh-lomba"
                  value={competitionLink}
                  onChange={e => setCompetitionLink(e.target.value)}
                    readOnly={Boolean(selectedCompetition?.link)}
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Kategori Lomba</label>
                {selectedCompetition && (selectedCompetition.skills?.length > 0 || selectedCompetition.categories?.length > 0) ? (
                  <div className="relative">
                    <select
                      className="w-full h-10 rounded-[6px] bg-[#F4F5F6] px-3 pr-10 text-black focus:outline-none text-xs border-none ring-0 appearance-none cursor-pointer"
                      value={competitionCategory}
                      onChange={(e) => setCompetitionCategory(e.target.value)}
                      required
                    >
                      <option value="" disabled hidden>Pilih kategori/bidang lomba</option>
                      {(selectedCompetition.skills || selectedCompetition.categories).map((cat: string) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                      <ChevronDown size={16} className="text-gray-500" />
                    </div>
                  </div>
                ) : (
                  <input
                    type="text"
                    className="w-full h-10 rounded-[6px] bg-[#F4F5F6] px-3 text-black focus:outline-none text-xs border-none ring-0"
                    placeholder="exp: UIUX DESIGN"
                    value={competitionCategory}
                    onChange={e => setCompetitionCategory(e.target.value)}
                    readOnly={Boolean(selectedCompetition?.category)}
                    required
                  />
                )}
              </div>
            </div>
            <div className="text-[12px] leading-relaxed pt-2 mt-4 italic" style={{ color: "#3E484F" }}>
              <div className="font-bold not-italic">Note:</div>
              <ol className="mt-1 list-decimal list-outside pl-6 space-y-1">
                <li>Pada field <span className="font-bold">Link Lomba</span> silahkan masukkan link/url informasi detail lomba, bisa berupa Guidebook/Rulebook, website lomba, postingan instagram lomba</li>
                <li>Pada field <span className="font-bold">Kategori Lomba</span> silahkan tulisakan jenis/kategori lomba yang ingin diikuti dari lomba yang diselenggarakan</li>
                <li>Proses matchmaking akan berjalan sampai menemukan kandidat yang terbaik</li>
              </ol>
            </div>
          </div>
          {/* Card 2: Skill Anggota Tim */}
          <div className="bg-white rounded-[8px] p-5 flex-[1.4] flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <span className="w-7 h-7 flex items-center justify-center rounded-full bg-[#FFC917] text-white font-bold text-sm">2</span>
                <span className="text-md font-semibold text-[#0A1024]">Skill Anggota Tim</span>
              </div>
              <div className="text-xs font-semibold text-gray-500 mb-3">Skill yang dibutuhkan</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 w-full justify-start">
                {SKILL_OPTIONS.map(skill => (
                  <button
                    type="button"
                    key={skill}
                    onClick={() => handleSkillToggle(skill)}
                    className={`h-[46px] w-full flex items-center justify-start px-3.5 border text-xs font-medium transition-all select-none rounded-[6px] text-left
                      ${requiredSkills.includes(skill)
                        ? "bg-[#FFC700] text-[#0A1024] border-[#FFC700] font-semibold"
                        : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"}
                    `}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <button
                type="submit"
                disabled={isPending}
                className="w-full sm:w-auto bg-[#FFC700] text-[#0A1024] font-bold px-9 py-3 rounded-[8px] text-sm hover:bg-[#e6b400] transition-colors disabled:opacity-60 shadow-sm"
              >
                {isPending ? "Memproses..." : "Buat Tim"}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Cropped Yellow Circle anchored to the page container */}
      <div className="absolute bottom-0 right-0 pointer-events-none w-[180px] h-[140px] md:w-[240px] md:h-[180px] z-0 select-none flex items-end justify-end">
        <Image
          src="/assets/matchmaking/cropped-yellowcircle.svg"
          alt="Yellow Circle"
          width={240}
          height={180}
          className="object-right-bottom object-contain m-0 p-0 block"
          priority
        />
      </div>
    </div>
  );
}