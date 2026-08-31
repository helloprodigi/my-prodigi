"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { X, CheckCircle2, FileText, Upload, ChevronDown, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

interface AddDraftCompetitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const COMPETITION_TYPES = [
  "UI/UX Design",
  "Web Development",
  "Mobile App Development",
  "Business Plan",
  "Data Science",
  "Cyber Security",
  "Game Development",
  "Artificial Intelligence",
  "Internet of Things (IoT)",
];

export default function AddDraftCompetitionModal({ isOpen, onClose, onSuccess }: AddDraftCompetitionModalProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [tab, setTab] = useState<"Guidebook" | "Proposal" | "Pitch Deck">("Guidebook");
  const [title, setTitle] = useState("");
  const [organizer, setOrganizer] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<"Belmawa" | "Non-Belmawa" | "Internal">("Belmawa");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [customSkill, setCustomSkill] = useState("");

  // PDF File Upload states
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string>("");
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  if (!isOpen) return null;

  const toggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter((s) => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const handleAddCustomSkill = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ("key" in e && e.key !== "Enter") return;
    e.preventDefault();
    const trimmed = customSkill.trim();
    if (!trimmed) return;
    setSelectedSkills((prev) => {
      if (prev.includes(trimmed)) return prev;
      return [...prev, trimmed];
    });
    setCustomSkill("");
  };

  const handleBidangChange = (value: string) => {
    if (!value) return;
    setSelectedSkills((prev) => {
      if (prev.includes(value)) return prev;
      return [...prev, value];
    });
  };

  // PDF File handling
  const handlePdfUpload = async (file: File) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
      toast.error("Hanya file bertipe PDF yang diperbolehkan.");
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      toast.error("Ukuran file PDF maksimal 15MB.");
      return;
    }

    setPdfFile(file);
    setIsUploadingPdf(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        setPdfUrl(data.url);
        toast.success("File PDF berhasil diunggah!");
      } else {
        toast.error("Gagal mengunggah file: " + (data.error || "Unknown error"));
        setPdfFile(null);
      }
    } catch (err: any) {
      toast.error("Gagal mengunggah PDF: " + err.message);
      setPdfFile(null);
    } finally {
      setIsUploadingPdf(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handlePdfUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handlePdfUpload(e.target.files[0]);
    }
  };

  const removePdfFile = () => {
    setPdfFile(null);
    setPdfUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const resetForm = () => {
    setTab("Guidebook");
    setTitle("");
    setOrganizer("");
    setDescription("");
    setCategory("Belmawa");
    setSelectedSkills([]);
    setCustomSkill("");
    setPdfFile(null);
    setPdfUrl("");
    setIsUploadingPdf(false);
    setShowSuccess(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const normalizedTitle = title.trim();
    const normalizedOrganizer = organizer.trim() || "Admin";
    const normalizedDescription = description.trim();
    const normalizedSkills = [...new Set(selectedSkills.map((skill) => skill.trim()).filter(Boolean))];

    if (!normalizedTitle) {
      toast.error("Nama Lomba / Judul Draft wajib diisi.");
      return;
    }

    if (normalizedSkills.length === 0) {
      toast.error("Jenis Lomba (Bidang) wajib dipilih minimal 1.");
      return;
    }

    if (!pdfUrl) {
      toast.error("Silakan unggah dokumen PDF terlebih dahulu.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/draft-competitions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: normalizedTitle,
          organizer: normalizedOrganizer,
          tab,
          category,
          skills: normalizedSkills,
          description: normalizedDescription,
          link: pdfUrl,
        }),
      });

      if (res.ok) {
        setShowSuccess(true);
        if (onSuccess) onSuccess();
        router.refresh();
      } else {
        const errorData = await res.json();
        toast.error("Gagal menyimpan draft: " + (errorData.error || "Unknown error"));
      }
    } catch (err: any) {
      toast.error("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative">
        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-800 transition-colors bg-gray-100 rounded-full z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {showSuccess ? (
          <div className="p-8 pt-12 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
            <h3 className="text-2xl font-bold text-[#0A1024] mb-3">Draft Berhasil Ditambahkan!</h3>
            <p className="text-[#6E7980] mb-8 leading-relaxed text-sm max-w-md mx-auto">
              Dokumen draft competition ({tab}) berhasil disimpan.
            </p>
            <button
              type="button"
              onClick={handleClose}
              className="w-full bg-[#FFC700] hover:bg-[#e6b400] text-[#0A1024] font-bold py-3.5 rounded-xl transition-colors shadow-sm cursor-pointer"
            >
              Selesai
            </button>
          </div>
        ) : (
          <div className="p-8 pt-10">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-[#0A1024] mb-1">Tambah Draft Competition</h2>
              <p className="text-sm text-gray-600">
                Lengkapi formulir di bawah ini untuk mengunggah dokumen draft competition.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 px-0.5">
              {/* 1. Tipe Dokumen (Tab Dropdown) */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-[#0A1024] block">
                  Jenis Dokumen <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={tab}
                    onChange={(e) => setTab(e.target.value as any)}
                    className="w-full bg-[#F4F4F5] border border-transparent rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-inset focus:ring-[#FFC700] focus:border-[#FFC700] transition-all text-[#0A1024] appearance-none pr-10 cursor-pointer font-medium"
                  >
                    <option value="Guidebook">Guidebook</option>
                    <option value="Proposal">Proposal</option>
                    <option value="Pitch Deck">Pitch Deck</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* 2. Judul / Nama Lomba */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-[#0A1024] block">
                  Nama Lomba / Judul Draft <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Masukkan Nama Lomba / Judul Draft"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#F4F4F5] border border-transparent rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-inset focus:ring-[#FFC700] focus:border-[#FFC700] transition-all text-[#0A1024]"
                />
              </div>

              {/* 3. Penyelenggara Lomba (Khusus Proposal & Pitch Deck) */}
              {tab !== "Guidebook" && (
                <div className="space-y-1.5 animate-in fade-in duration-150">
                  <label className="text-sm font-semibold text-[#0A1024] block">Penyelenggara Lomba</label>
                  <input
                    type="text"
                    placeholder="Nama penyelenggara lomba (opsional)"
                    value={organizer}
                    onChange={(e) => setOrganizer(e.target.value)}
                    className="w-full bg-[#F4F4F5] border border-transparent rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-inset focus:ring-[#FFC700] focus:border-[#FFC700] transition-all text-[#0A1024]"
                  />
                </div>
              )}

              {/* 4. Tipe Lomba (Belmawa, Non-Belmawa, Internal) */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-[#0A1024] block">
                  Tipe Lomba <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-[#F4F4F5] border border-transparent rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-inset focus:ring-[#FFC700] focus:border-[#FFC700] transition-all text-[#0A1024] appearance-none pr-10 cursor-pointer font-medium"
                  >
                    <option value="Belmawa">Belmawa</option>
                    <option value="Non-Belmawa">Non-Belmawa</option>
                    <option value="Internal">Internal</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* 5. Jenis Lomba (Bidang / Skills) */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-[#0A1024] block">
                  Jenis Lomba (Bidang) <span className="text-red-500">*</span>
                </label>

                <div className="relative">
                  <select
                    value=""
                    onChange={(e) => handleBidangChange(e.target.value)}
                    className="w-full bg-[#F4F4F5] border border-transparent rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-inset focus:ring-[#FFC700] focus:border-[#FFC700] transition-all text-[#0A1024] appearance-none pr-10 cursor-pointer font-medium"
                  >
                    <option value="">Pilih bidang lomba</option>
                    {COMPETITION_TYPES.filter((type) => !selectedSkills.includes(type)).map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>

                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    placeholder="Tambah bidang kustom..."
                    value={customSkill}
                    onChange={(e) => setCustomSkill(e.target.value)}
                    onKeyDown={handleAddCustomSkill}
                    className="flex-1 bg-[#F4F4F5] border border-transparent rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-inset focus:ring-[#FFC700] focus:border-[#FFC700] transition-all text-[#0A1024]"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomSkill}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors"
                  >
                    Tambah
                  </button>
                </div>

                {selectedSkills.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {selectedSkills.map((skill) => (
                      <span
                        key={skill}
                        className="flex items-center justify-center gap-1.5 rounded-full bg-[#FFF9E6] text-[#0A1024] border border-[#FFC700] px-2.5 py-1 text-[11px] font-semibold leading-none h-[32px]"
                      >
                        <span className="flex items-center leading-none">{skill}</span>
                        <button
                          type="button"
                          onClick={() => setSelectedSkills((prev) => prev.filter((item) => item !== skill))}
                          className="flex h-4 w-4 items-center justify-center rounded-full text-[#0A1024]/70 hover:text-[#0A1024] p-0 m-0 shrink-0"
                          aria-label={`Hapus ${skill}`}
                        >
                          <span className="leading-none">×</span>
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* 6. Deskripsi */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-[#0A1024] block">Deskripsi</label>
                <textarea
                  rows={3}
                  placeholder="Deskripsi singkat mengenai panduan atau alur pendaftaran lomba..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#F4F4F5] border border-transparent rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-inset focus:ring-[#FFC700] focus:border-[#FFC700] transition-all text-[#0A1024] resize-none"
                />
              </div>

              {/* 7. Upload Document PDF Only (Drag & Drop) */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-[#0A1024] block">
                  Upload Dokumen Draft (PDF Only) <span className="text-red-500">*</span>
                </label>

                {pdfFile || pdfUrl ? (
                  <div className="flex items-center justify-between bg-[#FFF9E6] border border-[#FFC700] rounded-2xl p-4">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-10 h-10 bg-[#FFC700] text-[#0A1024] rounded-xl flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="truncate">
                        <p className="text-sm font-semibold text-[#0A1024] truncate">
                          {pdfFile ? pdfFile.name : pdfUrl.split("/").pop()}
                        </p>
                        <p className="text-xs text-green-700 font-medium">PDF berhasil diunggah</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removePdfFile}
                      className="p-2 text-red-500 hover:bg-red-100 rounded-xl transition-colors shrink-0 ml-2"
                      title="Hapus file"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div
                    className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                      isDragging
                        ? "border-[#FFC700] bg-[#FFF9E6]"
                        : "border-gray-300 bg-[#F4F4F5]/50 hover:bg-[#F4F4F5]"
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="w-14 h-14 bg-[#FFF9E6] rounded-full flex items-center justify-center mb-3 shadow-xs">
                      {isUploadingPdf ? (
                        <div className="w-6 h-6 rounded-full border-2 border-[#FFC700] border-t-transparent animate-spin" />
                      ) : (
                        <Upload className="w-7 h-7 text-[#FFC700]" />
                      )}
                    </div>
                    <p className="font-semibold text-sm text-[#0A1024]">
                      {isUploadingPdf
                        ? "Mengunggah berkas PDF..."
                        : "Drag & drop file PDF di sini atau klik untuk browse"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Format khusus PDF (Maksimal 15MB)</p>
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,application/pdf"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      disabled={isUploadingPdf}
                    />
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading || isUploadingPdf}
                  className="w-full bg-[#FFC700] hover:bg-[#e6b400] text-[#0A1024] font-bold py-3.5 rounded-xl transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading && <div className="w-5 h-5 rounded-full border-2 border-black border-t-transparent animate-spin" />}
                  {loading ? "Menyimpan Draft..." : "Simpan Draft Competition"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
