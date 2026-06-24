"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Edit3 } from "lucide-react";
import toast from "react-hot-toast";
import AddCompetitionModal from "./AddCompetitionModal";
import ConfirmModal from "@/components/ui/ConfirmModal";

export default function AdminCompetitionActions({ competition }: { competition: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleDelete = async () => {
    setIsConfirmOpen(false);
    setLoading(true);
    try {
      const res = await fetch(`/api/competitions/${competition.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Lomba berhasil dihapus");
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
      <div className="flex gap-2">
        <button
          onClick={() => setIsConfirmOpen(true)}
          disabled={loading}
          className="p-1.5 bg-red-50 text-red-500 rounded-md hover:bg-red-100 transition-colors disabled:opacity-50"
          title="Hapus Lomba"
        >
          <Trash2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => setIsEditModalOpen(true)}
          disabled={loading}
          className="p-1.5 bg-gray-50 text-gray-700 rounded-md hover:bg-gray-100 transition-colors disabled:opacity-50"
          title="Edit Lomba"
        >
          <Edit3 className="w-4 h-4" />
        </button>
      </div>

      <ConfirmModal
        isOpen={isConfirmOpen}
        title="Hapus Lomba"
        message="Apakah Anda yakin ingin menghapus lomba ini? Tindakan ini tidak dapat dibatalkan."
        confirmText="Hapus"
        cancelText="Batal"
        isDestructive={true}
        onConfirm={handleDelete}
        onCancel={() => setIsConfirmOpen(false)}
      />

      <AddCompetitionModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        userRole="admin"
        competitionToApprove={competition}
        isEditMode={true}
      />
    </>
  );
}
