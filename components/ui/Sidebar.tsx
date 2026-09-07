"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Trophy, BookOpen, Bell, User, LogOut, Menu, X, ChevronRight, ChevronLeft, FileText, ShieldUser, CalendarClock, Calendar } from "lucide-react";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";
import { useState, useEffect, useRef } from "react";

// Asymmetric 2x2 grid (tall frames on the main diagonal, short frames on the
// other) — Material Symbols "dashboard" outline icon via Iconify, matches
// the Figma dashboard icon almost exactly.
function DashboardIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M13 9V3h8v6zM3 13V3h8v10zm10 8V11h8v10zM3 21v-6h8v6zm2-10h4V5H5zm10 8h4v-6h-4zm0-12h4V5h-4zM5 19h4v-2H5zm4-2" />
    </svg>
  );
}

// Two hollow-center twinkle stars — Hugeicons "sparkles" via Iconify, matches
// the Figma matchmaking icon (outline strokes naturally leave the diamond
// center hollow, unlike lucide's Sparkles which pairs one solid star with a
// cross-hair and a dot).
function MatchmakingIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth={1.5} className={className}>
      <path d="m15 2l.539 2.392a5.39 5.39 0 0 0 4.07 4.07L22 9l-2.392.539a5.39 5.39 0 0 0-4.07 4.07L15 16l-.539-2.392a5.39 5.39 0 0 0-4.07-4.07L8 9l2.392-.539a5.39 5.39 0 0 0 4.07-4.07zM7 12l.385 1.708a3.85 3.85 0 0 0 2.907 2.907L12 17l-1.708.385a3.85 3.85 0 0 0-2.907 2.907L7 22l-.385-1.708a3.85 3.85 0 0 0-2.907-2.907L2 17l1.708-.385a3.85 3.85 0 0 0 2.907-2.907z" />
    </svg>
  );
}

const talentNavItems = [
  { icon: DashboardIcon, href: "/dashboard", label: "Dashboard", disabled: false },
  { icon: Trophy, href: "/competitions", label: "Competition", disabled: false },
  { icon: FileText, href: "/competitions?view=draft", label: "Draft Competition", disabled: false },
  { icon: MatchmakingIcon, href: "/matchmaking", label: "Matchmaking", disabled: false },
  { icon: BookOpen, href: "/faq", label: "Tutorial & FAQ", disabled: false },
  { icon: Bell, href: "/notifications", label: "Notifikasi", disabled: false },
];

const aslabNavItems = [
  { icon: DashboardIcon, href: "/dashboard", label: "Dashboard" },
  { icon: Trophy, href: "/competitions", label: "Draft Competition" },
  { icon: FileText, href: "/aslab-proker", label: "Program Kerja", disabled: false },
  { icon: ShieldUser, href: "/my-divisi", label: "MyDivisi", disabled: false },
  { icon: CalendarClock, href: "/myshift", label: "MyShift", disabled: false },
  { icon: Calendar, href: "/agenda", label: "Kelola Agenda", disabled: false },
  { icon: Bell, href: "/notifications", label: "Notifikasi" },
];

const adminNavItems = [
  { icon: DashboardIcon, href: "/dashboard", label: "Dashboard" },
  { icon: Trophy, href: "/competitions", label: "Competition", disabled: false },
  { icon: CalendarClock, href: "/myshift", label: "MyShift", disabled: false },
  { icon: Calendar, href: "/agenda", label: "Kelola Agenda", disabled: false },
];

interface SidebarProps {
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  isDesktopOpen: boolean;
  setIsDesktopOpen: (open: boolean) => void;
}

const getCookie = (name: string) => {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
};

export function Sidebar({ isMobileOpen, setIsMobileOpen, isDesktopOpen, setIsDesktopOpen }: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const [userData, setUserData] = useState<{name: string, role: string, photoUrl?: string} | null>(null);
  const [userRole, setUserRole] = useState<string>("talent");
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    queueMicrotask(() => {
      const saved = getCookie("activeRole") || localStorage.getItem("activeRole");
      if (saved) {
        setUserRole(saved === "aslab" ? "asisten_lab" : saved);
      }
    });
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadUser() {
      try {
        const res = await fetch("/api/profile");
        if (!isMounted) return;
        if (res.ok) {
          const data = await res.json();
          if (data && data.role) {
            setUserData({
              name: data.name,
              role: data.role,
              photoUrl: data.photoUrl
            });
            setUserRole(data.role);
            return;
          }
        }
      } catch (e) {
        console.warn("Sidebar loadUser API error:", e);
      }

      // Fallback if API fails
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!isMounted) return;

      if (user) {
        let dbRole = user.user_metadata?.role;
        const savedRole = getCookie("activeRole") || (typeof window !== "undefined" ? localStorage.getItem("activeRole") : null);
        const normalizedSavedRole = savedRole === "aslab" ? "asisten_lab" : savedRole;
        const effectiveRole = normalizedSavedRole || dbRole || "talent";

        setUserData({
          name: user.user_metadata?.name || user.email?.split('@')[0] || "User",
          role: effectiveRole,
          photoUrl: user.user_metadata?.photoUrl
        });

        setUserRole(effectiveRole);
      } else {
        setUserData(null);
        setUserRole("talent");
      }
    }

    loadUser();

    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === "SIGNED_OUT") {
        if (!isMounted) return;
        setUserData(null);
        setUserRole("talent");
        setUnreadCount(0);
        router.refresh();
        return;
      }

      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        await loadUser();
        router.refresh();
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  useEffect(() => {
    function handleProfileUpdated(e: Event) {
      const { photoUrl, role } = (e as CustomEvent<{ photoUrl?: string; role?: string }>).detail ?? {};
      if (photoUrl !== undefined) {
        setUserData((prev) => (prev ? { ...prev, photoUrl } : prev));
      }
      if (role !== undefined) {
        const normalizedRole = role === "aslab" ? "asisten_lab" : role;
        setUserRole(normalizedRole);
        setUserData((prev) => (prev ? { ...prev, role: normalizedRole } : prev));
      }
    }
    function handleStorageChange(e: StorageEvent) {
      if (e.key === "activeRole" && e.newValue) {
        const normalizedRole = e.newValue === "aslab" ? "asisten_lab" : e.newValue;
        setUserRole(normalizedRole);
        setUserData((prev) => (prev ? { ...prev, role: normalizedRole } : prev));
      }
    }
    window.addEventListener("myprodigi:profile-updated", handleProfileUpdated);
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("myprodigi:profile-updated", handleProfileUpdated);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const navItems = userRole === "admin" ? adminNavItems : userRole === "asisten_lab" ? aslabNavItems : talentNavItems;

  useEffect(() => {
    async function fetchUnread() {
      try {
        const res = await fetch("/api/notifications?count=true");
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.unread ?? 0);
        }
      } catch {}
    }
    fetchUnread();
    const interval = setInterval(fetchUnread, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isProfileOpen) return;

    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isProfileOpen]);

  const handleLogout = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      document.cookie = "activeRole=; path=/; max-age=0; SameSite=Lax";
    } catch {}
    window.location.href = "/auth/logout";
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile top bar: hamburger + right-justified logo.
          /assets/myprodigi-logo.svg is now real vector paths (glyphs
          outlined via opentype.js, not the old embedded-raster version), so
          it stays crisp at any zoom/DPR — safe to reference directly. */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 z-30 bg-white border-b border-gray-200 flex items-center px-4">
        <button onClick={() => setIsMobileOpen(true)} className="text-[#0A1024]">
          <Menu className="w-6 h-6" />
        </button>
        <Image
          src="/assets/myprodigi-logo.svg"
          alt="MyProdigi"
          width={218}
          height={50}
          className="h-8 w-auto object-contain absolute right-4 top-1/2 -translate-y-1/2"
        />
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed left-0 top-0 min-h-screen bg-[#0A1024] text-white z-50 flex flex-col py-6 transition-all duration-300 ease-in-out
        ${isMobileOpen ? "w-[280px] translate-x-0" : "-translate-x-full lg:translate-x-0"}
        ${isDesktopOpen ? "lg:w-[280px]" : "lg:w-[80px]"}
      `}>
        {/* Mobile Close Button */}
        {isMobileOpen && (
          <button 
            className="absolute top-6 right-6 lg:hidden"
            onClick={() => setIsMobileOpen(false)}
          >
            <X className="w-6 h-6 text-gray-400 hover:text-white transition-colors" />
          </button>
        )}

        {/* Desktop Top Section */}
        <div className="hidden lg:flex h-16 w-full relative items-center justify-center mb-6">
          {isDesktopOpen ? (
            <button
              onClick={() => setIsDesktopOpen(false)}
              className="absolute top-6 left-6 z-50 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          ) : (
            <button
              onClick={() => setIsDesktopOpen(true)}
              className="mt-2 z-50 hover:scale-105 transition-transform"
            >
              <Image src="/assets/myprodigi-sidebar.svg" alt="MyProdigi" width={40} height={40} className="w-10 h-10 object-contain shrink-0" />
            </button>
          )}
        </div>
        
        {/* Mobile space */}
        <div className="h-16 w-full lg:hidden" />

        {/* Navigation */}
        <nav className="flex-1 flex flex-col gap-2 w-full px-4">
          {navItems.map((item) => {
            const isDraftLink = item.href.endsWith("?view=draft");
            const basePath = item.href.split("?")[0];
            const isActive =
              !item.disabled &&
              pathname.startsWith(basePath) &&
              (isDraftLink ? searchParams.get("view") === "draft" : searchParams.get("view") !== "draft");

            if (item.disabled) {
              return (
                <div
                  key={item.label}
                  className="relative w-full flex items-center rounded-xl p-3 text-gray-600 cursor-not-allowed"
                  title={"Segera hadir"}
                >
                  <span className="relative shrink-0">
                    <item.icon className="w-6 h-6" />
                  </span>
                  <span className={`ml-4 font-medium transition-all duration-300 whitespace-nowrap ${(isDesktopOpen || isMobileOpen) ? "opacity-100 w-auto" : "opacity-0 w-0 overflow-hidden"}`}>
                    {item.label}
                  </span>
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative w-full flex items-center rounded-xl p-3 transition-colors ${
                  isActive
                    ? "bg-[#1E2538] text-[#FFC700]"
                    : "text-gray-200 hover:text-white hover:bg-white/5"
                }`}
                title={!(isDesktopOpen || isMobileOpen) ? item.label : undefined}
                onClick={() => setIsMobileOpen(false)}
              >
                <span className="relative shrink-0">
                  <item.icon className="w-6 h-6" />
                  {item.href === "/notifications" && unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-[#FFC700] rounded-full border-2 border-[#0A1024]" />
                  )}
                </span>
                <span className={`ml-4 font-medium transition-all duration-300 whitespace-nowrap ${(isDesktopOpen || isMobileOpen) ? "opacity-100 w-auto" : "opacity-0 w-0 overflow-hidden"}`}>
                  {item.label}
                </span>
                {isActive && (
                  <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-[#FFC700] rounded-l-md" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Profile */}
        <div ref={profileRef} className="mt-auto pt-6 px-4 relative flex flex-col items-center">
          <div className="w-full border-t border-gray-800 mb-6" />
          
          <button 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className={`flex items-center w-full p-2 rounded-xl hover:bg-white/5 transition-colors ${!(isDesktopOpen || isMobileOpen) ? "justify-center" : "justify-start gap-3"}`}
          >
            <div className="w-10 h-10 shrink-0 rounded-full bg-[#1E2538] border-[1.5px] border-[#FFC700] flex items-center justify-center overflow-hidden">
              {userData?.photoUrl ? (
                <img src={userData.photoUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-5 h-5 text-gray-300" />
              )}
            </div>
            
            <div className={`flex-1 text-left transition-all duration-300 whitespace-nowrap overflow-hidden flex justify-between items-center ${(isDesktopOpen || isMobileOpen) ? "opacity-100 w-auto" : "opacity-0 w-0"}`}>
              <div>
                <p className="text-sm font-semibold text-white truncate max-w-[120px]">{userData?.name || "User Prodigi"}</p>
                <p className="text-xs text-gray-400 capitalize">{userRole === "admin" ? "Admin" : userRole === "asisten_lab" ? "Asisten Lab" : (userData?.role || "Talent")}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
            </div>
          </button>

          {isProfileOpen && (
            <div className={`absolute bottom-20 z-50 bg-[#1E2538] rounded-xl shadow-2xl py-1.5 border border-gray-700/50 overflow-hidden backdrop-blur-md ${
              (isDesktopOpen || isMobileOpen) ? "left-4 right-4" : "left-4 w-48"
            }`}>
              <Link 
                href="/profile" 
                className="px-4 py-3 text-sm text-gray-200 hover:text-white hover:bg-white/5 flex items-center gap-3 font-medium transition-colors"
                onClick={() => { setIsProfileOpen(false); setIsMobileOpen(false); }}
              >
                <User className="w-4 h-4" />
                Profile
              </Link>
              <div className="h-px w-full bg-gray-700/50" />
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleLogout();
                }}
                className="w-full text-left px-4 py-3 text-sm text-red-400 hover:text-red-300 hover:bg-white/5 flex items-center gap-3 font-medium transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          )}

          <div className={`mt-6 text-xs text-gray-600 transition-all duration-300 ${(isDesktopOpen || isMobileOpen) ? "opacity-100" : "opacity-0"}`}>
            MyProdigi V1.0
          </div>
        </div>
      </aside>
    </>
  );
}
