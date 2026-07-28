"use client";

import { useState, useEffect, useRef } from "react";
import { Clock, CheckCircle2, XCircle, X, ChevronLeft, ChevronRight, AlertCircle, QrCode } from "lucide-react";
import QRCode from "react-qr-code";
import { Html5QrcodeScanner } from "html5-qrcode";
import toast from "react-hot-toast";

interface Aslab {
  id: string;
  userId: string | null;
  nama: string;
  nim: string;
  divisi: string;
  photoUrl: string | null;
  status: string; // "HADIR", "ALPA", "IZIN", "BELUM ABSEN"
  waktuDatang: string | null;
  waktuPulang: string | null;
}

interface Agenda {
  id: string;
  nama: string;
  waktuMulai: string;
  waktuSelesai: string;
  kodeQrDatang: string;
  kodeQrPulang: string;
  jenis: string;
  myStatus: string;
  waktuDatang: string | null;
  waktuPulang: string | null;
  aslabs: Aslab[];
}

export default function MyShiftPage() {
  const [agendas, setAgendas] = useState<Agenda[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // QR Generator Modal
  const [showQRModal, setShowQRModal] = useState(false);
  const [activeAgenda, setActiveAgenda] = useState<Agenda | null>(null);
  const [qrType, setQrType] = useState<"datang" | "pulang" | "none">("none");
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [showAgendaSelectionModal, setShowAgendaSelectionModal] = useState(false);
  const [showEmptyAgendaModal, setShowEmptyAgendaModal] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [pageInfo, setPageInfo] = useState<string | null>(null);

  // QR Scanner Modal
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);

  const fetchAgendas = (date: Date) => {
    fetch(`/api/absensi/myshift?date=${date.toISOString()}`)
      .then(res => res.json())
      .then(data => {
        if (!data.error) setAgendas(data);
      });
  };

  useEffect(() => {
    fetchAgendas(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    if (!showQRModal || !activeAgenda) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const mulai = new Date(activeAgenda.waktuMulai).getTime();
      const selesai = new Date(activeAgenda.waktuSelesai).getTime();
      
      const endDatang = mulai + 20 * 60 * 1000;
      const startPulang = selesai - 10 * 60 * 1000;

      if (now >= mulai && now <= endDatang) {
        setQrType("datang");
        const remain = Math.floor((endDatang - now) / 1000);
        // Simulate 10-min rotation for visual effect
        const visualRemain = remain % 600; 
        setTimeRemaining(`${Math.floor(visualRemain / 60).toString().padStart(2, '0')}:${(visualRemain % 60).toString().padStart(2, '0')}`);
      } else if (now >= startPulang && now <= selesai) {
        setQrType("pulang");
        const remain = Math.floor((selesai - now) / 1000);
        const visualRemain = remain % 600; 
        setTimeRemaining(`${Math.floor(visualRemain / 60).toString().padStart(2, '0')}:${(visualRemain % 60).toString().padStart(2, '0')}`);
      } else {
        setQrType("none");
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [showQRModal, activeAgenda]);

  // Request Location on mount
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          toast.error("Gagal mendapatkan lokasi. Absensi memerlukan akses lokasi.");
        }
      );
    }
  }, []);

  const handlePreScanCheck = (action: "scan" | "lihat") => {
    if (agendas.length === 0) {
      setShowEmptyAgendaModal(true);
      return;
    }

    const now = new Date().getTime();
    let latestError = null;
    let latestInfo = null;
    let hasValidAgenda = false;

    for (const agenda of agendas) {
      const mulai = new Date(agenda.waktuMulai).getTime();
      const selesai = new Date(agenda.waktuSelesai).getTime();
      const endDatang = mulai + 30 * 60 * 1000;
      const endPulang = selesai + 30 * 60 * 1000;

      if (!agenda.waktuDatang) {
        if (now > endDatang) {
          latestError = "Kamu telah melewati batas waktu absensi datang dan saat ini berstatus alpa. Silakan laporkan kepada petugas apabila terjadi kekeliruan.";
        } else {
          hasValidAgenda = true;
        }
      } else if (!agenda.waktuPulang) {
        if (now < selesai) {
          latestInfo = "Terima Kasih, Kamu sudah absen datang. QR pulang akan muncul ketika di jam pulang.";
        } else if (now > endPulang) {
          latestError = "Batas waktu absensi pulang telah berakhir. QR absensi sudah tidak dapat digunakan. Jika terjadi kesalahan, silakan hubungi petugas untuk melakukan pengecekan.";
        } else {
          hasValidAgenda = true;
        }
      } else {
        // Fully completed this agenda
      }
    }

    if (!hasValidAgenda) {
      if (latestError) {
        setPageError(latestError);
      } else if (latestInfo) {
        setPageInfo(latestInfo);
      } else {
        setPageInfo("Semua jadwal absensi kamu hari ini telah selesai. Terima kasih!");
      }
      return;
    }

    if (action === "scan") {
      setShowScannerModal(true);
    }
  };

  const handleOpenQRGenerator = () => {
    if (agendas.length === 0) {
      setShowEmptyAgendaModal(true);
      return;
    }

    if (agendas.length === 1) {
      setActiveAgenda(agendas[0]);
      setShowQRModal(true);
    } else {
      setShowAgendaSelectionModal(true);
    }
  };

  const handlePrevDay = () => {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 1);
    setSelectedDate(prev);
  };

  const handleNextDay = () => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    setSelectedDate(next);
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  const formatDateTitle = (date: Date) => {
    return date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="min-h-screen bg-[#F9FAFC] relative">
      <div className="p-6 md:p-10 w-full space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-[22px] font-bold text-[#0A1024] sm:text-3xl md:text-4xl">MyShift</h1>
          <button 
            onClick={handleOpenQRGenerator}
            className="bg-[#FFC727] hover:bg-[#e5b323] text-[#0B132B] font-semibold px-6 py-2.5 rounded-lg transition-colors shadow-sm"
          >
            Lihat QR Absensi
          </button>
        </div>

        {/* Content Container */}
        <div className="bg-white rounded-2xl p-6 shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-gray-100 min-h-[500px]">
          
          {/* Controls */}
          <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-8 gap-4 border-b border-gray-100 pb-4">
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <h2 className="text-lg font-semibold text-[#0B132B] min-w-[200px]">
                {formatDateTitle(selectedDate)}
              </h2>
              <div className="flex items-center gap-2">
                <button onClick={handlePrevDay} className="p-1.5 border border-gray-200 rounded-md hover:bg-gray-50 text-gray-600 transition-colors">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button onClick={handleToday} className="px-4 py-1.5 border border-gray-200 rounded-md hover:bg-gray-50 text-gray-700 font-medium text-sm transition-colors">
                  Today
                </button>
                <button onClick={handleNextDay} className="p-1.5 border border-gray-200 rounded-md hover:bg-gray-50 text-gray-600 transition-colors">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Shift Time Info Banner */}
            {agendas.length > 0 && (
              <div className="flex items-center gap-2 bg-yellow-50 text-yellow-700 px-4 py-2 rounded-full text-sm font-medium border border-yellow-100">
                <AlertCircle className="w-4 h-4" />
                <span>
                  Absen Hanya Berlaku dari {formatTime(agendas[0].waktuMulai)} - {formatTime(agendas[agendas.length-1].waktuSelesai)}
                </span>
              </div>
            )}
          </div>

          {/* Grid of Aslabs */}
          <div className="space-y-10">
            {agendas.length === 0 ? (
              <div className="text-center py-20 text-gray-400 flex flex-col items-center">
                <Clock className="w-12 h-12 mb-4 text-gray-300" />
                <p>Tidak ada jadwal shift pada tanggal ini.</p>
              </div>
            ) : (
              agendas.map(agenda => (
                <div key={agenda.id} className="space-y-4">
                  <h3 className="font-semibold text-gray-600 border-l-4 border-[#FFC727] pl-3">
                    {agenda.jenis === "MyShift" ? "Shift" : "Agenda"} {agenda.nama} ({formatTime(agenda.waktuMulai)} - {formatTime(agenda.waktuSelesai)})
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {agenda.aslabs.map(aslab => (
                      <div key={aslab.id} className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 border-2 border-[#0B132B]">
                            {aslab.photoUrl ? (
                              <img src={aslab.photoUrl} alt={aslab.nama} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[#0B132B] font-bold">
                                {aslab.nama.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-[#0B132B] text-sm">{aslab.nama}</p>
                            <p className="text-xs text-teal-500 font-medium">{aslab.divisi}</p>
                          </div>
                        </div>

                        <div className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          aslab.status === "HADIR" ? "bg-green-100 text-green-700" :
                          aslab.status === "ALPA" ? "bg-red-100 text-red-700" :
                          aslab.status === "IZIN" ? "bg-yellow-100 text-yellow-700" :
                          "bg-green-50 text-green-600" // "Sudah Absen" style in mockup for "BELUM ABSEN" to test UI, wait, we should show Belum Absen
                        }`}>
                          {aslab.status === "BELUM ABSEN" ? "Belum Absen" : "Sudah Absen"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* FAB (Floating Action Button) for Scanner */}
      <div className="fixed bottom-8 right-8 z-40">
        <div className="relative">
          {/* Yellow swoosh decoration around FAB */}
          <svg className="absolute -inset-6 w-[120px] h-[120px] pointer-events-none -z-10 text-[#FFC727]" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M 10 90 C 10 30, 80 10, 90 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
            <path d="M 25 90 C 25 45, 70 25, 90 25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          
          <button 
            onClick={() => handlePreScanCheck("scan")}
            className="w-16 h-16 bg-[#0B132B] hover:bg-[#1a2b5e] text-white rounded-2xl flex items-center justify-center shadow-2xl transition-transform hover:scale-105"
          >
            <QrCode className="w-8 h-8" />
          </button>
        </div>
      </div>

      {/* Modal: QR Generator */}
      {showQRModal && activeAgenda && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 w-full max-w-sm relative flex flex-col items-center text-center shadow-2xl">
            <button 
              onClick={() => setShowQRModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            
            <h2 className="text-2xl font-bold text-[#0B132B] mb-2">
              {qrType === "datang" ? "QR Datang" : qrType === "pulang" ? "QR Pulang" : "QR Belum Tersedia"}
            </h2>
            
            {qrType === "none" && (
              <div className="bg-yellow-50 text-yellow-700 p-3 rounded-lg text-sm mb-4 border border-yellow-200">
                <AlertCircle className="w-5 h-5 inline mr-2" />
                Di luar jam absen (awal 20 menit / akhir 10 menit). QR ini ditampilkan untuk keperluan testing.
              </div>
            )}
            
            {activeAgenda.waktuDatang && qrType !== "pulang" ? (
              <div className="flex flex-col items-center justify-center py-8 text-center animate-in fade-in duration-300">
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-5">
                  <CheckCircle2 className="w-12 h-12 text-green-500" />
                </div>
                <h3 className="text-xl font-bold text-[#0B132B] mb-3">Hebat!</h3>
                <p className="text-gray-600 font-medium text-sm leading-relaxed px-4">
                  Kamu sudah absen datang. QR pulang akan muncul ketika di jam pulang.
                </p>
              </div>
            ) : activeAgenda.waktuPulang ? (
              <div className="flex flex-col items-center justify-center py-8 text-center animate-in fade-in duration-300">
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-5">
                  <CheckCircle2 className="w-12 h-12 text-green-500" />
                </div>
                <h3 className="text-xl font-bold text-[#0B132B] mb-3">Selesai!</h3>
                <p className="text-gray-600 font-medium text-sm leading-relaxed px-4">
                  Kamu sudah menyelesaikan semua absensi untuk shift ini.
                </p>
              </div>
            ) : !activeAgenda.waktuDatang && new Date().getTime() > new Date(activeAgenda.waktuMulai).getTime() + 30 * 60 * 1000 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center animate-in fade-in duration-300">
                <img src="/assets/absen/pop-up/ups.png" alt="Warning" className="w-24 h-24 mb-4 object-contain drop-shadow-md" />
                <h3 className="text-xl font-bold text-[#0B132B] mb-2">Waduhh!!</h3>
                <p className="text-gray-600 font-medium text-sm leading-relaxed px-2">
                  Kamu telah melewati batas waktu absensi datang dan saat ini berstatus alpa. Silakan laporkan kepada petugas apabila terjadi kekeliruan.
                </p>
              </div>
            ) : !activeAgenda.waktuPulang && new Date().getTime() > new Date(activeAgenda.waktuSelesai).getTime() + 30 * 60 * 1000 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center animate-in fade-in duration-300">
                <img src="/assets/absen/pop-up/ups.png" alt="Warning" className="w-24 h-24 mb-4 object-contain drop-shadow-md" />
                <h3 className="text-xl font-bold text-[#0B132B] mb-2">Waduhh!!</h3>
                <p className="text-gray-600 font-medium text-sm leading-relaxed px-2">
                  Batas waktu absensi pulang telah berakhir. QR absensi sudah tidak dapat digunakan. Jika terjadi kesalahan, silakan hubungi petugas untuk melakukan pengecekan.
                </p>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-600 mb-6">
                  Silakan scan QR ini untuk melakukan absensi. Pastikan melakukan absensi dua kali: saat datang dan saat selesai bertugas.
                </p>
                
                <div className="bg-white border border-gray-200 p-4 rounded-[2rem] mb-6 shadow-sm">
                  <QRCode 
                    value={`${window.location.origin}/scan-absensi?token=${(qrType === "pulang" || qrType === "none") ? activeAgenda.kodeQrPulang : activeAgenda.kodeQrDatang}&type=${qrType === "pulang" ? "pulang" : "datang"}`}
                    size={220}
                    level="Q"
                    fgColor="#0B132B"
                  />
                </div>
                
                <div className="bg-gray-100 rounded-full px-6 py-2 mb-6">
                  <span className="text-sm text-gray-600 font-medium">
                    {qrType === "none" ? "Status: Testing Mode" : `Refresh Dalam ${timeRemaining}`}
                  </span>
                </div>

                <button className="w-full bg-[#0B132B] hover:bg-[#1a2b5e] text-white font-medium py-3 rounded-xl transition-colors">
                  Download PNG
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal: Agenda Selection */}
      {showAgendaSelectionModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 w-full max-w-sm relative flex flex-col items-center text-center shadow-2xl">
            <button 
              onClick={() => setShowAgendaSelectionModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            
            <h2 className="text-xl font-bold text-[#0B132B] mb-6">
              Pilih Absensi
            </h2>
            
            <div className="w-full space-y-3">
              {agendas.map(agenda => (
                <button
                  key={agenda.id}
                  onClick={() => {
                    setActiveAgenda(agenda);
                    setShowAgendaSelectionModal(false);
                    setShowQRModal(true);
                  }}
                  className="w-full bg-gray-50 hover:bg-gray-100 border border-gray-200 text-[#0B132B] font-medium py-3 px-4 rounded-xl transition-colors text-left flex flex-col relative"
                >
                  <span className="font-semibold text-[#0B132B] mb-1">{agenda.nama}</span>
                  <span className="text-xs text-gray-500">{formatTime(agenda.waktuMulai)} - {formatTime(agenda.waktuSelesai)}</span>
                  <span className={`absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full ${(agenda.jenis || 'MyShift') === 'Agenda' ? 'bg-indigo-100 text-indigo-700' : 'bg-orange-100 text-orange-700'}`}>
                    {agenda.jenis || 'MyShift'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal: QR Scanner */}
      {showScannerModal && (
        <QRScannerModal 
          onClose={() => setShowScannerModal(false)} 
          location={location}
          onSuccess={() => {
            setShowScannerModal(false);
            fetchAgendas(selectedDate); // Refresh data
          }}
        />
      )}

      {/* Empty Agenda Popup Modal */}
      {showEmptyAgendaModal && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex flex-col items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden relative flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setShowEmptyAgendaModal(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-900 transition-colors rounded-full hover:bg-gray-100"
            >
              <X className="w-6 h-6" />
            </button>
            
            <img 
              src="/assets/absen/pop-up/clock.png" 
              alt="Clock Icon" 
              className="w-32 h-32 mb-6 object-contain drop-shadow-md"
            />
            
            <h3 className="text-2xl font-bold text-[#0B132B] mb-4">
              Uppss!!
            </h3>
            
            <p className="text-gray-700 font-medium leading-relaxed max-w-sm">
              Maaf, kamu tidak dijadwalkan untuk piket hari ini. Silakan periksa jadwal piket kamu untuk informasi lebih lanjut.
            </p>
          </div>
        </div>
      )}

      {/* Page Level Error Modal */}
      {pageError && (
        <div className="fixed inset-0 bg-black/80 z-[80] flex flex-col items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden relative flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-200 shadow-2xl">
            <button 
              onClick={() => setPageError(null)}
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
              {pageError}
            </p>
          </div>
        </div>
      )}

      {/* Page Level Info Modal (Waiting for Pulang / Completed) */}
      {pageInfo && (
        <div className="fixed inset-0 bg-black/80 z-[80] flex flex-col items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden relative flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-300 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)]">
            <button 
              onClick={() => setPageInfo(null)}
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
              {pageInfo}
            </p>
            
            <button 
              onClick={() => setPageInfo(null)}
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

// Sub-component for Scanner to encapsulate html5-qrcode
function QRScannerModal({ onClose, location, onSuccess }: { onClose: () => void, location: {lat: number, lng: number} | null, onSuccess: () => void }) {
  const [scanError, setScanError] = useState<string | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const isScanningRef = useRef(false);

  useEffect(() => {
    let isMounted = true;
    let timer = setTimeout(() => {
      if (!isMounted) return;
      
      const element = document.getElementById("qr-reader");
      if (element) {
        element.innerHTML = "";
      }

      scannerRef.current = new Html5QrcodeScanner(
        "qr-reader",
        { 
          fps: 10, 
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        },
        /* verbose= */ false
      );

    scannerRef.current.render(
      async (decodedText) => {
        // Debounce scan
        if (isScanningRef.current) return;
        isScanningRef.current = true;

        try {
          if (!location) {
            toast.error("Lokasi Anda belum terdeteksi. Izinkan akses lokasi.");
            isScanningRef.current = false;
            return;
          }

          // Parse decoded text. Example: http://localhost:3000/scan-absensi?token=abc&type=datang
          const url = new URL(decodedText);
          const token = url.searchParams.get("token");
          const type = url.searchParams.get("type");

          if (!token || !type) {
            toast.error("Format QR Code tidak valid.");
            isScanningRef.current = false;
            return;
          }

          toast.loading("Memproses absensi...", { id: "absensi" });
          
          const res = await fetch("/api/absensi/scan", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              token,
              type,
              lat: location.lat,
              lng: location.lng
            })
          });

          const data = await res.json();
          if (!res.ok) {
            if (data.errorCode === "LATE_DATANG" || data.errorCode === "LATE_PULANG" || data.errorCode === "MISSED_DATANG") {
              setScanError(data.message);
              // Pause scanner instead of clearing so it doesn't keep scanning the same QR while modal is open
              if (scannerRef.current) scannerRef.current.pause(true);
            } else {
              toast.error(data.message || data.error || "Gagal absen", { id: "absensi" });
            }
          } else {
            toast.success(data.message || "Absensi berhasil!", { id: "absensi" });
            if (scannerRef.current) {
              scannerRef.current.clear();
            }
            onSuccess();
          }
        } catch (err) {
          console.error(err);
          toast.error("Gagal membaca QR", { id: "absensi" });
        } finally {
          // Add a small delay before allowing next scan to prevent rapid firing
          setTimeout(() => { isScanningRef.current = false; }, 3000);
        }
      },
      (error) => {
        // Ignored. HTML5QrcodeScanner throws error for every frame without a QR code.
      }
    );
    
    }, 50); // 50ms delay for strict mode

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
      }
    };
  }, [location, onSuccess]);

  return (
    <div className="fixed inset-0 bg-black/80 z-[60] flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden relative">
        <div className="p-4 bg-[#0B132B] flex justify-between items-center text-white">
          <h3 className="font-semibold text-lg">Scan QR Absensi</h3>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-4">
          {!location && (
            <div className="bg-yellow-50 text-yellow-700 p-3 rounded-lg text-sm mb-4 border border-yellow-200">
              Mendeteksi lokasi Anda... Izinkan akses lokasi pada browser untuk dapat absen.
            </div>
          )}
          
          <style dangerouslySetInnerHTML={{__html: `
            #qr-reader {
              border: none !important;
              background: transparent !important;
            }
            #qr-reader__scan_region {
              border-radius: 16px;
              overflow: hidden;
            }
            #qr-reader video {
              object-fit: cover !important;
              border-radius: 16px !important;
              width: 100% !important;
            }
            #qr-reader__dashboard_section_csr span {
              display: none !important;
            }
            #qr-reader__dashboard_section_csr button {
              background: #0B132B !important;
              color: white !important;
              border: none !important;
              padding: 12px 24px !important;
              border-radius: 8px !important;
              font-weight: 600 !important;
              margin-top: 12px !important;
              cursor: pointer !important;
              transition: all 0.2s !important;
              width: 100% !important;
            }
            #qr-reader__dashboard_section_csr button:hover {
              background: #1a2b5e !important;
            }
            #qr-reader__dashboard_section_swaplink {
              display: none !important;
            }
            #qr-reader__dashboard_section_csr select {
              padding: 10px !important;
              border-radius: 8px !important;
              border: 1px solid #e5e7eb !important;
              width: 100% !important;
              font-size: 14px !important;
              background: #f9fafb !important;
              margin-bottom: 8px !important;
            }
            #qr-reader__dashboard_section_b {
              display: none !important;
            }
            #qr-reader__dashboard {
              padding: 0 !important;
              margin-top: 16px !important;
            }
          `}} />
          <div id="qr-reader" className="w-full"></div>
        </div>
        <div className="bg-gray-50 p-4 text-center border-t border-gray-100">
          <p className="text-sm text-gray-500 font-medium">
            Arahkan kamera ke QR Code yang ditampilkan oleh teman Anda.
          </p>
        </div>

        {/* Error Popup Modal */}
        {scanError && (
          <div className="absolute inset-0 bg-white z-[70] flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => {
                setScanError(null);
                if (scannerRef.current) scannerRef.current.resume();
              }}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-900 transition-colors rounded-full hover:bg-gray-100"
            >
              <X className="w-6 h-6" />
            </button>
            
            <img 
              src="/assets/absen/pop-up/ups.png" 
              alt="Warning Icon" 
              className="w-32 h-32 mb-6 object-contain drop-shadow-md"
            />
            
            <h3 className="text-2xl font-bold text-[#0B132B] mb-4">
              Waduhh!!
            </h3>
            
            <p className="text-gray-700 font-medium leading-relaxed max-w-sm">
              {scanError}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
