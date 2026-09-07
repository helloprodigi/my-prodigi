"use client";

import { useState } from "react";
import Link from "next/link";
import AddCompetitionModal from "./AddCompetitionModal";
import AddDraftCompetitionModal from "./AddDraftCompetitionModal";
import { Plus, FileText, LayoutGrid } from "lucide-react";

interface CompetitionsHeaderProps {
  role: string;
  isDraftView?: boolean;
}

export default function CompetitionsHeader({ role, isDraftView = false }: CompetitionsHeaderProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDraftModalOpen, setIsDraftModalOpen] = useState(false);

  const isAdmin = role === "admin";

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 sm:justify-end">
        {isAdmin && !isDraftView && (
          <Link
            href="/competitions?view=draft&tab=Guidebook"
            className="inline-flex items-center justify-center gap-2 h-9 sm:h-10 px-4 sm:px-5 rounded-lg border border-gray-200 bg-white text-[13px] sm:text-sm font-semibold text-[#0A1024] hover:bg-gray-50 transition-colors box-border"
          >
            <FileText className="h-4 w-4 text-[#FFC700]" />
            Draft Competition
          </Link>
        )}

        {isAdmin && isDraftView && (
          <>
            <Link
              href="/competitions"
              className="inline-flex items-center justify-center gap-2 h-9 sm:h-10 px-4 sm:px-5 rounded-lg border border-gray-200 bg-white text-[13px] sm:text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors box-border"
            >
              <LayoutGrid className="h-4 w-4 text-gray-500" />
              Lomba Utama
            </Link>

            <button
              type="button"
              onClick={() => setIsDraftModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 h-9 sm:h-10 px-4 sm:px-5 rounded-lg bg-[#FFC700] text-[#0A1024] text-[13px] sm:text-sm font-semibold hover:bg-[#e6b400] transition-colors cursor-pointer box-border"
            >
              <Plus className="h-4 w-4" />
              Tambah Draft
            </button>
          </>
        )}

        {!isDraftView && (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center h-9 sm:h-10 px-4 sm:px-6 rounded-lg bg-[#FFC700] text-[#0A1024] text-[13px] sm:text-sm font-semibold hover:bg-[#e6b400] transition-colors cursor-pointer box-border"
          >
            Tambah Lomba
          </button>
        )}
      </div>

      <AddCompetitionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userRole={role}
      />

      {isAdmin && (
        <AddDraftCompetitionModal
          isOpen={isDraftModalOpen}
          onClose={() => setIsDraftModalOpen(false)}
        />
      )}
    </>
  );
}
