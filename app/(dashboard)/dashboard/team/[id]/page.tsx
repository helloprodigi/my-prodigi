"use client";

import React, { use, useCallback, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Crown } from "lucide-react";
import {
  findMemberAction,
  getTeamDetailAction,
  inviteMemberAction,
  refreshMemberAction,
  requestJoinAction,
  approveJoinRequestAction,
  rejectJoinRequestAction,
} from "../../actions";
import type { DashboardTeamDetail } from "@/types/team";

function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-[#FBFBFB] flex items-center justify-center">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#FFC700] border-r-[#FFC700]/50 animate-spin" />
        <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-[#FFC700]/30 border-l-[#FFC700]/10 animate-spin" />
      </div>
    </div>
  );
}

export default function TeamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [teamInfo, setTeamInfo] = useState<DashboardTeamDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPending, startTransition] = useTransition();

  const loadTeam = useCallback(async () => {
    setIsLoading(true);
    const result = await getTeamDetailAction(id);
    if (result.success && result.data) {
      setTeamInfo(result.data);
    } else {
      toast.error(result.error ?? "Gagal memuat detail tim.");
      router.push("/dashboard");
    }
    setIsLoading(false);
  }, [id, router]);

  useEffect(() => {
    loadTeam();
  }, [loadTeam]);

  const approvedCount = teamInfo?.approvedCount ?? 0;
  const maxMembers = teamInfo?.maxAdditionalMembersNeeded ?? 0;
  const isTeamComplete = approvedCount >= maxMembers;
  const waitingCandidateCount = teamInfo?.members.filter(
    (m) => m.status === "WAITING" && m.inviteToken !== "REQUEST_JOIN",
  ).length ?? 0;
  const canFindMember =
    teamInfo?.isLeader && !isTeamComplete && (approvedCount + waitingCandidateCount < maxMembers);

  const handleInvite = (memberId: string, name: string) => {
    startTransition(async () => {
      const result = await inviteMemberAction(id, memberId);
      if (result.success) {
        if (result.warning) {
          toast(result.warning, { icon: "⚠️", duration: 8000 });
        } else {
          toast.success(`Undangan email berhasil dikirim ke ${name}!`);
        }
        await loadTeam();
      } else {
        toast.error(result.error ?? "Gagal mengirim undangan.");
      }
    });
  };

  const handleApproveJoinRequest = (memberId: string, name: string) => {
    startTransition(async () => {
      const result = await approveJoinRequestAction(id, memberId);
      if (result.success) {
        toast.success(`Permintaan bergabung ${name} disetujui!`);
        await loadTeam();
      } else {
        toast.error(result.error ?? "Gagal menyetujui permintaan bergabung.");
      }
    });
  };

  const handleRejectJoinRequest = (memberId: string, name: string) => {
    startTransition(async () => {
      const result = await rejectJoinRequestAction(id, memberId);
      if (result.success) {
        toast.success(`Permintaan bergabung ${name} ditolak.`);
        await loadTeam();
      } else {
        toast.error(result.error ?? "Gagal menolak permintaan bergabung.");
      }
    });
  };

  const handleRefreshMember = async (memberId: string) => {
    setIsRefreshing(true);
    try {
      const result = await refreshMemberAction(id, memberId);
      if (result.success) {
        toast.success("Mencari kandidat baru yang cocok...");
        await loadTeam();
      } else {
        toast.error(result.error ?? "Gagal memperbarui rekomendasi anggota.");
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleChatWhatsApp = (whatsappNumber: string) => {
    const cleanNumber = whatsappNumber.replace(/[^0-9]/g, "");
    if (!cleanNumber) {
      toast.error("Nomor WhatsApp tidak tersedia.");
      return;
    }
    const waUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent("Halo, saya dari tim matchmaking MyProdigi.")}`;
    window.open(waUrl, "_blank");
  };

  const handleLihatCV = (cvUrl: string | null, fullName: string) => {
    if (!cvUrl) {
      toast.error(`${fullName} belum mengupload CV.`);
      return;
    }
    if (!cvUrl.startsWith("http://") && !cvUrl.startsWith("https://")) {
      toast.error(`CV ${fullName} menggunakan format lama. Minta ${fullName} untuk re-upload CV di halaman profil.`, { duration: 5000 });
      return;
    }
    window.open(cvUrl, "_blank");
  };

  const handleFindMember = () => {
    startTransition(async () => {
      const result = await findMemberAction(id);
      if (result.success) {
        toast.success("Kandidat anggota ditemukan.");
        await loadTeam();
      } else {
        toast.error(result.error ?? "Gagal mencari anggota.");
      }
    });
  };

  const handleRequestJoin = () => {
    startTransition(async () => {
      const result = await requestJoinAction(id);
      if (result.success) {
        toast.success("Permintaan bergabung berhasil dikirim.");
        await loadTeam();
      } else {
        toast.error(result.error ?? "Gagal mengirim permintaan bergabung.");
      }
    });
  };

  const handleAcceptInvite = () => {
    startTransition(async () => {
      const res = await fetch("/api/teams/invite/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: teamInfo?.membershipId, token: teamInfo?.inviteToken, action: "accept" }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Gagal menerima undangan."); return; }
      toast.success("Kamu berhasil bergabung ke tim!");
      await loadTeam();
    });
  };

  const handleDeclineInvite = () => {
    startTransition(async () => {
      const res = await fetch("/api/teams/invite/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: teamInfo?.membershipId, token: teamInfo?.inviteToken, action: "decline" }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Gagal menolak undangan."); return; }
      toast.success("Undangan ditolak.");
      router.push("/dashboard");
    });
  };

  if (isLoading || !teamInfo) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-[#FBFBFB] relative overflow-hidden flex flex-col justify-between">
      <div className="w-full z-10 max-w-[1400px] px-4 sm:pl-6 sm:pr-4">
        <div className="pt-6 sm:pt-8 pb-4 w-full flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-3xl font-bold text-[#0A1024]">Dashboard</h1>
            <div className="text-xs text-gray-400 font-medium mt-1.5 flex items-center gap-1.5">
              <span>Dashboard</span>
              <span>&gt;</span>
              <span className="text-gray-500">Detail Tim {teamInfo.teamNameAfterColon}</span>
            </div>
          </div>
          <Link href="/matchmaking">
            <button className="bg-[#FFC700] text-[#0A1024] font-bold px-4 sm:px-9 py-2 sm:py-3 rounded-[8px] text-xs sm:text-sm hover:brightness-95 transition-all shadow-sm whitespace-nowrap">
              Buat Tim
            </button>
          </Link>
        </div>

        <div className="bg-white rounded-[8px] border border-[#F0F0F0] p-6 shadow-sm mt-4 w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4 mb-4">
            <div>
              <h2 className="text-xl font-bold text-[#0A1024]">
                Tim : <span className="font-bold">{teamInfo.teamNameAfterColon}</span>
              </h2>
              <p className="text-sm font-medium italic text-gray-700 mt-1">
                {teamInfo.competitionTitle}
              </p>
              <a
                href={teamInfo.competitionLink}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-[#FFC700] underline block mt-1 hover:text-[#e6b400]"
              >
                Link Lomba
              </a>
            </div>

            <div className="flex flex-col items-start sm:items-end justify-center">
              <div className="flex items-center gap-4 mb-2">
                <span className="text-sm font-bold text-[#0A1024]">
                  {approvedCount}/{maxMembers}
                </span>
                <span
                  className={`px-5 py-2 rounded-[6px] text-xs font-bold tracking-wide ${
                    isTeamComplete
                      ? "bg-[#FFF9E6] text-[#0A1024]"
                      : "bg-[#FFF9E6] text-[#E2A600] brightness-95"
                  }`}
                >
                  {isTeamComplete ? "Complete" : "Matchmaking..."}
                </span>
              </div>
              <div className="text-xs text-gray-500 font-medium">
                Lead : <span className="text-[#0A1024] font-bold">{teamInfo.leadName}</span>
              </div>
            </div>
          </div>

          {/* Mobile card list */}
          <div className="md:hidden space-y-3">
            {teamInfo.members.map((member) => (
              <div key={`m-${member.id}`} className="bg-gray-50 rounded-[6px] p-3 border border-gray-100">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-semibold text-sm text-gray-700 truncate">{member.fullName}</span>
                    {member.userId === teamInfo.leaderId && (
                      <Crown className="w-3.5 h-3.5 text-[#FFC700] fill-[#FFC700] shrink-0" />
                    )}
                  </div>
                  {member.status === "APPROVED" ? (
                    <span className="bg-[#EAF9E9] text-[#2E7D32] text-[10px] font-bold px-3 py-1.5 rounded-[4px] shrink-0">Accepted</span>
                  ) : member.inviteToken === "REQUEST_JOIN" ? (
                    <span className="bg-[#E8F0FE] text-[#1A73E8] text-[10px] font-bold px-3 py-1.5 rounded-[4px] shrink-0">Request Join</span>
                  ) : (
                    <span className="bg-[#FFF9E6] text-[#E2A600] text-[10px] font-bold px-3 py-1.5 rounded-[4px] shrink-0">Waiting</span>
                  )}
                </div>
                {member.skills && <p className="text-xs text-gray-500 mb-2.5">{member.skills}</p>}
                <div className="flex items-center gap-2 flex-wrap">
                  {member.status === "WAITING" && member.inviteToken !== "REQUEST_JOIN" && teamInfo.isLeader && (
                    <button
                      type="button"
                      onClick={() => handleRefreshMember(member.id)}
                      disabled={isRefreshing}
                      title="Ganti kandidat"
                      className="bg-[#FFC700] text-white p-1.5 rounded-[4px] hover:bg-[#e6b400] transition-colors inline-flex items-center justify-center shadow-sm disabled:opacity-50"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                      </svg>
                    </button>
                  )}
                  {member.userId !== teamInfo.currentUserId && (
                    <button
                      type="button"
                      onClick={() => handleLihatCV(member.cvUrl, member.fullName)}
                      className="border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 font-bold px-4 py-2 rounded-[4px] text-[11px] transition-all"
                    >
                      Lihat CV
                    </button>
                  )}
                  {member.status === "APPROVED" && member.userId !== teamInfo.currentUserId && (teamInfo.isLeader || teamInfo.isMember) ? (
                    <button
                      type="button"
                      onClick={() => handleChatWhatsApp(member.whatsappNumber)}
                      className="bg-[#FFC700] text-[#0A1024] font-bold px-5 py-2 rounded-[4px] text-[11px] hover:brightness-95 transition-all shadow-xs"
                    >
                      Chat
                    </button>
                  ) : member.status === "APPROVED" ? null : teamInfo.isLeader ? (
                    member.inviteToken === "REQUEST_JOIN" ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleApproveJoinRequest(member.id, member.fullName)}
                          disabled={isPending}
                          className="bg-[#FFC700] text-[#0A1024] font-bold px-4 py-2 rounded-[4px] text-[11px] hover:brightness-95 transition-all shadow-xs disabled:opacity-60"
                        >
                          Terima
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRejectJoinRequest(member.id, member.fullName)}
                          disabled={isPending}
                          className="border border-red-200 text-red-600 bg-white hover:bg-red-50 font-bold px-4 py-2 rounded-[4px] text-[11px] transition-all disabled:opacity-60"
                        >
                          Tolak
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleInvite(member.id, member.fullName)}
                        disabled={isPending}
                        className="bg-[#FFF9E6] text-[#0A1024] font-bold px-5 py-2 rounded-[4px] text-[11px] hover:brightness-95 transition-all shadow-xs disabled:opacity-60"
                      >
                        Invite
                      </button>
                    )
                  ) : null}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F4F5F6] text-gray-400 text-[11px] font-bold uppercase tracking-wider">
                  <th className="py-3 px-4 w-[60px] text-center">No</th>
                  <th className="py-3 px-4">Nama Lengkap</th>
                  <th className="py-3 px-4">Skil</th>
                  <th className="py-3 px-4 w-[120px] text-center">Status</th>
                  <th className="py-3 px-4 w-[240px] text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs font-medium text-[#0A1024]">
                {teamInfo.members.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-4 text-center align-middle">
                      {member.status === "WAITING" && member.inviteToken !== "REQUEST_JOIN" && teamInfo.isLeader ? (
                        <button
                          type="button"
                          onClick={() => handleRefreshMember(member.id)}
                          disabled={isRefreshing}
                          title="Roll — ganti kandidat"
                          className="bg-[#FFC700] text-white p-1.5 rounded-[4px] hover:bg-[#e6b400] transition-colors inline-flex items-center justify-center shadow-sm disabled:opacity-50"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                          </svg>
                        </button>
                      ) : (
                        <span className="text-gray-600 font-semibold">{member.no ?? "-"}</span>
                      )}
                    </td>
                    <td className="py-4 px-4 font-semibold text-gray-700">
                      <span className="flex items-center gap-1.5">
                        {member.fullName}
                        {member.userId === teamInfo.leaderId && (
                          <Crown className="w-3.5 h-3.5 text-[#FFC700] fill-[#FFC700] shrink-0" />
                        )}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-gray-500 font-normal">{member.skills}</td>
                    <td className="py-4 px-4 text-center align-middle">
                      {member.status === "APPROVED" ? (
                        <span className="bg-[#EAF9E9] text-[#2E7D32] text-[10px] font-bold px-3 py-1.5 rounded-[4px]">
                          Accepted
                        </span>
                      ) : member.inviteToken === "REQUEST_JOIN" ? (
                        <span className="bg-[#E8F0FE] text-[#1A73E8] text-[10px] font-bold px-3 py-1.5 rounded-[4px]">
                          Request Join
                        </span>
                      ) : (
                        <span className="bg-[#FFF9E6] text-[#E2A600] text-[10px] font-bold px-4 py-1.5 rounded-[4px]">
                          Waiting
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center align-middle">
                      <div className="flex items-center justify-center gap-2">
                        {member.userId !== teamInfo.currentUserId && (
                          <button
                            type="button"
                            onClick={() => handleLihatCV(member.cvUrl, member.fullName)}
                            className="border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 font-bold px-4 py-2 rounded-[4px] text-[11px] transition-all"
                          >
                            Lihat CV
                          </button>
                        )}

                        {member.status === "APPROVED" && member.userId !== teamInfo.currentUserId && (teamInfo.isLeader || teamInfo.isMember) ? (
                          <button
                            type="button"
                            onClick={() => handleChatWhatsApp(member.whatsappNumber)}
                            className="bg-[#FFC700] text-[#0A1024] font-bold px-5 py-2 rounded-[4px] text-[11px] hover:brightness-95 transition-all shadow-xs"
                          >
                            Chat
                          </button>
                        ) : member.status === "APPROVED" ? null : teamInfo.isLeader ? (
                          member.inviteToken === "REQUEST_JOIN" ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleApproveJoinRequest(member.id, member.fullName)}
                                disabled={isPending}
                                className="bg-[#FFC700] text-[#0A1024] font-bold px-4 py-2 rounded-[4px] text-[11px] hover:brightness-95 transition-all shadow-xs disabled:opacity-60"
                              >
                                Terima
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRejectJoinRequest(member.id, member.fullName)}
                                disabled={isPending}
                                className="border border-red-200 text-red-600 bg-white hover:bg-red-50 font-bold px-4 py-2 rounded-[4px] text-[11px] transition-all disabled:opacity-60"
                              >
                                Tolak
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleInvite(member.id, member.fullName)}
                              disabled={isPending}
                              className="bg-[#FFF9E6] text-[#0A1024] font-bold px-5 py-2 rounded-[4px] text-[11px] hover:brightness-95 transition-all shadow-xs disabled:opacity-60"
                            >
                              Invite
                            </button>
                          )
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!isTeamComplete && teamInfo.isLeader && (
            <div className="w-full text-center py-6 mt-4 tracking-wide">
              {canFindMember ? (
                <button
                  type="button"
                  onClick={handleFindMember}
                  disabled={isPending}
                  className="bg-[#FFC700] text-[#0A1024] font-bold px-6 py-2.5 rounded-[6px] text-xs hover:brightness-95 transition-all disabled:opacity-60"
                >
                  Cari Anggota
                </button>
              ) : (
                <p className="text-sm font-semibold italic text-[#FFC700]">
                  Sedang Mencari {maxMembers - approvedCount} Orang Lagi...
                </p>
              )}
            </div>
          )}

          {teamInfo.canJoin && (
            <div className="w-full text-center py-6 mt-4">
              <button
                type="button"
                onClick={handleRequestJoin}
                disabled={isPending}
                className="bg-[#FFC700] text-[#0A1024] font-bold px-6 py-2.5 rounded-[6px] text-xs hover:brightness-95 transition-all disabled:opacity-60"
              >
                Request Join
              </button>
            </div>
          )}

          {teamInfo.hasJoinRequest && !teamInfo.isLeader && (
            <div className="w-full text-center py-6 mt-4">
              <p className="text-sm font-semibold italic text-[#E2A600]">
                Permintaan bergabung kamu sedang menunggu persetujuan ketua tim.
              </p>
            </div>
          )}

          {teamInfo.isInvited && (
            <div className="w-full py-6 mt-4 border-t border-gray-100">
              <p className="text-sm text-gray-600 mb-1">
                Kamu diundang oleh <span className="font-bold text-[#0A1024]">{teamInfo.leadName}</span> untuk bergabung ke tim ini.
              </p>
              <p className="text-xs text-gray-400 mb-4">Lihat anggota dan CV di atas untuk mempertimbangkan keputusanmu.</p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleAcceptInvite}
                  disabled={isPending}
                  className="bg-[#FFC700] text-[#0A1024] font-bold px-6 py-2.5 rounded-[6px] text-xs hover:brightness-95 transition-all disabled:opacity-60"
                >
                  Terima Undangan
                </button>
                <button
                  type="button"
                  onClick={handleDeclineInvite}
                  disabled={isPending}
                  className="border border-red-200 text-red-600 bg-white hover:bg-red-50 font-bold px-6 py-2.5 rounded-[6px] text-xs transition-all disabled:opacity-60"
                >
                  Tolak
                </button>
              </div>
            </div>
          )}
        </div>
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
