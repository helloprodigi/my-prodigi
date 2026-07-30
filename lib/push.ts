import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase-admin";

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || "mailto:no-reply@contact.helloprodigi.pro";

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  icon?: string;
};

export async function sendPushToUser(userId: string, payload: PushPayload) {
  if (!vapidPublicKey || !vapidPrivateKey) {
    console.warn("[push] VAPID keys not configured, skipping push notification");
    return;
  }

  const adminDb = createAdminClient();

  const { data: subscriptions, error } = await adminDb
    .from("PushSubscription")
    .select("*")
    .eq("userId", userId);

  if (error) {
    console.error("[push] Failed to load subscriptions:", error.message);
    return;
  }

  if (!subscriptions || subscriptions.length === 0) return;

  const staleEndpoints: string[] = [];

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify(payload)
        );
      } catch (err: any) {
        // 404/410 means the subscription is no longer valid on the push service
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          staleEndpoints.push(sub.endpoint);
        } else {
          console.error("[push] Failed to send notification:", err?.message || err);
        }
      }
    })
  );

  if (staleEndpoints.length > 0) {
    await adminDb.from("PushSubscription").delete().in("endpoint", staleEndpoints);
  }
}
