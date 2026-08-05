"use client";

import { Suspense, useState } from "react";
import { Sidebar } from "./Sidebar";
import { GlobalScannerFAB } from "./GlobalScannerFAB";
import { PushNotificationManager } from "./PushNotificationManager";

function SidebarFallback({ isDesktopOpen }: { isDesktopOpen: boolean }) {
  return (
    <aside
      className={`fixed left-0 top-0 min-h-screen bg-[#0A1024] z-50 transition-all duration-300 ease-in-out -translate-x-full lg:translate-x-0 ${
        isDesktopOpen ? "lg:w-[280px]" : "lg:w-[80px]"
      }`}
    />
  );
}

export function DashboardLayoutWrapper({ children }: { children: React.ReactNode }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDesktopOpen, setIsDesktopOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-[#FAFAFA]">
      <Suspense fallback={<SidebarFallback isDesktopOpen={isDesktopOpen} />}>
        <Sidebar
          isMobileOpen={isMobileOpen}
          setIsMobileOpen={setIsMobileOpen}
          isDesktopOpen={isDesktopOpen}
          setIsDesktopOpen={setIsDesktopOpen}
        />
      </Suspense>
      <main
        className={`flex-1 min-w-0 transition-all duration-300 ease-in-out pt-16 lg:pt-0 ${
          isDesktopOpen ? "ml-0 lg:ml-[280px]" : "ml-0 lg:ml-[80px]"
        }`}
      >
        {children}
      </main>
      <GlobalScannerFAB />
      <PushNotificationManager />
    </div>
  );
}
