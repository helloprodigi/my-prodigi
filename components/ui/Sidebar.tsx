"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutGrid, Trophy, Sparkles, BookOpen, Bell, User, LogOut, Menu, X, ChevronRight, ChevronLeft } from "lucide-react";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";
import { useState, useEffect } from "react";

const navItems = [
  { icon: LayoutGrid, href: "/dashboard", label: "Dashboard" },
  { icon: Trophy, href: "/competitions", label: "Competition" },
  { icon: Sparkles, href: "/matchmaking", label: "Matchmaking" },
  { icon: BookOpen, href: "/faq", label: "Tutorial & FAQ" },
  { icon: Bell, href: "/notifications", label: "Notifikasi" },
];

interface SidebarProps {
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  isDesktopOpen: boolean;
  setIsDesktopOpen: (open: boolean) => void;
}

export function Sidebar({ isMobileOpen, setIsMobileOpen, isDesktopOpen, setIsDesktopOpen }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [userData, setUserData] = useState<{name: string, role: string, photoUrl?: string} | null>(null);

  useEffect(() => {
    async function loadUser() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserData({
          name: user.user_metadata?.name || user.email?.split('@')[0] || "User",
          role: user.user_metadata?.role || "Talent",
          photoUrl: user.user_metadata?.photoUrl
        });
      }
    }
    loadUser();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
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

      {/* Hamburger for mobile (when closed) */}
      <button 
        className="lg:hidden fixed top-6 left-4 z-30 p-2 bg-[#0A1024] text-white rounded-md"
        onClick={() => setIsMobileOpen(true)}
      >
        <Menu className="w-6 h-6" />
      </button>

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
            const isActive = pathname.startsWith(item.href);
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
                onClick={() => setIsMobileOpen(false)} // Close on mobile after navigation
              >
                <item.icon className="w-6 h-6 shrink-0" />
                <span className={`ml-4 font-medium transition-all duration-300 whitespace-nowrap ${(isDesktopOpen || isMobileOpen) ? "opacity-100 w-auto" : "opacity-0 w-0 overflow-hidden"}`}>
                  {item.label}
                </span>
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#FFC700] rounded-r-md" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="mt-auto pt-6 px-4 relative flex flex-col items-center">
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
                <p className="text-xs text-gray-400 capitalize">{userData?.role || "Talent"}</p>
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
                onClick={handleLogout}
                className="w-full text-left px-4 py-3 text-sm text-red-400 hover:text-red-300 hover:bg-white/5 flex items-center gap-3 font-medium transition-colors"
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
