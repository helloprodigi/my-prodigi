import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import webpush from "web-push";

// Web Push setup
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    "mailto:contact@prodigi.com",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export async function GET(req: Request) {
  try {
    const openRecords = await prisma.absensiRecord.findMany({
      where: { shiftStatus: "ON" },
      include: {
        user: {
          include: { pushSubscriptions: true }
        }
      }
    });

    const nowTimestamp = Date.now();
    let notificationsSent = 0;
    let autoClosed = 0;

    for (const rec of openRecords) {
      if (!rec.waktuDatang) continue;

      const diffHours = (nowTimestamp - rec.waktuDatang.getTime()) / (1000 * 60 * 60);

      if (diffHours > 8) {
        // AUTO CLOSE
        await prisma.absensiRecord.update({
          where: { id: rec.id },
          data: {
            shiftStatus: "OFF",
            waktuPulang: new Date(rec.waktuDatang.getTime() + 8 * 60 * 60 * 1000),
            status: "HADIR",
            actualDuration: 480,
            creditedDuration: 240,
            closeReason: "AUTO_CLOSE"
          }
        }).catch(console.error);
        autoClosed++;
      } else if (diffHours > 5 && diffHours <= 6) {
        // Send push notification if they haven't been notified yet.
        // We check if it's between 5 and 6 hours so it only sends once per cron cycle (assuming hourly cron).
        if (rec.user && rec.user.pushSubscriptions.length > 0 && process.env.VAPID_PRIVATE_KEY) {
          const payload = JSON.stringify({
            title: "Lupa Absen Pulang MyShift?",
            body: "Kamu sudah berjaga lebih dari 5 jam. Jangan lupa absen pulang agar durasimu tersimpan dengan benar!",
            url: "/myshift"
          });

          for (const sub of rec.user.pushSubscriptions) {
            const pushSub = {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
            };
            try {
              await webpush.sendNotification(pushSub, payload);
              notificationsSent++;
            } catch (e) {
              console.error("Push error:", e);
            }
          }
        }
      }
    }

    return NextResponse.json({ success: true, autoClosed, notificationsSent });
  } catch (error) {
    console.error("Cron Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
