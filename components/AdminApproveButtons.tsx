"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Trash2, Pencil } from "lucide-react";

export default function AdminApproveButtons({ competitionId }: { competitionId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleAction = async (action: "approve" | "reject") => {
    if (!confirm(`Are you sure you want to ${action} this competition?`)) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/competitions/${competitionId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action })
      });

      if (res.ok) {
        alert(`Competition ${action}d successfully`);
        router.refresh();
      } else {
        const err = await res.json();
        alert(`Error: ${err.error}`);
      }
    } catch (error) {
      console.error(error);
      alert("System error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="absolute top-6 right-6 flex gap-3">
        <button 
          onClick={() => handleAction("reject")}
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
          href={`/competitions/${competitionId}`} 
          className="flex-1 bg-[#FFF9E6] text-[#0A1024] font-semibold py-2 rounded-lg text-sm hover:bg-[#ffe380] transition-colors text-center block"
        >
          Lihat Detail
        </Link>
        <button 
          onClick={() => handleAction("approve")}
          disabled={loading}
          className="flex-1 bg-[#FFC700] text-[#0A1024] font-semibold py-2 rounded-lg text-sm hover:bg-[#e6b400] transition-colors disabled:opacity-50"
        >
          {loading ? "..." : "Accept"}
        </button>
      </div>
    </>
  );
}
