"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronRight, FileText } from "lucide-react";
import toast from "react-hot-toast";

const PROKER_OPTIONS = [
  "Pembinaan Lomba Satria Data",
  "Master Design Systems",
  "Workshop UI/UX",
  "Rapat Koordinasi",
  "Audit Inventaris",
];

export default function BuatLaporanPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [namaProker, setNamaProker] = useState("");
  const [catatan, setCatatan] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const acceptFile = (candidate: File | undefined) => {
    if (!candidate) return;
    if (candidate.type !== "application/pdf") {
      toast.error("File harus berformat PDF");
      return;
    }
    setFile(candidate);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    acceptFile(e.dataTransfer.files?.[0]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error("Silahkan unggah file laporan (PDF)");
      return;
    }
    toast.success("Laporan berhasil dibuat");
    router.push("/aslab-proker");
  };

  return (
    <div className="min-h-screen bg-[#FBFBFB] relative overflow-hidden">
      <div className="w-full max-w-3xl p-8 relative z-10">
        <h1 className="text-[22px] sm:text-3xl md:text-4xl font-bold text-[#0A1024] mb-2">Laporan Program Kerja</h1>
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <Link href="/aslab-proker" className="hover:text-gray-600 transition-colors">Program Kerja</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-600 font-medium">Buat Laporan</span>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 space-y-6">
          <div>
            <label className="block text-sm text-[#0A1024] mb-2">Nama Program Kerja</label>
            <div className="relative">
              <select
                value={namaProker}
                onChange={(e) => setNamaProker(e.target.value)}
                className="w-full bg-[#F5F5F5] rounded-lg px-4 py-3 pr-10 text-sm text-[#0A1024] outline-none focus:ring-2 focus:ring-[#FFC700] appearance-none"
                required
              >
                <option value="" disabled>Pilih program kerja</option>
                {PROKER_OPTIONS.map((proker) => (
                  <option key={proker} value={proker}>{proker}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            </div>
          </div>

          <div>
            <label className="block text-sm text-[#0A1024] mb-2">Catatan Program Kerja</label>
            <textarea
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Masukkan catatan program kerja"
              rows={4}
              className="w-full bg-[#F5F5F5] rounded-lg px-4 py-3 text-sm text-[#0A1024] outline-none focus:ring-2 focus:ring-[#FFC700] resize-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-[#0A1024] mb-2">Masukkan Laporan</label>
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl py-12 flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors ${
                isDragging ? "border-[#FFC700] bg-[#FFF9E6]" : "border-gray-300 hover:border-gray-400"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => acceptFile(e.target.files?.[0])}
              />
              <div className="w-14 h-14 rounded-full bg-[#FFF3CC] flex items-center justify-center">
                <FileText className="w-6 h-6 text-[#FFC700]" />
              </div>
              {file ? (
                <p className="font-semibold text-sm text-[#0A1024]">{file.name}</p>
              ) : (
                <>
                  <p className="font-bold text-sm text-[#0A1024]">Drag & drop file here</p>
                  <p className="text-xs text-gray-400">Supported only PDF</p>
                </>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-[#FFC700] text-[#0A1024] font-bold py-3.5 rounded-lg text-sm hover:bg-[#e6b400] transition-colors"
          >
            Buat Laporan
          </button>
        </form>
      </div>

      <div className="absolute bottom-0 right-0 pointer-events-none w-[180px] h-[140px] md:w-[240px] md:h-[180px] z-0 select-none flex items-end justify-end">
        <Image
          src="/assets/matchmaking/cropped-yellowcircle.svg"
          alt=""
          width={240}
          height={180}
          className="object-right-bottom object-contain m-0 p-0 block"
        />
      </div>
    </div>
  );
}
