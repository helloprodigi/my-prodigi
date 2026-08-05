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
          const createdSchedule = await tx.myShiftSchedule.create({
            data: {
              hari: dayName,
              dayOfWeek: dayOfWeek,
              namaSesi: session.namaSesi || "Shift",
              waktuMulai: session.waktuMulai,
              waktuSelesai: session.waktuSelesai,
              createdById: user.id,
              assignedAslabs: {
                create: session.assignedAslabs.map((aslab: any) => ({
                  userId: aslab.userId || (aslab.id?.startsWith("static-") ? null : aslab.id) || null,
                  nama: aslab.nama,
                  nim: aslab.nim,
                  divisi: aslab.divisi || "Asisten Lab",
                  jabatan: aslab.jabatan || aslab.posisi || aslab.divisi || "Asisten Lab"
                }))
              }
            }
          });

          // Link any user IDs if missing by NIM
          const nims = session.assignedAslabs.map((a: any) => a.nim).filter(Boolean);
          if (nims.length > 0) {
            const existingUsers = await tx.user.findMany({
              where: { nim: { in: nims } },
              select: { id: true, nim: true }
            });
            for (const eu of existingUsers) {
              if (eu.nim) {
                await tx.myShiftScheduleAssignment.updateMany({
                  where: { scheduleId: createdSchedule.id, nim: eu.nim },
                  data: { userId: eu.id }
                });
              }
            }
          }
        }
      }
    });

    // 3. Immediately sync today's absensi agendas if today matches any of the schedules
    try {
      const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;
      const nowWib = new Date(Date.now() + WIB_OFFSET_MS);
      const todayWibDayOfWeek = nowWib.getUTCDay();
      const wibYear = nowWib.getUTCFullYear();
      const wibMonth = nowWib.getUTCMonth();
      const wibDay = nowWib.getUTCDate();

      const todayTemplates = await prisma.myShiftSchedule.findMany({
        where: { dayOfWeek: todayWibDayOfWeek },
        include: { assignedAslabs: true }
      });

      for (const template of todayTemplates) {
        const [startH, startM] = template.waktuMulai.split(":").map(Number);
        const [endH, endM] = template.waktuSelesai.split(":").map(Number);

        const sessionStart = new Date(Date.UTC(wibYear, wibMonth, wibDay, startH, startM, 0, 0) - WIB_OFFSET_MS);
        const sessionEnd = new Date(Date.UTC(wibYear, wibMonth, wibDay, endH, endM, 0, 0) - WIB_OFFSET_MS);

        let existingAgenda = await prisma.absensiAgenda.findFirst({
          where: {
            waktuMulai: sessionStart,
            waktuSelesai: sessionEnd,
            nama: template.namaSesi || "Shift"
          },
          include: { assignedUsers: true }
        });

        if (!existingAgenda) {
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
        }
      }
    } catch (syncErr) {
      console.error("Error syncing today's shift agenda after schedule save:", syncErr);
    }

    return NextResponse.json({ success: true, message: "Jadwal shift berhasil diperbarui!" });
  } catch (error) {
    console.error("Error saving MyShift schedule:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
