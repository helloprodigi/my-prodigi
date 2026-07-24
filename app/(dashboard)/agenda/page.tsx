"use client";

import { useState, useEffect } from "react";
import { Plus, Users, Search, RefreshCw, Calendar, Clock, Download, Check } from "lucide-react";
import QRCode from "react-qr-code";

const posisiOptions: Record<string, string[]> = {
  "EXTERNAL": ["Event Organizer", "Media", "Partnership"],
  "INTERNAL": ["Competitive Programming", "Cyber", "Data Mining", "Entrepreneur", "Human Capital", "Inovasi", "Product Team"],
  "INTI": ["Bendahara", "Ketua", "Sekretaris I", "Sekretaris II", "Vice President External", "Vice President Internal", "Wakil Ketua"]
};

interface Agenda {
  id: string;
  nama: string;
  divisi: string;
  waktuMulai: string;
  waktuSelesai: string;
  jumlahHadir: number;
  jumlahAssigned: number;
  kodeQrDatang: string;
  kodeQrPulang: string;
}

export default function AgendaAdminPage() {
  const [activeTab, setActiveTab] = useState<"buat" | "riwayat">("buat");
  
  // Buat Agenda State
  const [namaShift, setNamaShift] = useState("");
  const [waktuMulai, setWaktuMulai] = useState("");
  const [waktuSelesai, setWaktuSelesai] = useState("");
  const [divisi, setDivisi] = useState("");
  const [posisi, setPosisi] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  
  // QR State
  const [createdAgenda, setCreatedAgenda] = useState<Agenda | null>(null);
  const [showQr, setShowQr] = useState<"datang" | "pulang">("datang");
  
  // Riwayat State
  const [riwayat, setRiwayat] = useState<Agenda[]>([]);

  useEffect(() => {
    if (activeTab === "riwayat") {
      fetch("/api/absensi/agenda-divisi")
        .then(res => res.json())
        .then(data => setRiwayat(data));
    }
  }, [activeTab]);

  const handleBuatAgenda = async () => {
    if (!namaShift || !waktuMulai || !waktuSelesai || !divisi) {
      alert("Harap lengkapi semua field yang wajib diisi.");
      return;
    }

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
        alert("Agenda berhasil dibuat!");
      } else {
        alert("Gagal membuat agenda");
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kelola Agenda</h1>
          <p className="text-gray-500">Atur agenda kegiatan per divisi dan pantau kehadiran.</p>
        </div>
      </div>

      <div className="flex space-x-1 bg-gray-100 border border-gray-200 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab("buat")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === "buat" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Buat Agenda
        </button>
        <button
          onClick={() => setActiveTab("riwayat")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === "riwayat" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Riwayat
        </button>
      </div>

      {activeTab === "buat" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6 space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">Detail Agenda</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Agenda</label>
                  <input 
                    type="text" 
                    value={namaShift}
                    onChange={(e) => setNamaShift(e.target.value)}
                    placeholder="Contoh: Rapat Koordinasi..."
                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                  <textarea 
                    value={deskripsi}
                    onChange={(e) => setDeskripsi(e.target.value)}
                    placeholder="Opsional: Deskripsi agenda..."
                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent h-24 resize-none"
                  ></textarea>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Waktu Mulai</label>
                    <input 
                      type="datetime-local" 
                      value={waktuMulai}
                      onChange={(e) => setWaktuMulai(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Waktu Selesai</label>
                    <input 
                      type="datetime-local" 
                      value={waktuSelesai}
                      onChange={(e) => setWaktuSelesai(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Divisi</label>
                  <select 
                    value={divisi}
                    onChange={(e) => {
                      setDivisi(e.target.value);
                      setPosisi(""); // Reset posisi when divisi changes
                    }}
                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent appearance-none"
                  >
                    <option value="">Semua Divisi</option>
                    <option value="INTI">INTI</option>
                    <option value="EXTERNAL">EXTERNAL</option>
                    <option value="INTERNAL">INTERNAL</option>
                  </select>
                </div>
                
                {divisi && divisi !== "Semua Divisi" && posisiOptions[divisi] && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Posisi (Opsional)</label>
                    <select 
                      value={posisi}
                      onChange={(e) => setPosisi(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent appearance-none"
                    >
                      <option value="">Semua Posisi</option>
                      {posisiOptions[divisi].map((pos, idx) => (
                        <option key={idx} value={pos}>{pos}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-gray-200">
                <button 
                  onClick={handleBuatAgenda}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" /> Buat QR Code Absensi
                </button>
              </div>
            </div>
          </div>

          {/* QR Result Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6 sticky top-6 text-center">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">QR Code Absensi</h2>
              
              {!createdAgenda ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <div className="w-48 h-48 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center mb-4 bg-gray-50">
                    <span className="text-sm">QR Code akan muncul disini</span>
                  </div>
                  <p className="text-sm">Silakan buat agenda terlebih dahulu.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex bg-gray-100 rounded-lg p-1 w-fit mx-auto mb-6">
                    <button 
                      onClick={() => setShowQr("datang")}
                      className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${showQr === "datang" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                    >
                      QR Datang
                    </button>
                    <button 
                      onClick={() => setShowQr("pulang")}
                      className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${showQr === "pulang" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                    >
                      QR Pulang
                    </button>
                  </div>
                  
                  <div className="bg-white p-4 border border-gray-200 shadow-sm rounded-xl inline-block">
                    <QRCode 
                      value={`${window.location.origin}/scan-absensi?token=${showQr === "datang" ? createdAgenda.kodeQrDatang : createdAgenda.kodeQrPulang}&type=${showQr}`}
                      size={200}
                    />
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-900">{createdAgenda.nama}</h3>
                    <p className="text-sm text-gray-500 mt-1">{new Date(createdAgenda.waktuMulai).toLocaleString('id-ID')}</p>
                    <p className="text-sm text-red-600 mt-2 font-medium">Tipe: {showQr === "datang" ? "Absen Datang" : "Absen Pulang"}</p>
                  </div>
                  
                  <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2">
                    <Download className="w-4 h-4" /> Download QR
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "riwayat" && (
        <div className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-6 py-4 font-medium">NAMA AGENDA</th>
                  <th className="px-6 py-4 font-medium">DEPARTMEN</th>
                  <th className="px-6 py-4 font-medium">TANGGAL & WAKTU</th>
                  <th className="px-6 py-4 font-medium">JUMLAH HADIR</th>
                  <th className="px-6 py-4 font-medium">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {riwayat.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Belum ada riwayat agenda</td>
                  </tr>
                ) : (
                  riwayat.map((agenda) => (
                    <tr key={agenda.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{agenda.nama}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">
                          {agenda.divisi}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(agenda.waktuMulai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}, {new Date(agenda.waktuMulai).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} - {new Date(agenda.waktuSelesai).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {agenda.jumlahHadir} Aslab
                      </td>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => window.open(`/api/absensi/agenda-divisi/${agenda.id}/download`, '_blank')}
                          className="px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Unduh Daftar Hadir
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
