"use server";

import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { assignNextCandidate } from "@/lib/matchmaking";
import { sendTeamInviteEmail } from "@/lib/team-invite-email";
import { unwrapRelation } from "@/lib/supabase-relations";
import type { DashboardTeamCard, DashboardTeamDetail } from "@/types/team";

type TeamRow = {
  id: string;
  name: string;
  memberCount: number;
  category: string;
  createdAt: string;
  leaderId: string;
  status: string;
  requiredSkills?: string[];
  leader?: any;
  competition: { title: string; organizer: string } | { title: string; organizer: string }[] | null;
};

function skillsMatch(requiredSkills: string[] | null | undefined, userSkills: string[]) {
  const required = requiredSkills ?? [];
  if (required.length === 0) return true;
  return required.some((skill) => userSkills.includes(skill));
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function mapSkills(skills: string[] | null | undefined) {
  return (skills ?? []).join(", ");
}

async function getAuthUser() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function getDashboardTeamsAction(): Promise<{
  success: boolean;
  data?: DashboardTeamCard[];
  error?: string;
}> {
  try {
    const { user } = await getAuthUser();
    if (!user) return { success: false, error: "Kamu harus login." };

    const adminDb = createAdminClient();

    const { data: userProfile } = await adminDb
      .from("User")
      .select("skills")
      .eq("id", user.id)
      .single();
    const userSkills = userProfile?.skills ?? [];

    const { data: myMemberships } = await adminDb
      .from("TeamMember")
      .select("teamId, status")
      .eq("userId", user.id);

    const membershipByTeam = new Map(
      (myMemberships ?? []).map((membership) => [membership.teamId, membership.status]),
    );

    const teamSelectWithStatus = `
      id, name, memberCount, category, createdAt, leaderId, status, requiredSkills,
      leader:User!Team_leaderId_fkey(name, photoUrl),
      competition:Competition(title, organizer)
    `;
    const teamSelectBase = `
      id, name, memberCount, category, createdAt, leaderId, requiredSkills,
      leader:User!Team_leaderId_fkey(name, photoUrl),
      competition:Competition(title, organizer)
    `;

    const ledTeamsResult = await adminDb
      .from("Team")
      .select(teamSelectWithStatus)
      .eq("leaderId", user.id)
      .neq("status", "COMPLETED");

    let resolvedLedTeams: TeamRow[] = [];

    if (!ledTeamsResult.error) {
      resolvedLedTeams = (ledTeamsResult.data ?? []) as TeamRow[];
    } else if (ledTeamsResult.error.message.includes("status")) {
      const fallback = await adminDb
        .from("Team")
        .select(teamSelectBase)
        .eq("leaderId", user.id);
      if (fallback.error) throw fallback.error;
      resolvedLedTeams = (fallback.data ?? []).map((team) => ({
        ...team,
        status: "IN_PROGRESS",
      })) as TeamRow[];
    } else {
      throw ledTeamsResult.error;
    }

    let memberRows: Array<{ status: string; team: TeamRow | TeamRow[] | null }> = [];
    const memberResult = await adminDb
      .from("TeamMember")
      .select(`
        status,
        team:Team(
          id, name, memberCount, category, createdAt, leaderId, requiredSkills, status,
          leader:User!Team_leaderId_fkey(name, photoUrl),
          competition:Competition(title, organizer)
        )
      `)
      .eq("userId", user.id)
      .eq("status", "APPROVED");

    if (memberResult.error?.message?.includes("TeamMember")) {
      memberRows = [];
    } else if (memberResult.error) {
      throw memberResult.error;
    } else {
      memberRows = (memberResult.data ?? []) as Array<{ status: string; team: TeamRow | TeamRow[] | null }>;
    }

    const teamMap = new Map<string, TeamRow>();

    for (const team of resolvedLedTeams) {
      teamMap.set(team.id, team as TeamRow);
    }

    for (const row of memberRows ?? []) {
      const team = unwrapRelation(row.team as TeamRow | TeamRow[] | null);
      if (team && team.status !== "COMPLETED") {
        teamMap.set(team.id, team);
      }
    }

    const openTeamsResult = await adminDb
      .from("Team")
      .select(teamSelectWithStatus)
      .neq("leaderId", user.id)
      .neq("status", "COMPLETED");

    let openTeams: TeamRow[] = [];
    if (!openTeamsResult.error) {
      openTeams = (openTeamsResult.data ?? []) as TeamRow[];
    } else if (openTeamsResult.error.message.includes("status")) {
      const fallback = await adminDb
        .from("Team")
        .select(teamSelectBase)
        .neq("leaderId", user.id);
      if (!fallback.error) {
        openTeams = (fallback.data ?? []).map((team) => ({
          ...team,
          status: "IN_PROGRESS",
        })) as TeamRow[];
      }
    }

    for (const team of openTeams) {
      if (teamMap.has(team.id) || membershipByTeam.has(team.id)) continue;
      if (!skillsMatch(team.requiredSkills, userSkills)) continue;

      const { count } = await adminDb
        .from("TeamMember")
        .select("id", { count: "exact", head: true })
        .eq("teamId", team.id)
        .eq("status", "APPROVED");

      if ((count ?? 0) < team.memberCount) {
        teamMap.set(team.id, team);
      }
    }

    const cards: DashboardTeamCard[] = [];

    for (const team of teamMap.values()) {
      const teamId = team.id;
      const membersResult = await adminDb
        .from("TeamMember")
        .select("status, userId, user:User!TeamMember_userId_fkey(name, photoUrl)")
        .eq("teamId", teamId)
        .eq("status", "APPROVED")
        .order("slotNumber", { ascending: true, nullsFirst: false });

      const members = membersResult.error ? [] : (membersResult.data ?? []);
      const approvedCount = members.length + 1; // +1 to include the team leader
      const leaderData = unwrapRelation(team.leader as any);
      const memberNames = [
        leaderData?.name ?? "Ketua",
        ...(members ?? []).map((m) => {
          const memberUser = unwrapRelation(
            m.user as { name: string | null } | { name: string | null }[] | null,
          );
          return memberUser?.name ?? "Anggota";
        })
      ];
      const membersData = [
        { name: leaderData?.name ?? "Ketua", photoUrl: leaderData?.photoUrl ?? null },
        ...(members ?? []).map((m) => {
          const memberUser = unwrapRelation(m.user as any);
          return { name: memberUser?.name ?? "Anggota", photoUrl: memberUser?.photoUrl ?? null };
        })
      ];
      const competition = unwrapRelation(team.competition);
      const isLeader = team.leaderId === user.id;
      const isMember = !isLeader && membershipByTeam.get(teamId) === "APPROVED";

      cards.push({
        id: teamId,
        teamName: team.name,
        competitionTitle: competition?.title ?? "-",
        createdDate: formatDate(team.createdAt),
        createdAt: team.createdAt,
        category: team.category,
        organizer: competition?.organizer ?? "-",
        memberNames,
        membersData,
        approvedCount,
        memberCount: team.memberCount,
        isLeader,
        isMember,
        isDiscoverable: !isLeader && !isMember && !membershipByTeam.has(teamId),
        isComplete: approvedCount >= team.memberCount,
      });
    }

    cards.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    return { success: true, data: cards };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal memuat tim.";
    return { success: false, error: message };
  }
}

export async function getTeamDetailAction(teamId: string): Promise<{
  success: boolean;
  data?: DashboardTeamDetail;
  error?: string;
}> {
  try {
    const { user } = await getAuthUser();
    if (!user) return { success: false, error: "Kamu harus login." };

    const adminDb = createAdminClient();

    const { data: team, error: teamError } = await adminDb
      .from("Team")
      .select(
        `
        id, name, memberCount, link, leaderId, requiredSkills,
        competition:Competition(title),
        leader:User!Team_leaderId_fkey(name)
      `,
      )
      .eq("id", teamId)
      .single();

    if (teamError || !team) {
      return { success: false, error: "Tim tidak ditemukan." };
    }

    const isLeader = team.leaderId === user.id;

    const { data: membership } = await adminDb
      .from("TeamMember")
      .select("id, status, inviteToken")
      .eq("teamId", teamId)
      .eq("userId", user.id)
      .maybeSingle();

    const isMember = membership?.status === "APPROVED";
    const hasJoinRequest = membership?.status === "WAITING" && membership?.inviteToken === "REQUEST_JOIN";
    const isInvited = membership?.status === "WAITING" && membership?.inviteToken !== "REQUEST_JOIN";

    if (!isLeader && !isMember && !hasJoinRequest && !isInvited) {
      const { data: viewerProfile } = await adminDb
        .from("User")
        .select("skills")
        .eq("id", user.id)
        .single();

      const { count: approvedTotal } = await adminDb
        .from("TeamMember")
        .select("id", { count: "exact", head: true })
        .eq("teamId", teamId)
        .eq("status", "APPROVED");

      const teamNeedsMembers = (approvedTotal ?? 0) < team.memberCount;
      const canView =
        teamNeedsMembers &&
        skillsMatch(team.requiredSkills ?? [], viewerProfile?.skills ?? []);

      if (!canView) {
        return { success: false, error: "Akses ditolak." };
      }
    }

    const memberRowsResult = await adminDb
      .from("TeamMember")
      .select(
        `
        id, status, slotNumber, userId, inviteToken,
        user:User!TeamMember_userId_fkey(name, skills, nomorWa, cvUrl)
      `,
      )
      .eq("teamId", teamId)
      .order("slotNumber", { ascending: true, nullsFirst: false });

    if (memberRowsResult.error?.message?.includes("TeamMember")) {
      return {
        success: false,
        error:
          "Tabel TeamMember belum tersedia. Jalankan migrasi: npm run db:migrate-team (atau eksekusi SQL di Supabase Dashboard).",
      };
    }

    if (memberRowsResult.error) {
      return { success: false, error: memberRowsResult.error.message };
    }

    let memberRows = memberRowsResult.data ?? [];

    const leaderAlreadyMember = memberRows.some((row) => row.userId === team.leaderId);
    if (!leaderAlreadyMember && team.leaderId) {
      const now = new Date().toISOString();
      await adminDb.from("TeamMember").insert({
        id: crypto.randomUUID(),
        teamId,
        userId: team.leaderId,
        status: "APPROVED",
        slotNumber: 1,
        updatedAt: now,
      });

      const refetch = await adminDb
        .from("TeamMember")
        .select(
          `
          id, status, slotNumber, userId, inviteToken,
          user:User!TeamMember_userId_fkey(name, skills, nomorWa, cvUrl)
        `,
        )
        .eq("teamId", teamId)
        .order("slotNumber", { ascending: true, nullsFirst: false });

      if (!refetch.error) {
        memberRows = refetch.data ?? memberRows;
      }
    }

    const approvedCount = (memberRows ?? []).filter((m) => m.status === "APPROVED").length;
    const teamNeedsMembers = approvedCount < team.memberCount;
    const competition = unwrapRelation(
      team.competition as { title: string } | { title: string }[] | null,
    );
    const leader = unwrapRelation(
      team.leader as { name: string | null } | { name: string | null }[] | null,
    );

    const visibleMembers = (memberRows ?? []).filter(
      (row) => isLeader || row.status === "APPROVED" || row.userId === user.id,
    );

    return {
      success: true,
      data: {
        id: team.id,
        teamNameAfterColon: team.name,
        competitionTitle: competition?.title ?? "-",
        competitionLink: team.link,
        leadName: leader?.name ?? "Ketua Tim",
        maxAdditionalMembersNeeded: team.memberCount,
        approvedCount,
        isLeader,
        isMember,
        canJoin: !isLeader && !isMember && !hasJoinRequest && !isInvited && teamNeedsMembers,
        hasJoinRequest,
        isInvited,
        inviteToken: membership?.inviteToken ?? null,
        membershipId: membership?.id ?? null,
        members: visibleMembers.map((row) => {
          const memberUser = unwrapRelation(
            row.user as
              | {
                  name: string | null;
                  skills: string[] | null;
                  nomorWa: string | null;
                  cvUrl: string | null;
                }
              | {
                  name: string | null;
                  skills: string[] | null;
                  nomorWa: string | null;
                  cvUrl: string | null;
                }[]
              | null,
          );

          return {
            id: row.id,
            no: row.slotNumber,
            fullName: memberUser?.name ?? "Anggota",
            skills: mapSkills(memberUser?.skills),
            status: row.status as "WAITING" | "APPROVED",
            whatsappNumber: memberUser?.nomorWa ?? "",
            cvUrl: memberUser?.cvUrl ?? null,
            userId: row.userId,
            inviteToken: row.inviteToken,
          };
        }),
      },
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal memuat detail tim.";
    return { success: false, error: message };
  }
}

export async function findMemberAction(teamId: string) {
  try {
    const { user } = await getAuthUser();
    if (!user) return { success: false, error: "Kamu harus login." };

    const adminDb = createAdminClient();

    const { data: team } = await adminDb
      .from("Team")
      .select("id, leaderId, memberCount, requiredSkills")
      .eq("id", teamId)
      .single();

    if (!team || team.leaderId !== user.id) {
      return { success: false, error: "Hanya ketua tim yang dapat mencari anggota." };
    }

    const assigned = await assignNextCandidate(adminDb, {
      id: team.id,
      leaderId: team.leaderId,
      memberCount: team.memberCount,
      requiredSkills: team.requiredSkills ?? [],
    });

    if (!assigned) {
      return { success: false, error: "Belum ada kandidat yang cocok saat ini." };
    }

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal mencari anggota.";
    return { success: false, error: message };
  }
}

export async function requestJoinAction(teamId: string) {
  try {
    const { user } = await getAuthUser();
    if (!user) return { success: false, error: "Kamu harus login." };

    const adminDb = createAdminClient();

    const { data: team } = await adminDb
      .from("Team")
      .select("id, leaderId, memberCount, requiredSkills")
      .eq("id", teamId)
      .single();

    if (!team) return { success: false, error: "Tim tidak ditemukan." };
    if (team.leaderId === user.id) {
      return { success: false, error: "Kamu sudah menjadi ketua tim ini." };
    }

    const { data: existing } = await adminDb
      .from("TeamMember")
      .select("id, status")
      .eq("teamId", teamId)
      .eq("userId", user.id)
      .maybeSingle();

    if (existing) {
      return { success: false, error: "Kamu sudah terdaftar di tim ini." };
    }

    const { data: userProfile } = await adminDb
      .from("User")
      .select("skills")
      .eq("id", user.id)
      .single();

    if (!skillsMatch(team.requiredSkills ?? [], userProfile?.skills ?? [])) {
      return { success: false, error: "Skill kamu belum sesuai dengan kebutuhan tim." };
    }

    const { count } = await adminDb
      .from("TeamMember")
      .select("id", { count: "exact", head: true })
      .eq("teamId", teamId)
      .eq("status", "APPROVED");

    if ((count ?? 0) >= team.memberCount) {
      return { success: false, error: "Tim sudah penuh." };
    }

    const now = new Date().toISOString();
    const { error } = await adminDb.from("TeamMember").insert({
      id: crypto.randomUUID(),
      teamId,
      userId: user.id,
      status: "WAITING",
      inviteToken: "REQUEST_JOIN",
      updatedAt: now,
    });

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal mengirim permintaan bergabung.";
    return { success: false, error: message };
  }
}

export async function completeTeamAction(teamId: string) {
  try {
    const { user } = await getAuthUser();
    if (!user) return { success: false, error: "Kamu harus login." };

    const adminDb = createAdminClient();

    const { data: team } = await adminDb
      .from("Team")
      .select("id, leaderId, memberCount")
      .eq("id", teamId)
      .single();

    if (!team || team.leaderId !== user.id) {
      return { success: false, error: "Hanya ketua tim yang dapat menyelesaikan lomba." };
    }

    const { error } = await adminDb.from("Team").delete().eq("id", teamId);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal menyelesaikan lomba.";
    return { success: false, error: message };
  }
}

export async function refreshMemberAction(teamId: string, memberId: string) {
  try {
    const { user } = await getAuthUser();
    if (!user) return { success: false, error: "Kamu harus login." };

    const adminDb = createAdminClient();

    const { data: team } = await adminDb
      .from("Team")
      .select("id, leaderId, memberCount, requiredSkills")
      .eq("id", teamId)
      .single();

    if (!team || team.leaderId !== user.id) {
      return { success: false, error: "Hanya ketua tim yang dapat mengganti anggota." };
    }

    const { data: member } = await adminDb
      .from("TeamMember")
      .select("id, status")
      .eq("id", memberId)
      .eq("teamId", teamId)
      .single();

    if (!member || member.status !== "WAITING") {
      return { success: false, error: "Hanya kandidat dengan status waiting yang dapat diganti." };
    }

    await adminDb.from("TeamMember").delete().eq("id", memberId);

    const assigned = await assignNextCandidate(adminDb, {
      id: team.id,
      leaderId: team.leaderId,
      memberCount: team.memberCount,
      requiredSkills: team.requiredSkills ?? [],
    });

    if (!assigned) {
      return { success: false, error: "Belum ada kandidat pengganti yang cocok." };
    }

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal memperbarui anggota.";
    return { success: false, error: message };
  }
}

export async function inviteMemberAction(teamId: string, memberId: string) {
  try {
    const { user } = await getAuthUser();
    if (!user) return { success: false, error: "Kamu harus login." };

    const adminDb = createAdminClient();

    const { data: team } = await adminDb
      .from("Team")
      .select("id, leaderId")
      .eq("id", teamId)
      .single();

    if (!team || team.leaderId !== user.id) {
      return { success: false, error: "Hanya ketua tim yang dapat mengirim undangan." };
    }

    const { data: member } = await adminDb
      .from("TeamMember")
      .select("id, status, inviteToken")
      .eq("id", memberId)
      .eq("teamId", teamId)
      .single();

    if (!member || member.status !== "WAITING") {
      return { success: false, error: "Undangan hanya untuk kandidat waiting." };
    }

    const inviteToken = member.inviteToken ?? crypto.randomUUID();
    const now = new Date().toISOString();

    await adminDb
      .from("TeamMember")
      .update({ inviteToken, invitedAt: now, updatedAt: now })
      .eq("id", memberId);

    const origin = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    
    // Also create a notification inside the app
    const { data: memberData } = await adminDb
      .from("TeamMember")
      .select("userId, team:Team(name)")
      .eq("id", memberId)
      .single();

    if (memberData) {
      const teamName = memberData.team ? (memberData.team as any).name : "Tim";
      await adminDb.from("Notification").insert({
        id: crypto.randomUUID(),
        userId: memberData.userId,
        type: "custom_info",
        title: "Undangan Bergabung Tim",
        description: `Kamu diundang untuk bergabung dengan tim "${teamName}". Buka tautan berikut untuk melihat detail: /team-invite/${memberId}?token=${inviteToken}`,
        isRead: false,
        createdAt: now,
      });
    }

    try {
      await sendTeamInviteEmail({ teamId, memberId, inviteToken, origin });
    } catch (emailErr: any) {
      console.warn("Resend email sending failed:", emailErr);
      return { 
        success: true, 
        warning: "Resend sandbox limit: Undangan telah dibuat di sistem, tetapi email gagal dikirim karena limitasi Resend Free. Pengguna dapat menerima undangan langsung melalui tab Notifikasi atau Tim Saya."
      };
    }

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal mengirim undangan.";
    return { success: false, error: message };
  }
}

export async function getMyTeamsAction(): Promise<{
  success: boolean;
  data?: (DashboardTeamCard & { inviteToken?: string | null })[];
  error?: string;
}> {
  try {
    const { user } = await getAuthUser();
    if (!user) return { success: false, error: "Kamu harus login." };

    const adminDb = createAdminClient();

    const { data: myMemberships } = await adminDb
      .from("TeamMember")
      .select("id, teamId, status, inviteToken")
      .eq("userId", user.id);

    const membershipByTeam = new Map(
      (myMemberships ?? []).map((m) => [m.teamId, { id: m.id, status: m.status, inviteToken: m.inviteToken }]),
    );

    const teamSelectWithStatus = `
      id, name, memberCount, category, createdAt, leaderId, status, requiredSkills,
      competition:Competition(title, organizer)
    `;
    const teamSelectBase = `
      id, name, memberCount, category, createdAt, leaderId, requiredSkills,
      competition:Competition(title, organizer)
    `;

    const ledTeamsResult = await adminDb
      .from("Team")
      .select(teamSelectWithStatus)
      .eq("leaderId", user.id)
      .neq("status", "COMPLETED");

    let resolvedLedTeams: TeamRow[] = [];
    if (!ledTeamsResult.error) {
      resolvedLedTeams = (ledTeamsResult.data ?? []) as TeamRow[];
    } else {
      const fallback = await adminDb
        .from("Team")
        .select(teamSelectBase)
        .eq("leaderId", user.id);
      if (fallback.error) throw fallback.error;
      resolvedLedTeams = (fallback.data ?? []).map((team) => ({
        ...team,
        status: "IN_PROGRESS",
      })) as TeamRow[];
    }

    let memberRows: Array<{ status: string; inviteToken: string | null; team: TeamRow | TeamRow[] | null }> = [];
    const memberResult = await adminDb
      .from("TeamMember")
      .select(
        `
        status, inviteToken,
        team:Team(
          id, name, memberCount, category, createdAt, leaderId, status,
          competition:Competition(title, organizer)
        )
      `,
      )
      .eq("userId", user.id);

    if (!memberResult.error) {
      memberRows = (memberResult.data ?? []) as any[];
    }

    const teamMap = new Map<string, TeamRow>();
    for (const team of resolvedLedTeams) {
      teamMap.set(team.id, team);
    }
    for (const row of memberRows) {
      const team = unwrapRelation(row.team as TeamRow | TeamRow[] | null);
      if (team && team.status !== "COMPLETED") {
        teamMap.set(team.id, team);
      }
    }

    const cards: (DashboardTeamCard & { inviteToken?: string | null })[] = [];

    for (const team of teamMap.values()) {
      const teamId = team.id;
      const membersResult = await adminDb
        .from("TeamMember")
        .select("status, userId, user:User!TeamMember_userId_fkey(name, photoUrl)")
        .eq("teamId", teamId)
        .eq("status", "APPROVED")
        .order("slotNumber", { ascending: true, nullsFirst: false });

      const members = membersResult.error ? [] : (membersResult.data ?? []);
      const approvedCount = members.length;
      const memberNames = (members ?? []).map((m) => {
        const memberUser = unwrapRelation(
          m.user as { name: string | null } | { name: string | null }[] | null,
        );
        return memberUser?.name ?? "Anggota";
      });
      const membersData = (members ?? []).map((m) => {
        const memberUser = unwrapRelation(m.user as any);
        return { name: memberUser?.name ?? "Anggota", photoUrl: memberUser?.photoUrl ?? null };
      });

      const competition = unwrapRelation(team.competition);
      const isLeader = team.leaderId === user.id;
      
      const userMembership = membershipByTeam.get(teamId);
      const isMember = !isLeader && userMembership?.status === "APPROVED";
      const hasJoinRequest = !isLeader && userMembership?.status === "WAITING" && userMembership?.inviteToken === "REQUEST_JOIN";
      const isInvited = !isLeader && userMembership?.status === "WAITING" && userMembership?.inviteToken !== "REQUEST_JOIN";

      cards.push({
        id: teamId,
        teamName: team.name,
        competitionTitle: competition?.title ?? "-",
        createdDate: formatDate(team.createdAt),
        createdAt: team.createdAt,
        category: team.category,
        organizer: competition?.organizer ?? "-",
        memberNames,
        membersData,
        approvedCount,
        memberCount: team.memberCount,
        isLeader,
        isMember,
        isDiscoverable: false,
        isComplete: approvedCount >= team.memberCount,
        hasJoinRequest,
        isInvited,
        membershipId: userMembership?.id,
        inviteToken: userMembership?.inviteToken,
      });
    }

    cards.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    return { success: true, data: cards };
  } catch (error: unknown) {
    console.error("ERROR IN getMyTeamsAction:", error);
    const message = error instanceof Error ? error.message : "Gagal memuat tim saya.";
    return { success: false, error: message };
  }
}

export async function getAllTeamsAction(): Promise<{
  success: boolean;
  data?: DashboardTeamCard[];
  error?: string;
}> {
  try {
    const { user } = await getAuthUser();
    if (!user) return { success: false, error: "Kamu harus login." };

    const adminDb = createAdminClient();

    const { data: myMemberships } = await adminDb
      .from("TeamMember")
      .select("teamId, status, inviteToken")
      .eq("userId", user.id);

    const membershipByTeam = new Map(
      (myMemberships ?? []).map((m) => [m.teamId, { status: m.status, inviteToken: m.inviteToken }]),
    );

    const teamSelectWithStatus = `
      id, name, memberCount, category, createdAt, leaderId, status, requiredSkills,
      competition:Competition(title, organizer)
    `;

    const { data: allTeams, error: teamsError } = await adminDb
      .from("Team")
      .select(teamSelectWithStatus)
      .neq("status", "COMPLETED");

    if (teamsError) throw teamsError;

    const cards: DashboardTeamCard[] = [];

    for (const team of (allTeams ?? []) as TeamRow[]) {
      const teamId = team.id;
      const membersResult = await adminDb
        .from("TeamMember")
        .select("status, userId, user:User!TeamMember_userId_fkey(name, photoUrl)")
        .eq("teamId", teamId)
        .eq("status", "APPROVED")
        .order("slotNumber", { ascending: true, nullsFirst: false });

      const members = membersResult.error ? [] : (membersResult.data ?? []);
      const approvedCount = members.length;
      const memberNames = (members ?? []).map((m) => {
        const memberUser = unwrapRelation(
          m.user as { name: string | null } | { name: string | null }[] | null,
        );
        return memberUser?.name ?? "Anggota";
      });
      const membersData = (members ?? []).map((m) => {
        const memberUser = unwrapRelation(m.user as any);
        return { name: memberUser?.name ?? "Anggota", photoUrl: memberUser?.photoUrl ?? null };
      });

      const competition = unwrapRelation(team.competition);
      const isLeader = team.leaderId === user.id;
      
      const userMembership = membershipByTeam.get(teamId);
      const isMember = !isLeader && userMembership?.status === "APPROVED";
      const hasJoinRequest = !isLeader && userMembership?.status === "WAITING" && userMembership?.inviteToken === "REQUEST_JOIN";
      
      const isDiscoverable = !isLeader && !isMember && !userMembership;

      cards.push({
        id: teamId,
        teamName: team.name,
        competitionTitle: competition?.title ?? "-",
        createdDate: formatDate(team.createdAt),
        createdAt: team.createdAt,
        category: team.category,
        organizer: competition?.organizer ?? "-",
        memberNames,
        membersData,
        approvedCount,
        memberCount: team.memberCount,
        isLeader,
        isMember,
        isDiscoverable,
        isComplete: approvedCount >= team.memberCount,
        hasJoinRequest,
      });
    }

    cards.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    return { success: true, data: cards };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal memuat semua tim.";
    return { success: false, error: message };
  }
}

export async function approveJoinRequestAction(teamId: string, memberId: string) {
  try {
    const { user } = await getAuthUser();
    if (!user) return { success: false, error: "Kamu harus login." };

    const adminDb = createAdminClient();

    const { data: team } = await adminDb
      .from("Team")
      .select("id, name, leaderId, memberCount")
      .eq("id", teamId)
      .single();

    if (!team || team.leaderId !== user.id) {
      return { success: false, error: "Hanya ketua tim yang dapat menyetujui permintaan gabung." };
    }

    const { data: member } = await adminDb
      .from("TeamMember")
      .select("id, userId, status, inviteToken")
      .eq("id", memberId)
      .eq("teamId", teamId)
      .single();

    if (!member || member.status !== "WAITING" || member.inviteToken !== "REQUEST_JOIN") {
      return { success: false, error: "Permintaan gabung tidak valid atau sudah diproses." };
    }

    const { count } = await adminDb
      .from("TeamMember")
      .select("id", { count: "exact", head: true })
      .eq("teamId", teamId)
      .eq("status", "APPROVED");

    const approvedCount = count ?? 0;
    if (approvedCount >= team.memberCount) {
      return { success: false, error: "Tim sudah penuh." };
    }

    const slotNumber = approvedCount + 1;
    const now = new Date().toISOString();

    const { error: updateError } = await adminDb
      .from("TeamMember")
      .update({
        status: "APPROVED",
        slotNumber,
        updatedAt: now,
      })
      .eq("id", memberId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    await adminDb.from("Notification").insert({
      id: crypto.randomUUID(),
      userId: member.userId,
      type: "team_approve",
      title: "Permintaan Gabung Disetujui",
      description: `Permintaan bergabung kamu di tim "${team.name ?? 'Tim'}" telah disetujui oleh ketua tim.`,
      isRead: false,
      createdAt: now,
    });

    if (slotNumber >= team.memberCount) {
      await adminDb
        .from("TeamMember")
        .delete()
        .eq("teamId", teamId)
        .eq("status", "WAITING");
    }

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal menyetujui permintaan gabung.";
    return { success: false, error: message };
  }
}

export async function rejectJoinRequestAction(teamId: string, memberId: string) {
  try {
    const { user } = await getAuthUser();
    if (!user) return { success: false, error: "Kamu harus login." };

    const adminDb = createAdminClient();

    const { data: team } = await adminDb
      .from("Team")
      .select("id, name, leaderId")
      .eq("id", teamId)
      .single();

    if (!team || team.leaderId !== user.id) {
      return { success: false, error: "Hanya ketua tim yang dapat menolak permintaan gabung." };
    }

    const { data: member } = await adminDb
      .from("TeamMember")
      .select("id, userId, status, inviteToken")
      .eq("id", memberId)
      .eq("teamId", teamId)
      .single();

    if (!member || member.status !== "WAITING" || member.inviteToken !== "REQUEST_JOIN") {
      return { success: false, error: "Permintaan gabung tidak valid atau sudah diproses." };
    }

    const now = new Date().toISOString();

    const { error: deleteError } = await adminDb
      .from("TeamMember")
      .delete()
      .eq("id", memberId);

    if (deleteError) {
      return { success: false, error: deleteError.message };
    }

    await adminDb.from("Notification").insert({
      id: crypto.randomUUID(),
      userId: member.userId,
      type: "team_reject",
      title: "Permintaan Gabung Ditolak",
      description: `Permintaan bergabung kamu di tim "${team.name ?? 'Tim'}" ditolak oleh ketua tim.`,
      isRead: false,
      createdAt: now,
    });

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal menolak permintaan gabung.";
    return { success: false, error: message };
  }
}
