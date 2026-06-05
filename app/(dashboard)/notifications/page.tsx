"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, AlertCircle, Info } from "lucide-react";
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

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState("Semua");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      // Optimistic update
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      
      const res = await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: id })
      });
      
      if (!res.ok) {
        // Revert on failure
        fetchNotifications();
      }
    } catch (error) {
      console.error("Failed to mark as read", error);
    }
  };

  const displayedNotifications = notifications.filter(n => {
    if (activeTab === "Belum dibaca") return !n.isRead;
    return true;
  });

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "1 day ago";
    return `${diffDays} days ago`;
  };

  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "team_approve":
        return <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0" />;
      case "team_reject":
        return <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />;
      case "competition_new":
        return <AlertCircle className="w-6 h-6 text-yellow-500 flex-shrink-0" />;
      case "custom_info":
        return <Info className="w-6 h-6 text-blue-500 flex-shrink-0" />;
      default:
        return <Info className="w-6 h-6 text-gray-500 flex-shrink-0" />;
    }
  };

  return (
    <div className="p-10 w-full">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-[#0A1024]">Notifikasi</h1>
      </div>

      <div className="flex justify-between items-center border-b border-gray-200 mb-8">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab("Semua")}
            className={`pb-4 px-2 font-medium transition-colors ${
              activeTab === "Semua" 
                ? "text-[#0A1024] border-b-2 border-[#FFC700]" 
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => setActiveTab("Belum dibaca")}
            className={`pb-4 px-2 font-medium transition-colors ${
              activeTab === "Belum dibaca" 
                ? "text-[#0A1024] border-b-2 border-[#FFC700]" 
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Belum dibaca
          </button>
        </div>
      </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FFC700]"></div>
          </div>
        ) : displayedNotifications.length > 0 ? (
          <div className="space-y-4">
            {displayedNotifications.map((notif) => (
              <div 
                key={notif.id}
                onClick={() => !notif.isRead && markAsRead(notif.id)}
                className={`relative p-6 rounded-xl border transition-all ${
                  !notif.isRead 
                    ? "bg-[#FFFCF0] border-[#FFE780] shadow-sm cursor-pointer hover:bg-[#FFF9E6]" 
                    : "bg-white border-gray-100 shadow-sm"
                }`}
              >
                {!notif.isRead && (
                  <div className="absolute top-6 right-6 w-2 h-2 rounded-full bg-[#FFC700]" />
                )}
                
                <div className="flex gap-4">
                  {getIcon(notif.type)}
                  
                  <div className="flex-1 pr-6">
                    <h3 className="font-semibold text-[#0A1024] text-base mb-2">
                      {notif.title}
                    </h3>
                    <p className="text-sm text-gray-500 leading-relaxed mb-4">
                      {notif.description}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>{formatTimeAgo(notif.createdAt)}</span>
                      <span>{formatTimestamp(notif.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
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
        )}
    </div>
  );
}
