import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";

// Coordinates for TULT (Telkom University Landmark Tower)
const TULT_LAT = -6.969143548676223;
const TULT_LNG = 107.62812480949316;
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

    if (!token || lat === undefined || lng === undefined || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify distance
    const distance = getDistanceFromLatLonInM(lat, lng, TULT_LAT, TULT_LNG);
    if (distance > MAX_RADIUS_METERS) {
      return NextResponse.json({ 
        error: "Location out of bounds", 
        message: `Anda berada di luar jangkauan TULT (${Math.round(distance)}m > ${MAX_RADIUS_METERS}m)` 
      }, { status: 400 });
    }

    // Find Agenda by token
    const isDatang = type === "datang";
    const agenda = await prisma.absensiAgenda.findFirst({
      where: isDatang ? { kodeQrDatang: token } : { kodeQrPulang: token }
    });

    if (!agenda) {
      return NextResponse.json({ error: "Invalid or expired QR token" }, { status: 404 });
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
      if (record.waktuDatang) {
        return NextResponse.json({ error: "Anda sudah melakukan absen Datang" }, { status: 400 });
      }
      
      // Update datang time
      record = await prisma.absensiRecord.update({
        where: { id: record.id },
        data: { waktuDatang: now }
      });
      
    } else {
      if (record.waktuPulang) {
        return NextResponse.json({ error: "Anda sudah melakukan absen Pulang" }, { status: 400 });
      }
      if (!record.waktuDatang) {
        return NextResponse.json({ error: "Anda tidak absen Datang, tidak bisa absen Pulang" }, { status: 400 });
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
