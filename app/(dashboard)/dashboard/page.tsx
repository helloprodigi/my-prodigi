"use client";

import React, { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";
import { completeTeamAction, getMyTeamsAction, getAllTeamsAction, requestJoinAction } from "./actions";
import type { DashboardTeamCard } from "@/types/team";

function MemberAvatar({ name, photoUrl, zIndex }: { name: string; photoUrl?: string | null, zIndex?: number }) {
  if (photoUrl) {
    return (
      <div className="inline-flex h-7 w-7 rounded-full ring-2 ring-white overflow-hidden bg-[#1E2538] relative" style={{ zIndex }} title={name}>
        <img src={photoUrl} alt={name} className="w-full h-full object-cover" />
      </div>
    );
  }
  const initial = name?.charAt(0)?.toUpperCase() ?? "?";
  return (
    <div className="inline-flex h-7 w-7 rounded-full ring-2 ring-white bg-[#1E2538] text-white text-[10px] font-bold items-center justify-center relative" style={{ zIndex }} title={name}>
      {initial}
    </div>
  );
}


function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[50vh] w-full">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#FFC700] border-r-[#FFC700]/50 animate-spin" />
        <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-[#FFC700]/30 border-l-[#FFC700]/10 animate-spin" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<"my-teams" | "all-teams">("my-teams");
  const [teams, setTeams] = useState<DashboardTeamCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const fetchMyTeams = async () => {
    try {
      setIsLoading(true);
      const res = await getMyTeamsAction();
      if (res.success && res.data) {
        setTeams(res.data);
      } else {
        toast.error(res.error ?? "Gagal memuat data tim saya.");
      }
    } catch {
      toast.error("Gagal memuat data tim saya.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllTeams = async () => {
    try {
      setIsLoading(true);
      const res = await getAllTeamsAction();
      if (res.success && res.data) {
        setTeams(res.data);
      } else {
        toast.error(res.error ?? "Gagal memuat semua data tim.");
      }
    } catch {
      toast.error("Gagal memuat semua data tim.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "my-teams") {
      fetchMyTeams();
    } else {
      fetchAllTeams();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleComplete = (teamId: string) => {
    startTransition(async () => {
      const result = await completeTeamAction(teamId);
      if (result.success) {
        toast.success("Tim berhasil diselesaikan.");
        if (activeTab === "my-teams") fetchMyTeams();
        else fetchAllTeams();
      } else {
        toast.error(result.error ?? "Gagal menyelesaikan lomba.");
      }
    });
  };

  const handleRequestJoin = (teamId: string) => {
    startTransition(async () => {
      const result = await requestJoinAction(teamId);
      if (result.success) {
        toast.success("Permintaan bergabung berhasil dikirim.");
        if (activeTab === "my-teams") fetchMyTeams();
        else fetchAllTeams();
      } else {
        toast.error(result.error ?? "Gagal mengirim permintaan bergabung.");
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#FBFBFB] relative overflow-hidden flex flex-col justify-between">
      <div className="w-full z-10 max-w-[1400px] pl-6 pr-4">
        {/* Header */}
        <div className="flex items-center justify-between pt-8 pb-6 w-full">
          <h1 className="text-3xl font-bold text-[#0A1024]">Dashboard</h1>
          <Link href="/matchmaking">
            <button className="bg-[#FFC700] text-[#0A1024] font-bold px-9 py-3 rounded-[8px] text-sm hover:brightness-95 transition-all shadow-sm">
              Buat Tim
            </button>
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex justify-between items-center border-b border-gray-200 mb-6 w-full">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab("my-teams")}
              className={`pb-4 px-2 font-medium transition-all text-sm ${activeTab === "my-teams"
                  ? "text-[#0A1024] border-b-2 border-[#FFC700] font-bold"
                  : "text-gray-500 hover:text-gray-800"
                }`}
            >
              MyTeam
            </button>
            <button
              onClick={() => setActiveTab("all-teams")}
              className={`pb-4 px-2 font-medium transition-all text-sm ${activeTab === "all-teams"
                  ? "text-[#0A1024] border-b-2 border-[#FFC700] font-bold"
                  : "text-gray-500 hover:text-gray-800"
                }`}
            >
              All Teams
            </button>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <LoadingSpinner />
        ) : teams.length === 0 ? (
          <div className="text-sm font-medium text-gray-500 italic py-10">
            {activeTab === "my-teams"
              ? "Belum ada tim yang diikuti atau dibuat. Silakan klik tombol 'Buat Tim' atau cari tim di tab sebelah."
              : "Belum ada tim aktif terdaftar di sistem."}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 pb-24">
            {teams.map((team) => (
              <div
                key={team.id}
                className="bg-white rounded-[8px] border border-[#F0F0F0] p-4 shadow-sm flex flex-col justify-between w-full"
              >
                <div>
                  <div className="text-[13px] text-gray-500 font-medium mb-1 flex flex-wrap items-center gap-1.5">
                    <span>Tim :</span>
                    <span className="text-[#0A1024] font-semibold">{team.teamName}</span>
                    {team.isLeader && (
                      <span className="text-[9px] font-bold text-white bg-[#0A1024] px-2 py-0.5 rounded-[4px]">
                        Ketua
                      </span>
                    )}
                    {team.isMember && (
                      <span className="text-[9px] font-bold text-[#2E7D32] bg-[#EAF9E9] px-2 py-0.5 rounded-[4px]">
                        Anggota
                      </span>
                    )}
                    {team.hasJoinRequest && (
                      <span className="text-[9px] font-bold text-[#E2A600] bg-[#FFF9E6] px-2 py-0.5 rounded-[4px]">
                        Pending Request
                      </span>
                    )}
                    {team.isInvited && (
                      <span className="text-[9px] font-bold text-white bg-[#E2A600] px-2 py-0.5 rounded-[4px] animate-pulse">
                        Diundang
                      </span>
                    )}
                    {team.isDiscoverable && !team.isComplete && (
                      <span className="text-[9px] font-bold text-[#E2A600] bg-[#FFF9E6] px-2 py-0.5 rounded-[4px]">
                        Mencari Anggota
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-[#0A1024] leading-snug mb-2 line-clamp-2">
                    {team.competitionTitle}
                  </h3>

                  <div className="text-[11px] text-[#FFC700] font-semibold mb-3">
                    created: {team.createdDate}
                  </div>

                  <div className="mb-4">
                    <span className="bg-[#F4F5F6] text-gray-500 text-[11px] font-medium px-3 py-1.5 rounded-[4px]">
                      {team.category}
                    </span>
                  </div>

                  <p className="text-[12px] text-gray-400 leading-normal mb-3">
                    Diselenggarakan oleh : {team.organizer}
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex -space-x-3 overflow-hidden pl-1 py-1">
                      {(team.membersData || team.memberNames.map(n => ({ name: n, photoUrl: undefined }))).slice(0, 5).map((m, idx) => (
                        <MemberAvatar key={idx} name={m.name} photoUrl={m.photoUrl} zIndex={10 - idx} />
                      ))}
                    </div>
                    <span className="text-[11px] text-gray-400 font-medium">
                      {team.approvedCount}/{team.memberCount} members
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {team.isInvited ? (
                      <Link href={`/team-invite/${team.membershipId}?token=${team.inviteToken}`} className="w-full">
                        <button className="w-full bg-[#FFC700] text-[#0A1024] text-xs font-bold py-2.5 rounded-[6px] hover:brightness-95 transition-all text-center">
                          Lihat Undangan
                        </button>
                      </Link>
                    ) : team.isLeader || team.isMember ? (
                      <div className={team.isLeader ? "grid grid-cols-2 gap-2.5" : "grid grid-cols-1"}>
                        <Link href={`/dashboard/team/${team.id}`} className="w-full">
                          <button className="w-full bg-[#FFF9E6] text-[#0A1024] text-xs font-semibold py-2.5 rounded-[6px] hover:brightness-95 transition-all text-center">
                            Detail
                          </button>
                        </Link>
                        {team.isLeader && (
                          <button
                            type="button"
                            onClick={() => handleComplete(team.id)}
                            disabled={isPending}
                            className="w-full bg-[#FFC700] text-[#0A1024] text-xs font-bold py-2.5 rounded-[6px] hover:brightness-95 transition-all text-center disabled:opacity-60"
                          >
                            Completed
                          </button>
                        )}
                      </div>
                    ) : team.hasJoinRequest ? (
                      <div className="grid grid-cols-2 gap-2.5">
                        <Link href={`/dashboard/team/${team.id}`} className="w-full">
                          <button className="w-full bg-[#FFF9E6] text-[#0A1024] text-xs font-semibold py-2.5 rounded-[6px] hover:brightness-95 transition-all text-center border border-[#FFF0C2]">
                            Detail
                          </button>
                        </Link>
                        <button
                          disabled
                          className="w-full bg-gray-100 text-gray-400 text-[10px] font-semibold py-2.5 px-1 rounded-[6px] cursor-not-allowed text-center leading-tight"
                        >
                          Menunggu Persetujuan
                        </button>
                      </div>
                    ) : team.isDiscoverable && !team.isComplete ? (
                      <div className="grid grid-cols-2 gap-2.5">
                        <Link href={`/dashboard/team/${team.id}`} className="w-full">
                          <button className="w-full bg-[#FFF9E6] text-[#0A1024] text-xs font-semibold py-2.5 rounded-[6px] hover:brightness-95 transition-all text-center border border-[#FFF0C2]">
                            Detail
                          </button>
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleRequestJoin(team.id)}
                          disabled={isPending}
                          className="w-full bg-[#FFC700] text-[#0A1024] text-xs font-bold py-2.5 rounded-[6px] hover:brightness-95 transition-all text-center disabled:opacity-60"
                        >
                          Request Join
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2.5">
                        <Link href={`/dashboard/team/${team.id}`} className="w-full">
                          <button className="w-full bg-[#FFF9E6] text-[#0A1024] text-xs font-semibold py-2.5 rounded-[6px] hover:brightness-95 transition-all text-center border border-[#FFF0C2]">
                            Detail
                          </button>
                        </Link>
                        <button
                          disabled
                          className="w-full bg-gray-100 text-gray-400 text-[10px] font-semibold py-2.5 px-1 rounded-[6px] cursor-not-allowed text-center leading-tight"
                        >
                          Tim Penuh
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
