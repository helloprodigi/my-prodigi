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

    if (dbUser?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { nama, deskripsi, divisi, waktuMulai, waktuSelesai, assignedUsers } = body;

    if (!nama || !divisi || !waktuMulai || !waktuSelesai || !assignedUsers || !Array.isArray(assignedUsers)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const kodeQrDatang = crypto.randomUUID();
    const kodeQrPulang = crypto.randomUUID();

    const newAgenda = await prisma.absensiAgenda.create({
      data: {
        nama,
        deskripsi,
        divisi,
        waktuMulai: new Date(waktuMulai),
        waktuSelesai: new Date(waktuSelesai),
        kodeQrDatang,
        kodeQrPulang,
        createdById: user.id,
        assignedUsers: {
          create: assignedUsers.map((u: { nama: string; nim: string }) => ({
            nama: u.nama,
            nim: u.nim,
            // Try to link to an existing user if they have onboarded
            // For now we just store the nim and nama. Link will be made when they scan or view if possible, 
            // but prisma doesn't allow finding user inline easily without a separate query.
          }))
        }
      },
    });

    // Try to link existing users
    const nims = assignedUsers.map((u: any) => u.nim);
    const existingUsers = await prisma.user.findMany({
      where: { nim: { in: nims } }
    });
    
    if (existingUsers.length > 0) {
      for (const eu of existingUsers) {
        if (eu.nim) {
          await prisma.shiftAssignment.updateMany({
            where: { agendaId: newAgenda.id, nim: eu.nim },
            data: { userId: eu.id }
          });
        }
      }
    }

    return NextResponse.json({ success: true, agenda: newAgenda });
  } catch (error) {
    console.error("Error creating absensi agenda:", error);
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

    if (dbUser?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const agendas = await prisma.absensiAgenda.findMany({
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
