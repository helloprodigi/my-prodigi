import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { unwrapRelation } from "@/lib/supabase-relations";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get("memberId");
    const token = searchParams.get("token");

    if (!memberId || !token) {
      return NextResponse.json({ error: "Parameter tidak lengkap." }, { status: 400 });
    }

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminDb = createAdminClient();

    const { data: member, error } = await adminDb
      .from("TeamMember")
      .select(
        `
        id, status, inviteToken, userId,
        team:Team(
          id, name, category, link, memberCount,
          competition:Competition(title, organizer),
          leader:User(name)
        )
      `,
      )
      .eq("id", memberId)
      .single();

    if (error || !member || member.inviteToken !== token) {
      return NextResponse.json({ error: "Undangan tidak valid." }, { status: 404 });
    }

    if (member.userId !== user.id) {
      return NextResponse.json({ error: "Undangan ini bukan untuk akunmu." }, { status: 403 });
    }

    const team = unwrapRelation(
      member.team as
        | {
            id: string;
            name: string;
            category: string;
            link: string;
            memberCount: number;
            competition: { title: string; organizer: string } | { title: string; organizer: string }[] | null;
            leader: { name: string | null } | { name: string | null }[] | null;
          }
        | {
            id: string;
            name: string;
            category: string;
            link: string;
            memberCount: number;
            competition: { title: string; organizer: string } | { title: string; organizer: string }[] | null;
            leader: { name: string | null } | { name: string | null }[] | null;
          }[]
        | null,
    );
    const competition = unwrapRelation(team?.competition ?? null);
    const leader = unwrapRelation(team?.leader ?? null);

    return NextResponse.json({
      memberId: member.id,
      status: member.status,
      team: team
        ? {
            id: team.id,
            name: team.name,
            category: team.category,
            link: team.link,
            memberCount: team.memberCount,
            competitionTitle: competition?.title ?? "-",
            organizer: competition?.organizer ?? "-",
            leadName: leader?.name ?? "Ketua Tim",
          }
        : null,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal memuat undangan.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
