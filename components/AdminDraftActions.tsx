"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import ConfirmModal from "@/components/ui/ConfirmModal";

interface AdminDraftActionsProps {
  draftId: string;
  draftTitle: string;
}

export default function AdminDraftActions({ draftId, draftTitle }: AdminDraftActionsProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/draft-competitions/${draftId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Draft competition berhasil dihapus");
        setShowConfirm(false);
        router.refresh();
      } else {
        const errorData = await res.json();
        toast.error("Gagal menghapus draft: " + (errorData.error || "Unknown error"));
      }
    } catch (err: any) {
      toast.error("Error: " + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
        title="Hapus Draft Competition"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      <ConfirmModal
        isOpen={showConfirm}
        title="Hapus Draft Competition"
        message={`Apakah Anda yakin ingin menghapus draft "${draftTitle}"? Data yang dihapus tidak dapat dikembalikan.`}
        confirmText={isDeleting ? "Menghapus..." : "Hapus"}
        cancelText="Batal"
        isDestructive={true}
        onConfirm={handleDelete}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  );
}
