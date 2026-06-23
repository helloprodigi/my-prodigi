"use server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/lib/supabase-admin";
import type { CreateTeamInput } from "@/types/team";

export async function createTeamAction({ teamName, memberCount, competitionId, competitionLink, competitionCategory, requiredSkills }: CreateTeamInput) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Kamu harus login." };
  }

  const teamId = crypto.randomUUID();
  const now = new Date().toISOString();

  const adminDb = createAdminClient();
  let finalCompetitionId = competitionId;

  if (!finalCompetitionId) {
    finalCompetitionId = crypto.randomUUID();
    const { error: compError } = await adminDb.from("Competition").insert({
      id: finalCompetitionId,
      title: `Custom: ${competitionCategory}`,
      organizer: "Manual Creation",
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      category: "Internal",
      skills: requiredSkills,
      link: competitionLink,
      status: "APPROVED",
      createdById: user.id,
      updatedAt: now,
    });
    if (compError) {
      return { success: false, error: "Gagal membuat referensi lomba custom: " + compError.message };
    }
  }

  const basePayload = {
    id: teamId,
    name: teamName.trim(),
    memberCount: memberCount,
    competitionId: finalCompetitionId,
    link: competitionLink,
    category: competitionCategory,
    requiredSkills: requiredSkills,
    leaderId: user.id,
    updatedAt: now,
  };

  let { data, error } = await supabase.from("Team").insert([
    { ...basePayload, status: "IN_PROGRESS" },
  ]).select().single();

  if (error?.message?.includes("status")) {
    ({ data, error } = await supabase.from("Team").insert([basePayload]).select().single());
  }

  if (error) {
    return { success: false, error: error.message };
  }

  try {
    const adminDb = createAdminClient();
    const { error: leaderMemberError } = await adminDb.from("TeamMember").insert({
      id: crypto.randomUUID(),
      teamId,
      userId: user.id,
      status: "APPROVED",
      slotNumber: 1,
      updatedAt: now,
    });

    if (leaderMemberError) {
      return { success: false, error: leaderMemberError.message };
    }
  } catch (matchmakingError: unknown) {
    const message =
      matchmakingError instanceof Error ? matchmakingError.message : "Gagal memulai matchmaking.";
    if (message.includes("TeamMember") || message.includes("relation")) {
      return {
        success: false,
        error:
          "Tabel TeamMember belum tersedia. Jalankan migrasi database terlebih dahulu (npm run db:migrate-team).",
      };
    }
    return { success: false, error: message };
  }

  return { success: true, team: data };
}
