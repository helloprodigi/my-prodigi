"use client";

import { useState, useEffect } from "react";
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  AlertCircle, 
  Download, 
  CalendarPlus, 
  Plus, 
  Trash2, 
  Users, 
  Search, 
  Check, 
  Loader2,
  CalendarDays
} from "lucide-react";
import QRCode from "react-qr-code";
import { downloadQRCode } from "@/lib/downloadQr";
import toast from "react-hot-toast";

const ALL_DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
const DAYS_MAPPING: { [key: string]: number } = {
  "Senin": 1,
  "Selasa": 2,
  "Rabu": 3,
  "Kamis": 4,
  "Jumat": 5,
  "Sabtu": 6,
  "Minggu": 0
};

interface Aslab {
  id: string;
  userId: string | null;
  nama: string;
  nim: string;
  divisi: string;
  posisi?: string;
  jabatan?: string;
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

interface RegisteredAslab {
  id: string;
  userId: string | null;
  nim: string;
  nama: string;
  divisi: string;
  posisi: string;
  jabatan: string;
  photoUrl: string | null;
}

interface SessionForm {
  id?: string;
  namaSesi: string;
  waktuMulai: string;
  waktuSelesai: string;
  assignedAslabs: RegisteredAslab[];
}

interface DayForm {
  hari: string;
  dayOfWeek: number;
  sessions: SessionForm[];
}

export default function MyShiftPage() {
  const [userRole, setUserRole] = useState<string>("aslab");
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

  // Atur Jadwal Shift Modal
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleDays, setScheduleDays] = useState<DayForm[]>([]);
  const [allRegisteredAslabs, setAllRegisteredAslabs] = useState<RegisteredAslab[]>([]);
  const [aslabSearchQuery, setAslabSearchQuery] = useState<{ [key: string]: string }>({});
  const [aslabDropdownOpen, setAslabDropdownOpen] = useState<{ [key: string]: boolean }>({});
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(false);
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);
  const [scheduleModalError, setScheduleModalError] = useState<string | null>(null);

  // Load User Profile
  useEffect(() => {
    fetch("/api/profile")
      .then(res => res.json())
      .then(data => {
        if (data && data.role) {
          setUserRole(data.role);
        }
      })
      .catch(() => {});
  }, []);

  const fetchAgendas = (date: Date) => {
    fetch(`/api/absensi/myshift?date=${date.toISOString()}`)
      .then(res => res.json())
      .then(data => {
        if (!data.error && Array.isArray(data)) {
          setAgendas(data);
        }
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

  // Load Schedule data when opening modal
  const handleOpenScheduleModal = async () => {
    setIsLoadingSchedule(true);
    setScheduleModalError(null);
    setShowScheduleModal(true);

    try {
      // 1. Fetch registered aslabs
      const aslabRes = await fetch("/api/users/aslab");
      const aslabData = await aslabRes.json();
      if (Array.isArray(aslabData)) {
        setAllRegisteredAslabs(aslabData);
      }

      // 2. Fetch existing schedule templates
      const schedRes = await fetch("/api/absensi/myshift/schedule");
      const schedData = await schedRes.json();

      if (schedData && Array.isArray(schedData.days) && schedData.days.length > 0) {
        setScheduleDays(schedData.days);
      } else {
        // Default with Monday
        setScheduleDays([
          {
            hari: "Senin",
            dayOfWeek: 1,
            sessions: [
              {
                namaSesi: "Shift 1",
                waktuMulai: "08:00",
                waktuSelesai: "12:00",
                assignedAslabs: []
              }
            ]
          }
        ]);
      }
    } catch (e) {
      console.error("Failed to load schedule:", e);
      setScheduleModalError("Gagal memuat data jadwal shift.");
    } finally {
      setIsLoadingSchedule(false);
    }
  };

  const handleAddDay = (dayName: string) => {
    if (scheduleDays.some(d => d.hari === dayName)) {
      toast.error(`Hari ${dayName} sudah ditambahkan.`);
      return;
    }

    setScheduleDays(prev => [
      ...prev,
      {
        hari: dayName,
        dayOfWeek: DAYS_MAPPING[dayName] !== undefined ? DAYS_MAPPING[dayName] : 1,
        sessions: [
          {
            namaSesi: "Shift 1",
            waktuMulai: "08:00",
            waktuSelesai: "12:00",
            assignedAslabs: []
          }
        ]
      }
    ]);
  };

  const handleRemoveDay = (dayIndex: number) => {
    setScheduleDays(prev => prev.filter((_, idx) => idx !== dayIndex));
  };

  const handleAddSession = (dayIndex: number) => {
    setScheduleDays(prev => {
      const copy = [...prev];
      const targetDay = copy[dayIndex];
      const nextShiftNumber = targetDay.sessions.length + 1;
      targetDay.sessions.push({
        namaSesi: `Shift ${nextShiftNumber}`,
        waktuMulai: "13:00",
        waktuSelesai: "17:00",
        assignedAslabs: []
      });
      return copy;
    });
  };

  const handleRemoveSession = (dayIndex: number, sessionIndex: number) => {
    setScheduleDays(prev => {
      const copy = [...prev];
      copy[dayIndex].sessions = copy[dayIndex].sessions.filter((_, sIdx) => sIdx !== sessionIndex);
      return copy;
    });
  };

  const handleSessionFieldChange = (dayIndex: number, sessionIndex: number, field: "namaSesi" | "waktuMulai" | "waktuSelesai", value: string) => {
    setScheduleDays(prev => {
      const copy = [...prev];
      copy[dayIndex].sessions[sessionIndex][field] = value;
      return copy;
    });
  };

  const handleToggleAslabForSession = (dayIndex: number, sessionIndex: number, aslab: RegisteredAslab) => {
    setScheduleDays(prev => {
      const copy = [...prev];
      const session = copy[dayIndex].sessions[sessionIndex];
      const exists = session.assignedAslabs.some(a => a.nim === aslab.nim);

      if (exists) {
        session.assignedAslabs = session.assignedAslabs.filter(a => a.nim !== aslab.nim);
      } else {
        session.assignedAslabs.push(aslab);
      }
      return copy;
    });
  };

  const handleSaveSchedule = async () => {
    setScheduleModalError(null);

    // Validation
    if (scheduleDays.length === 0) {
      setScheduleModalError("Silakan tambahkan minimal 1 hari jadwal.");
      return;
    }

    for (const day of scheduleDays) {
      if (day.sessions.length === 0) {
        setScheduleModalError(`Hari ${day.hari} belum memiliki sesi waktu. Tambahkan minimal 1 sesi.`);
        return;
      }

      for (let sIdx = 0; sIdx < day.sessions.length; sIdx++) {
        const s = day.sessions[sIdx];
        if (!s.waktuMulai || !s.waktuSelesai) {
          setScheduleModalError(`Waktu mulai dan selesai pada hari ${day.hari} (${s.namaSesi || `Sesi ${sIdx + 1}`}) wajib diisi.`);
          return;
        }
        if (s.waktuSelesai <= s.waktuMulai) {
          setScheduleModalError(`Waktu selesai (${s.waktuSelesai}) harus setelah waktu mulai (${s.waktuMulai}) pada hari ${day.hari}.`);
          return;
        }
        if (s.assignedAslabs.length === 0) {
          setScheduleModalError(`Pilih minimal 1 Asisten Lab untuk bertugas pada hari ${day.hari} (${s.namaSesi || `Sesi ${sIdx + 1}`}).`);
          return;
        }
      }
    }

    setIsSavingSchedule(true);
    try {
      const res = await fetch("/api/absensi/myshift/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days: scheduleDays })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal menyimpan jadwal.");
      }

      toast.success("Jadwal MyShift berhasil disimpan dan diperbarui!");
      setShowScheduleModal(false);
      fetchAgendas(selectedDate);
    } catch (e: any) {
      setScheduleModalError(e.message || "Terjadi kesalahan saat menyimpan jadwal.");
    } finally {
      setIsSavingSchedule(false);
    }
  };

  const handleOpenQRGenerator = () => {
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
    return date.toLocaleDateString("id-ID", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
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
          <div>
            <h1 className="text-[22px] font-bold text-[#0A1024] sm:text-3xl md:text-4xl">MyShift</h1>
            <p className="text-gray-500 text-sm mt-1">Kelola dan pantau jadwal shift piket harian asisten lab</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {userRole === "admin" && (
              <button 
                onClick={handleOpenScheduleModal}
                className="flex-1 sm:flex-none bg-[#0B132B] hover:bg-[#1a2b5e] text-white font-medium px-5 py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 text-sm border border-[#0B132B]"
              >
                <CalendarPlus className="w-4 h-4 text-[#FFC727]" />
                Atur Jadwal Shift
              </button>
            )}
            <button 
              onClick={handleOpenQRGenerator}
              className="flex-1 sm:flex-none bg-[#FFC727] hover:bg-[#e5b323] text-[#0B132B] font-semibold px-6 py-2.5 rounded-xl transition-colors shadow-sm text-sm"
            >
              Lihat QR Absensi
            </button>
          </div>
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
                  Hari Ini
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
                  Absen Hanya Berlaku dari {formatTime(agendas[0].waktuMulai)} - {formatTime(agendas[agendas.length-1].waktuSelesai)} WIB
                </span>
              </div>
            )}
          </div>

          {/* Grid of Aslabs */}
          <div className="space-y-10">
            {agendas.length === 0 ? (
              <div className="text-center py-20 text-gray-400 flex flex-col items-center">
                <Clock className="w-12 h-12 mb-4 text-gray-300" />
                <p className="font-medium text-gray-600">Tidak ada jadwal shift pada hari ini.</p>
                {userRole === "admin" && (
                  <p className="text-xs text-gray-400 mt-2">
                    Klik tombol <span className="font-semibold text-gray-700">"Atur Jadwal Shift"</span> di atas untuk menambahkan template jadwal piket mingguan.
                  </p>
                )}
              </div>
            ) : (
              agendas.map(agenda => (
                <div key={agenda.id} className="space-y-4">
                  <h3 className="font-semibold text-gray-700 border-l-4 border-[#FFC727] pl-3 flex items-center justify-between">
                    <span>
                      {agenda.jenis === "MyShift" ? "Shift" : "Agenda"} {agenda.nama} ({formatTime(agenda.waktuMulai)} - {formatTime(agenda.waktuSelesai)} WIB)
                    </span>
                    <span className="text-xs font-normal text-gray-400">
                      {agenda.aslabs.length} Asisten Lab Bertugas
                    </span>
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {agenda.aslabs.map(aslab => (
                      <div key={aslab.id} className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors border border-gray-100 bg-white shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 border-2 border-[#0B132B] flex-shrink-0">
                            {aslab.photoUrl ? (
                              <img src={aslab.photoUrl} alt={aslab.nama} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[#0B132B] font-bold">
                                {aslab.nama.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-[#0B132B] text-sm line-clamp-1">{aslab.nama}</p>
                            <p className="text-xs text-teal-600 font-medium">{aslab.jabatan || aslab.divisi || "Asisten Lab"}</p>
                            <p className="text-[11px] text-gray-400">{aslab.nim}</p>
                          </div>
                        </div>

                        <div className={`px-3 py-1 text-xs font-semibold rounded-full flex-shrink-0 ${
                          aslab.status === "HADIR" ? "bg-green-100 text-green-700" :
                          aslab.status === "ALPA" ? "bg-red-100 text-red-700" :
                          aslab.status === "IZIN" ? "bg-yellow-100 text-yellow-700" :
                          "bg-gray-100 text-gray-500"
                        }`}>
                          {aslab.status === "HADIR" ? "Hadir" : 
                           aslab.status === "ALPA" ? "Alpa" : 
                           aslab.status === "IZIN" ? "Izin" : "Belum Absen"}
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

      {/* Modal: Atur Jadwal Shift (Admin Only) */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#0B132B] flex items-center justify-center text-[#FFC727]">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#0B132B]">Atur Jadwal Piket MyShift</h2>
                  <p className="text-xs text-gray-500">Jadwal berulang mingguan per hari (WIB) tanpa terikat tanggal spesifik</p>
                </div>
              </div>
              <button 
                onClick={() => setShowScheduleModal(false)}
                className="p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              
              {scheduleModalError && (
                <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 text-sm flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{scheduleModalError}</span>
                </div>
              )}

              {isLoadingSchedule ? (
                <div className="py-20 flex flex-col items-center justify-center text-gray-400 space-y-3">
                  <Loader2 className="w-8 h-8 animate-spin text-[#FFC727]" />
                  <p className="text-sm">Memuat data jadwal...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  
                  {/* Action Bar: Tambah Hari */}
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-[#F9FAFC] p-4 rounded-2xl border border-gray-100">
                    <span className="text-sm font-semibold text-gray-700">Daftar Hari Aktif ({scheduleDays.length} Hari)</span>
                    
                    <div className="flex flex-wrap items-center gap-2">
                      {ALL_DAYS.map(dayName => {
                        const isAdded = scheduleDays.some(d => d.hari === dayName);
                        return (
                          <button
                            key={dayName}
                            disabled={isAdded}
                            onClick={() => handleAddDay(dayName)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                              isAdded 
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                                : "bg-white text-[#0B132B] border border-gray-200 hover:border-[#FFC727] hover:bg-yellow-50 shadow-sm"
                            }`}
                          >
                            <Plus className="w-3.5 h-3.5" />
                            {dayName}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Days Builder List */}
                  {scheduleDays.length === 0 ? (
                    <div className="text-center py-16 text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                      <p className="text-sm">Belum ada hari yang ditambahkan. Silakan klik salah satu tombol hari di atas.</p>
                    </div>
                  ) : (
                    scheduleDays.map((dayItem, dayIndex) => (
                      <div key={dayItem.hari} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4 relative">
                        
                        {/* Day Card Header */}
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                          <div className="flex items-center gap-3">
                            <span className="px-3.5 py-1 bg-[#0B132B] text-white text-xs font-bold rounded-lg uppercase tracking-wider">
                              {dayItem.hari}
                            </span>
                            <span className="text-xs text-gray-500 font-medium">
                              {dayItem.sessions.length} Sesi Waktu
                            </span>
                          </div>

                          <button
                            onClick={() => handleRemoveDay(dayIndex)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors text-xs flex items-center gap-1 font-medium"
                            title="Hapus Hari"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span className="hidden sm:inline">Hapus Hari</span>
                          </button>
                        </div>

                        {/* Sessions inside Day */}
                        <div className="space-y-4">
                          {dayItem.sessions.map((session, sessionIndex) => {
                            const dropdownKey = `${dayIndex}-${sessionIndex}`;
                            const searchVal = aslabSearchQuery[dropdownKey] || "";
                            const isDropdownOpen = !!aslabDropdownOpen[dropdownKey];

                            const filteredAslabs = allRegisteredAslabs.filter(a => 
                              a.nama.toLowerCase().includes(searchVal.toLowerCase()) ||
                              a.nim.toLowerCase().includes(searchVal.toLowerCase()) ||
                              a.divisi.toLowerCase().includes(searchVal.toLowerCase()) ||
                              (a.posisi && a.posisi.toLowerCase().includes(searchVal.toLowerCase()))
                            );

                            return (
                              <div key={sessionIndex} className="bg-[#F9FAFC] p-4 rounded-xl border border-gray-100 space-y-3">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                  
                                  {/* Nama Sesi Input */}
                                  <div className="flex-1">
                                    <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                                      Nama Sesi / Shift
                                    </label>
                                    <input 
                                      type="text"
                                      value={session.namaSesi}
                                      onChange={(e) => handleSessionFieldChange(dayIndex, sessionIndex, "namaSesi", e.target.value)}
                                      placeholder="Contoh: Shift 1 / Shift Pagi"
                                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-[#0B132B] font-medium focus:outline-none focus:ring-2 focus:ring-[#FFC727]"
                                    />
                                  </div>

                                  {/* Waktu Mulai & Waktu Selesai (24 Jam) */}
                                  <div className="flex items-center gap-3">
                                    <div>
                                      <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                                        Mulai (24 Jam)
                                      </label>
                                      <input 
                                        type="time"
                                        step="60"
                                        value={session.waktuMulai}
                                        onChange={(e) => handleSessionFieldChange(dayIndex, sessionIndex, "waktuMulai", e.target.value)}
                                        className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-semibold text-[#0B132B] focus:outline-none focus:ring-2 focus:ring-[#FFC727]"
                                      />
                                    </div>
                                    <span className="text-gray-400 font-bold mt-5">-</span>
                                    <div>
                                      <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                                        Selesai (24 Jam)
                                      </label>
                                      <input 
                                        type="time"
                                        step="60"
                                        value={session.waktuSelesai}
                                        onChange={(e) => handleSessionFieldChange(dayIndex, sessionIndex, "waktuSelesai", e.target.value)}
                                        className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-semibold text-[#0B132B] focus:outline-none focus:ring-2 focus:ring-[#FFC727]"
                                      />
                                    </div>
                                  </div>

                                  {/* Remove Session Button */}
                                  <div className="sm:self-end">
                                    <button
                                      onClick={() => handleRemoveSession(dayIndex, sessionIndex)}
                                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                      title="Hapus Sesi"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>

                                {/* Aslab Selector */}
                                <div className="space-y-2 pt-2 border-t border-gray-100">
                                  <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">
                                    Asisten Lab Yang Bertugas ({session.assignedAslabs.length} Orang Terpilih)
                                  </label>

                                  {/* Selected Aslabs Tags */}
                                  <div className="flex flex-wrap gap-2">
                                    {session.assignedAslabs.map(aslab => (
                                      <span 
                                        key={aslab.nim}
                                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-gray-200 rounded-full text-xs font-semibold text-[#0B132B] shadow-sm"
                                      >
                                        <span>{aslab.nama}</span>
                                        <span className="text-[10px] text-gray-400">({aslab.posisi || aslab.divisi})</span>
                                        <button 
                                          type="button"
                                          onClick={() => handleToggleAslabForSession(dayIndex, sessionIndex, aslab)}
                                          className="text-gray-400 hover:text-red-500 ml-1"
                                        >
                                          <X className="w-3.5 h-3.5" />
                                        </button>
                                      </span>
                                    ))}
                                  </div>

                                  {/* Dropdown Input */}
                                  <div className="relative">
                                    <div className="flex items-center bg-white border border-gray-200 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-[#FFC727]">
                                      <Search className="w-4 h-4 text-gray-400 mr-2" />
                                      <input 
                                        type="text"
                                        placeholder="Cari & pilih nama / NIM / divisi aslab..."
                                        value={searchVal}
                                        onFocus={() => setAslabDropdownOpen(prev => ({ ...prev, [dropdownKey]: true }))}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setAslabSearchQuery(prev => ({ ...prev, [dropdownKey]: val }));
                                          setAslabDropdownOpen(prev => ({ ...prev, [dropdownKey]: true }));
                                        }}
                                        className="w-full text-xs text-[#0B132B] focus:outline-none bg-transparent"
                                      />
                                      {isDropdownOpen && (
                                        <button 
                                          type="button" 
                                          onClick={() => setAslabDropdownOpen(prev => ({ ...prev, [dropdownKey]: false }))}
                                          className="text-xs text-gray-400 hover:text-gray-600 ml-2"
                                        >
                                          Tutup
                                        </button>
                                      )}
                                    </div>

                                    {/* Dropdown Options */}
                                    {isDropdownOpen && (
                                      <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl max-h-56 overflow-y-auto z-30 p-2 space-y-1">
                                        {filteredAslabs.length === 0 ? (
                                          <div className="p-3 text-center text-xs text-gray-400">
                                            Tidak ada aslab yang cocok.
                                          </div>
                                        ) : (
                                          filteredAslabs.map(aslab => {
                                            const isSelected = session.assignedAslabs.some(a => a.nim === aslab.nim);
                                            return (
                                              <button
                                                key={aslab.nim}
                                                type="button"
                                                onClick={() => handleToggleAslabForSession(dayIndex, sessionIndex, aslab)}
                                                className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left text-xs transition-colors ${
                                                  isSelected ? "bg-yellow-50 text-[#0B132B] font-semibold" : "hover:bg-gray-50 text-gray-700"
                                                }`}
                                              >
                                                <div className="flex flex-col">
                                                  <span className="font-semibold text-[#0B132B]">{aslab.nama}</span>
                                                  <span className="text-[11px] text-gray-500">
                                                    {aslab.nim} • {aslab.posisi || aslab.jabatan || aslab.divisi} ({aslab.divisi})
                                                  </span>
                                                </div>
                                                {isSelected && (
                                                  <div className="w-5 h-5 rounded-full bg-[#FFC727] flex items-center justify-center text-[#0B132B]">
                                                    <Check className="w-3.5 h-3.5" />
                                                  </div>
                                                )}
                                              </button>
                                            );
                                          })
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Add Session Button */}
                        <button
                          type="button"
                          onClick={() => handleAddSession(dayIndex)}
                          className="w-full py-2.5 bg-gray-50 hover:bg-gray-100 text-[#0B132B] border border-dashed border-gray-300 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Plus className="w-4 h-4" />
                          Tambah Waktu / Sesi di Hari {dayItem.hari}
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-100 bg-gray-50/80 flex items-center justify-end gap-3">
              <button 
                type="button"
                onClick={() => setShowScheduleModal(false)}
                disabled={isSavingSchedule}
                className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-100 transition-colors"
              >
                Batal
              </button>
              <button 
                type="button"
                onClick={handleSaveSchedule}
                disabled={isSavingSchedule || isLoadingSchedule}
                className="bg-[#0B132B] hover:bg-[#1a2b5e] text-white font-semibold px-6 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2 text-sm disabled:opacity-50"
              >
                {isSavingSchedule ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#FFC727]" />
                    Menyimpan...
                  </>
                ) : (
                  "Simpan Jadwal Shift"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

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
                    id="myshift-qr-code-svg"
                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/scan-absensi?token=${(qrType === "pulang" || qrType === "none") ? activeAgenda.kodeQrPulang : activeAgenda.kodeQrDatang}&type=${qrType === "pulang" ? "pulang" : "datang"}`}
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

                <button 
                  onClick={() => {
                    const formattedName = `QR_${activeAgenda.nama}_${qrType === "pulang" ? "Pulang" : "Datang"}`;
                    downloadQRCode("myshift-qr-code-svg", formattedName);
                  }}
                  className="w-full bg-[#0B132B] hover:bg-[#1a2b5e] text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" /> Download PNG
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
                  <span className="text-xs text-gray-500">{formatTime(agenda.waktuMulai)} - {formatTime(agenda.waktuSelesai)} WIB</span>
                  <span className={`absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full ${(agenda.jenis || 'MyShift') === 'Agenda' ? 'bg-indigo-100 text-indigo-700' : 'bg-orange-100 text-orange-700'}`}>
                    {agenda.jenis || 'MyShift'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
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
