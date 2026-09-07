import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";
import * as XLSX from "xlsx";

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

    const waktuMulaiStr = new Date(agenda.waktuMulai).toLocaleDateString('id-ID', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Jakarta'
    });
    
    const waktuSelesaiStr = new Date(agenda.waktuSelesai).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Jakarta'
    });

    // Build Worksheet rows
    const dataRows: (string | number)[][] = [
      ["LAPORAN DAFTAR HADIR ASISTEN LAB"],
      ["Nama Agenda", agenda.nama],
      ["Departemen / Divisi", agenda.divisi],
      ["Waktu Pelaksanaan", `${waktuMulaiStr} - ${waktuSelesaiStr} WIB`],
      [], // Empty row for spacing
      ["No", "NIM", "Nama Lengkap", "Departemen / Divisi", "Status Kehadiran", "Waktu Datang", "Waktu Pulang"]
    ];

    let totalHadir = 0;
    let totalBelumHadir = 0;

    agenda.assignedUsers.forEach((assignedUser, index) => {
      const record = agenda.records.find(r => r.userId === assignedUser.userId || r.nim === assignedUser.nim);
      
      const no = index + 1;
      const nim = assignedUser.nim || "-";
      const nama = assignedUser.nama || "-";
      const divisi = agenda.divisi || "-";
      
      let status = "BELUM ABSEN";
      if (record) {
        if (record.waktuDatang && record.waktuPulang) {
          status = "HADIR (LENGKAP)";
          totalHadir++;
        } else if (record.waktuDatang) {
          status = "HADIR (DATANG)";
          totalHadir++;
        } else if (record.waktuPulang) {
          status = "HADIR (PULANG)";
          totalHadir++;
        } else {
          status = record.status || "HADIR";
          totalHadir++;
        }
      } else {
        totalBelumHadir++;
      }
      
      const waktuDatang = record?.waktuDatang 
        ? new Date(record.waktuDatang).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) + " WIB"
        : "-";
        
      const waktuPulang = record?.waktuPulang 
        ? new Date(record.waktuPulang).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) + " WIB"
        : "-";

      dataRows.push([no, nim, nama, divisi, status, waktuDatang, waktuPulang]);
    });

    // Summary at the bottom
    dataRows.push([]);
    dataRows.push(["Total Ditugaskan", agenda.assignedUsers.length]);
    dataRows.push(["Total Hadir", totalHadir]);
    dataRows.push(["Total Belum Hadir", totalBelumHadir]);

    // Create Worksheet & Workbook
    const worksheet = XLSX.utils.aoa_to_sheet(dataRows);

    // Set Column Widths for comfortable and readable auto-formatted table
    worksheet["!cols"] = [
      { wch: 6 },   // No
      { wch: 20 },  // NIM
      { wch: 32 },  // Nama Lengkap
      { wch: 28 },  // Departemen / Divisi
      { wch: 22 },  // Status Kehadiran
      { wch: 26 },  // Waktu Datang
      { wch: 26 },  // Waktu Pulang
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Daftar Hadir");

    // Generate Excel Buffer
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    const safeAgendaName = agenda.nama.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `Daftar-Hadir-${safeAgendaName}.xlsx`;

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error("Error generating Excel:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
