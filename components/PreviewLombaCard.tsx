"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import AddCompetitionModal from "./AddCompetitionModal";
import ConfirmModal from "@/components/ui/ConfirmModal";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function PreviewLombaCard({ competition }: { competition: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleReject = async () => {
    setIsConfirmOpen(false);
    setLoading(true);
    try {
      const res = await fetch(`/api/competitions/${competition.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject" })
      });

      if (res.ok) {
        toast.success("Lomba berhasil ditolak");
        router.refresh();
      } else {
        const err = await res.json();
        toast.error(`Error: ${err.error}`);
      }
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan sistem.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex flex-col h-full relative hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-6">
          <span className="text-[#FFC700] text-xs font-bold">
            Dikirim: {formatDate(competition.createdAt)}
          </span>
          <button 
            onClick={() => setIsConfirmOpen(true)}
            disabled={loading}
            className="p-1.5 bg-red-50 text-red-500 rounded-md hover:bg-red-100 transition-colors disabled:opacity-50"
            title="Tolak Lomba"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div className="mb-4">
          <a 
            href={competition.link || "#"} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[#0A1024] font-bold text-lg underline break-all hover:text-blue-600 transition-colors line-clamp-2"
          >
            {competition.link || "Tidak ada link"}
          </a>
        </div>

        <div className="text-sm text-gray-500 mb-8 flex-1">
          Dikirim oleh: {competition.createdBy?.name || "Unknown"}
        </div>

        <button 
          onClick={() => setIsAddModalOpen(true)}
          disabled={loading}
          className="w-full bg-[#FFC700] text-[#0A1024] font-bold py-3 rounded-lg text-sm hover:bg-[#e6b400] transition-colors disabled:opacity-50 mt-auto"
        >
          Accept
        </button>
      </div>

      <ConfirmModal 
        isOpen={isConfirmOpen}
        title="Tolak Lomba"
        message="Apakah Anda yakin ingin menolak usulan lomba ini?"
        confirmText="Tolak"
        cancelText="Batal"
        isDestructive={true}
        onConfirm={handleReject}
        onCancel={() => setIsConfirmOpen(false)}
      />
      
      <AddCompetitionModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        userRole="admin"
        competitionToApprove={competition}
      />
    </>
  );
}
