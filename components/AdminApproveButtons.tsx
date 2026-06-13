"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Trash2, Pencil } from "lucide-react";
import toast from "react-hot-toast";
import AddCompetitionModal from "./AddCompetitionModal";
import ConfirmModal from "@/components/ui/ConfirmModal";

export default function AdminApproveButtons({ competition }: { competition: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    action: "approve" | "reject" | null;
  }>({ isOpen: false, action: null });

  const triggerAction = (action: "approve" | "reject") => {
    if (action === "approve") {
      setIsAddModalOpen(true);
    } else {
      setConfirmModal({ isOpen: true, action });
    }
  };

  const handleAction = async () => {
    const action = confirmModal.action;
    if (!action) return;
    setConfirmModal({ isOpen: false, action: null });
    
    setLoading(true);
    try {
      const res = await fetch(`/api/competitions/${competition.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action })
      });

      if (res.ok) {
        toast.success(`Competition ${action}d successfully`);
        router.refresh();
      } else {
        const err = await res.json();
        toast.error(`Error: ${err.error}`);
      }
    } catch (error) {
      console.error(error);
      toast.error("System error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="absolute top-6 right-6 flex gap-3">
        <button 
          onClick={() => triggerAction("reject")}
          disabled={loading}
          className="p-1.5 bg-red-50 text-red-500 rounded-md hover:bg-red-100 transition-colors disabled:opacity-50"
          title="Tolak Lomba"
        >
          <Trash2 className="w-4 h-4" />
        </button>
        <button 
          className="p-1.5 bg-gray-50 text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
          title="Edit Lomba"
        >
          <Pencil className="w-4 h-4" />
        </button>
      </div>

      <div className="flex gap-3 w-full mt-auto pt-6">
        <Link 
          href={competition.link || "#"} 
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 bg-[#FFF9E6] text-[#0A1024] font-semibold py-2 rounded-lg text-sm hover:bg-[#ffe380] transition-colors text-center block"
        >
          Lihat Detail
        </Link>
        <button 
          onClick={() => triggerAction("approve")}
          disabled={loading}
          className="flex-1 bg-[#FFC700] text-[#0A1024] font-semibold py-2 rounded-lg text-sm hover:bg-[#e6b400] transition-colors disabled:opacity-50"
        >
          {loading ? "..." : "Accept"}
        </button>
      </div>

      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        title={confirmModal.action === "approve" ? "Setujui Lomba" : "Tolak Lomba"}
        message={`Apakah Anda yakin ingin ${confirmModal.action === "approve" ? "menyetujui" : "menolak"} lomba ini?`}
        confirmText={confirmModal.action === "approve" ? "Setujui" : "Tolak"}
        cancelText="Batal"
        isDestructive={confirmModal.action === "reject"}
        onConfirm={handleAction}
        onCancel={() => setConfirmModal({ isOpen: false, action: null })}
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
