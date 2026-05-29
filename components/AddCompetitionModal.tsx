"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, CheckCircle2 } from "lucide-react";

interface AddCompetitionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Removed SKILL_CATEGORIES

export default function AddCompetitionModal({ isOpen, onClose }: AddCompetitionModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    organizer: "",
    category: "Belmawa",
    skills: [] as string[], // Keep for db compatibility but empty
    link: "",
    deadline: ""
  });

  if (!isOpen) return null;

  // Removed toggleSkill

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/competitions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setShowSuccess(true);
        router.refresh(); // Refresh page to show new data
      } else {
        const errorData = await res.json();
        alert("Gagal menambahkan Info Lomba: " + errorData.error);
      }
    } catch (err) {
      console.error("Error submitting competition:", err);
      alert("Terjadi kesalahan sistem.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      {showSuccess ? (
        <div className="bg-white rounded-3xl w-full max-w-md p-8 text-center shadow-2xl relative">
          <button 
            onClick={() => { setShowSuccess(false); onClose(); }}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-800 transition-colors bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <h3 className="text-2xl font-bold text-[#0A1024] mb-3">Terkirim!</h3>
          <p className="text-[#6E7980] mb-8 leading-relaxed text-sm">
            Terima kasih telah menambahkan informasi lomba. Informasi ini akan <span className="font-semibold text-[#0A1024]">di-review terlebih dahulu dan menunggu ACC (persetujuan) dari Admin</span> sebelum dipublikasikan.
          </p>
          <button 
            onClick={() => { setShowSuccess(false); onClose(); }}
            className="w-full bg-[#FFC700] hover:bg-[#e6b400] text-[#0A1024] font-bold py-3.5 rounded-xl transition-colors shadow-sm"
          >
            Selesai
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-800 transition-colors bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>

        <div className="p-8 pt-12">

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Nama Lomba</label>
              <input 
                type="text" 
                required
                className="w-full bg-[#F4F4F5] border-none rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFC700] transition-all text-[#0A1024]"
                placeholder="masukkan nama lomba"
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Penyelenggara Lomba</label>
              <input 
                type="text" 
                required
                className="w-full bg-[#F4F4F5] border-none rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFC700] transition-all text-[#0A1024]"
                placeholder="Nama penyelenggara lomba"
                value={formData.organizer}
                onChange={e => setFormData({...formData, organizer: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Deadline Lomba</label>
              <input 
                type="date" 
                required
                className="w-full bg-[#F4F4F5] border-none rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFC700] transition-all text-[#0A1024]"
                value={formData.deadline}
                onChange={e => setFormData({...formData, deadline: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Link Lomba</label>
              <input 
                type="url" 
                required
                className="w-full bg-[#F4F4F5] border-none rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFC700] transition-all text-[#0A1024]"
                placeholder="https://lomba-isme70-informatic-system-memorable-exhibition"
                value={formData.link}
                onChange={e => setFormData({...formData, link: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Kategori Lomba</label>
              <select 
                className="w-full bg-[#F4F4F5] border-none rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFC700] transition-all text-[#0A1024] appearance-none"
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
              >
                <option value="Belmawa">Belmawa</option>
                <option value="Non-Belmawa">Non-Belmawa</option>
                <option value="Internal">Internal</option>
              </select>
            </div>

            {/* Bidang Lomba moved to dropdown above */}

            <div className="pt-6 flex justify-end">
              <button 
                type="submit"
                disabled={loading || !formData.title || !formData.organizer || !formData.link || !formData.deadline}
                className="px-8 bg-[#FFC700] hover:bg-[#e6b400] text-[#0A1024] font-semibold py-3 rounded-xl transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Menyimpan..." : "Buat Lomba"}
              </button>
            </div>
          </form>
        </div>
        </div>
      )}
    </div>
  );
}
