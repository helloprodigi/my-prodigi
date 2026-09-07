import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";

// Coordinates for TULT (Telkom University Landmark Tower)
const TULT_LAT = -6.969260270985497;
const TULT_LNG = 107.62816532337784;
const MAX_RADIUS_METERS = 50;

function getDistanceFromLatLonInM(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c * 1000; // Distance in meters
  return d;
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
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
      select: { role: true, nim: true, name: true }
    });

    if (dbUser?.role !== "asisten_lab") {
      return NextResponse.json({ error: "Forbidden. Only Asisten Lab can perform attendance." }, { status: 403 });
    }

    const body = await req.json();
    const { token, lat, lng, type } = body; // type is 'datang' or 'pulang'

    if (!token || !type) {
      return NextResponse.json({ error: "Missing required fields: token and type are required" }, { status: 400 });
    }

    // Find Agenda by token first
    const isDatang = type === "datang";
    const agenda = await prisma.absensiAgenda.findFirst({
      where: isDatang ? { kodeQrDatang: token } : { kodeQrPulang: token },
      include: {
        createdBy: {
          select: { role: true }
        }
      }
    });

    if (!agenda) {
      return NextResponse.json({ error: "Invalid or expired QR token" }, { status: 404 });
    }

    // Determine if this is an Agenda (kegiatan divisi / event) or a standard MyShift
    // Agenda: bisa absen dimana saja (tidak perlu berada di LAB DTC)
    // MyShift: wajib berada di area LAB DTC (radius <= 50m)
    const isAgenda = Boolean(agenda.deskripsi);

    if (!isAgenda) {
      // MyShift requires location check in LAB DTC area
      if (typeof lat !== "number" || typeof lng !== "number") {
        return NextResponse.json({
          error: "Location required",
          message: "Absensi MyShift mewajibkan akses lokasi di area LAB DTC. Harap aktifkan izin lokasi pada browser/perangkat Anda."
        }, { status: 400 });
      }

      const distance = getDistanceFromLatLonInM(lat, lng, TULT_LAT, TULT_LNG);
      if (distance > MAX_RADIUS_METERS) {
        return NextResponse.json({
          error: "Location out of bounds",
          message: `Anda sedang tidak berada di area LAB DTC (${Math.round(distance)}m > ${MAX_RADIUS_METERS}m). Absensi MyShift hanya dapat dilakukan di area LAB DTC.`
        }, { status: 400 });
      }
    }

    // Check if user is assigned to this agenda
    const assignment = await prisma.shiftAssignment.findFirst({
      where: {
        agendaId: agenda.id,
        OR: [
          { userId: user.id },
          ...(dbUser.nim ? [{ nim: dbUser.nim }] : [])
        ]
      }
    });

    if (!assignment) {
      return NextResponse.json({ error: "You are not assigned to this shift" }, { status: 403 });
    }

    // Find or create record
    let record = await prisma.absensiRecord.findUnique({
      where: {
        agendaId_userId: {
          agendaId: agenda.id,
          userId: user.id
        }
      }
    });

    if (!record) {
      record = await prisma.absensiRecord.create({
        data: {
          agendaId: agenda.id,
          userId: user.id,
          nama: dbUser.name,
          nim: dbUser.nim,
          status: "ALPA" // Default, changed to HADIR only when both are fulfilled
        }
      });
    }

    // Update based on type
    const now = new Date();
    let newStatus = record.status;

    if (isDatang) {
      const deadlineDatang = new Date(agenda.waktuMulai.getTime() + 30 * 60 * 1000);
      if (now > deadlineDatang) {
        return NextResponse.json({
          error: "Terlambat",
          errorCode: "LATE_DATANG",
          message: "Kamu telah melewati batas waktu absensi datang dan saat ini berstatus alpa. Silakan laporkan kepada petugas apabila terjadi kekeliruan."
        }, { status: 400 });
      }

      if (record.waktuDatang) {
        return NextResponse.json({ error: "Anda sudah melakukan absen Datang" }, { status: 400 });
      }

      // Update datang time
      record = await prisma.absensiRecord.update({
        where: { id: record.id },
        data: { waktuDatang: now }
      });

    } else {
      const deadlinePulang = new Date(agenda.waktuSelesai.getTime() + 30 * 60 * 1000);
      if (now > deadlinePulang) {
        return NextResponse.json({
          error: "Terlambat",
          errorCode: "LATE_PULANG",
          message: "Batas waktu absensi pulang telah berakhir. QR absensi sudah tidak dapat digunakan. Jika terjadi kesalahan, silakan hubungi petugas untuk melakukan pengecekan."
        }, { status: 400 });
      }

      if (record.waktuPulang) {
        return NextResponse.json({ error: "Anda sudah melakukan absen Pulang" }, { status: 400 });
      }
      if (!record.waktuDatang) {
        return NextResponse.json({
          error: "Tidak Absen Datang",
          errorCode: "MISSED_DATANG",
          message: "Maaf, kamu tidak melakukan absensi datang sehingga saat ini status kamu tercatat sebagai alpa. Silakan laporkan kepada petugas apabila terjadi kekeliruan."
        }, { status: 400 });
      }

      // Update pulang time and set to HADIR if both are filled
      newStatus = "HADIR";

      record = await prisma.absensiRecord.update({
        where: { id: record.id },
        data: {
          waktuPulang: now,
          status: newStatus
        }
      });
    }

    return NextResponse.json({ success: true, message: "Absensi berhasil dicatat", record });
  } catch (error) {
    console.error("Error processing scan:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
