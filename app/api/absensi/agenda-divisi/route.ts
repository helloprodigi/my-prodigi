import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";

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
      select: { role: true },
    });

    if (dbUser?.role !== "admin" && dbUser?.role !== "asisten_lab") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { nama, deskripsi, divisi, posisi, waktuMulai, waktuSelesai } = body;

    if (!nama || !divisi || !waktuMulai || !waktuSelesai) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Find users in the specified division and posisi
    let userQuery: any = { role: "asisten_lab" };
    if (divisi && divisi !== "Semua Divisi") {
      userQuery.divisi = divisi;
    }
    if (posisi && posisi !== "") {
      // Use contains to match variants like "(Kepala Divisi)" or just the base string
      userQuery.jabatan = { contains: posisi, mode: 'insensitive' };
    }
    
    const targetUsers = await prisma.user.findMany({
      where: userQuery,
      select: { id: true, name: true, nim: true }
    });

    const combinedDivisi = posisi ? `${divisi} - ${posisi}` : divisi;

    // Deduplication check: prevent rapid duplicate submissions within 15 seconds
    const recentDuplicate = await prisma.absensiAgenda.findFirst({
      where: {
        nama,
        divisi: combinedDivisi,
        waktuMulai: new Date(waktuMulai),
        waktuSelesai: new Date(waktuSelesai),
        createdById: user.id,
        createdAt: {
          gte: new Date(Date.now() - 15000)
        }
      }
    });

    if (recentDuplicate) {
      return NextResponse.json({ success: true, agenda: recentDuplicate });
    }

    const assignedUsersData = targetUsers.map(u => ({
      userId: u.id,
      nama: u.name || "Asisten Lab",
      nim: u.nim || `NIM-${u.id.substring(0, 8)}`
    }));

    const kodeQrDatang = crypto.randomUUID();
    const kodeQrPulang = crypto.randomUUID();

    const newAgenda = await prisma.absensiAgenda.create({
      data: {
        nama,
        deskripsi,
        divisi: combinedDivisi,
        waktuMulai: new Date(waktuMulai),
        waktuSelesai: new Date(waktuSelesai),
        kodeQrDatang,
        kodeQrPulang,
        createdById: user.id,
        assignedUsers: {
          create: assignedUsersData
        }
      },
    });

    return NextResponse.json({ success: true, agenda: newAgenda });
  } catch (error) {
    console.error("Error creating absensi agenda divisi:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

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
      select: { role: true },
    });

    if (dbUser?.role !== "admin" && dbUser?.role !== "asisten_lab") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const whereClause = dbUser?.role === "admin" ? {} : { createdById: user.id };

    const agendas = await prisma.absensiAgenda.findMany({
      where: whereClause,
      orderBy: { waktuMulai: "desc" },
      include: {
        _count: {
          select: { assignedUsers: true }
        },
        records: {
          where: { status: "HADIR" }
        }
      }
    });

    const formattedAgendas = agendas.map(agenda => ({
      ...agenda,
      jumlahHadir: agenda.records.length,
      jumlahAssigned: agenda._count.assignedUsers
    }));

    return NextResponse.json(formattedAgendas);
  } catch (error) {
    console.error("Error fetching agendas:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
