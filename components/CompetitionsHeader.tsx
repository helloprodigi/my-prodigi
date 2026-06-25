"use client";

import { useState } from "react";
import AddCompetitionModal from "./AddCompetitionModal";

export default function CompetitionsHeader({ role }: { role: string }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="flex justify-end">
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-[#FFC700] text-[#0A1024] font-semibold py-1.5 px-4 sm:py-2 sm:px-6 rounded-lg text-[13px] sm:text-sm hover:bg-[#e6b400] transition-colors shadow-sm"
        >
          Buat tim
        </button>
      </div>

      <AddCompetitionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        userRole={role}
      />
    </>
  );
}
