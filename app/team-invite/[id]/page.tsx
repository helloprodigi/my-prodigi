"use client";

import { use, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";

type InviteDetail = {
  memberId: string;
  status: string;
  team: {
    id: string;
    name: string;
    category: string;
    link: string;
    memberCount: number;
    competitionTitle: string;
    organizer: string;
    leadName: string;
  } | null;
};

export default function TeamInvitePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [detail, setDetail] = useState<InviteDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    async function load() {
      if (!token) {
        toast.error("Token undangan tidak valid.");
        setIsLoading(false);
        return;
      }

      const res = await fetch(
        `/api/teams/invite/detail?memberId=${encodeURIComponent(id)}&token=${encodeURIComponent(token)}`,
      );
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Gagal memuat undangan.");
        setIsLoading(false);
        return;
      }

      setDetail(data);
      setIsLoading(false);
    }

    load();
  }, [id, token]);

  const handleDecline = () => {
    startTransition(async () => {
      const res = await fetch("/api/teams/invite/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: id, token, action: "decline" }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Gagal menolak undangan.");
        return;
      }
      toast.success("Undangan ditolak.");
      router.push("/dashboard");
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FBFBFB] flex items-center justify-center">
        <p className="text-sm text-gray-500 italic">Memuat undangan tim...</p>
      </div>
    );
  }

  if (!detail?.team) {
    return (
      <div className="min-h-screen bg-[#FBFBFB] flex items-center justify-center">
        <p className="text-sm text-gray-500">Undangan tidak ditemukan.</p>
      </div>
    );
  }

  const team = detail.team;
  const isProcessed = detail.status === "APPROVED";

  return (
    <div className="min-h-screen bg-[#FBFBFB] flex items-center justify-center p-6">
      <div className="w-full max-w-xl bg-white border border-[#F0F0F0] rounded-[8px] p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-[#0A1024] mb-1">Undangan Tim</h1>
        <p className="text-sm text-gray-500 mb-6">
          <span className="font-semibold text-[#0A1024]">{team.leadName}</span> mengundangmu bergabung ke tim berikut.
        </p>

        <div className="bg-[#F4F5F6] rounded-[8px] p-4 space-y-2 text-sm text-[#0A1024] mb-6">
          <p><span className="font-semibold">Tim:</span> {team.name}</p>
          <p><span className="font-semibold">Lomba:</span> {team.competitionTitle}</p>
          <p><span className="font-semibold">Kategori:</span> {team.category}</p>
          <p><span className="font-semibold">Penyelenggara:</span> {team.organizer}</p>
          <a href={team.link} target="_blank" rel="noreferrer" className="text-[#FFC700] font-semibold underline block">
            Link Lomba ↗
          </a>
        </div>

        <p className="text-xs text-gray-400 mb-5">
          Sebelum memutuskan, lihat dulu siapa saja yang sudah ada di tim ini beserta CV mereka.
        </p>

        {isProcessed ? (
          <Link
            href={`/dashboard/team/${team.id}`}
            className="inline-block bg-[#FFC700] text-[#0A1024] font-bold px-6 py-3 rounded-[8px] text-sm"
          >
            Lihat Tim
          </Link>
        ) : (
          <div className="flex flex-col gap-3">
            <Link href={`/dashboard/team/${team.id}`} className="w-full">
              <button
                type="button"
                className="w-full bg-[#FFC700] text-[#0A1024] font-bold px-6 py-3 rounded-[8px] text-sm hover:brightness-95 transition-all"
              >
                Lihat Detail Tim & Anggota
              </button>
            </Link>
            <button
              type="button"
              onClick={handleDecline}
              disabled={isPending}
              className="w-full border border-gray-200 text-gray-500 font-medium px-6 py-2.5 rounded-[8px] text-sm hover:bg-gray-50 transition-all disabled:opacity-60"
            >
              Tolak Undangan
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
