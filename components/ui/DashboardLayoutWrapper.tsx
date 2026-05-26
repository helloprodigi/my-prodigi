"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";

export function DashboardLayoutWrapper({ children }: { children: React.ReactNode }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDesktopOpen, setIsDesktopOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-[#FAFAFA]">
      <Sidebar 
        isMobileOpen={isMobileOpen} 
        setIsMobileOpen={setIsMobileOpen} 
        isDesktopOpen={isDesktopOpen}
        setIsDesktopOpen={setIsDesktopOpen}
      />
      <main 
        className={`flex-1 transition-all duration-300 ease-in-out pt-16 lg:pt-0 ${
          isDesktopOpen ? "ml-0 lg:ml-[280px]" : "ml-0 lg:ml-[80px]"
        }`}
      >
        {children}
      </main>
    </div>
  );
}
