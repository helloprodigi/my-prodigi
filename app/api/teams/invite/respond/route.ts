import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { assignNextCandidate } from "@/lib/matchmaking";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Kamu harus login." }, { status: 401 });
    }

    const body = await request.json();
    const memberId = typeof body?.memberId === "string" ? body.memberId : "";
    const token = typeof body?.token === "string" ? body.token : "";
    const action = body?.action === "accept" ? "accept" : "decline";

    if (!memberId || !token) {
      return NextResponse.json({ error: "Data tidak lengkap." }, { status: 400 });
    }

    const adminDb = createAdminClient();

    const { data: member, error: memberError } = await adminDb
      .from("TeamMember")
      .select("id, teamId, userId, status, inviteToken")
      .eq("id", memberId)
      .single();

    if (memberError || !member || member.inviteToken !== token) {
      return NextResponse.json({ error: "Undangan tidak valid." }, { status: 404 });
    }

    if (member.userId !== user.id) {
      return NextResponse.json({ error: "Undangan ini bukan untuk akunmu." }, { status: 403 });
    }

    if (member.status !== "WAITING") {
      return NextResponse.json({ error: "Undangan sudah diproses." }, { status: 400 });
    }

    const { data: team } = await adminDb
      .from("Team")
      .select("id, leaderId, memberCount, requiredSkills, name, competition:Competition(title)")
      .eq("id", member.teamId)
      .single();

    if (!team) {
      return NextResponse.json({ error: "Tim tidak ditemukan." }, { status: 404 });
    }

    const { data: memberUser } = await adminDb
      .from("User")
      .select("name")
      .eq("id", user.id)
      .single();

    const memberName = memberUser?.name ?? "Anggota baru";
    const teamName = (team as any).name ?? "Tim";
    const competitionTitle = (team as any).competition?.title ?? "Lomba";

    const now = new Date().toISOString();

    if (action === "accept") {
      const { count } = await adminDb
        .from("TeamMember")
        .select("id", { count: "exact", head: true })
        .eq("teamId", team.id)
        .eq("status", "APPROVED");

      const slotNumber = (count ?? 0) + 1;

      const { error } = await adminDb
        .from("TeamMember")
        .update({ status: "APPROVED", slotNumber, updatedAt: now })
        .eq("id", memberId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Count non-leader approved after join
      const { count: approvedNonLeader } = await adminDb
        .from("TeamMember")
        .select("id", { count: "exact", head: true })
        .eq("teamId", team.id)
        .eq("status", "APPROVED")
        .neq("userId", team.leaderId);

      const currentCount = approvedNonLeader ?? 0;
      const totalCount = team.memberCount;

      // Notify leader
      await adminDb.from("Notification").insert({
        id: crypto.randomUUID(),
        userId: team.leaderId,
        type: "member_joined",
        title: `${memberName} bergabung ke tim kamu`,
        description: `${memberName} menerima undangan dan resmi bergabung sebagai anggota tim untuk kompetisi ${competitionTitle}. Jumlah anggota tim saat ini menjadi ${currentCount}/${totalCount} anggota.`,
        isRead: false,
        createdAt: now,
      });

      // Notify other approved members (not the leader, not the one who just joined)
      const { data: otherMembers } = await adminDb
        .from("TeamMember")
        .select("userId")
        .eq("teamId", team.id)
        .eq("status", "APPROVED")
        .neq("userId", team.leaderId)
        .neq("userId", user.id);

      if (otherMembers && otherMembers.length > 0) {
        await adminDb.from("Notification").insert(
          otherMembers.map((m: any) => ({
            id: crypto.randomUUID(),
            userId: m.userId,
            type: "member_joined",
            title: `${memberName} bergabung ke tim`,
            description: `${memberName} menerima undangan dan resmi bergabung sebagai anggota tim "${teamName}" untuk kompetisi ${competitionTitle}. Jumlah anggota tim saat ini menjadi ${currentCount}/${totalCount} anggota.`,
            isRead: false,
            createdAt: now,
          }))
        );
      }

      await assignNextCandidate(adminDb, {
        id: team.id,
        leaderId: team.leaderId,
        memberCount: team.memberCount,
        requiredSkills: team.requiredSkills ?? [],
      });

      return NextResponse.json({ success: true, status: "APPROVED" });
    }

    // DECLINE
    await adminDb.from("TeamMember").delete().eq("id", memberId);

    // Notify leader about decline
    await adminDb.from("Notification").insert({
      id: crypto.randomUUID(),
      userId: team.leaderId,
      type: "invite_declined",
      title: `${memberName} menolak undangan timmu`,
      description: `${memberName} menolak undangan untuk bergabung ke tim "${teamName}" pada kompetisi ${competitionTitle}. Sistem akan melanjutkan proses pencarian kandidat baru secara otomatis berdasarkan role dan skill yang dibutuhkan tim.`,
      isRead: false,
      createdAt: now,
    });

    await assignNextCandidate(adminDb, {
      id: team.id,
      leaderId: team.leaderId,
      memberCount: team.memberCount,
      requiredSkills: team.requiredSkills ?? [],
    });

    return NextResponse.json({ success: true, status: "DECLINED" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal memproses undangan.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
