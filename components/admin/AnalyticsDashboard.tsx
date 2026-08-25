"use client";

import { useEffect, useMemo, useState } from "react";
import { TrendingUp, GraduationCap, Wrench, UsersRound, Trophy, UserPlus, Users as UsersIcon } from "lucide-react";
import toast from "react-hot-toast";
import { useCountUp } from "./useAnalyticsAnimations";
import UserGrowthChart from "./charts/UserGrowthChart";
import RoleDonutChart from "./charts/RoleDonutChart";

type Analytics = {
  totalUsers: number;
  totalTalent: number;
  totalAslab: number;
  totalAdmin: number;
  activeTeams: number;
  totalTeamsCreated: number;
  newUsersThisMonth: number;
  userGrowth: { date: string; total: number }[];
  recentActivity: { id: string; type: "user_joined" | "team_created"; label: string; timestamp: string }[];
  lastUpdated: string;
};

function LoadingSpinner() {
  return (
    <div className="flex justify-center p-8">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#FFC700] border-r-[#FFC700]/50 animate-spin" />
        <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-[#FFC700]/30 border-l-[#FFC700]/10 animate-spin" />
      </div>
    </div>
  );
}

function Sparkline({ points }: { points: number[] }) {
  if (points.length < 2) return null;
  const w = 96;
  const h = 28;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const coords = points.map((v, i) => {
    const x = (i / (points.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} className="shrink-0">
      <polyline points={coords.join(" ")} fill="none" stroke="#FFC700" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function relativeTime(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Baru saja";
  if (mins < 60) return `${mins} menit lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function activityTimeLabel(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Baru saja";
  if (mins < 60) return `${mins}m lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}j lalu`;
  const days = Math.floor(hours / 24);
  return `${days}h lalu`;
}

export default function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/admin/analytics");
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setAnalytics(data);
        } else {
          toast.error("Gagal memuat data analytics.");
        }
      } catch (err) {
        console.error(err);
        toast.error("Gagal memuat data analytics.");
      }
      if (!cancelled) setIsLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const talentPercent = analytics && analytics.totalUsers > 0 ? Math.round((analytics.totalTalent / analytics.totalUsers) * 100) : 0;
  const aslabPercent = analytics && analytics.totalUsers > 0 ? Math.round((analytics.totalAslab / analytics.totalUsers) * 100) : 0;

  const sparklinePoints = useMemo(
    () => (analytics ? analytics.userGrowth.slice(-14).map((p) => p.total) : []),
    [analytics]
  );

  const totalUsersCount = useCountUp(analytics?.totalUsers ?? 0, !!analytics);
  const talentCount = useCountUp(analytics?.totalTalent ?? 0, !!analytics);
  const aslabCount = useCountUp(analytics?.totalAslab ?? 0, !!analytics);
  const activeTeamsCount = useCountUp(analytics?.activeTeams ?? 0, !!analytics);
  const totalTeamsCount = useCountUp(analytics?.totalTeamsCreated ?? 0, !!analytics);

  if (isLoading || !analytics) {
    return <LoadingSpinner />;
  }

  // Admin counts toward "Asisten Lab" in the KPI card above (per the app's
  // role hierarchy — admin is also lab staff), but the ring and legend below
  // show each DB role as its own arc/row so the two always sum cleanly to
  // 100% and the legend matches exactly what's drawn.
  const aslabOnly = Math.max(analytics.totalAslab - analytics.totalAdmin, 0);
  const donutArcs = [
    { key: "talent", label: "Talent", value: analytics.totalTalent, color: "#FFC700", group: "talent", groupLabel: "Talent" },
    { key: "aslab-only", label: "Asisten Lab", value: aslabOnly, color: "#0A1024", group: "aslab", groupLabel: "Asisten Lab" },
    { key: "admin", label: "Admin", value: analytics.totalAdmin, color: "#E2A600", group: "aslab", groupLabel: "Admin" },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 animate-fade-up">
        <div>
          <h2 className="text-xl font-bold text-[#0A1024]">Analytics Overview</h2>
          <p className="text-sm text-gray-500 mt-1">Pantau aktivitas platform, pengguna, peran, dan tim dalam satu tempat.</p>
        </div>
        <p className="text-xs text-gray-400 shrink-0">Terakhir diperbarui: {relativeTime(analytics.lastUpdated)}</p>
      </div>

      {/* Primary KPI row */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div
          className="lg:col-span-2 bg-white border border-gray-200 rounded-lg p-5 sm:p-6 animate-fade-up"
          style={{ animationDelay: "60ms" }}
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-[#FFF9E6] flex items-center justify-center">
                  <UsersIcon className="w-4 h-4 text-[#0A1024]" />
                </div>
                <p className="text-sm font-medium text-gray-500">Total Users</p>
              </div>
              <p className="text-[40px] leading-none font-bold text-[#0A1024]">{totalUsersCount.toLocaleString("id-ID")}</p>
              {analytics.newUsersThisMonth > 0 && (
                <div className="inline-flex items-center gap-1 mt-3 px-2.5 py-1 rounded-md bg-[#EAF9E9] text-[#2E7D32] text-xs font-bold">
                  <TrendingUp className="w-3 h-3" />
                  +{analytics.newUsersThisMonth} bulan ini
                </div>
              )}
            </div>
            {sparklinePoints.length > 1 && (
              <div className="flex flex-col items-end gap-1">
                <Sparkline points={sparklinePoints} />
                <span className="text-[10px] text-gray-400">14 hari terakhir</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-5 sm:p-6 animate-fade-up" style={{ animationDelay: "120ms" }}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-[#FFF9E6] flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-[#0A1024]" />
            </div>
            <p className="text-sm font-medium text-gray-500">Talent</p>
          </div>
          <p className="text-3xl font-bold text-[#0A1024]">{talentCount.toLocaleString("id-ID")}</p>
          <p className="text-xs text-gray-400 mt-1 mb-2">{talentPercent}% dari total pengguna</p>
          <div className="h-1.5 rounded-sm bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-sm bg-[#FFC700] transition-all duration-700 ease-out"
              style={{ width: `${talentPercent}%` }}
            />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-5 sm:p-6 animate-fade-up" style={{ animationDelay: "180ms" }}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-[#FFF9E6] flex items-center justify-center">
              <Wrench className="w-4 h-4 text-[#0A1024]" />
            </div>
            <p className="text-sm font-medium text-gray-500">Asisten Lab</p>
          </div>
          <p className="text-3xl font-bold text-[#0A1024]">{aslabCount.toLocaleString("id-ID")}</p>
          <p className="text-xs text-gray-400 mt-1 mb-2">{aslabPercent}% dari total pengguna</p>
          <div className="h-1.5 rounded-sm bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-sm bg-[#0A1024] transition-all duration-700 ease-out"
              style={{ width: `${aslabPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 animate-fade-up" style={{ animationDelay: "260ms" }}>
          <UserGrowthChart data={analytics.userGrowth} />
        </div>
        <div className="animate-fade-up" style={{ animationDelay: "300ms" }}>
          <RoleDonutChart arcs={donutArcs} />
        </div>
      </div>

      {/* Team overview + recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div
          className="bg-white border border-gray-200 rounded-lg p-5 sm:p-6 animate-fade-up"
          style={{ animationDelay: "340ms" }}
        >
          <h3 className="text-base font-bold text-[#0A1024] mb-4">Team Overview</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#FFF9E6] flex items-center justify-center shrink-0">
                <UsersRound className="w-4 h-4 text-[#0A1024]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#0A1024] leading-none">{activeTeamsCount}</p>
                <p className="text-xs text-gray-500 mt-1">Tim Aktif Saat Ini</p>
              </div>
            </div>
            <p className="text-[11px] text-gray-400 leading-relaxed">Jumlah tim yang masih ada di sistem sekarang.</p>

            <div className="h-px bg-gray-100" />

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#FFF9E6] flex items-center justify-center shrink-0">
                <Trophy className="w-4 h-4 text-[#0A1024]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#0A1024] leading-none">{totalTeamsCount}</p>
                <p className="text-xs text-gray-500 mt-1">Total Tim Pernah Dibuat</p>
              </div>
            </div>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              Akumulatif sejak awal, termasuk tim yang sudah selesai/dihapus.
            </p>
          </div>
        </div>

        <div
          className="lg:col-span-2 bg-white border border-gray-200 rounded-lg p-5 sm:p-6 animate-fade-up"
          style={{ animationDelay: "380ms" }}
        >
          <h3 className="text-base font-bold text-[#0A1024] mb-4">Recent Activity</h3>
          {analytics.recentActivity.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">Belum ada aktivitas terbaru.</p>
          ) : (
            <div className="space-y-1">
              {analytics.recentActivity.map((item) => (
                <div key={item.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className="w-7 h-7 rounded-lg bg-[#FFF9E6] flex items-center justify-center shrink-0">
                    {item.type === "user_joined" ? (
                      <UserPlus className="w-3.5 h-3.5 text-[#0A1024]" />
                    ) : (
                      <UsersRound className="w-3.5 h-3.5 text-[#0A1024]" />
                    )}
                  </div>
                  <p className="text-sm text-gray-700 flex-1 truncate">{item.label}</p>
                  <span className="text-xs text-gray-400 shrink-0">{activityTimeLabel(item.timestamp)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
