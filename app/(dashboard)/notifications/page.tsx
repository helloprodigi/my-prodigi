"use client";

import { useState, useEffect, useCallback } from "react";
import { CheckCircle2, AlertCircle, CheckCheck, UserPlus } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";

interface Notification {
  id: string;
  type: string;
  title: string;
  description: string;
  isRead: boolean;
  createdAt: string;
}

function NotifIcon({ type }: { type: string }) {
  if (type === "member_joined" || type === "team_approve") {
    return <CheckCircle2 className="w-5 h-5 text-[#22C55E] shrink-0 mt-0.5" />;
  }
  if (type === "team_reject" || type === "invite_declined") {
    return <AlertCircle className="w-5 h-5 text-[#EF4444] shrink-0 mt-0.5" />;
  }
  if (type === "competition_new") {
    return <AlertCircle className="w-5 h-5 text-[#F59E0B] shrink-0 mt-0.5" />;
  }
  if (type === "request_join") {
    return <UserPlus className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />;
  }
  return <AlertCircle className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />;
}

function formatTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  if (diffMins < 1) return "Baru saja";
  if (diffMins < 60) return `${diffMins} menit lalu`;
  if (diffHours < 24) return `${diffHours} jam lalu`;
  if (diffDays === 1) return "Kemarin";
  if (diffDays < 7) return `${diffDays} hari lalu`;
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

function formatTimestamp(dateString: string) {
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<"Semua" | "Belum dibaca">("Semua");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(Array.isArray(data) ? data : []);
      }
    } catch {
      toast.error("Gagal memuat notifikasi.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Poll setiap 10 detik saat tab aktif
  useEffect(() => {
    const tick = () => {
      if (!document.hidden) fetchNotifications();
    };
    const interval = setInterval(tick, 10000);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [fetchNotifications]);

  const markAsRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    try {
      await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: id }),
      });
    } catch {
      fetchNotifications();
    }
  };

  const markAllAsRead = async () => {
    setMarkingAll(true);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      toast.success("Semua notifikasi ditandai dibaca.");
    } catch {
      fetchNotifications();
      toast.error("Gagal menandai semua sebagai dibaca.");
    } finally {
      setMarkingAll(false);
    }
  };

  const displayed = notifications.filter((n) =>
    activeTab === "Belum dibaca" ? !n.isRead : true
  );
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="min-h-screen bg-[#FBFBFB] flex flex-col">
      {/* Header + Tabs — left-aligned */}
      <div className="w-full max-w-[720px] pl-6 pr-4">
        <div className="flex items-center justify-between pt-8 pb-6">
          <h1 className="text-3xl font-bold text-[#0A1024]">Notifikasi</h1>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              disabled={markingAll}
              className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-[#0A1024] transition-colors disabled:opacity-50"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Tandai semua dibaca
            </button>
          )}
        </div>

        <div className="flex gap-8 mb-6">
          {(["Semua", "Belum dibaca"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm transition-all ${
                activeTab === tab
                  ? "text-[#0A1024] font-bold border-b-[3px] border-[#FFC700]"
                  : "text-gray-400 font-medium hover:text-gray-700"
              }`}
            >
              {tab}
              {tab === "Belum dibaca" && unreadCount > 0 && (
                <span className="ml-1.5 bg-[#FFC700] text-[#0A1024] text-[9px] font-black px-1.5 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-4 border-transparent border-t-[#FFC700] animate-spin" />
        </div>
      ) : displayed.length === 0 ? (
        /* Empty state — centered full page */
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6 pb-16">
          <div className="mb-8">
            <Image
              src="/assets/notifications/no-notifications.svg"
              alt="No notifications"
              width={200}
              height={200}
              className="mx-auto"
            />
          </div>
          <h2 className="text-2xl font-bold text-[#0A1024] mb-3">Belum ada notifikasi</h2>
          <p className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed mb-8">
            Kamu akan melihat notifikasi terbaru kamu disini. Yuk, mulai explor dan jangan lewatkan update penting!
          </p>
          <Link
            href="/competitions"
            className="px-8 py-3 bg-[#FFC700] hover:bg-[#e6b400] text-[#0A1024] font-bold rounded-xl transition-colors shadow-sm"
          >
            Jelajahi Kompetisi
          </Link>
        </div>
      ) : (
        <div className="w-full pl-6 pr-6 pb-16">
          <div className="flex flex-col gap-7">
            {displayed.map((notif) =>
              !notif.isRead ? (
                /* UNREAD — kuning card */
                <div
                  key={notif.id}
                  onClick={() => markAsRead(notif.id)}
                  className="relative bg-[#FFFBEA] border border-[#FFE680] rounded-[10px] p-5 cursor-pointer hover:bg-[#FFF9E6] transition-colors"
                >
                  <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-[#FFC700]" />
                  <div className="flex items-start gap-3">
                    <NotifIcon type={notif.type} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[#0A1024] leading-snug mb-1.5">
                        {notif.title}
                      </p>
                      <p className="text-xs text-gray-600 leading-relaxed mb-3">
                        {notif.description}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-gray-400 font-medium">
                        <span>{formatTimeAgo(notif.createdAt)}</span>
                        <span>{formatTimestamp(notif.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* READ — no card, no border */
                <div key={notif.id} className="flex items-start gap-3">
                  <NotifIcon type={notif.type} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#0A1024] leading-snug mb-1.5">
                      {notif.title}
                    </p>
                    <p className="text-xs text-gray-500 leading-relaxed mb-3">
                      {notif.description}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-gray-400 font-medium">
                      <span>{formatTimeAgo(notif.createdAt)}</span>
                      <span>{formatTimestamp(notif.createdAt)}</span>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}
