import { Suspense } from "react";

export default function TeamInviteLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<div className="min-h-screen bg-[#FBFBFB] flex items-center justify-center text-sm text-gray-500 italic">Memuat undangan...</div>}>{children}</Suspense>;
}
