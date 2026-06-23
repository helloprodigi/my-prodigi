import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase-admin";
import { unwrapRelation } from "@/lib/supabase-relations";

const resendApiKey = process.env.RESEND_API_KEY;
const resendFrom = process.env.RESEND_FROM_EMAIL ?? "HelloProdigi <onboarding@resend.dev>";

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
  if (!resendApiKey) {
    throw new Error("RESEND_API_KEY belum di-set.");
  }

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
  const brandLogoUrl = `${origin}/assets/myprodigi.svg`;
  const competitionTitle = team.competition?.title ?? "Lomba";
  const leaderName = team.leader?.name ?? "Ketua Tim";

  const resend = new Resend(resendApiKey);
  const { error } = await resend.emails.send({
    from: resendFrom,
    to: user.email,
    subject: `Undangan bergabung tim ${team.name} - MyProdigi`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827; max-width: 600px; margin: 0 auto;">
        <img src="${brandLogoUrl}" alt="MyProdigi" style="display:block; width: 180px; height: auto; margin-bottom: 16px;" />
        <h2 style="margin: 0 0 12px;">Halo ${user.name ?? "Talent"},</h2>
        <p style="margin: 0 0 12px;">Kamu diundang untuk bergabung dalam sebuah tim lomba di MyProdigi.</p>
        <div style="background:#F4F5F6; border-radius:8px; padding:16px; margin: 16px 0;">
          <p style="margin:0 0 8px;"><strong>Tim:</strong> ${team.name}</p>
          <p style="margin:0 0 8px;"><strong>Ketua:</strong> ${leaderName}</p>
          <p style="margin:0 0 8px;"><strong>Lomba:</strong> ${competitionTitle}</p>
          <p style="margin:0 0 8px;"><strong>Kategori:</strong> ${team.category}</p>
          <p style="margin:0;"><strong>Link Lomba:</strong> <a href="${team.link}">${team.link}</a></p>
        </div>
        <p style="margin: 16px 0;">
          <a href="${detailUrl}" style="display:inline-block;background:#FFC917;color:#111827;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:700;">Detail Tim</a>
        </p>
        <p style="margin: 0; font-size: 13px; color:#6B7280;">Buka tautan di atas untuk melihat detail tim dan menerima permintaan bergabung.</p>
      </div>
    `,
  });

  if (error) {
    throw new Error(error.message);
  }
}
