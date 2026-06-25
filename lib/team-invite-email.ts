import { resend, RESEND_FROM } from "@/lib/resend";
import { createAdminClient } from "@/lib/supabase-admin";
import { unwrapRelation } from "@/lib/supabase-relations";
import { teamInviteEmailHtml } from "@/lib/email-templates";

export async function sendTeamInviteEmail({
  teamId,
  memberId,
  inviteToken,
  origin,
}: {
  teamId: string;
  memberId: string;
  inviteToken: string;
  origin: string;
}) {
  const adminDb = createAdminClient();

  const { data: member, error: memberError } = await adminDb
    .from("TeamMember")
    .select(
      `
      id, inviteToken, status,
      user:User(email, name),
      team:Team(
        name, category, link,
        competition:Competition(title),
        leader:User(name)
      )
    `,
    )
    .eq("id", memberId)
    .eq("teamId", teamId)
    .single();

  if (memberError || !member || member.inviteToken !== inviteToken) {
    throw new Error("Undangan tidak valid.");
  }

  if (member.status !== "WAITING") {
    throw new Error("Undangan sudah diproses.");
  }

  const user = unwrapRelation(
    member.user as { email: string; name: string | null } | { email: string; name: string | null }[] | null,
  );
  const teamRaw = unwrapRelation(
    member.team as
      | {
          name: string;
          category: string;
          link: string;
          competition: { title: string } | { title: string }[] | null;
          leader: { name: string | null } | { name: string | null }[] | null;
        }
      | {
          name: string;
          category: string;
          link: string;
          competition: { title: string } | { title: string }[] | null;
          leader: { name: string | null } | { name: string | null }[] | null;
        }[]
      | null,
  );
  const team = teamRaw
    ? {
        ...teamRaw,
        competition: unwrapRelation(teamRaw.competition),
        leader: unwrapRelation(teamRaw.leader),
      }
    : null;

  if (!user?.email || !team) {
    throw new Error("Data undangan tidak lengkap.");
  }

  const detailUrl = `${origin}/team-invite/${memberId}?token=${encodeURIComponent(inviteToken)}`;
  const competitionTitle = team.competition?.title ?? "Lomba";
  const leaderName = team.leader?.name ?? "Ketua Tim";

  const { error } = await resend.emails.send({
    from: RESEND_FROM,
    to: user.email,
    subject: `${leaderName} mengundangmu ke tim "${team.name}" — MyProdigi`,
    html: teamInviteEmailHtml({
      recipientName: user.name ?? "Talent",
      leaderName,
      teamName: team.name,
      competitionTitle,
      category: team.category,
      teamLink: team.link,
      detailUrl,
    }),
  });

  if (error) {
    throw new Error(error.message);
  }
}
