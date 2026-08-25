import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";

export const DAYS_MAPPING: { [key: string]: number } = {
  "Senin": 1,
  "Selasa": 2,
  "Rabu": 3,
  "Kamis": 4,
  "Jumat": 5,
  "Sabtu": 6,
  "Minggu": 0
};

export const DAYS_LIST = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true }
    });

    if (dbUser?.role !== "admin" && dbUser?.role !== "asisten_lab") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const schedules = await prisma.myShiftSchedule.findMany({
      orderBy: [
        { dayOfWeek: "asc" },
        { waktuMulai: "asc" }
      ],
      include: {
        assignedAslabs: {
          include: {
            user: {
              select: { photoUrl: true, divisi: true, jabatan: true }
            }
          }
        }
      }
    });

    // Group schedules by day
    const dayMap = new Map<string, any[]>();
    for (const day of DAYS_LIST) {
      dayMap.set(day, []);
    }

    for (const s of schedules) {
      const dayName = s.hari || DAYS_LIST.find(d => DAYS_MAPPING[d] === s.dayOfWeek) || "Senin";
      const existing = dayMap.get(dayName) || [];
      existing.push({
        id: s.id,
        namaSesi: s.namaSesi || "Shift",
        waktuMulai: s.waktuMulai,
        waktuSelesai: s.waktuSelesai,
        assignedAslabs: s.assignedAslabs.map(a => ({
          id: a.id,
          userId: a.userId,
          nama: a.nama,
          nim: a.nim,
          divisi: a.divisi || a.user?.divisi || "Asisten Lab",
          jabatan: a.jabatan || a.user?.jabatan || a.divisi || "Asisten Lab",
          photoUrl: a.user?.photoUrl || null
        }))
      });
      dayMap.set(dayName, existing);
    }

    const formatted = DAYS_LIST.map(day => ({
      hari: day,
      dayOfWeek: DAYS_MAPPING[day],
      sessions: dayMap.get(day) || []
    })).filter(d => d.sessions.length > 0);

    return NextResponse.json({ days: formatted, rawSchedules: schedules });
  } catch (error) {
    console.error("Error fetching MyShift schedule:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true }
    });

    if (dbUser?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden. Hanya admin yang dapat mengatur jadwal shift." }, { status: 403 });
    }

    const body = await req.json();
    const { days } = body; // Array of { hari, dayOfWeek, sessions: [{ namaSesi, waktuMulai, waktuSelesai, assignedAslabs }] }

    if (!Array.isArray(days)) {
      return NextResponse.json({ error: "Format data tidak valid. Expected 'days' array." }, { status: 400 });
    }

    // Validate inputs
    for (const day of days) {
      if (!day.hari) {
        return NextResponse.json({ error: "Nama hari wajib diisi." }, { status: 400 });
      }
      if (!Array.isArray(day.sessions)) continue;

      for (const session of day.sessions) {
        if (!session.waktuMulai || !session.waktuSelesai) {
          return NextResponse.json({ error: `Waktu mulai dan selesai wajib diisi pada hari ${day.hari}.` }, { status: 400 });
        }
        if (session.waktuSelesai <= session.waktuMulai) {
          return NextResponse.json({ error: `Waktu selesai (${session.waktuSelesai}) harus setelah waktu mulai (${session.waktuMulai}) pada hari ${day.hari}.` }, { status: 400 });
        }
        if (!Array.isArray(session.assignedAslabs) || session.assignedAslabs.length === 0) {
          return NextResponse.json({ error: `Minimal pilih 1 Asisten Lab untuk setiap sesi pada hari ${day.hari}.` }, { status: 400 });
        }
      }

      // Check overlapping sessions within the same day
      for (let i = 0; i < day.sessions.length; i++) {
        const s1 = day.sessions[i];
        const [s1H, s1M] = s1.waktuMulai.split(":").map(Number);
        const [e1H, e1M] = s1.waktuSelesai.split(":").map(Number);
        const start1 = s1H * 60 + s1M;
        const end1 = e1H * 60 + e1M;

        for (let j = i + 1; j < day.sessions.length; j++) {
          const s2 = day.sessions[j];
          const [s2H, s2M] = s2.waktuMulai.split(":").map(Number);
          const [e2H, e2M] = s2.waktuSelesai.split(":").map(Number);
          const start2 = s2H * 60 + s2M;
          const end2 = e2H * 60 + e2M;

          if (Math.max(start1, start2) < Math.min(end1, end2)) {
            return NextResponse.json({
              error: `Waktu shift bertabrakan pada hari ${day.hari}: "${s1.namaSesi || 'Sesi ' + (i + 1)}" (${s1.waktuMulai}–${s1.waktuSelesai}) dan "${s2.namaSesi || 'Sesi ' + (j + 1)}" (${s2.waktuMulai}–${s2.waktuSelesai}). Jadwal tidak boleh tumpang tindih.`
            }, { status: 400 });
          }
        }
      }
    }

    // Resolve userId-by-NIM for every assigned aslab up front, in a single
    // query, instead of one findMany + updateMany per session inside the
    // transaction below. That N+1 pattern was slow enough over the network
    // (each session round-tripping separately) that it could blow past
    // Prisma's default 5s interactive-transaction timeout in production
    // (higher latency to the DB than local dev), aborting the whole save
    // with a generic 500 even though nothing was actually wrong with the data.
    const allNims = Array.from(
      new Set(
        days.flatMap((day: any) =>
          Array.isArray(day.sessions)
            ? day.sessions.flatMap((session: any) =>
                (session.assignedAslabs ?? []).map((a: any) => a.nim).filter(Boolean)
              )
            : []
        )
      )
    ) as string[];

    const usersByNim = new Map<string, string>();
    if (allNims.length > 0) {
      const existingUsers = await prisma.user.findMany({
        where: { nim: { in: allNims } },
        select: { id: true, nim: true }
      });
      for (const eu of existingUsers) {
        if (eu.nim) usersByNim.set(eu.nim, eu.id);
      }
    }

    // Perform atomic update inside transaction
    await prisma.$transaction(async (tx) => {
      // 1. Clear existing template schedules
      await tx.myShiftScheduleAssignment.deleteMany({});
      await tx.myShiftSchedule.deleteMany({});

      // 2. Insert new schedule templates
      for (const day of days) {
        const dayName = day.hari;
        const dayOfWeek = DAYS_MAPPING[dayName] !== undefined ? DAYS_MAPPING[dayName] : (day.dayOfWeek ?? 1);

        if (!Array.isArray(day.sessions)) continue;

        for (const session of day.sessions) {
          await tx.myShiftSchedule.create({
            data: {
              hari: dayName,
              dayOfWeek: dayOfWeek,
              namaSesi: session.namaSesi || "Shift",
              waktuMulai: session.waktuMulai,
              waktuSelesai: session.waktuSelesai,
              createdById: user.id,
              assignedAslabs: {
                create: session.assignedAslabs.map((aslab: any) => ({
                  userId:
                    (aslab.nim && usersByNim.get(aslab.nim)) ||
                    aslab.userId ||
                    (aslab.id?.startsWith("static-") ? null : aslab.id) ||
                    null,
                  nama: aslab.nama,
                  nim: aslab.nim,
                  divisi: aslab.divisi || "Asisten Lab",
                  jabatan: aslab.jabatan || aslab.posisi || aslab.divisi || "Asisten Lab"
                }))
              }
            }
          });
        }
      }
    }, { timeout: 20000 });

    // 3. Immediately sync today's absensi agendas if today matches any of the schedules
    try {
      const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;
      const nowWib = new Date(Date.now() + WIB_OFFSET_MS);
      const todayWibDayOfWeek = nowWib.getUTCDay();
      const wibYear = nowWib.getUTCFullYear();
      const wibMonth = nowWib.getUTCMonth();
      const wibDay = nowWib.getUTCDate();
      const startOfDay = new Date(Date.UTC(wibYear, wibMonth, wibDay, 0, 0, 0, 0) - WIB_OFFSET_MS);
      const endOfDay = new Date(Date.UTC(wibYear, wibMonth, wibDay, 23, 59, 59, 999) - WIB_OFFSET_MS);

      const todayTemplates = await prisma.myShiftSchedule.findMany({
        where: { dayOfWeek: todayWibDayOfWeek },
        include: { assignedAslabs: true }
      });

      for (const template of todayTemplates) {
        const [startH, startM] = template.waktuMulai.split(":").map(Number);
        const [endH, endM] = template.waktuSelesai.split(":").map(Number);

        const sessionStart = new Date(Date.UTC(wibYear, wibMonth, wibDay, startH, startM, 0, 0) - WIB_OFFSET_MS);
        const sessionEnd = new Date(Date.UTC(wibYear, wibMonth, wibDay, endH, endM, 0, 0) - WIB_OFFSET_MS);

        // Match by name + calendar day (not exact time) so editing a
        // template's time updates today's already-generated instance in
        // place instead of orphaning it and creating a duplicate.
        let existingAgenda = await prisma.absensiAgenda.findFirst({
          where: {
            waktuMulai: { gte: startOfDay, lte: endOfDay },
            nama: template.namaSesi || "Shift",
            deskripsi: null
          },
          include: { assignedUsers: true }
        });

        if (existingAgenda && (
          existingAgenda.waktuMulai.getTime() !== sessionStart.getTime() ||
          existingAgenda.waktuSelesai.getTime() !== sessionEnd.getTime()
        )) {
          existingAgenda = await prisma.absensiAgenda.update({
            where: { id: existingAgenda.id },
            data: { waktuMulai: sessionStart, waktuSelesai: sessionEnd },
            include: { assignedUsers: true }
          });
        }

        if (!existingAgenda) {
          try {
            await prisma.absensiAgenda.create({
              data: {
                nama: template.namaSesi || "Shift",
                deskripsi: null,
                divisi: "Asisten Lab",
                waktuMulai: sessionStart,
                waktuSelesai: sessionEnd,
                kodeQrDatang: crypto.randomUUID(),
                kodeQrPulang: crypto.randomUUID(),
                createdById: user.id,
                assignedUsers: {
                  create: template.assignedAslabs.map(aslab => ({
                    nama: aslab.nama,
                    nim: aslab.nim,
                    userId: aslab.userId
                  }))
                }
              }
            });
          } catch (createErr: any) {
            // P2002 = another request already created this agenda concurrently.
            // Nothing more to do here — it already has the current template's data.
            if (createErr?.code !== "P2002") throw createErr;
          }
        } else {
          if (!existingAgenda.kodeQrDatang || !existingAgenda.kodeQrPulang) {
            await prisma.absensiAgenda.update({
              where: { id: existingAgenda.id },
              data: {
                kodeQrDatang: existingAgenda.kodeQrDatang || crypto.randomUUID(),
                kodeQrPulang: existingAgenda.kodeQrPulang || crypto.randomUUID()
              }
            });
          }
          for (const aslab of template.assignedAslabs) {
            const alreadyAssigned = existingAgenda.assignedUsers.some(
              au => (au.nim && aslab.nim && au.nim.trim() === aslab.nim.trim()) ||
                    (au.userId && aslab.userId && au.userId === aslab.userId)
            );
            if (!alreadyAssigned) {
              await prisma.shiftAssignment.create({
                data: {
                  agendaId: existingAgenda.id,
                  nama: aslab.nama,
                  nim: aslab.nim,
                  userId: aslab.userId
                }
              }).catch(() => {});
            }
          }

          // Remove assignments no longer present in the (just-saved) template
          const templateNims = new Set(
            template.assignedAslabs.map(a => a.nim?.trim().toLowerCase()).filter(Boolean)
          );
          const templateUserIds = new Set(
            template.assignedAslabs.map(a => a.userId).filter(Boolean)
          );
          const toUnassign = existingAgenda.assignedUsers.filter(au => {
            const matchesNim = au.nim && templateNims.has(au.nim.trim().toLowerCase());
            const matchesUserId = au.userId && templateUserIds.has(au.userId);
            return !matchesNim && !matchesUserId;
          });
          if (toUnassign.length > 0) {
            await prisma.shiftAssignment.deleteMany({
              where: { id: { in: toUnassign.map(a => a.id) } }
            }).catch(() => {});
          }
        }
      }
    } catch (syncErr) {
      console.error("Error syncing today's shift agenda after schedule save:", syncErr);
    }

    return NextResponse.json({ success: true, message: "Jadwal shift berhasil diperbarui!" });
  } catch (error) {
    console.error("Error saving MyShift schedule:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
