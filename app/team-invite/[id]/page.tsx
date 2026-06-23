"use client";

import { use, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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

  const respond = (action: "accept" | "decline") => {
    startTransition(async () => {
      const res = await fetch("/api/teams/invite/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: id, token, action }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Gagal memproses undangan.");
        return;
      }

      if (action === "accept") {
        toast.success("Kamu berhasil bergabung ke tim!");
        window.location.href = `/dashboard/team/${detail?.team?.id}`;
      } else {
        toast.success("Undangan ditolak. Sistem akan mencari kandidat lain.");
        window.location.href = "/dashboard";
      }
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
        <h1 className="text-2xl font-bold text-[#0A1024] mb-2">Detail Tim</h1>
        <p className="text-sm text-gray-500 mb-6">Kamu diundang untuk bergabung dalam tim berikut.</p>

        <div className="space-y-3 text-sm text-[#0A1024] mb-8">
          <p><span className="font-semibold">Tim:</span> {team.name}</p>
          <p><span className="font-semibold">Ketua:</span> {team.leadName}</p>
          <p><span className="font-semibold">Lomba:</span> {team.competitionTitle}</p>
          <p><span className="font-semibold">Kategori:</span> {team.category}</p>
          <p><span className="font-semibold">Penyelenggara:</span> {team.organizer}</p>
          <a href={team.link} target="_blank" rel="noreferrer" className="text-[#FFC700] font-semibold underline block">
            Link Lomba
          </a>
        </div>

        {isProcessed ? (
          <Link
            href={`/dashboard/team/${team.id}`}
            className="inline-block bg-[#FFC700] text-[#0A1024] font-bold px-6 py-3 rounded-[8px] text-sm"
          >
            Lihat Tim
          </Link>
        ) : (
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => respond("accept")}
              disabled={isPending}
              className="bg-[#FFC700] text-[#0A1024] font-bold px-6 py-3 rounded-[8px] text-sm disabled:opacity-60"
            >
              Terima Permintaan
            </button>
            <button
              type="button"
              onClick={() => respond("decline")}
              disabled={isPending}
              className="border border-gray-200 text-gray-700 font-bold px-6 py-3 rounded-[8px] text-sm disabled:opacity-60"
            >
              Tolak
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
