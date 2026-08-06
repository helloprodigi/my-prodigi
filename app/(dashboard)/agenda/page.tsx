"use client";

import { useState, useEffect } from "react";
import { 
  Plus, 
  Users, 
  Search, 
  Calendar, 
  Clock, 
  Download, 
  Check, 
  X, 
  CheckCircle2,
  Loader2,
  RefreshCw,
  QrCode,
  Eye, 
  Info,
  Building2,
  FileSpreadsheet
} from "lucide-react";
import QRCode from "react-qr-code";
import { downloadQRCode } from "@/lib/downloadQr";
import WaktuPelaksanaanPicker from "@/components/ui/WaktuPelaksanaanPicker";

const posisiOptions: Record<string, string[]> = {
  "EXTERNAL": ["Event Organizer", "Media", "Partnership"],
  "INTERNAL": ["Competitive Programming", "Cyber", "Data Mining", "Entrepreneur", "Human Capital", "Inovasi", "Product Team"],
  "INTI": ["Bendahara", "Ketua", "Sekretaris I", "Sekretaris II", "Vice President External", "Vice President Internal", "Wakil Ketua"]
};

interface Agenda {
  id: string;
  nama: string;
  divisi: string;
  deskripsi?: string | null;
  waktuMulai: string;
  waktuSelesai: string;
  jumlahHadir: number;
  jumlahAssigned: number;
  kodeQrDatang: string;
  kodeQrPulang: string;
}

export default function AgendaAdminPage() {
  const [activeTab, setActiveTab] = useState<"buat" | "riwayat">("buat");
  const [isLoading, setIsLoading] = useState(false);
  
  // Buat Agenda State
  const [namaShift, setNamaShift] = useState("");
  const [waktuMulai, setWaktuMulai] = useState("");
  const [waktuSelesai, setWaktuSelesai] = useState("");
  const [divisi, setDivisi] = useState("");
  const [posisi, setPosisi] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  
  // QR State (Panel Buat Agenda)
  const [createdAgenda, setCreatedAgenda] = useState<Agenda | null>(null);
  const [showQr, setShowQr] = useState<"datang" | "pulang">("datang");
  
  // Riwayat State
  const [riwayat, setRiwayat] = useState<Agenda[]>([]);
  const [isLoadingRiwayat, setIsLoadingRiwayat] = useState(false);
  
  // Riwayat QR Modal State
  const [selectedAgendaForQr, setSelectedAgendaForQr] = useState<Agenda | null>(null);
  const [modalQrType, setModalQrType] = useState<"datang" | "pulang">("datang");

  // Modal states
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchRiwayat = () => {
    setIsLoadingRiwayat(true);
    fetch("/api/absensi/agenda-divisi")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setRiwayat(data);
        } else {
          setRiwayat([]);
        }
      })
      .catch(() => setRiwayat([]))
      .finally(() => setIsLoadingRiwayat(false));
  };

  useEffect(() => {
    if (activeTab === "riwayat") {
      fetchRiwayat();
    }
  }, [activeTab]);

  const handleBuatAgenda = async () => {
    if (isLoading) return;

    if (!namaShift || !waktuMulai || !waktuSelesai || !divisi) {
      setErrorMessage("Harap lengkapi semua field yang wajib diisi.");
      return;
    }

    if (new Date(waktuSelesai) <= new Date(waktuMulai)) {
      setErrorMessage("Waktu Selesai harus setelah Waktu Mulai.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/absensi/agenda-divisi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama: namaShift,
          deskripsi,
          waktuMulai,
          waktuSelesai,
          divisi,
          posisi
        })
      });

      if (res.ok) {
        const data = await res.json();
        setCreatedAgenda(data.agenda);
        setSuccessMessage("Agenda berhasil dibuat! QR Code statis siap diunduh atau dibagikan ke grup.");
      } else {
        const errData = await res.json().catch(() => ({}));
        setErrorMessage(errData.error || errData.message || "Gagal membuat agenda");
      }
    } catch (error) {
      console.error(error);
      setErrorMessage("Terjadi kesalahan koneksi saat membuat agenda.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }) + " WIB";
  };

  const formatTimeOnly = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="p-6 md:p-10 w-full space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#0A1024] sm:text-3xl md:text-4xl">Kelola Agenda</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 border border-gray-200 p-1.5 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab("buat")}
          className={`px-5 py-2 rounded-md text-sm font-bold transition-all ${
            activeTab === "buat" ? "bg-white text-[#0B132B]" : "text-gray-500 hover:text-gray-800"
          }`}
        >
          Buat Agenda
        </button>
        <button
          onClick={() => setActiveTab("riwayat")}
          className={`px-5 py-2 rounded-md text-sm font-bold transition-all ${
            activeTab === "riwayat" ? "bg-white text-[#0B132B]" : "text-gray-500 hover:text-gray-800"
          }`}
        >
          Riwayat Agenda
        </button>
      </div>

      {/* Tab: Buat Agenda */}
      {activeTab === "buat" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.03)] rounded-2xl p-6 space-y-6">
              <h2 className="text-lg font-bold text-[#0B132B] border-b border-gray-100 pb-3 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#FFC727]" />
                Detail Agenda
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-[#0B132B] mb-2">Nama Agenda</label>
                  <input
                    type="text"
                    value={namaShift}
                    onChange={(e) => setNamaShift(e.target.value)}
                    placeholder="Contoh: Rapat Koordinasi Divisi..."
                    className="w-full bg-[#F5F5F5] rounded-lg px-4 py-3 text-sm text-[#0B132B] outline-none focus:ring-2 focus:ring-[#FFC727] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm text-[#0B132B] mb-2">Deskripsi</label>
                  <textarea
                    value={deskripsi}
                    onChange={(e) => setDeskripsi(e.target.value)}
                    placeholder="Opsional: Deskripsi / agenda pembahasan kegiatan..."
                    className="w-full bg-[#F5F5F5] rounded-lg px-4 py-3 text-sm text-[#0B132B] outline-none focus:ring-2 focus:ring-[#FFC727] transition-all h-24 resize-none"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-sm text-[#0B132B] mb-2">Waktu Pelaksanaan (24 Jam)</label>
                  <WaktuPelaksanaanPicker
                    waktuMulai={waktuMulai}
                    waktuSelesai={waktuSelesai}
                    onChange={(mulai, selesai) => {
                      setWaktuMulai(mulai);
                      setWaktuSelesai(selesai);
                      setErrorMessage(null);
                    }}
                    placeholder="Pilih waktu pelaksanaan"
                  />
                </div>

                <div>
                  <label className="block text-sm text-[#0B132B] mb-2">Pilih Divisi</label>
                  <select
                    value={divisi}
                    onChange={(e) => {
                      setDivisi(e.target.value);
                      setPosisi("");
                    }}
                    className="w-full bg-[#F5F5F5] rounded-lg px-4 py-3 text-sm text-[#0B132B] outline-none focus:ring-2 focus:ring-[#FFC727] transition-all appearance-none cursor-pointer"
                  >
                    <option value="">-- Pilih Divisi Sasaran --</option>
                    <option value="Semua Divisi">Semua Divisi</option>
                    <option value="INTI">INTI</option>
                    <option value="EXTERNAL">EXTERNAL</option>
                    <option value="INTERNAL">INTERNAL</option>
                  </select>
                </div>

                {divisi && divisi !== "Semua Divisi" && posisiOptions[divisi] && (
                  <div>
                    <label className="block text-sm text-[#0B132B] mb-2">Pilih Posisi (Opsional)</label>
                    <select
                      value={posisi}
                      onChange={(e) => setPosisi(e.target.value)}
                      className="w-full bg-[#F5F5F5] rounded-lg px-4 py-3 text-sm text-[#0B132B] outline-none focus:ring-2 focus:ring-[#FFC727] transition-all appearance-none cursor-pointer"
                    >
                      <option value="">Semua Posisi di {divisi}</option>
                      {posisiOptions[divisi].map((pos, idx) => (
                        <option key={idx} value={pos}>{pos}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-gray-100">
                <button
                  onClick={handleBuatAgenda}
                  disabled={isLoading}
                  className={`w-full font-bold py-3.5 rounded-lg transition-all flex items-center justify-center gap-2 text-sm bg-[#FFC700] text-[#0A1024] hover:bg-[#e6b400] ${
                    isLoading ? 'opacity-70 cursor-not-allowed shadow-none' : 'active:scale-[0.99] shadow-md'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin text-[#0A1024]" />
                      <span>Membuat QR Code...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5 text-[#0A1024]" />
                      <span>Buat QR Code Absensi Agenda</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* QR Result Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.03)] rounded-2xl p-6 sticky top-6 text-center space-y-4">
              <h2 className="text-base font-bold text-[#0B132B] flex items-center justify-center gap-2">
                <QrCode className="w-5 h-5 text-[#FFC727]" />
                QR Code Absensi
              </h2>
              
              {!createdAgenda ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400 space-y-3">
                  <div className="w-48 h-48 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center bg-gray-50/60 p-4">
                    <QrCode className="w-10 h-10 text-gray-300 mb-2" />
                    <span className="text-xs font-semibold text-gray-500">QR Code Statis</span>
                    <span className="text-[11px] text-gray-400 text-center mt-1">Akan muncul setelah agenda dibuat</span>
                  </div>
                  <p className="text-xs text-gray-500 max-w-[200px] leading-relaxed">
                    QR code dapat diunduh sekarang atau dilihat kembali di menu <strong>Riwayat</strong>.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex bg-gray-100/80 rounded-xl p-1 w-fit mx-auto border border-gray-200">
                    <button 
                      onClick={() => setShowQr("datang")}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${showQr === "datang" ? "bg-[#0B132B] text-white shadow-sm" : "text-gray-600 hover:text-gray-900"}`}
                    >
                      QR Datang
                    </button>
                    <button 
                      onClick={() => setShowQr("pulang")}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${showQr === "pulang" ? "bg-[#0B132B] text-white shadow-sm" : "text-gray-600 hover:text-gray-900"}`}
                    >
                      QR Pulang
                    </button>
                  </div>
                  
                  <div className="bg-white p-4 border-2 border-gray-200 shadow-sm rounded-2xl inline-block">
                    <QRCode 
                      id="agenda-created-qr-code-svg"
                      value={`${typeof window !== 'undefined' ? window.location.origin : ''}/scan-absensi?token=${showQr === "datang" ? createdAgenda.kodeQrDatang : createdAgenda.kodeQrPulang}&type=${showQr}`}
                      size={180}
                      level="Q"
                      fgColor="#0B132B"
                    />
                  </div>
                  
                  <div className="text-left bg-gray-50 p-3.5 rounded-2xl border border-gray-100 text-xs space-y-1">
                    <h3 className="font-bold text-[#0B132B]">{createdAgenda.nama}</h3>
                    <p className="text-gray-500 font-medium">
                      {new Date(createdAgenda.waktuMulai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}, {formatTimeOnly(createdAgenda.waktuMulai)} - {formatTimeOnly(createdAgenda.waktuSelesai)} WIB
                    </p>
                    <p className="text-[#0B132B] font-bold">
                      Tipe: {showQr === "datang" ? "Absen Datang" : "Absen Pulang"}
                    </p>
                  </div>

                  {/* Static Info Notice */}
                  <div className="bg-blue-50 text-blue-800 p-3 rounded-2xl text-[11px] font-medium border border-blue-200 flex items-start gap-2 text-left">
                    <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>QR ini statis dan tersimpan di <strong>Riwayat Agenda</strong>. Bagikan ke grup WhatsApp untuk di-scan peserta.</span>
                  </div>
                  
                  <button 
                    onClick={() => {
                      const formattedName = `QR_Agenda_${createdAgenda.nama}_${showQr === "datang" ? "Datang" : "Pulang"}`;
                      downloadQRCode("agenda-created-qr-code-svg", formattedName);
                    }}
                    className="w-full bg-[#FFC727] hover:bg-[#e5b323] text-[#0B132B] font-bold py-3 rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Download className="w-4 h-4" /> Download QR {showQr === "datang" ? "Datang" : "Pulang"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Riwayat Agenda */}
      {activeTab === "riwayat" && (
        <div className="bg-white border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.03)] rounded-lg overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-[#0B132B]">Riwayat Agenda & QR Absensi</h2>
              <p className="text-xs text-gray-500">Daftar agenda yang pernah dibuat. Klik "Lihat QR" untuk membagikan atau mengunduh ulang QR code.</p>
            </div>
            <button
              onClick={fetchRiwayat}
              disabled={isLoadingRiwayat}
              className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-md text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingRiwayat ? 'animate-spin' : ''}`} />
              Segarkan
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#F8F9FB] border-b border-gray-200 text-xs font-bold uppercase text-gray-600 tracking-wider">
                <tr>
                  <th className="px-6 py-4">NAMA AGENDA</th>
                  <th className="px-6 py-4">DEPARTEMEN / DIVISI</th>
                  <th className="px-6 py-4">TANGGAL & WAKTU</th>
                  <th className="px-6 py-4">JUMLAH HADIR</th>
                  <th className="px-6 py-4 text-center">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {isLoadingRiwayat ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center text-gray-400">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#FFC727] mb-2" />
                      <span className="text-xs font-medium">Memuat riwayat agenda...</span>
                    </td>
                  </tr>
                ) : riwayat.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center text-gray-400">
                      <Calendar className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                      <p className="font-semibold text-gray-600">Belum ada riwayat agenda</p>
                      <p className="text-xs text-gray-400 mt-1">Agenda yang kamu buat akan otomatis muncul di sini lengkap dengan QR code statisnya.</p>
                    </td>
                  </tr>
                ) : (
                  riwayat.map((agenda) => (
                    <tr key={agenda.id} className="hover:bg-yellow-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-[#0B132B]">{agenda.nama}</div>
                        {agenda.deskripsi && (
                          <div className="text-xs text-gray-400 line-clamp-1 mt-0.5">{agenda.deskripsi}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-bold bg-gray-100 text-gray-800 border border-gray-200">
                          <Building2 className="w-3 h-3 text-gray-500" />
                          {agenda.divisi}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-gray-600 whitespace-nowrap">
                        {formatDateTime(agenda.waktuMulai)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-100 rounded-full h-2 overflow-hidden border border-gray-200">
                            <div 
                              className="bg-green-500 h-full rounded-full transition-all" 
                              style={{ width: `${Math.min(100, ((agenda.jumlahHadir || 0) / (agenda.jumlahAssigned || 1)) * 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-[#0B132B]">
                            {agenda.jumlahHadir || 0} / {agenda.jumlahAssigned || 0}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          {/* Tombol Lihat QR (Solusi PM: Creator dapat melihat & membagikan QR kapan saja) */}
                          <button 
                            onClick={() => {
                              setSelectedAgendaForQr(agenda);
                              setModalQrType("datang");
                            }}
                            className="px-3.5 py-2 text-xs font-bold text-[#0B132B] bg-[#FFC727] hover:bg-[#e5b323] rounded-md transition-all shadow-sm flex items-center gap-1.5 shrink-0"
                            title="Buka & Unduh QR Absensi"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            <span>Lihat QR</span>
                          </button>

                          {/* Tombol Unduh Rekap Kehadiran */}
                          <button 
                            onClick={() => window.open(`/api/absensi/agenda-divisi/${agenda.id}/download`, '_blank')}
                            className="px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-md transition-colors flex items-center gap-1.5 shrink-0"
                            title="Unduh Daftar Hadir Excel/PDF"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5 text-gray-500" />
                            <span className="hidden sm:inline">Daftar Hadir</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Lihat & Download QR Agenda dari Riwayat */}
      {selectedAgendaForQr && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-md relative flex flex-col items-center text-center shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setSelectedAgendaForQr(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 transition-colors p-1 rounded-full hover:bg-gray-100"
            >
              <X className="w-6 h-6" />
            </button>
            
            <div className="w-12 h-12 rounded-2xl bg-[#0B132B] flex items-center justify-center text-[#FFC727] mb-3 shadow-md">
              <QrCode className="w-6 h-6" />
            </div>

            <h2 className="text-xl font-bold text-[#0B132B] mb-1">
              QR Code Absensi Agenda
            </h2>
            <p className="text-xs text-gray-500 font-semibold mb-4">
              {selectedAgendaForQr.nama} ({selectedAgendaForQr.divisi})
            </p>

            {/* Toggle QR Datang / Pulang */}
            <div className="flex bg-gray-100 rounded-xl p-1 w-fit mb-5 border border-gray-200">
              <button 
                type="button"
                onClick={() => setModalQrType("datang")}
                className={`px-5 py-2 rounded-lg text-xs font-bold transition-all ${modalQrType === "datang" ? "bg-[#0B132B] text-white shadow-sm" : "text-gray-600 hover:text-gray-900"}`}
              >
                QR Datang
              </button>
              <button 
                type="button"
                onClick={() => setModalQrType("pulang")}
                className={`px-5 py-2 rounded-lg text-xs font-bold transition-all ${modalQrType === "pulang" ? "bg-[#0B132B] text-white shadow-sm" : "text-gray-600 hover:text-gray-900"}`}
              >
                QR Pulang
              </button>
            </div>

            {/* QR Code Container */}
            <div className="bg-white p-4 border-2 border-gray-200 shadow-sm rounded-3xl mb-4 inline-block">
              <QRCode 
                id="modal-agenda-qr-code-svg"
                value={`${typeof window !== 'undefined' ? window.location.origin : ''}/scan-absensi?token=${modalQrType === "datang" ? selectedAgendaForQr.kodeQrDatang : selectedAgendaForQr.kodeQrPulang}&type=${modalQrType}`}
                size={210}
                level="Q"
                fgColor="#0B132B"
              />
            </div>

            {/* Static Notice */}
            <div className="bg-amber-50 text-amber-900 p-3 rounded-2xl text-xs font-medium border border-amber-200/80 mb-5 w-full text-left flex items-start gap-2.5">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold block text-amber-950">QR Code Statis Agenda</span>
                <span className="text-[11px] text-amber-800 leading-relaxed block">
                  QR Code ini tidak berubah-ubah. Kamu dapat membagikan gambar QR ini ke grup atau menampilkannya di proyektor saat kegiatan.
                </span>
              </div>
            </div>

            {/* Download Button */}
            <button 
              onClick={() => {
                const formattedName = `QR_Agenda_${selectedAgendaForQr.nama}_${modalQrType === "datang" ? "Datang" : "Pulang"}`;
                downloadQRCode("modal-agenda-qr-code-svg", formattedName);
              }}
              className="w-full bg-[#0B132B] hover:bg-[#1a2b5e] text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-md"
            >
              <Download className="w-4 h-4 text-[#FFC727]" />
              Download PNG ({modalQrType === "datang" ? "QR Datang" : "QR Pulang"})
            </button>
          </div>
        </div>
      )}

      {/* Error Popup Modal */}
      {errorMessage && (
        <div className="fixed inset-0 bg-black/80 z-[80] flex flex-col items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden relative flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-200 shadow-2xl">
            <button 
              onClick={() => setErrorMessage(null)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-900 transition-colors rounded-full hover:bg-gray-100"
            >
              <X className="w-6 h-6" />
            </button>
            
            <img 
              src="/assets/absen/pop-up/ups.png" 
              alt="Warning Icon" 
              className="w-28 h-28 mb-6 object-contain drop-shadow-md"
            />
            
            <h3 className="text-2xl font-bold text-[#0B132B] mb-3">
              Waduhh!!
            </h3>
            
            <p className="text-gray-700 font-medium leading-relaxed max-w-sm text-sm">
              {errorMessage}
            </p>
          </div>
        </div>
      )}

      {/* Success Popup Modal */}
      {successMessage && (
        <div className="fixed inset-0 bg-black/80 z-[80] flex flex-col items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden relative flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-300 shadow-2xl">
            <button 
              onClick={() => setSuccessMessage(null)}
              className="absolute top-5 right-5 p-2 text-gray-400 hover:text-gray-900 transition-colors rounded-full hover:bg-gray-100"
            >
              <X className="w-6 h-6" />
            </button>
            
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-5">
              <CheckCircle2 className="w-12 h-12 text-green-500" />
            </div>
            
            <h3 className="text-2xl font-bold text-[#0B132B] mb-2">
              Hebat!
            </h3>
            
            <p className="text-gray-600 font-medium leading-relaxed max-w-sm text-sm">
              {successMessage}
            </p>
            
            <button 
              onClick={() => setSuccessMessage(null)}
              className="mt-6 w-full bg-[#0B132B] hover:bg-[#1a2b5e] text-white font-bold py-3.5 rounded-xl transition-colors text-sm"
            >
              Oke, Mengerti
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
