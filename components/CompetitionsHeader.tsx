"use client";

import { useState } from "react";
import AddCompetitionModal from "./AddCompetitionModal";

export default function CompetitionsHeader() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="flex justify-end">
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-[#FFC700] text-[#0A1024] font-semibold py-2 px-6 rounded-lg hover:bg-[#e6b400] transition-colors shadow-sm"
        >
          Tambah Lomba
        </button>
      </div>

      <AddCompetitionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
}
