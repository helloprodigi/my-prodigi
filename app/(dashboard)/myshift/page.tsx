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

  const handleOpenQRGenerator = () => {
    if (agendas.length === 0) {
      toast.error("Tidak ada jadwal shift pada tanggal ini.");
      return;
    }

    // Find active agenda right now based on time
    const now = new Date().getTime();
    const active = agendas.find(a => {
      const start = new Date(a.waktuMulai).getTime();
      const end = new Date(a.waktuSelesai).getTime();
      return now >= start && now <= end;
    });

    if (active) {
      setActiveAgenda(active);
    } else {
      // fallback to first agenda today
      setActiveAgenda(agendas[0]);
    }
    setShowQRModal(true);
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
      <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-3xl font-bold text-[#0B132B]">MyShift</h1>
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
                    Shift {agenda.nama} ({formatTime(agenda.waktuMulai)} - {formatTime(agenda.waktuSelesai)})
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
            onClick={() => setShowScannerModal(true)}
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
    </div>
  );
}

// Sub-component for Scanner to encapsulate html5-qrcode
function QRScannerModal({ onClose, location, onSuccess }: { onClose: () => void, location: {lat: number, lng: number} | null, onSuccess: () => void }) {
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    scannerRef.current = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    );

    scannerRef.current.render(
      async (decodedText) => {
        // Debounce scan
        if (isScanning) return;
        setIsScanning(true);

        try {
          if (!location) {
            toast.error("Lokasi Anda belum terdeteksi. Izinkan akses lokasi.");
            setIsScanning(false);
            return;
          }

          // Parse decoded text. Example: http://localhost:3000/scan-absensi?token=abc&type=datang
          const url = new URL(decodedText);
          const token = url.searchParams.get("token");
          const type = url.searchParams.get("type");

          if (!token || !type) {
            toast.error("Format QR Code tidak valid.");
            setIsScanning(false);
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
            toast.error(data.message || data.error || "Gagal absen", { id: "absensi" });
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
          setTimeout(() => setIsScanning(false), 3000);
        }
      },
      (error) => {
        // Ignored. HTML5QrcodeScanner throws error for every frame without a QR code.
      }
    );

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
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
          
          <div id="qr-reader" className="w-full rounded-xl overflow-hidden [&_video]:rounded-xl [&_#qr-reader__dashboard]:p-2 [&_button]:bg-[#0B132B] [&_button]:text-white [&_button]:px-4 [&_button]:py-2 [&_button]:rounded-lg [&_button]:mt-2"></div>
        </div>
        <div className="bg-gray-50 p-4 text-center border-t border-gray-100">
          <p className="text-sm text-gray-500">
            Arahkan kamera ke QR Code yang ditampilkan oleh teman Anda.
          </p>
        </div>
      </div>
    </div>
  );
}
