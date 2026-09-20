import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }

  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  
  // Find all records that are currently "ON"
  const openRecords = await prisma.absensiRecord.findMany({
    where: { shiftStatus: "ON", waktuDatang: { not: null } }
  });

  let notified = 0;

  for (const rec of openRecords) {
    if (!rec.waktuDatang || !rec.userId) continue;
    const diffHours = (now.getTime() - rec.waktuDatang.getTime()) / (1000 * 60 * 60);

    // If more than 5 hours have passed (but less than 8 hours)
    if (diffHours >= 5 && diffHours < 8) {
      // Check if we already notified them for this specific record today
      const alreadyNotified = await prisma.notification.findFirst({
        where: {
          userId: rec.userId,
          type: "myshift_checkout_reminder",
          createdAt: { gte: rec.waktuDatang }
        }
      });

      if (!alreadyNotified) {
        await createNotification(
          rec.userId,
          {
            type: "myshift_checkout_reminder",
            title: "Waktunya Checkout MyShift!",
            description: "Kamu sudah check-in selama lebih dari 5 jam. Jangan lupa checkout sebelum 8 jam, atau jam kerjamu akan otomatis terpotong jadi 4 jam!"
          },
          {
            title: "Waktunya Checkout MyShift!",
            body: "Kamu sudah check-in selama lebih dari 5 jam. Checkout sekarang sebelum otomatis terpotong!",
            url: "/myshift"
          }
        );
        notified++;
      }
    }
  }

  return NextResponse.json({ success: true, notified });
}
