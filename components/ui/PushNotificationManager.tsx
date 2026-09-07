"use client";

import { useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { Bell, CheckCircle2, XCircle, X } from "lucide-react";

// iOS PWA/WebKit can freeze timers while the app is backgrounded (e.g. behind
// the native permission sheet), so a plain toast.success/error's auto-dismiss
// timer can end up stuck. Render tap-to-dismiss so there's always a manual way out.
function showDismissibleToast(message: string, variant: "success" | "error", duration: number) {
  toast(
    (t) => (
      <div
        role="button"
        onClick={() => toast.dismiss(t.id)}
        className="flex items-start gap-2 cursor-pointer"
      >
        {variant === "success" ? (
          <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
        ) : (
          <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
        )}
        <p className="text-sm text-gray-900 flex-1">{message}</p>
        <X className="w-4 h-4 text-gray-400 shrink-0" />
      </div>
    ),
    { duration }
  );
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function saveSubscription(subscription: PushSubscription) {
  const serialized = JSON.parse(JSON.stringify(subscription));
  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(serialized),
  });
  if (!res.ok) {
    throw new Error(`Failed to save push subscription (${res.status})`);
  }
}

async function subscribeToPush() {
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidPublicKey) return;

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
  });

  try {
    await saveSubscription(subscription);
  } catch (err) {
    // Don't leave a browser-side subscription that was never persisted
    // server-side — it would silently block all future retries.
    await subscription.unsubscribe().catch(() => {});
    throw err;
  }
}

export function PushNotificationManager() {
  const promptedRef = useRef(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    let cancelled = false;

    async function init() {
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
        updateViaCache: "none",
      });

      const existingSub = await registration.pushManager.getSubscription();
      if (cancelled) return;

      if (existingSub) {
        // Re-sync in case a previous save silently failed to persist —
        // this is idempotent (upsert on endpoint) so it's safe to repeat.
        saveSubscription(existingSub).catch((err) =>
          console.error("Failed to re-sync push subscription:", err)
        );
        return;
      }

      if (Notification.permission === "denied") return;
      if (promptedRef.current) return;
      if (sessionStorage.getItem("push-prompt-dismissed")) return;
      promptedRef.current = true;

      toast(
        (t) => (
          <div className="flex items-start gap-3">
            <Bell className="w-5 h-5 text-[#FFC917] shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Aktifkan notifikasi?</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Dapatkan notifikasi langsung di perangkatmu untuk update penting.
              </p>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={async () => {
                    toast.dismiss(t.id);
                    try {
                      const permission = await Notification.requestPermission();
                      if (permission === "granted") {
                        await subscribeToPush();
                        showDismissibleToast("Notifikasi berhasil diaktifkan!", "success", 4000);
                      } else {
                        showDismissibleToast(
                          "Izin notifikasi ditolak. Aktifkan lewat pengaturan browser/device.",
                          "error",
                          6000
                        );
                      }
                    } catch (err) {
                      console.error("Failed to subscribe to push notifications:", err);
                      const message = err instanceof Error ? err.message : String(err);
                      showDismissibleToast(`Gagal mengaktifkan notifikasi: ${message}`, "error", 8000);
                    }
                  }}
                  className="text-xs font-semibold text-[#111] bg-[#FFC917] px-3 py-1.5 rounded-lg"
                >
                  Aktifkan
                </button>
                <button
                  onClick={() => {
                    sessionStorage.setItem("push-prompt-dismissed", "1");
                    toast.dismiss(t.id);
                  }}
                  className="text-xs font-medium text-gray-500 px-3 py-1.5"
                >
                  Nanti
                </button>
              </div>
            </div>
          </div>
        ),
        { duration: Infinity }
      );
    }

    init().catch((err) => console.error("Push notification init failed:", err));

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
