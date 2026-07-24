import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    const agenda = await prisma.absensiAgenda.findUnique({
      where: { id },
      include: {
        assignedUsers: true,
        records: true
      }
    });

    if (!agenda) {
      return NextResponse.json({ error: "Agenda not found" }, { status: 404 });
    }

    // Generate CSV
    const headers = ["No", "NIM", "Nama", "Departmen/Divisi", "Status", "Waktu Datang", "Waktu Pulang"];
    let csvContent = headers.join(",") + "\n";

    agenda.assignedUsers.forEach((assignedUser, index) => {
      const record = agenda.records.find(r => r.userId === assignedUser.userId || r.nim === assignedUser.nim);
      
      const no = index + 1;
      const nim = assignedUser.nim || "-";
      const nama = `"${(assignedUser.nama || "").replace(/"/g, '""')}"`;
      const divisi = `"${(agenda.divisi || "").replace(/"/g, '""')}"`;
      const status = record ? record.status : "BELUM ABSEN";
      
      const waktuDatang = record?.waktuDatang 
        ? `"${new Date(record.waktuDatang).toLocaleString('id-ID')}"` 
        : "-";
        
      const waktuPulang = record?.waktuPulang 
        ? `"${new Date(record.waktuPulang).toLocaleString('id-ID')}"` 
        : "-";

      csvContent += `${no},${nim},${nama},${divisi},${status},${waktuDatang},${waktuPulang}\n`;
    });

    const filename = `Daftar-Hadir-${agenda.nama.replace(/\s+/g, '-')}.csv`;

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error("Error downloading csv:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
