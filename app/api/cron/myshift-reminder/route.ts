import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }

  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const nowWib = new Date(Date.now() + WIB_OFFSET_MS);
  const todayWibDayOfWeek = nowWib.getUTCDay();
  const startOfTodayWibUtc = new Date(
    Date.UTC(nowWib.getUTCFullYear(), nowWib.getUTCMonth(), nowWib.getUTCDate(), 0, 0, 0, 0) -
      WIB_OFFSET_MS
  );

  const todaySchedules = await prisma.myShiftSchedule.findMany({
    where: { dayOfWeek: todayWibDayOfWeek },
    include: { assignedAslabs: true },
  });

  const sessionsByUser = new Map<string, { namaSesi: string; waktuMulai: string; waktuSelesai: string }[]>();
  for (const schedule of todaySchedules) {
    for (const aslab of schedule.assignedAslabs) {
      if (!aslab.userId) continue;
      const sessions = sessionsByUser.get(aslab.userId) ?? [];
      sessions.push({
        namaSesi: schedule.namaSesi || "Shift",
        waktuMulai: schedule.waktuMulai,
        waktuSelesai: schedule.waktuSelesai,
      });
      sessionsByUser.set(aslab.userId, sessions);
    }
  }

  if (sessionsByUser.size === 0) {
    return NextResponse.json({ success: true, notified: 0 });
  }

  const candidateIds = Array.from(sessionsByUser.keys());
  const alreadyNotified = await prisma.notification.findMany({
    where: {
      userId: { in: candidateIds },
      type: "myshift_reminder",
      createdAt: { gte: startOfTodayWibUtc },
    },
    select: { userId: true },
  });
  const alreadyNotifiedIds = new Set(alreadyNotified.map((n) => n.userId));

  const toNotify = candidateIds.filter((id) => !alreadyNotifiedIds.has(id));

  const results = await Promise.allSettled(
    toNotify.map((userId) => {
      const sessions = sessionsByUser.get(userId)!;
      const sessionList = sessions
        .map((s) => `${s.namaSesi} (${s.waktuMulai}-${s.waktuSelesai})`)
        .join(", ");

      return createNotification(
        userId,
        {
          type: "myshift_reminder",
          title: "Jadwal MyShift Hari Ini",
          description: `Kamu memiliki jadwal MyShift hari ini: ${sessionList}.`,
        },
        {
          title: "Jadwal MyShift Hari Ini",
          body: `Kamu memiliki jadwal: ${sessionList}.`,
          url: "/myshift",
        }
      );
    })
  );

  const notified = results.filter((r) => r.status === "fulfilled").length;

  return NextResponse.json({ success: true, notified });
}
