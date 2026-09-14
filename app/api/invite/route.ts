import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { sendTeamInviteEmail } from "@/lib/team-invite-email";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Kamu harus login." }, { status: 401 });
    }

    const payload = await request.json().catch(() => null);
    const teamId = typeof payload?.teamId === "string" ? payload.teamId : "";
    const memberId = typeof payload?.memberId === "string" ? payload.memberId : "";
    const inviteToken = typeof payload?.inviteToken === "string" ? payload.inviteToken : "";

    if (!teamId || !memberId || !inviteToken) {
      return NextResponse.json({ error: "Data undangan tidak lengkap." }, { status: 400 });
    }

    const adminDb = createAdminClient();
    const { data: team } = await adminDb
      .from("Team")
      .select("leaderId")
      .eq("id", teamId)
      .single();
    if (!team || team.leaderId !== user.id) {
      return NextResponse.json({ error: "Hanya ketua tim yang dapat mengirim ulang undangan." }, { status: 403 });
    }

    const origin = new URL(request.url).origin;
    await sendTeamInviteEmail({ teamId, memberId, inviteToken, origin });

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal mengirim undangan.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
