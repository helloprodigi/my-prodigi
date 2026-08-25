import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000; // WIB is UTC+7

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, role: true, nim: true, name: true, email: true }
    });

    const activeRoleCookie = cookieStore.get("activeRole")?.value;
    const rawRole = (dbUser?.role || user.user_metadata?.role || "talent").toLowerCase();
    const effectiveRole = (activeRoleCookie || rawRole).toLowerCase();
    const isAslabOrAdmin = ["aslab", "asisten_lab", "admin"].includes(effectiveRole) || ["aslab", "asisten_lab", "admin"].includes(rawRole);

    if (!isAslabOrAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const isAdmin = effectiveRole === "admin" || dbUser?.role === "admin";

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

    // AUTO-GENERATE / SYNC: Check if there are recurring templates in MyShiftSchedule for this dayOfWeek
    const recurringTemplates = await prisma.myShiftSchedule.findMany({
      where: { dayOfWeek: wibDayOfWeek },
      include: {
        assignedAslabs: true
      },
      orderBy: { waktuMulai: "asc" }
    });

    if (recurringTemplates.length > 0) {
      for (const template of recurringTemplates) {
        const [startH, startM] = template.waktuMulai.split(":").map(Number);
        const [endH, endM] = template.waktuSelesai.split(":").map(Number);

        const sessionStart = new Date(Date.UTC(wibYear, wibMonth, wibDay, startH, startM, 0, 0) - WIB_OFFSET_MS);
        const sessionEnd = new Date(Date.UTC(wibYear, wibMonth, wibDay, endH, endM, 0, 0) - WIB_OFFSET_MS);

        // Check if an agenda already exists for this exact time and session name
        let existingAgenda = await prisma.absensiAgenda.findFirst({
          where: {
            waktuMulai: sessionStart,
            waktuSelesai: sessionEnd,
            nama: template.namaSesi || "Shift"
          },
          include: {
            assignedUsers: true
          }
        });

        if (!existingAgenda) {
          const kodeQrDatang = crypto.randomUUID();
          const kodeQrPulang = crypto.randomUUID();

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
        } else {
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
        records: true
      },
      orderBy: {
        waktuMulai: "asc"
      }
    });

    // If Aslab (not admin), filter only agendas where this specific aslab is assigned
    const userNim = dbUser?.nim?.trim();
    const userName = (dbUser?.name || user.user_metadata?.name || "").trim().toLowerCase();

    const myAgendas = allAgendas;

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
      const allAslabs = agenda.assignedUsers.map(assignment => {
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

        return {
          id: assignment.id,
          userId: assignment.userId,
          nama: assignment.nama,
          nim: assignment.nim,
          divisi: assignment.user?.divisi || agenda.divisi || "Asisten Lab",
          jabatan: assignment.user?.jabatan || assignment.user?.divisi || agenda.divisi || "Asisten Lab",
          photoUrl: assignment.user?.photoUrl || null,
          status: record ? record.status : "BELUM ABSEN",
          waktuDatang: record?.waktuDatang || null,
          waktuPulang: record?.waktuPulang || null,
        };
      });

      return {
        id: agenda.id,
        nama: agenda.nama,
        waktuMulai: agenda.waktuMulai,
        waktuSelesai: agenda.waktuSelesai,
        kodeQrDatang: agenda.kodeQrDatang,
        kodeQrPulang: agenda.kodeQrPulang,
        jenis: !agenda.deskripsi ? "MyShift" : "Agenda",
        myStatus: myRecord ? myRecord.status : "BELUM ABSEN",
        waktuDatang: myRecord?.waktuDatang || null,
        waktuPulang: myRecord?.waktuPulang || null,
        aslabs: allAslabs,
      };
    }));

    return NextResponse.json(formattedAgendas);
  } catch (error) {
    console.error("Error fetching myshift:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
