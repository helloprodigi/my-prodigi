"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import toast from "react-hot-toast";

export default function BuatProkerPage() {
  const router = useRouter();
  const [nama, setNama] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [tanggalMulai, setTanggalMulai] = useState("");
  const [tanggalSelesai, setTanggalSelesai] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Program kerja berhasil dibuat");
    router.push("/aslab-proker");
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
            className="w-full bg-[#FFC700] text-[#0A1024] font-bold py-3.5 rounded-lg text-sm hover:bg-[#e6b400] transition-colors"
          >
            Buat Proker
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
