"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";

import { divisions } from "@/lib/divisions";

export default function BuatProkerPage() {
  const router = useRouter();
  const [divisi, setDivisi] = useState("");
  const [nama, setNama] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [tanggalMulai, setTanggalMulai] = useState("");
  const [tanggalSelesai, setTanggalSelesai] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/proker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ divisi, nama, deskripsi, tanggalMulai, tanggalSelesai }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Gagal membuat program kerja");
        return;
      }
      toast.success("Program kerja berhasil dibuat");
      router.push("/aslab-proker");
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBFBFB] relative overflow-hidden">
      <div className="w-full max-w-3xl p-8 relative z-10">
        <h1 className="text-[22px] sm:text-3xl md:text-4xl font-bold text-[#0A1024] mb-2">Input Program Kerja</h1>
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <Link href="/aslab-proker" className="hover:text-gray-600 transition-colors">Program Kerja</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-600 font-medium">Buat Program Kerja</span>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 space-y-6">
          <div>
            <label className="block text-sm text-[#0A1024] mb-2">Divisi</label>
            <div className="relative">
              <select
                value={divisi}
                onChange={(e) => setDivisi(e.target.value)}
                className="w-full bg-[#F5F5F5] rounded-lg px-4 py-3 pr-10 text-sm text-[#0A1024] outline-none focus:ring-2 focus:ring-[#FFC700] appearance-none"
                required
              >
                <option value="" disabled>Pilih divisi</option>
                {divisions.map((d) => (
                  <option key={d.name} value={d.name}>{d.name}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            </div>
          </div>

          <div>
            <label className="block text-sm text-[#0A1024] mb-2">Nama Program Kerja</label>
            <input
              type="text"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Masukkan nama program kerja"
              className="w-full bg-[#F5F5F5] rounded-lg px-4 py-3 text-sm text-[#0A1024] outline-none focus:ring-2 focus:ring-[#FFC700]"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-[#0A1024] mb-2">Deskripsi</label>
            <textarea
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              placeholder="Masukkan deskripsi program kerja"
              rows={4}
              className="w-full bg-[#F5F5F5] rounded-lg px-4 py-3 text-sm text-[#0A1024] outline-none focus:ring-2 focus:ring-[#FFC700] resize-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-[#0A1024] mb-2">Waktu Pelaksanaan</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="date"
                value={tanggalMulai}
                onChange={(e) => setTanggalMulai(e.target.value)}
                className="w-full bg-[#F5F5F5] rounded-lg px-4 py-3 text-sm text-[#0A1024] outline-none focus:ring-2 focus:ring-[#FFC700]"
                required
              />
              <input
                type="date"
                value={tanggalSelesai}
                onChange={(e) => setTanggalSelesai(e.target.value)}
                className="w-full bg-[#F5F5F5] rounded-lg px-4 py-3 text-sm text-[#0A1024] outline-none focus:ring-2 focus:ring-[#FFC700]"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#FFC700] text-[#0A1024] font-bold py-3.5 rounded-lg text-sm hover:bg-[#e6b400] transition-colors disabled:opacity-60"
          >
            {isSubmitting ? "Menyimpan..." : "Buat Proker"}
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
