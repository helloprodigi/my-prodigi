import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000; // WIB is UTC+7

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
      select: { id: true, role: true, nim: true, name: true, email: true, divisi: true, jabatan: true }
    });

    const rawRole = (dbUser?.role || "talent").toLowerCase();
    const normalizedRole = rawRole === "aslab" ? "asisten_lab" : rawRole;
    const isAslabOrAdmin = ["asisten_lab", "admin"].includes(normalizedRole);

    if (!isAslabOrAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Auto-sync NIM if missing so assignments can be matched accurately
    if (dbUser && !dbUser.nim && (dbUser.email || dbUser.name)) {
      try {
        const fs = require('fs/promises');
        const path = require('path');
        const dataPath = path.join(process.cwd(), "data", "data_prodigi.json");
        const fileContent = await fs.readFile(dataPath, "utf-8");
        const parsedData = JSON.parse(fileContent);
        const aslabList = parsedData["CHAMP PRODIGI"] || [];
        const matchedAslab = aslabList.find((a: any) => 
          (dbUser?.email && a.Email?.toLowerCase() === dbUser.email?.toLowerCase()) ||
          (dbUser?.name && (a["Nama "] || a["Nama"])?.toLowerCase().trim() === dbUser?.name?.toLowerCase().trim())
        );
        
        if (matchedAslab && matchedAslab["NIM"]) {
          const nimString = String(matchedAslab["NIM"]).trim();
          await prisma.user.update({
            where: { id: user.id },
            data: { nim: nimString }
          });
          dbUser.nim = nimString;
        }
      } catch (e) {
        console.error("Failed to auto-sync NIM:", e);
      }
    }

    // Get date from query, default to today
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get('date');
    let targetDate = new Date();
    if (dateParam) {
      targetDate = new Date(dateParam);
    }
    
    // Calculate calendar date in WIB (UTC+7)
    const wibTargetTime = new Date(targetDate.getTime() + WIB_OFFSET_MS);
    const wibYear = wibTargetTime.getUTCFullYear();
    const wibMonth = wibTargetTime.getUTCMonth(); // 0-11
    const wibDay = wibTargetTime.getUTCDate(); // 1-31
    const wibDayOfWeek = wibTargetTime.getUTCDay(); // 0=Minggu, 1=Senin, ..., 6=Sabtu

    // Start & End of target day in UTC
    const startOfDay = new Date(Date.UTC(wibYear, wibMonth, wibDay, 0, 0, 0, 0) - WIB_OFFSET_MS);
    const endOfDay = new Date(Date.UTC(wibYear, wibMonth, wibDay, 23, 59, 59, 999) - WIB_OFFSET_MS);

    // Only materialize (auto-create) concrete agenda instances within a
    // reasonable window around today — otherwise someone repeatedly clicking
    // "next day" would silently spawn agenda + assignment rows forever into
    // the future (or past) with nobody ever attending them.
    const nowWibForBounds = new Date(Date.now() + WIB_OFFSET_MS);
    const todayStartOfDay = new Date(
      Date.UTC(nowWibForBounds.getUTCFullYear(), nowWibForBounds.getUTCMonth(), nowWibForBounds.getUTCDate(), 0, 0, 0, 0) - WIB_OFFSET_MS
    );
    const daysFromToday = Math.round((startOfDay.getTime() - todayStartOfDay.getTime()) / (24 * 60 * 60 * 1000));
    const withinAutoGenerateWindow = daysFromToday >= -180 && daysFromToday <= 60;

    // AUTO-GENERATE / SYNC: Check if there are recurring templates in MyShiftSchedule for this dayOfWeek
    const recurringTemplates = withinAutoGenerateWindow
      ? await prisma.myShiftSchedule.findMany({
          where: { dayOfWeek: wibDayOfWeek },
          include: {
            assignedAslabs: true
          },
          orderBy: { waktuMulai: "asc" }
        })
      : [];

    if (recurringTemplates.length > 0) {
      for (const template of recurringTemplates) {
        const [startH, startM] = template.waktuMulai.split(":").map(Number);
        const [endH, endM] = template.waktuSelesai.split(":").map(Number);

        const sessionStart = new Date(Date.UTC(wibYear, wibMonth, wibDay, startH, startM, 0, 0) - WIB_OFFSET_MS);
        const sessionEnd = new Date(Date.UTC(wibYear, wibMonth, wibDay, endH, endM, 0, 0) - WIB_OFFSET_MS);

        // Check if an agenda already exists for this session on this calendar
        // day — match by name + day only (not exact time), so that editing a
        // template's time later updates the existing instance in place
        // instead of leaving the old one orphaned and creating a duplicate.
        let existingAgenda = await prisma.absensiAgenda.findFirst({
          where: {
            waktuMulai: { gte: startOfDay, lte: endOfDay },
            nama: template.namaSesi || "Shift",
            deskripsi: null
          },
          include: {
            assignedUsers: true
          }
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

        let wasFreshlyCreated = false;
        if (!existingAgenda) {
          const kodeQrDatang = crypto.randomUUID();
          const kodeQrPulang = crypto.randomUUID();

          try {
            existingAgenda = await prisma.absensiAgenda.create({
              data: {
                nama: template.namaSesi || "Shift",
                deskripsi: null, // Null indicates a standard MyShift
                divisi: "Asisten Lab",
                waktuMulai: sessionStart,
                waktuSelesai: sessionEnd,
                kodeQrDatang,
                kodeQrPulang,
                createdById: template.createdById || user.id,
                assignedUsers: {
                  create: template.assignedAslabs.map(aslab => ({
                    nama: aslab.nama,
                    nim: aslab.nim,
                    userId: aslab.userId
                  }))
                }
              },
              include: {
                assignedUsers: true
              }
            });
            wasFreshlyCreated = true;
          } catch (createErr: any) {
            // P2002 = unique constraint violation: a concurrent request
            // (findFirst-then-create race) already created this exact
            // session's agenda for today. Fall back to it instead of 500ing.
            if (createErr?.code === "P2002") {
              existingAgenda = await prisma.absensiAgenda.findFirst({
                where: {
                  waktuMulai: { gte: startOfDay, lte: endOfDay },
                  nama: template.namaSesi || "Shift",
                  deskripsi: null
                },
                include: { assignedUsers: true }
              });
            } else {
              throw createErr;
            }
          }
        }

        if (existingAgenda && !wasFreshlyCreated) {
          // Ensure QR codes exist
          if (!existingAgenda.kodeQrDatang || !existingAgenda.kodeQrPulang) {
            const newDatang = existingAgenda.kodeQrDatang || crypto.randomUUID();
            const newPulang = existingAgenda.kodeQrPulang || crypto.randomUUID();
            await prisma.absensiAgenda.update({
              where: { id: existingAgenda.id },
              data: { kodeQrDatang: newDatang, kodeQrPulang: newPulang }
            });
            existingAgenda.kodeQrDatang = newDatang;
            existingAgenda.kodeQrPulang = newPulang;
          }

          // Sync assigned users from template
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

          // Remove assignments for aslabs that were unassigned from the
          // template (e.g. admin removed them after the agenda was already
          // generated) — otherwise they'd stay able to check in indefinitely.
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
    }

    // Find all MyShift agendas for target date (exclude division agendas / non-admin events)
    const allAgendas = await prisma.absensiAgenda.findMany({
      where: {
        waktuMulai: {
          gte: startOfDay,
          lte: endOfDay
        },
        deskripsi: null
      },
      include: {
        assignedUsers: {
          include: {
            user: {
              select: { divisi: true, jabatan: true, photoUrl: true, name: true, nim: true }
            }
          }
        },
        createdBy: {
          select: { role: true }
        },
        records: {
          include: {
            user: {
              select: { divisi: true, jabatan: true, photoUrl: true }
            }
          }
        }
      },
      orderBy: {
        waktuMulai: "asc"
      }
    });

    // If Aslab (not admin), filter only agendas where this specific aslab is assigned
    const userNim = dbUser?.nim?.trim();
    const userName = (dbUser?.name || user.user_metadata?.name || "").trim().toLowerCase();

    const myAgendas = allAgendas;

    // --- Lazy Auto-Close ---
    const openRecords = await prisma.absensiRecord.findMany({
      where: { shiftStatus: "ON" }
    });
    const nowTimestamp = Date.now();
    for (const rec of openRecords) {
      if (!rec.waktuDatang) continue;
      const diffHours = (nowTimestamp - rec.waktuDatang.getTime()) / (1000 * 60 * 60);
      if (diffHours > 8) {
        await prisma.absensiRecord.update({
          where: { id: rec.id },
          data: {
            shiftStatus: "OFF",
            waktuPulang: new Date(rec.waktuDatang.getTime() + 8 * 60 * 60 * 1000),
            status: "HADIR",
            actualDuration: 480,
            creditedDuration: 240, // max 4 hours for forgot checkout
            closeReason: "AUTO_CLOSE"
          }
        }).catch(() => {});
      }
    }

    // --- Cumulative Weekly Duration (Senin-Minggu) ---
    const dayOfWeek = wibDayOfWeek === 0 ? 7 : wibDayOfWeek;
    const startOfWeek = new Date(startOfDay.getTime() - (dayOfWeek - 1) * 24 * 60 * 60 * 1000);
    const endOfWeek = new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);

    const weeklyRecords = await prisma.absensiRecord.findMany({
      where: {
        createdAt: { gte: startOfWeek, lte: endOfWeek },
        agenda: { deskripsi: null } // Only MyShift
      }
    });
    
    // Sum all credited durations inside this week per user
    const weeklyDurationMap = new Map<string, number>();
    for (const rec of weeklyRecords) {
      const duration = rec.creditedDuration || 0;
      if (rec.userId) {
        weeklyDurationMap.set(`user:${rec.userId}`, (weeklyDurationMap.get(`user:${rec.userId}`) || 0) + duration);
      }
      if (rec.nim) {
        weeklyDurationMap.set(`nim:${rec.nim.trim().toLowerCase()}`, (weeklyDurationMap.get(`nim:${rec.nim.trim().toLowerCase()}`) || 0) + duration);
      }
      if (rec.nama) {
        weeklyDurationMap.set(`nama:${rec.nama.trim().toLowerCase()}`, (weeklyDurationMap.get(`nama:${rec.nama.trim().toLowerCase()}`) || 0) + duration);
      }
    }

    const getWeeklyDuration = (uId: string | null | undefined, uNim: string | null | undefined, uNama: string | null | undefined) => {
      if (uId && weeklyDurationMap.has(`user:${uId}`)) return weeklyDurationMap.get(`user:${uId}`) || 0;
      if (uNim && weeklyDurationMap.has(`nim:${uNim.trim().toLowerCase()}`)) return weeklyDurationMap.get(`nim:${uNim.trim().toLowerCase()}`) || 0;
      if (uNama && weeklyDurationMap.has(`nama:${uNama.trim().toLowerCase()}`)) return weeklyDurationMap.get(`nama:${uNama.trim().toLowerCase()}`) || 0;
      return 0;
    };

    const cumulativeWeeklyDuration = getWeeklyDuration(user.id, userNim, userName);


    const formattedAgendas = await Promise.all(myAgendas.map(async (agenda) => {
      // Ensure QR tokens are always present
      if (!agenda.kodeQrDatang || !agenda.kodeQrPulang) {
        const kodeQrDatang = agenda.kodeQrDatang || crypto.randomUUID();
        const kodeQrPulang = agenda.kodeQrPulang || crypto.randomUUID();
        await prisma.absensiAgenda.update({
          where: { id: agenda.id },
          data: { kodeQrDatang, kodeQrPulang }
        }).catch(() => {});
        agenda.kodeQrDatang = kodeQrDatang;
        agenda.kodeQrPulang = kodeQrPulang;
      }

      // Find current user's record
      const myRecord = agenda.records.find(r => 
        (r.userId && r.userId === user.id) || 
        (userNim && r.nim && r.nim.trim() === userNim) ||
        (userName && r.nama && r.nama.toLowerCase().trim() === userName)
      );
      
      // Map all assigned users and their status
      const allAslabsMap = new Map<string, any>();

      // 1. Add all assigned users first
      for (const assignment of agenda.assignedUsers) {
        const record = agenda.records.find(r => 
          (assignment.userId && r.userId === assignment.userId) || 
          (assignment.nim && r.nim && r.nim.trim() === assignment.nim.trim()) ||
          (assignment.nama && r.nama && r.nama.toLowerCase().trim() === assignment.nama.toLowerCase().trim())
        );
        
        // Auto update assignment userId if missing and matches current user
        if (!assignment.userId && (
          (userNim && userNim === assignment.nim) || 
          (userName && userName === assignment.nama.toLowerCase().trim()) || 
          (dbUser?.id === user.id && dbUser?.name === assignment.nama)
        )) {
           prisma.shiftAssignment.update({
             where: { id: assignment.id },
             data: { userId: user.id }
           }).catch(console.error);
        }

        const weeklyDuration = getWeeklyDuration(assignment.userId, assignment.nim, assignment.nama);

        const key = assignment.userId || assignment.nim || assignment.nama;
        allAslabsMap.set(key, {
          id: assignment.id, // assignment ID
          userId: assignment.userId,
          nama: assignment.nama,
          nim: assignment.nim,
          divisi: assignment.user?.divisi || agenda.divisi || "Asisten Lab",
          jabatan: assignment.user?.jabatan || assignment.user?.divisi || agenda.divisi || "Asisten Lab",
          photoUrl: assignment.user?.photoUrl || null,
          status: record ? record.status : "BELUM ABSEN",
          shiftStatus: record?.shiftStatus || "OFF",
          closeReason: record?.closeReason || null,
          waktuDatang: record?.waktuDatang || null,
          waktuPulang: record?.waktuPulang || null,
          actualDuration: record?.actualDuration || 0,
          creditedDuration: record?.creditedDuration || 0,
          shiftHistory: record?.shiftHistory || [],
          weeklyDuration,
        });
      }

      // 2. Add unassigned users who have an AbsensiRecord for this agenda (numpang absen)
      for (const record of agenda.records) {
        // Check if this record already matches an assignment
        const isAssigned = agenda.assignedUsers.some(a => 
          (a.userId && a.userId === record.userId) || 
          (a.nim && record.nim && a.nim.trim() === record.nim.trim()) ||
          (a.nama && record.nama && a.nama.toLowerCase().trim() === record.nama.toLowerCase().trim())
        );

        if (!isAssigned) {
          const weeklyDuration = getWeeklyDuration(record.userId, record.nim, record.nama);
          const key = record.userId || record.nim || record.nama || record.id;
          allAslabsMap.set(key, {
            id: record.id, // use record ID since there is no assignment ID
            userId: record.userId,
            nama: record.nama || "Unknown",
            nim: record.nim,
            divisi: record.user?.divisi || "Asisten Lab (Tambahan)",
            jabatan: record.user?.jabatan || "Asisten Lab",
            photoUrl: record.user?.photoUrl || null,
            status: record.status,
            shiftStatus: record.shiftStatus,
            closeReason: record.closeReason,
            waktuDatang: record.waktuDatang,
            waktuPulang: record.waktuPulang,
            actualDuration: record.actualDuration || 0,
            creditedDuration: record.creditedDuration || 0,
            shiftHistory: record.shiftHistory || [],
            weeklyDuration,
          });
        }
      }

      const allAslabs = Array.from(allAslabsMap.values());


      return {
        id: agenda.id,
        nama: agenda.nama,
        waktuMulai: agenda.waktuMulai,
        waktuSelesai: agenda.waktuSelesai,
        kodeQrDatang: agenda.kodeQrDatang,
        kodeQrPulang: agenda.kodeQrPulang,
        jenis: !agenda.deskripsi ? "MyShift" : "Agenda",
        myStatus: myRecord ? myRecord.status : "BELUM ABSEN",
        myShiftStatus: myRecord?.shiftStatus || "OFF",
        waktuDatang: myRecord?.waktuDatang || null,
        waktuPulang: myRecord?.waktuPulang || null,
        aslabs: allAslabs,
      };
    }));

    return NextResponse.json({
      agendas: formattedAgendas,
      cumulativeWeeklyDuration
    });
  } catch (error) {
    console.error("Error fetching myshift:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
