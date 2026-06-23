import { NextResponse } from "next/server";
import { sendTeamInviteEmail } from "@/lib/team-invite-email";

export async function POST(request: Request) {
  try {
    const payload = await request.json().catch(() => null);
    const teamId = typeof payload?.teamId === "string" ? payload.teamId : "";
    const memberId = typeof payload?.memberId === "string" ? payload.memberId : "";
    const inviteToken = typeof payload?.inviteToken === "string" ? payload.inviteToken : "";

    if (!teamId || !memberId || !inviteToken) {
      return NextResponse.json({ error: "Data undangan tidak lengkap." }, { status: 400 });
    }

    const origin = new URL(request.url).origin;
    await sendTeamInviteEmail({ teamId, memberId, inviteToken, origin });

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal mengirim undangan.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
