import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";

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

    if (dbUser?.role !== "asisten_lab") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Auto-sync NIM if missing so assignments can be matched
    if (dbUser && !dbUser.nim && dbUser.email) {
      try {
        const fs = require('fs/promises');
        const path = require('path');
        const dataPath = path.join(process.cwd(), "data", "data_prodigi.json");
        const fileContent = await fs.readFile(dataPath, "utf-8");
        const parsedData = JSON.parse(fileContent);
        const aslabList = parsedData["CHAMP PRODIGI"] || [];
        const matchedAslab = aslabList.find((a: any) => a.Email?.toLowerCase() === dbUser.email?.toLowerCase());
        
        if (matchedAslab && matchedAslab["NIM"]) {
          const nimString = String(matchedAslab["NIM"]);
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
    
    // Set to start and end of the target day
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Find all agendas for this user on the target date
    const myAgendas = await prisma.absensiAgenda.findMany({
      where: {
        waktuMulai: {
          gte: startOfDay,
          lte: endOfDay
        },
        assignedUsers: {
          some: {
            OR: [
              { userId: user.id },
              ...(dbUser.nim ? [{ nim: dbUser.nim }] : [])
            ]
          }
        }
      },
      include: {
        assignedUsers: {
          include: {
            user: {
              select: { divisi: true, photoUrl: true }
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

    const formattedAgendas = myAgendas.map(agenda => {
      // Find current user's record
      const myRecord = agenda.records.find(r => r.userId === user.id || (dbUser.nim && r.nim === dbUser.nim));
      
      // Map all assigned users and their status
      const allAslabs = agenda.assignedUsers.map(assignment => {
        const record = agenda.records.find(r => r.userId === assignment.userId || r.nim === assignment.nim);
        
        // Auto update assignment userId if missing
        if (!assignment.userId && dbUser.nim === assignment.nim) {
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
        jenis: agenda.createdBy?.role === "admin" && !agenda.deskripsi ? "MyShift" : "Agenda",
        myStatus: myRecord ? myRecord.status : "BELUM ABSEN",
        waktuDatang: myRecord?.waktuDatang || null,
        waktuPulang: myRecord?.waktuPulang || null,
        aslabs: allAslabs,
      };
    });

    return NextResponse.json(formattedAgendas);
  } catch (error) {
    console.error("Error fetching myshift:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
