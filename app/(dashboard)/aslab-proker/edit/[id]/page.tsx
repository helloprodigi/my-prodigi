"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import toast from "react-hot-toast";

function toDateInputValue(iso: string) {
  return iso ? iso.slice(0, 10) : "";
}

export default function EditProkerPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [divisi, setDivisi] = useState("");
  const [nama, setNama] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [tanggalMulai, setTanggalMulai] = useState("");
  const [tanggalSelesai, setTanggalSelesai] = useState("");

  useEffect(() => {
    fetch(`/api/proker/${params.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.programKerja) {
          toast.error("Program kerja tidak ditemukan");
          router.push("/aslab-proker");
          return;
        }
        const pk = data.programKerja;
        setDivisi(pk.divisi);
        setNama(pk.nama);
        setDeskripsi(pk.deskripsi || "");
        setTanggalMulai(toDateInputValue(pk.tanggalMulai));
        setTanggalSelesai(toDateInputValue(pk.tanggalSelesai));
      })
      .catch(() => toast.error("Gagal memuat program kerja"))
      .finally(() => setIsLoading(false));
  }, [params.id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch(`/api/proker/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama, deskripsi, tanggalMulai, tanggalSelesai }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Gagal menyimpan perubahan");
        return;
      }
      toast.success("Program kerja berhasil diperbarui");
      router.push("/aslab-proker");
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setIsSaving(false);
    }
  };

  const handleBatalkan = async () => {
    if (!confirm("Batalkan program kerja ini? Tindakan ini tidak dapat dibatalkan.")) return;
    setIsCancelling(true);
    try {
      const res = await fetch(`/api/proker/${params.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Gagal membatalkan program kerja");
        return;
      }
      toast.success("Program kerja dibatalkan");
      router.push("/aslab-proker");
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBFBFB] relative overflow-hidden">
      <div className="w-full max-w-3xl p-8 relative z-10">
        <h1 className="text-[22px] sm:text-3xl md:text-4xl font-bold text-[#0A1024] mb-2">Edit Program Kerja</h1>
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <Link href="/aslab-proker" className="hover:text-gray-600 transition-colors">Program Kerja</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-600 font-medium">Edit Program Kerja</span>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-2xl p-8 text-sm text-gray-400">Memuat...</div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 space-y-6">
            <div>
              <label className="block text-sm text-[#0A1024] mb-2">Divisi</label>
              <input
                type="text"
                value={divisi}
                disabled
                className="w-full bg-[#F0F0F0] rounded-lg px-4 py-3 text-sm text-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm text-[#0A1024] mb-2">Nama Program Kerja</label>
              <input
                type="text"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                className="w-full bg-[#F5F5F5] rounded-lg px-4 py-3 text-sm text-[#0A1024] outline-none focus:ring-2 focus:ring-[#FFC700]"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-[#0A1024] mb-2">Deskripsi</label>
              <textarea
                value={deskripsi}
                onChange={(e) => setDeskripsi(e.target.value)}
                rows={4}
                className="w-full bg-[#F5F5F5] rounded-lg px-4 py-3 text-sm text-[#0A1024] outline-none focus:ring-2 focus:ring-[#FFC700] resize-none"
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

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleBatalkan}
                disabled={isCancelling || isSaving}
                className="bg-white text-red-600 border border-red-200 font-semibold px-5 py-3 rounded-lg text-sm hover:bg-red-50 transition-colors disabled:opacity-60"
              >
                {isCancelling ? "Membatalkan..." : "Batalkan Proker"}
              </button>
              <button
                type="submit"
                disabled={isSaving || isCancelling}
                className="flex-1 bg-[#FFC700] text-[#0A1024] font-bold py-3 rounded-lg text-sm hover:bg-[#e6b400] transition-colors disabled:opacity-60"
              >
                {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>
          </form>
        )}
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
