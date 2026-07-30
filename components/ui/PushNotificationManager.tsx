"use client";

import { useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { Bell } from "lucide-react";

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

async function subscribeToPush() {
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidPublicKey) return;

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
  });

  const serialized = JSON.parse(JSON.stringify(subscription));
  await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(serialized),
  });
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
      if (cancelled || existingSub) return;

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
                      }
                    } catch (err) {
                      console.error("Failed to subscribe to push notifications:", err);
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
        { duration: 10000 }
      );
    }

    init().catch((err) => console.error("Push notification init failed:", err));

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
