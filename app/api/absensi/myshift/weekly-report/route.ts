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
      select: { role: true, divisi: true, jabatan: true }
    });

    const rawRole = (dbUser?.role || "talent").toLowerCase();
    const normalizedRole = rawRole === "aslab" ? "asisten_lab" : rawRole;
    const isAdmin = ["admin"].includes(normalizedRole);
    const isHC = dbUser?.divisi === "Human Capital" || (dbUser?.jabatan && dbUser.jabatan.includes("Human Capital"));

    if (!isAdmin && !isHC) {
      return NextResponse.json({ error: "Forbidden. Only Admin/HC can download report." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get('endDate');
    if (!dateParam) {
      return NextResponse.json({ error: "Missing endDate parameter" }, { status: 400 });
    }

    const targetDate = new Date(dateParam); // This should be a Sunday
    const wibTargetTime = new Date(targetDate.getTime() + WIB_OFFSET_MS);

    // End of the target day in UTC
    const endOfDay = new Date(Date.UTC(wibTargetTime.getUTCFullYear(), wibTargetTime.getUTCMonth(), wibTargetTime.getUTCDate(), 23, 59, 59, 999) - WIB_OFFSET_MS);
    
    // Start of the week (6 days before the target date)
    const startOfWeekWib = new Date(wibTargetTime.getTime() - 6 * 24 * 60 * 60 * 1000);
    const startOfDay = new Date(Date.UTC(startOfWeekWib.getUTCFullYear(), startOfWeekWib.getUTCMonth(), startOfWeekWib.getUTCDate(), 0, 0, 0, 0) - WIB_OFFSET_MS);

    const agendas = await prisma.absensiAgenda.findMany({
      where: {
        waktuMulai: { gte: startOfDay, lte: endOfDay },
        deskripsi: null
      },
      include: {
        records: {
          include: {
            user: true
          }
        }
      },
      orderBy: {
        waktuMulai: 'asc'
      }
    });

    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    
    const formattedData: any[] = [];

    agendas.forEach(agenda => {
      // Get the local day and date of the agenda
      const agendaWib = new Date(agenda.waktuMulai.getTime() + WIB_OFFSET_MS);
      const hari = days[agendaWib.getUTCDay()];
      const tanggal = agendaWib.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });

      agenda.records.forEach(record => {
        if (!record.waktuDatang) return; // Only include those who actually attended

        const aslabUser = record.user;
        const aslabName = aslabUser?.name || record.nama || "Unknown";
        const aslabNim = aslabUser?.nim || record.nim || "-";
        const divisiJabatan = aslabUser?.jabatan || aslabUser?.divisi || "Asisten Lab";

        let historyStr = "";
        let isOngoing = false;
        
        if (record.shiftHistory && Array.isArray(record.shiftHistory) && record.shiftHistory.length > 0) {
          historyStr = record.shiftHistory.map((h: any) => 
            `${new Date(h.datang).toLocaleTimeString("id-ID", {hour: '2-digit', minute:'2-digit'})} - ${new Date(h.pulang).toLocaleTimeString("id-ID", {hour: '2-digit', minute:'2-digit'})}`
          ).join(", ");
          
          if (record.shiftStatus === "ON" && record.waktuDatang) {
            historyStr += `, ${new Date(record.waktuDatang).toLocaleTimeString("id-ID", {hour: '2-digit', minute:'2-digit'})} - Sedang Berjalan`;
            isOngoing = true;
          }
        } else if (record.waktuDatang) {
          const datangStr = new Date(record.waktuDatang).toLocaleTimeString("id-ID", {hour: '2-digit', minute:'2-digit'});
          const pulangStr = record.waktuPulang ? new Date(record.waktuPulang).toLocaleTimeString("id-ID", {hour: '2-digit', minute:'2-digit'}) : "Sedang Berjalan";
          historyStr = `${datangStr} - ${pulangStr}`;
          if (record.shiftStatus === "ON") isOngoing = true;
        } else {
          historyStr = "-";
        }

        let durasiSelesai = record.creditedDuration || 0;
        let durasiBerjalan = 0;
        if (isOngoing && record.waktuDatang) {
          durasiBerjalan = Math.floor((Date.now() - new Date(record.waktuDatang).getTime()) / 60000);
        }

        formattedData.push({
          Hari: hari,
          Tanggal: tanggal,
          Nama: aslabName,
          NIM: aslabNim,
          "Divisi/Jabatan": divisiJabatan,
          "Status": isOngoing ? "Hadir (Sedang Berjalan)" : (record.status === "HADIR" ? "Hadir" : "Alpa"),
          "Riwayat Datang & Pulang": historyStr,
          "Durasi Harian (Menit)": durasiSelesai + durasiBerjalan,
          // Used for sorting later
          _timestamp: agenda.waktuMulai.getTime(),
          _nama: aslabName
        });
      });
    });

    // Sort by timestamp (chronological) then by name
    formattedData.sort((a, b) => {
      if (a._timestamp === b._timestamp) {
        return a._nama.localeCompare(b._nama);
      }
      return a._timestamp - b._timestamp;
    });

    // Remove internal fields and insert index
    const finalData = formattedData.map((item, index) => {
      const { _timestamp, _nama, Hari, Tanggal, ...rest } = item;
      return {
        "No": index + 1,
        Hari,
        Tanggal,
        ...rest
      };
    });

    return NextResponse.json({ success: true, data: finalData });

  } catch (error: any) {
    console.error("Error in weekly-report API:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
