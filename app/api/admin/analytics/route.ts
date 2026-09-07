import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { prisma } from "@/lib/prisma";

const GROWTH_WINDOW_DAYS = 90;

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("User")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const adminDb = createAdminClient();

    const [
      { count: totalUsers },
      { count: totalTalent },
      { count: totalAslabOnly },
      { count: totalAdmin },
      { count: activeTeams },
      appStats,
      { data: allUserDates },
      { data: recentUsers },
      { data: recentTeams },
    ] = await Promise.all([
      adminDb.from("User").select("id", { count: "exact", head: true }),
      adminDb.from("User").select("id", { count: "exact", head: true }).eq("role", "talent"),
      adminDb.from("User").select("id", { count: "exact", head: true }).eq("role", "asisten_lab"),
      adminDb.from("User").select("id", { count: "exact", head: true }).eq("role", "admin"),
      adminDb.from("Team").select("id", { count: "exact", head: true }),
      prisma.appStats.findUnique({ where: { id: "global" } }),
      adminDb.from("User").select("createdAt").order("createdAt", { ascending: true }),
      adminDb.from("User").select("id, name, role, createdAt").order("createdAt", { ascending: false }).limit(8),
      adminDb.from("Team").select("id, name, createdAt").order("createdAt", { ascending: false }).limit(8),
    ]);

    // Real cumulative growth from actual signup timestamps — no fabricated
    // history. Users created before the window count toward the baseline.
    const now = new Date();
    const windowStart = new Date(now);
    windowStart.setUTCDate(windowStart.getUTCDate() - (GROWTH_WINDOW_DAYS - 1));
    windowStart.setUTCHours(0, 0, 0, 0);

    const dates = (allUserDates || []).map((u) => new Date(u.createdAt));
    const baseline = dates.filter((d) => d < windowStart).length;

    const countsByDay = new Map<string, number>();
    for (const d of dates) {
      if (d < windowStart) continue;
      const key = dayKey(d);
      countsByDay.set(key, (countsByDay.get(key) || 0) + 1);
    }

    const userGrowth: { date: string; total: number }[] = [];
    let running = baseline;
    for (let i = 0; i < GROWTH_WINDOW_DAYS; i++) {
      const d = new Date(windowStart);
      d.setUTCDate(d.getUTCDate() + i);
      const key = dayKey(d);
      running += countsByDay.get(key) || 0;
      userGrowth.push({ date: key, total: running });
    }

    const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const newUsersThisMonth = dates.filter((d) => d >= startOfMonth).length;

    type ActivityItem = { id: string; type: "user_joined" | "team_created"; label: string; timestamp: string };
    const activity: ActivityItem[] = [
      ...(recentUsers || []).map((u): ActivityItem => ({
        id: `user-${u.id}`,
        type: "user_joined",
        label: `${u.name || "Seseorang"} bergabung sebagai ${
          u.role === "admin" ? "Admin" : u.role === "asisten_lab" ? "Asisten Lab" : "Talent"
        }`,
        timestamp: u.createdAt,
      })),
      ...(recentTeams || []).map((t): ActivityItem => ({
        id: `team-${t.id}`,
        type: "team_created",
        label: `Tim "${t.name}" dibuat`,
        timestamp: t.createdAt,
      })),
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 8);

    // Role headcount, not raw DB role: an admin account is also a lab-team
    // member, so it counts toward Aslab in addition to its own Admin total.
    // Talent stays exclusive — asisten_lab/admin accounts don't roll back
    // down into it. totalUsers is the true distinct headcount (unaffected).
    const totalAslab = (totalAslabOnly || 0) + (totalAdmin || 0);

    return NextResponse.json({
      totalUsers: totalUsers || 0,
      totalTalent: totalTalent || 0,
      totalAslab,
      totalAdmin: totalAdmin || 0,
      activeTeams: activeTeams || 0,
      totalTeamsCreated: appStats?.totalTeamsCreated ?? 0,
      newUsersThisMonth,
      userGrowth,
      recentActivity: activity,
      lastUpdated: now.toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
