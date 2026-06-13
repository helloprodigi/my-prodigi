"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";

interface AddCompetitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole?: string;
  competitionToApprove?: any;
}

const SKILL_CATEGORIES = [
  { name: "Data Science", activeClass: "bg-[#F0F8FF] text-[#006699]" },
  { name: "UI/UX Design", activeClass: "bg-[#F0F4FF] text-[#3333CC]" },
  { name: "Business Plan", activeClass: "bg-[#FFF4EB] text-[#CC4400]" },
  { name: "Web Development", activeClass: "bg-[#FFFBEB] text-[#D4AF37]" }
];

export default function AddCompetitionModal({ isOpen, onClose, userRole = "talent", competitionToApprove }: AddCompetitionModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    organizer: "",
    category: "Belmawa",
    skillsString: "",
    link: "",
    deadline: ""
  });

  // Prefill if editing/approving
  useEffect(() => {
    if (isOpen && competitionToApprove) {
      setFormData({
        title: competitionToApprove.title === "Menunggu Review Admin" ? "" : (competitionToApprove.title || ""),
        organizer: competitionToApprove.organizer === "TBD" ? "" : (competitionToApprove.organizer || ""),
        category: competitionToApprove.category || "Belmawa",
        skillsString: (competitionToApprove.skills || []).join(", "),
        link: competitionToApprove.link || "",
        deadline: competitionToApprove.deadline ? competitionToApprove.deadline.split('T')[0] : ""
      });
    } else if (isOpen) {
      // Reset
      setFormData({
        title: "", organizer: "", category: "Belmawa", skillsString: "", link: "", deadline: ""
      });
      setShowSuccess(false);
    }
  }, [isOpen, competitionToApprove]);

  if (!isOpen) return null;

  const isAdmin = userRole === "admin";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const submissionData = {
      ...formData,
      skills: formData.skillsString.split(",").map(s => s.trim()).filter(Boolean)
    };

    try {
      let res;
      if (competitionToApprove) {
        // Approve flow
        res = await fetch(`/api/competitions/${competitionToApprove.id}/approve`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "approve", ...submissionData })
        });
      } else {
        // Create flow
        res = await fetch("/api/competitions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(submissionData)
        });
      }

      if (res.ok) {
        setShowSuccess(true);
        router.refresh();
      } else {
        const errorData = await res.json();
        toast.error("Gagal menyimpan: " + errorData.error);
      }
    } catch (err) {
      console.error("Error submitting competition:", err);
      toast.error("Terjadi kesalahan sistem.");
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = isAdmin 
    ? formData.title && formData.organizer && formData.link && formData.deadline
    : formData.link;

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
          {!isAdmin && (
            <div className="mb-8">
              <h2 className="text-xl font-bold text-[#0A1024] mb-3">Menemukan lomba yang belum tersedia di MyProdigi?</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                Silakan tambahkan informasinya. Tim admin akan meninjau dan memverifikasi data sebelum dipublikasikan. Terima kasih telah membantu memperkaya informasi lomba untuk mahasiswa lainnya.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {isAdmin && (
              <>
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
              </>
            )}

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

            {isAdmin && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Kategori yang tersedia</label>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {SKILL_CATEGORIES.map(skill => {
                      const selectedSkills = formData.skillsString.split(",").map(s => s.trim()).filter(Boolean);
                      const isSelected = selectedSkills.includes(skill.name);
                      
                      return (
                        <button
                          type="button"
                          key={skill.name}
                          onClick={() => {
                            if (isSelected) {
                              setFormData({
                                ...formData, 
                                skillsString: selectedSkills.filter(s => s !== skill.name).join(", ")
                              });
                            } else {
                              setFormData({
                                ...formData, 
                                skillsString: [...selectedSkills, skill.name].join(", ")
                              });
                            }
                          }}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                            isSelected 
                              ? skill.activeClass
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}
                        >
                          {skill.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Jenis Lomba</label>
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
              </>
            )}

            <div className="pt-6 flex justify-end">
              <button 
                type="submit"
                disabled={loading || !isFormValid}
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
