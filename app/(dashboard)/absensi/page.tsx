"use client";

import { useState, useEffect } from "react";
import { Plus, Users, Search, RefreshCw, Calendar, Clock, Download, Check, X, CheckCircle2 } from "lucide-react";
import QRCode from "react-qr-code";

interface Aslab {
  nim: string;
  nama: string;
  divisi: string;
  posisi: string;
}

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

export default function AbsensiAdminPage() {
  const [activeTab, setActiveTab] = useState<"buat" | "riwayat">("buat");
  
  // Buat Agenda State
  const [namaShift, setNamaShift] = useState("");
  const [waktuMulai, setWaktuMulai] = useState("");
  const [waktuSelesai, setWaktuSelesai] = useState("");
  const [divisi, setDivisi] = useState("");
  const [searchAslab, setSearchAslab] = useState("");
  const [allAslabs, setAllAslabs] = useState<Aslab[]>([]);
  const [selectedAslabs, setSelectedAslabs] = useState<Aslab[]>([]);
  
  // QR State
  const [createdAgenda, setCreatedAgenda] = useState<Agenda | null>(null);
  const [showQr, setShowQr] = useState<"datang" | "pulang">("datang");
  
  // Riwayat State
  const [riwayat, setRiwayat] = useState<Agenda[]>([]);
  
  // Modal states
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/users/aslab")
      .then(res => res.json())
      .then(data => setAllAslabs(data));
  }, []);

  useEffect(() => {
    if (activeTab === "riwayat") {
      fetch("/api/absensi/agenda")
        .then(res => res.json())
        .then(data => setRiwayat(data));
    }
  }, [activeTab]);

  const filteredAslabs = allAslabs
    .filter(a => (divisi ? a.divisi === divisi : true))
    .filter(a => a.nama.toLowerCase().includes(searchAslab.toLowerCase()));

  const toggleAslab = (aslab: Aslab) => {
    if (selectedAslabs.find(a => a.nim === aslab.nim)) {
      setSelectedAslabs(selectedAslabs.filter(a => a.nim !== aslab.nim));
    } else {
      setSelectedAslabs([...selectedAslabs, aslab]);
    }
  };

  const handleSelectAll = () => {
    if (selectedAslabs.length === filteredAslabs.length) {
      setSelectedAslabs([]);
    } else {
      setSelectedAslabs(filteredAslabs);
    }
  };

  const handleBuatAgenda = async () => {
    if (!namaShift || !waktuMulai || !waktuSelesai || !divisi || selectedAslabs.length === 0) {
      setErrorMessage("Harap lengkapi semua field dan pilih minimal 1 aslab.");
      return;
    }

    if (new Date(waktuSelesai) <= new Date(waktuMulai)) {
      setErrorMessage("Waktu Selesai harus setelah Waktu Mulai.");
      return;
    }

    try {
      const res = await fetch("/api/absensi/agenda", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama: namaShift,
          waktuMulai,
          waktuSelesai,
          divisi,
          assignedUsers: selectedAslabs.map(a => ({ nim: a.nim, nama: a.nama }))
        })
      });

      if (res.ok) {
        const data = await res.json();
        setCreatedAgenda(data.agenda);
        setSuccessMessage("Agenda berhasil dibuat!");
      } else {
        setErrorMessage("Gagal membuat agenda");
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#0A1024] sm:text-3xl md:text-4xl">Kelola Absensi</h1>
          <p className="text-gray-500 mt-1">Atur jadwal shift dan pantau kehadiran Asisten Lab.</p>
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
              <h2 className="text-lg font-semibold text-gray-900">Detail Jadwal Shift</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Jadwal Shift</label>
                  <input 
                    type="text" 
                    value={namaShift}
                    onChange={(e) => setNamaShift(e.target.value)}
                    placeholder="Contoh: Piket Reguler Divisi..."
                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Waktu Mulai</label>
                    <input 
                      type="datetime-local" 
                      value={waktuMulai}
                      onChange={(e) => {
                        const newMulai = e.target.value;
                        setWaktuMulai(newMulai);
                        if (waktuSelesai && newMulai && new Date(waktuSelesai) <= new Date(newMulai)) {
                          setWaktuSelesai("");
                          setErrorMessage("Waktu Selesai di-reset karena harus setelah Waktu Mulai");
                        }
                      }}
                      className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Waktu Selesai</label>
                    <input 
                      type="datetime-local" 
                      value={waktuSelesai}
                      min={waktuMulai}
                      onChange={(e) => {
                        const newSelesai = e.target.value;
                        if (waktuMulai && newSelesai && new Date(newSelesai) <= new Date(waktuMulai)) {
                          setErrorMessage("Waktu Selesai harus setelah Waktu Mulai");
                          return;
                        }
                        setWaktuSelesai(newSelesai);
                      }}
                      className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Divisi</label>
                  <select 
                    value={divisi}
                    onChange={(e) => setDivisi(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent appearance-none"
                  >
                    <option value="">Semua Divisi</option>
                    <option value="INTI">INTI</option>
                    <option value="EXTERNAL">EXTERNAL</option>
                    <option value="INTERNAL">INTERNAL</option>
                  </select>
                </div>

                <div>
                  <div className="flex justify-between items-end mb-2">
                    <label className="block text-sm font-medium text-gray-700">Pilih Asisten Lab (Assign)</label>
                    <button onClick={handleSelectAll} className="text-xs font-medium text-red-600 hover:text-red-700">
                      Pilih Semua
                    </button>
                  </div>
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="text" 
                      value={searchAslab}
                      onChange={(e) => setSearchAslab(e.target.value)}
                      placeholder="Cari nama asisten lab..."
                      className="w-full bg-gray-50 border border-gray-300 rounded-lg pl-10 pr-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                    />
                  </div>
                  <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50 h-64 overflow-y-auto">
                    {filteredAslabs.length === 0 ? (
                      <div className="p-4 text-center text-gray-500 text-sm">Tidak ada asisten lab ditemukan.</div>
                    ) : (
                      <div className="divide-y divide-gray-200">
                        {filteredAslabs.map(aslab => {
                          const isSelected = selectedAslabs.some(a => a.nim === aslab.nim);
                          return (
                            <div 
                              key={aslab.nim}
                              onClick={() => toggleAslab(aslab)}
                              className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${isSelected ? "bg-red-50" : "hover:bg-gray-100"}`}
                            >
                              <div className={`w-5 h-5 rounded border flex items-center justify-center ${isSelected ? "bg-red-600 border-red-600" : "bg-white border-gray-300"}`}>
                                {isSelected && <Check className="w-3 h-3 text-white" />}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">{aslab.nama}</p>
                                <p className="text-xs text-gray-500">{aslab.divisi} • {aslab.posisi}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    {selectedAslabs.length} asisten lab dipilih
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <button 
                  onClick={handleBuatAgenda}
                  className="w-full font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                  style={{ backgroundColor: '#FFC917', color: '#000000' }}
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
                  <th className="px-6 py-4 font-medium">Nama Agenda</th>
                  <th className="px-6 py-4 font-medium">Divisi</th>
                  <th className="px-6 py-4 font-medium">Waktu Mulai</th>
                  <th className="px-6 py-4 font-medium">Status Kehadiran</th>
                  <th className="px-6 py-4 font-medium">Aksi</th>
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
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                          {agenda.divisi}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(agenda.waktuMulai).toLocaleString('id-ID')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-full bg-gray-200 rounded-full h-2 max-w-[100px]">
                            <div 
                              className="bg-green-500 h-2 rounded-full" 
                              style={{ width: `${Math.min(100, (agenda.jumlahHadir / (agenda.jumlahAssigned || 1)) * 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-medium text-gray-600">{agenda.jumlahHadir}/{agenda.jumlahAssigned}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                          Lihat Detail
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

      {/* Error Popup Modal */}
      {errorMessage && (
        <div className="fixed inset-0 bg-black/80 z-[80] flex flex-col items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden relative flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-200 shadow-2xl">
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
            
            <h3 className="text-2xl font-bold text-[#0B132B] mb-4">
              Waduhh!!
            </h3>
            
            <p className="text-gray-700 font-medium leading-relaxed max-w-sm">
              {errorMessage}
            </p>
          </div>
        </div>
      )}

      {/* Success Popup Modal */}
      {successMessage && (
        <div className="fixed inset-0 bg-black/80 z-[80] flex flex-col items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden relative flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-300 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)]">
            <button 
              onClick={() => setSuccessMessage(null)}
              className="absolute top-5 right-5 p-2 text-gray-400 hover:text-gray-900 transition-colors rounded-full hover:bg-gray-100"
            >
              <X className="w-6 h-6" />
            </button>
            
            <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="w-14 h-14 text-green-500" />
            </div>
            
            <h3 className="text-2xl font-bold text-[#0B132B] mb-4">
              Hebat!
            </h3>
            
            <p className="text-gray-600 font-medium leading-relaxed max-w-sm">
              {successMessage}
            </p>
            
            <button 
              onClick={() => setSuccessMessage(null)}
              className="mt-8 w-full bg-[#0B132B] hover:bg-[#1a2b5e] text-white font-semibold py-3.5 rounded-xl transition-colors"
            >
              Oke, Mengerti
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
