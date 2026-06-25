import type { SupabaseClient } from "@supabase/supabase-js";

type DbUser = {
  id: string;
  skills: string[] | null;
};

export async function getExcludedUserIds(
  adminDb: SupabaseClient,
  teamId: string,
  leaderId: string,
): Promise<string[]> {
  const { data: existingMembers } = await adminDb
    .from("TeamMember")
    .select("userId")
    .eq("teamId", teamId);

  const excluded = new Set<string>([leaderId]);
  for (const member of existingMembers ?? []) {
    excluded.add(member.userId);
  }
  return Array.from(excluded);
}

export async function findCandidateUserId(
  adminDb: SupabaseClient,
  leaderId: string,
  requiredSkills: string[],
  excludeUserIds: string[],
): Promise<string | null> {
  const { data: users, error } = await adminDb
    .from("User")
    .select("id, skills")
    .eq("isOnboarded", true);

  if (error || !users?.length) return null;

  const excluded = new Set(excludeUserIds);
  excluded.add(leaderId);

  const candidates = (users as DbUser[]).filter((user) => {
    if (excluded.has(user.id)) return false;
    const userSkills = user.skills ?? [];
    return requiredSkills.some((skill) => userSkills.includes(skill));
  });

  if (!candidates.length) return null;

  const pick = candidates[Math.floor(Math.random() * candidates.length)];
  return pick.id;
}

export async function assignAllCandidates(
  adminDb: SupabaseClient,
  team: {
    id: string;
    leaderId: string;
    memberCount: number;
    requiredSkills: string[];
  },
): Promise<number> {
  const { data: members } = await adminDb
    .from("TeamMember")
    .select("id, status, userId")
    .eq("teamId", team.id);

  const allMembers = members ?? [];
  const approvedNonLeader = allMembers.filter(
    (m) => m.status === "APPROVED" && m.userId !== team.leaderId,
  ).length;
  const waitingCount = allMembers.filter((m) => m.status === "WAITING").length;

  const slotsNeeded = team.memberCount - approvedNonLeader - waitingCount;
  if (slotsNeeded <= 0) return 0;

  const excludeUserIds = await getExcludedUserIds(adminDb, team.id, team.leaderId);
  let assigned = 0;

  for (let i = 0; i < slotsNeeded; i++) {
    const candidateId = await findCandidateUserId(
      adminDb,
      team.leaderId,
      team.requiredSkills ?? [],
      excludeUserIds,
    );

    if (!candidateId) break;

    excludeUserIds.push(candidateId);

    const now = new Date().toISOString();
    const { error } = await adminDb.from("TeamMember").insert({
      id: crypto.randomUUID(),
      teamId: team.id,
      userId: candidateId,
      status: "WAITING",
      inviteToken: crypto.randomUUID(),
      updatedAt: now,
    });

    if (!error) assigned++;
  }

  return assigned;
}

export async function assignNextCandidate(
  adminDb: SupabaseClient,
  team: {
    id: string;
    leaderId: string;
    memberCount: number;
    requiredSkills: string[];
  },
): Promise<boolean> {
  const excludeUserIds = await getExcludedUserIds(adminDb, team.id, team.leaderId);
  const candidateId = await findCandidateUserId(
    adminDb,
    team.leaderId,
    team.requiredSkills ?? [],
    excludeUserIds,
  );

  if (!candidateId) return false;

  const now = new Date().toISOString();
  const { error } = await adminDb.from("TeamMember").insert({
    id: crypto.randomUUID(),
    teamId: team.id,
    userId: candidateId,
    status: "WAITING",
    inviteToken: crypto.randomUUID(),
    updatedAt: now,
  });

  return !error;
}
