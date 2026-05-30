"use server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import type { CreateTeamInput } from "@/types/team";

export async function createTeamAction({ teamName, memberCount, competitionId, competitionLink, competitionCategory, requiredSkills }: CreateTeamInput) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Kamu harus login." };
  }

  // Insert team to Supabase (table: Team)
  const { data, error } = await supabase.from("Team").insert([
    {
      id: crypto.randomUUID(),
      name: teamName,
      memberCount: memberCount,
      competitionId: competitionId,
      link: competitionLink,
      category: competitionCategory,
      requiredSkills: requiredSkills,
      leaderId: user.id,
      updatedAt: new Date().toISOString(),
    },
  ]).select().single();

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true, team: data };
}
