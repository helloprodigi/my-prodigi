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
  CalendarDays,
  ShieldAlert,
  Info
} from "lucide-react";
import QRCode from "react-qr-code";
import { downloadQRCode } from "@/lib/downloadQr";
import toast from "react-hot-toast";
import ShiftTimePicker from "@/components/ui/ShiftTimePicker";

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

// Helper to convert "HH:MM" to total minutes from midnight
function timeToMinutes(timeStr: string): number {
  if (!timeStr || !timeStr.includes(":")) return 0;
  const [h, m] = timeStr.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

// Check session overlaps within a day
function getOverlapErrorsForDay(sessions: SessionForm[]): string[] {
  const errors: string[] = [];
  if (!sessions || sessions.length < 2) return errors;

  for (let i = 0; i < sessions.length; i++) {
    const s1 = sessions[i];
    const start1 = timeToMinutes(s1.waktuMulai);
    const end1 = timeToMinutes(s1.waktuSelesai);

    for (let j = i + 1; j < sessions.length; j++) {
      const s2 = sessions[j];
      const start2 = timeToMinutes(s2.waktuMulai);
      const end2 = timeToMinutes(s2.waktuSelesai);

      if (Math.max(start1, start2) < Math.min(end1, end2)) {
        errors.push(
          `"${s1.namaSesi || `Sesi ${i + 1}`}" (${s1.waktuMulai}–${s1.waktuSelesai}) bertabrakan dengan "${s2.namaSesi || `Sesi ${j + 1}`}" (${s2.waktuMulai}–${s2.waktuSelesai}).`
        );
      }
    }
  }

  return errors;
}

export default function MyShiftPage() {
  const [userRole, setUserRole] = useState<string>("aslab");
  const [currentUserNim, setCurrentUserNim] = useState<string>("");
  const [currentUserName, setCurrentUserName] = useState<string>("");
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [agendas, setAgendas] = useState<Agenda[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // QR Generator Modal
  const [showQRModal, setShowQRModal] = useState(false);
  const [activeAgenda, setActiveAgenda] = useState<Agenda | null>(null);
  const [qrStatus, setQrStatus] = useState<"datang_open" | "pulang_open" | "closed" | "ended">("closed");
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [nextWindowInfo, setNextWindowInfo] = useState<string>("");
  const [showAgendaSelectionModal, setShowAgendaSelectionModal] = useState(false);
  const [showEmptyAgendaModal, setShowEmptyAgendaModal] = useState(false);
  const [emptyAgendaMessage, setEmptyAgendaMessage] = useState<string>(
    "Maaf, kamu tidak dijadwalkan untuk piket hari ini. Silakan periksa jadwal piket kamu untuk informasi lebih lanjut."
  );

  // Atur Jadwal Shift Modal
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [activeDayTab, setActiveDayTab] = useState<string>("Senin");
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
        if (data) {
          if (data.role) setUserRole(data.role);
          if (data.nim) setCurrentUserNim(data.nim);
          if (data.name) setCurrentUserName(data.name);
          if (data.id) setCurrentUserId(data.id);
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
        } else {
          setAgendas([]);
        }
      })
      .catch(() => setAgendas([]));
  };

  useEffect(() => {
    fetchAgendas(selectedDate);
  }, [selectedDate]);

  // Real-time calculation of QR window & status
  useEffect(() => {
    if (!showQRModal || !activeAgenda) return;

    const calculateStatus = () => {
      const now = Date.now();
      const mulai = new Date(activeAgenda.waktuMulai).getTime();
      const selesai = new Date(activeAgenda.waktuSelesai).getTime();
      
      const endDatang = mulai + 20 * 60 * 1000;
      const startPulang = selesai - 10 * 60 * 1000;

      if (now >= mulai && now <= endDatang) {
        setQrStatus("datang_open");
        const remain = Math.max(0, Math.floor((endDatang - now) / 1000));
        const visualRemain = remain % 600; // rotate token every 10 mins
        setTimeRemaining(`${Math.floor(visualRemain / 60).toString().padStart(2, '0')}:${(visualRemain % 60).toString().padStart(2, '0')}`);
        setNextWindowInfo(`Absen Datang dibuka hingga ${new Date(endDatang).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`);
      } else if (now >= startPulang && now <= selesai) {
        setQrStatus("pulang_open");
        const remain = Math.max(0, Math.floor((selesai - now) / 1000));
        const visualRemain = remain % 600;
        setTimeRemaining(`${Math.floor(visualRemain / 60).toString().padStart(2, '0')}:${(visualRemain % 60).toString().padStart(2, '0')}`);
        setNextWindowInfo(`Absen Pulang dibuka hingga shift berakhir (${new Date(selesai).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB)`);
      } else if (now > selesai) {
        setQrStatus("ended");
        setTimeRemaining("");
        setNextWindowInfo("Sesi shift telah berakhir.");
      } else {
        setQrStatus("closed");
        setTimeRemaining("");
        if (now < mulai) {
          setNextWindowInfo(`Absen Datang akan dibuka pada ${new Date(mulai).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB (20 menit pertama).`);
        } else {
          setNextWindowInfo(`Waktu Absen Datang telah ditutup. Absen Pulang akan dibuka pukul ${new Date(startPulang).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB (10 menit terakhir).`);
        }
      }
    };

    calculateStatus();
    const interval = setInterval(calculateStatus, 1000);
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
        // Ensure all 7 days exist in scheduleDays structure
        const existingMap = new Map<string, DayForm>();
        schedData.days.forEach((d: DayForm) => existingMap.set(d.hari, d));

        const filledDays: DayForm[] = ALL_DAYS.map(dayName => {
          if (existingMap.has(dayName)) {
            return existingMap.get(dayName)!;
          }
          return {
            hari: dayName,
            dayOfWeek: DAYS_MAPPING[dayName],
            sessions: []
          };
        });

        setScheduleDays(filledDays);
      } else {
        // Initialize all 7 days with Monday having default shift
        const initialDays: DayForm[] = ALL_DAYS.map(dayName => ({
          hari: dayName,
          dayOfWeek: DAYS_MAPPING[dayName],
          sessions: dayName === "Senin" ? [
            {
              namaSesi: "Shift 1",
              waktuMulai: "08:00",
              waktuSelesai: "11:30",
              assignedAslabs: []
            }
          ] : []
        }));
        setScheduleDays(initialDays);
      }
    } catch (e) {
      console.error("Failed to load schedule:", e);
      setScheduleModalError("Gagal memuat data jadwal shift.");
    } finally {
      setIsLoadingSchedule(false);
    }
  };

  // Session Management for Current Active Day Tab
  const getCurrentDayForm = (): DayForm => {
    const found = scheduleDays.find(d => d.hari === activeDayTab);
    if (found) return found;
    return {
      hari: activeDayTab,
      dayOfWeek: DAYS_MAPPING[activeDayTab] || 1,
      sessions: []
    };
  };

  const handleAddSessionToActiveDay = () => {
    setScheduleDays(prev => 
      prev.map(day => {
        if (day.hari !== activeDayTab) return day;
        const nextShiftNumber = (day.sessions?.length || 0) + 1;
        
        // Suggest non-overlapping default time
        let defaultStart = "08:00";
        let defaultEnd = "11:30";
        if (day.sessions && day.sessions.length > 0) {
          const lastSession = day.sessions[day.sessions.length - 1];
          defaultStart = lastSession.waktuSelesai || "13:00";
          const [h, m] = defaultStart.split(":").map(Number);
          const endH = Math.min(23, h + 3);
          defaultEnd = `${String(endH).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
        }

        return {
          ...day,
          sessions: [
            ...(day.sessions || []),
            {
              namaSesi: `Shift ${nextShiftNumber}`,
              waktuMulai: defaultStart,
              waktuSelesai: defaultEnd,
              assignedAslabs: []
            }
          ]
        };
      })
    );
  };

  const handleRemoveSessionFromActiveDay = (sessionIndex: number) => {
    setScheduleDays(prev => 
      prev.map(day => {
        if (day.hari !== activeDayTab) return day;
        return {
          ...day,
          sessions: day.sessions.filter((_, sIdx) => sIdx !== sessionIndex)
        };
      })
    );
  };

  const handleSessionFieldChange = (sessionIndex: number, field: "namaSesi" | "waktuMulai" | "waktuSelesai", value: string) => {
    setScheduleDays(prev => 
      prev.map(day => {
        if (day.hari !== activeDayTab) return day;
        return {
          ...day,
          sessions: day.sessions.map((sess, sIdx) => {
            if (sIdx !== sessionIndex) return sess;
            return { ...sess, [field]: value };
          })
        };
      })
    );
  };

  const isSameAslab = (a: any, b: any) => {
    if (!a || !b) return false;
    if (a.id && b.id && a.id === b.id) return true;
    if (a.userId && b.userId && a.userId === b.userId) return true;
    if (a.nim && b.nim && String(a.nim).trim().toLowerCase() === String(b.nim).trim().toLowerCase()) return true;
    if (a.nama && b.nama && String(a.nama).trim().toLowerCase() === String(b.nama).trim().toLowerCase()) return true;
    return false;
  };

  const handleToggleAslabForSession = (sessionIndex: number, aslab: RegisteredAslab) => {
    setScheduleDays(prev => 
      prev.map(day => {
        if (day.hari !== activeDayTab) return day;
        return {
          ...day,
          sessions: day.sessions.map((sess, sIdx) => {
            if (sIdx !== sessionIndex) return sess;
            const currentList = Array.isArray(sess.assignedAslabs) ? sess.assignedAslabs : [];
            const exists = currentList.some(a => isSameAslab(a, aslab));
            const updatedList = exists
              ? currentList.filter(a => !isSameAslab(a, aslab))
              : [...currentList, aslab];
            return {
              ...sess,
              assignedAslabs: updatedList
            };
          })
        };
      })
    );
  };

  const handleSaveSchedule = async () => {
    setScheduleModalError(null);

    // Filter only days that have sessions
    const daysWithSessions = scheduleDays.filter(d => Array.isArray(d.sessions) && d.sessions.length > 0);

    if (daysWithSessions.length === 0) {
      setScheduleModalError("Silakan tambahkan minimal 1 sesi shift pada salah satu hari.");
      return;
    }

    // Validate inputs & overlaps across all days
    for (const day of daysWithSessions) {
      for (let sIdx = 0; sIdx < day.sessions.length; sIdx++) {
        const s = day.sessions[sIdx];
        if (!s.waktuMulai || !s.waktuSelesai) {
          setScheduleModalError(`Waktu mulai dan selesai pada hari ${day.hari} (${s.namaSesi || `Sesi ${sIdx + 1}`}) wajib diisi.`);
          setActiveDayTab(day.hari);
          return;
        }
        if (s.waktuSelesai <= s.waktuMulai) {
          setScheduleModalError(`Waktu selesai (${s.waktuSelesai}) harus setelah waktu mulai (${s.waktuMulai}) pada hari ${day.hari}.`);
          setActiveDayTab(day.hari);
          return;
        }
        if (!Array.isArray(s.assignedAslabs) || s.assignedAslabs.length === 0) {
          setScheduleModalError(`Pilih minimal 1 Asisten Lab untuk bertugas pada hari ${day.hari} (${s.namaSesi || `Sesi ${sIdx + 1}`}).`);
          setActiveDayTab(day.hari);
          return;
        }
      }

      // Check overlap
      const overlapErrors = getOverlapErrorsForDay(day.sessions);
      if (overlapErrors.length > 0) {
        setScheduleModalError(`Terdapat waktu shift yang bertabrakan pada hari ${day.hari}:\n${overlapErrors.join(" ")}`);
        setActiveDayTab(day.hari);
        return;
      }
    }

    setIsSavingSchedule(true);
    try {
      const res = await fetch("/api/absensi/myshift/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days: daysWithSessions })
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

  // Handle "Lihat QR Absensi" Click
  const handleOpenQRGenerator = () => {
    // If no agendas exist today
    if (agendas.length === 0) {
      setEmptyAgendaMessage(
        userRole === "admin"
          ? "Belum ada jadwal MyShift yang dibuat pada hari ini."
          : "Maaf, kamu tidak dijadwalkan untuk piket hari ini. Silakan periksa jadwal piket kamu untuk informasi lebih lanjut."
      );
      setShowEmptyAgendaModal(true);
      return;
    }

    // If User is Aslab, check if Aslab is scheduled today & time validity
    if (userRole !== "admin") {
      const now = Date.now();
      
      // Find shift where current user is assigned
      const myAssignedAgendas = agendas.filter(agenda => {
        return agenda.aslabs.some(a => 
          (currentUserId && a.userId === currentUserId) ||
          (currentUserNim && a.nim && a.nim.trim() === currentUserNim.trim()) ||
          (currentUserName && a.nama && a.nama.toLowerCase().trim() === currentUserName.toLowerCase().trim())
        );
      });

      if (myAssignedAgendas.length === 0) {
        setEmptyAgendaMessage("Maaf, kamu tidak dijadwalkan untuk piket hari ini. Silakan periksa jadwal piket kamu untuk informasi lebih lanjut.");
        setShowEmptyAgendaModal(true);
        return;
      }

      // Find active shift right now or upcoming
      const activeShift = myAssignedAgendas.find(agenda => {
        const mulai = new Date(agenda.waktuMulai).getTime();
        const selesai = new Date(agenda.waktuSelesai).getTime();
        return now >= (mulai - 15 * 60 * 1000) && now <= selesai;
      });

      if (activeShift) {
        setActiveAgenda(activeShift);
        setShowQRModal(true);
      } else {
        // User is scheduled today, but currently outside shift hours
        const nextShift = myAssignedAgendas[0];
        const mulaiStr = new Date(nextShift.waktuMulai).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        const selesaiStr = new Date(nextShift.waktuSelesai).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        setEmptyAgendaMessage(`Maaf, saat ini bukan jadwal shift kamu. Jadwal piket kamu hari ini adalah ${nextShift.nama} (${mulaiStr} - ${selesaiStr} WIB).`);
        setShowEmptyAgendaModal(true);
      }
      return;
    }

    // If Admin, can view all MyShift QR codes
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

  const currentActiveDayForm = getCurrentDayForm();
  const currentDayOverlapErrors = getOverlapErrorsForDay(currentActiveDayForm.sessions);

  return (
    <div className="min-h-screen bg-[#F9FAFC] relative">
      <div className="p-6 md:p-10 w-full space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-[22px] font-bold text-[#0A1024] sm:text-3xl md:text-4xl">MyShift</h1>
            <p className="text-gray-500 text-sm mt-1">
              {userRole === "admin"
                ? "Kelola dan pantau seluruh jadwal shift piket asisten lab"
                : "Pantau jadwal shift piket dan absensi kamu"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {userRole === "admin" && (
              <button 
                onClick={handleOpenScheduleModal}
                className="flex-1 sm:flex-none bg-[#0B132B] hover:bg-[#1a2b5e] text-white font-semibold px-5 py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 text-sm border border-[#0B132B]"
              >
                <CalendarPlus className="w-4 h-4 text-[#FFC727]" />
                Atur Jadwal Shift
              </button>
            )}
            <button 
              onClick={handleOpenQRGenerator}
              className="flex-1 sm:flex-none bg-[#FFC727] hover:bg-[#e5b323] text-[#0B132B] font-bold px-6 py-2.5 rounded-xl transition-colors shadow-sm text-sm flex items-center justify-center gap-2"
            >
              <Clock className="w-4 h-4 text-[#0B132B]" />
              Lihat QR Absensi
            </button>
          </div>
        </div>

        {/* Content Container */}
        <div className="bg-white rounded-2xl p-6 shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-gray-100 min-h-[500px]">
          
          {/* Date Controls */}
          <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-8 gap-4 border-b border-gray-100 pb-4">
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <h2 className="text-lg font-bold text-[#0B132B] min-w-[200px]">
                {formatDateTitle(selectedDate)}
              </h2>
              <div className="flex items-center gap-2">
                <button onClick={handlePrevDay} className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button onClick={handleToday} className="px-4 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700 font-semibold text-sm transition-colors">
                  Hari Ini
                </button>
                <button onClick={handleNextDay} className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Shift Time Info Banner */}
            {agendas.length > 0 && (
              <div className="flex items-center gap-2 bg-yellow-50 text-yellow-800 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold border border-yellow-200/80">
                <AlertCircle className="w-4 h-4 text-yellow-700 shrink-0" />
                <span>
                  Rentang Jadwal: {formatTime(agendas[0].waktuMulai)} - {formatTime(agendas[agendas.length-1].waktuSelesai)} WIB (Lokasi: LAB DTC)
                </span>
              </div>
            )}
          </div>

          {/* Grid of Aslabs */}
          <div className="space-y-10">
            {agendas.length === 0 ? (
              <div className="text-center py-20 text-gray-400 flex flex-col items-center">
                <Clock className="w-12 h-12 mb-4 text-gray-300" />
                <p className="font-semibold text-gray-700 text-base">
                  {userRole === "admin"
                    ? "Tidak ada jadwal shift pada hari ini."
                    : "Kamu tidak memiliki jadwal shift pada hari ini."}
                </p>
                {userRole === "admin" ? (
                  <p className="text-xs text-gray-400 mt-2 max-w-md">
                    Klik tombol <span className="font-bold text-gray-700">"Atur Jadwal Shift"</span> di kanan atas untuk mengelola template jadwal piket mingguan.
                  </p>
                ) : (
                  <p className="text-xs text-gray-400 mt-2 max-w-md">
                    Jadwal piket kamu akan muncul di sini secara otomatis apabila ditugaskan oleh Admin.
                  </p>
                )}
              </div>
            ) : (
              agendas.map(agenda => (
                <div key={agenda.id} className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between border-l-4 border-[#FFC727] pl-3 gap-2">
                    <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                      <span>{agenda.nama}</span>
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200">
                        {formatTime(agenda.waktuMulai)} - {formatTime(agenda.waktuSelesai)} WIB
                      </span>
                    </h3>
                    <span className="text-xs font-semibold text-gray-500">
                      {agenda.aslabs.length} Asisten Lab Bertugas
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {agenda.aslabs.map(aslab => (
                      <div key={aslab.id} className="flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50/80 transition-colors border border-gray-100 bg-white shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 border-2 border-[#0B132B] flex-shrink-0 flex items-center justify-center">
                            {aslab.photoUrl ? (
                              <img src={aslab.photoUrl} alt={aslab.nama} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-[#0B132B] font-bold text-base">
                                {aslab.nama.charAt(0)}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-[#0B132B] text-sm line-clamp-1">{aslab.nama}</p>
                            <p className="text-xs text-teal-700 font-semibold">{aslab.jabatan || aslab.divisi || "Asisten Lab"}</p>
                            <p className="text-[11px] text-gray-400 font-medium">{aslab.nim}</p>
                          </div>
                        </div>

                        <div className={`px-3 py-1.5 text-xs font-bold rounded-xl flex-shrink-0 ${
                          aslab.status === "HADIR" ? "bg-green-100 text-green-800 border border-green-200" :
                          aslab.status === "ALPA" ? "bg-red-100 text-red-800 border border-red-200" :
                          aslab.status === "IZIN" ? "bg-yellow-100 text-yellow-800 border border-yellow-200" :
                          "bg-gray-100 text-gray-600 border border-gray-200"
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

      {/* Modal: Atur Jadwal Shift (Admin Only) with Day Tabs */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#0B132B] flex items-center justify-center text-[#FFC727] shadow-sm">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#0B132B]">Atur Jadwal Piket MyShift</h2>
                  <p className="text-xs text-gray-500">Kelola jadwal berulang mingguan per hari (Format 24 Jam)</p>
                </div>
              </div>
              <button 
                onClick={() => setShowScheduleModal(false)}
                className="p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Day Tabs Navigation */}
            <div className="bg-gray-100/70 border-b border-gray-200 px-6 py-3 overflow-x-auto">
              <div className="flex items-center gap-2 min-w-max">
                {ALL_DAYS.map(dayName => {
                  const dayData = scheduleDays.find(d => d.hari === dayName);
                  const sessionCount = dayData?.sessions?.length || 0;
                  const isActive = activeDayTab === dayName;
                  const hasOverlap = dayData ? getOverlapErrorsForDay(dayData.sessions).length > 0 : false;

                  return (
                    <button
                      key={dayName}
                      type="button"
                      onClick={() => setActiveDayTab(dayName)}
                      className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                        isActive
                          ? "bg-[#0B132B] text-white shadow-md"
                          : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200/80"
                      } ${hasOverlap ? "ring-2 ring-red-500" : ""}`}
                    >
                      <span>{dayName}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        isActive
                          ? "bg-[#FFC727] text-[#0B132B]"
                          : sessionCount > 0 
                            ? "bg-gray-100 text-gray-700" 
                            : "bg-gray-50 text-gray-400"
                      }`}>
                        {sessionCount} Sesi
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              
              {scheduleModalError && (
                <div className="bg-red-50 text-red-700 p-4 rounded-2xl border border-red-200 text-xs sm:text-sm flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div className="font-semibold whitespace-pre-line">{scheduleModalError}</div>
                </div>
              )}

              {/* Overlap Warning Badge for Active Day */}
              {currentDayOverlapErrors.length > 0 && (
                <div className="bg-red-50 text-red-800 p-4 rounded-2xl border-2 border-red-300 text-xs sm:text-sm flex items-start gap-3 animate-in shake duration-200">
                  <ShieldAlert className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-red-900 mb-1">Perhatian: Jadwal Shift Bertabrakan pada Hari {activeDayTab}!</strong>
                    <ul className="list-disc pl-4 space-y-1 text-xs">
                      {currentDayOverlapErrors.map((err, idx) => (
                        <li key={idx}>{err}</li>
                      ))}
                    </ul>
                    <p className="mt-2 text-[11px] text-red-700">Silakan ubah jam sesi agar tidak saling tumpang tindih sebelum menyimpan.</p>
                  </div>
                </div>
              )}

              {isLoadingSchedule ? (
                <div className="py-20 flex flex-col items-center justify-center text-gray-400 space-y-3">
                  <Loader2 className="w-8 h-8 animate-spin text-[#FFC727]" />
                  <p className="text-sm font-semibold">Memuat data jadwal...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  
                  {/* Active Day Header */}
                  <div className="flex items-center justify-between bg-[#F8F9FB] p-4 rounded-2xl border border-gray-200/80">
                    <div className="flex items-center gap-3">
                      <span className="px-3.5 py-1.5 bg-[#0B132B] text-white text-xs font-bold rounded-xl uppercase tracking-wider">
                        Hari {activeDayTab}
                      </span>
                      <span className="text-xs text-gray-600 font-semibold">
                        {currentActiveDayForm.sessions.length} Sesi Shift Dikonfigurasi
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddSessionToActiveDay}
                      className="px-4 py-2 bg-[#FFC727] hover:bg-[#e5b323] text-[#0B132B] rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      Tambah Sesi Shift
                    </button>
                  </div>

                  {/* Sessions List for Active Day */}
                  {currentActiveDayForm.sessions.length === 0 ? (
                    <div className="text-center py-16 text-gray-400 bg-gray-50/60 rounded-3xl border-2 border-dashed border-gray-200 space-y-3">
                      <CalendarDays className="w-10 h-10 mx-auto text-gray-300" />
                      <p className="text-sm font-semibold text-gray-600">
                        Belum ada sesi shift yang diatur untuk hari {activeDayTab}.
                      </p>
                      <button
                        type="button"
                        onClick={handleAddSessionToActiveDay}
                        className="px-4 py-2 bg-[#0B132B] hover:bg-[#1a2b5e] text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5"
                      >
                        <Plus className="w-4 h-4 text-[#FFC727]" />
                        Tambah Sesi di Hari {activeDayTab}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {currentActiveDayForm.sessions.map((session, sessionIndex) => {
                        const dropdownKey = `${activeDayTab}-${sessionIndex}`;
                        const searchVal = aslabSearchQuery[dropdownKey] || "";
                        const isDropdownOpen = !!aslabDropdownOpen[dropdownKey];

                        const filteredAslabs = allRegisteredAslabs.filter(a => 
                          a.nama.toLowerCase().includes(searchVal.toLowerCase()) ||
                          a.nim.toLowerCase().includes(searchVal.toLowerCase()) ||
                          a.divisi.toLowerCase().includes(searchVal.toLowerCase()) ||
                          (a.posisi && a.posisi.toLowerCase().includes(searchVal.toLowerCase()))
                        );

                        return (
                          <div key={sessionIndex} className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-sm space-y-4">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                              
                              {/* Nama Sesi Input */}
                              <div className="flex-1">
                                <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block mb-1.5">
                                  Nama Sesi / Shift
                                </label>
                                <input 
                                  type="text"
                                  value={session.namaSesi}
                                  onChange={(e) => handleSessionFieldChange(sessionIndex, "namaSesi", e.target.value)}
                                  placeholder="Contoh: Shift 1 / Shift Pagi"
                                  className="w-full bg-[#F8F9FB] border border-gray-200 rounded-xl px-4 py-3 text-sm text-[#0B132B] font-semibold focus:outline-none focus:ring-2 focus:ring-[#FFC727] focus:bg-white transition-all"
                                />
                              </div>

                              {/* Waktu Pelaksanaan Shift (24 Jam) */}
                              <div className="w-full lg:w-72">
                                <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block mb-1.5">
                                  Waktu Pelaksanaan (24 Jam)
                                </label>
                                <ShiftTimePicker
                                  dayName={activeDayTab}
                                  waktuMulai={session.waktuMulai}
                                  waktuSelesai={session.waktuSelesai}
                                  onChange={(mulai, selesai) => {
                                    handleSessionFieldChange(sessionIndex, "waktuMulai", mulai);
                                    handleSessionFieldChange(sessionIndex, "waktuSelesai", selesai);
                                  }}
                                />
                              </div>

                              {/* Remove Session Button */}
                              <div className="lg:self-end pb-1 flex justify-end">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSessionFromActiveDay(sessionIndex)}
                                  className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-transparent hover:border-red-200"
                                  title="Hapus Sesi"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              </div>
                            </div>

                            {/* Aslab Selector */}
                            <div className="space-y-2.5 pt-3 border-t border-gray-100">
                              <div className="flex items-center justify-between">
                                <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block">
                                  Asisten Lab Bertugas ({(session.assignedAslabs || []).length} Orang)
                                </label>
                                <span className="text-[11px] text-gray-400">Pilih dari database asisten lab</span>
                              </div>

                              {/* Selected Aslabs Chips */}
                              <div className="flex flex-wrap gap-2 min-h-[32px] items-center">
                                {session.assignedAslabs && session.assignedAslabs.length > 0 ? (
                                  session.assignedAslabs.map((aslab, aslabIdx) => (
                                    <span 
                                      key={aslab.nim || aslab.id || aslabIdx}
                                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-yellow-100/70 border border-yellow-300 rounded-full text-xs font-bold text-[#0B132B] shadow-sm animate-in fade-in zoom-in-95 duration-150"
                                    >
                                      <span>{aslab.nama}</span>
                                      <span className="text-[10px] text-gray-600 font-normal">({aslab.posisi || aslab.jabatan || aslab.divisi})</span>
                                      <button 
                                        type="button"
                                        onClick={() => handleToggleAslabForSession(sessionIndex, aslab)}
                                        className="text-gray-400 hover:text-red-600 ml-1 p-0.5 rounded-full hover:bg-white transition-colors cursor-pointer"
                                        title="Hapus aslab dari sesi ini"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-xs text-gray-400 italic font-medium">Belum ada asisten lab yang dipilih</span>
                                )}
                              </div>

                              {/* Search & Selection Dropdown */}
                              <div className="relative">
                                <div className="flex items-center bg-[#F8F9FB] border border-gray-200 rounded-xl px-3.5 py-2.5 focus-within:ring-2 focus-within:ring-[#FFC727] focus-within:bg-white transition-all">
                                  <Search className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
                                  <input 
                                    type="text"
                                    placeholder="Cari nama, NIM, atau divisi aslab..."
                                    value={searchVal}
                                    onFocus={() => setAslabDropdownOpen(prev => ({ ...prev, [dropdownKey]: true }))}
                                    onChange={(e) => {
                                      setAslabSearchQuery(prev => ({ ...prev, [dropdownKey]: e.target.value }));
                                      setAslabDropdownOpen(prev => ({ ...prev, [dropdownKey]: true }));
                                    }}
                                    className="w-full bg-transparent text-xs sm:text-sm text-[#0B132B] font-medium focus:outline-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setAslabDropdownOpen(prev => ({ ...prev, [dropdownKey]: !isDropdownOpen }))}
                                    className="text-xs text-[#0B132B] font-bold px-2 py-1 bg-yellow-200/80 rounded-lg hover:bg-yellow-300 transition-colors ml-2 shrink-0"
                                  >
                                    {isDropdownOpen ? "Tutup" : "Pilih Aslab"}
                                  </button>
                                </div>

                                {isDropdownOpen && (
                                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-xl z-20 max-h-60 overflow-y-auto p-2 space-y-1">
                                    {filteredAslabs.length === 0 ? (
                                      <div className="p-4 text-center text-xs text-gray-400">
                                        Tidak ada asisten lab ditemukan.
                                      </div>
                                    ) : (
                                      filteredAslabs.map(aslab => {
                                        const isSelected = (session.assignedAslabs || []).some(a => isSameAslab(a, aslab));
                                        return (
                                          <button
                                            key={aslab.id || aslab.nim}
                                            type="button"
                                            onClick={() => handleToggleAslabForSession(sessionIndex, aslab)}
                                            className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs transition-colors ${
                                              isSelected ? "bg-yellow-50 text-[#0B132B]" : "hover:bg-gray-50 text-gray-700"
                                            }`}
                                          >
                                            <div className="flex items-center gap-2.5">
                                              <div className="w-7 h-7 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center font-bold text-[11px] text-[#0B132B]">
                                                {aslab.photoUrl ? (
                                                  <img src={aslab.photoUrl} alt={aslab.nama} className="w-full h-full object-cover" />
                                                ) : (
                                                  aslab.nama.charAt(0)
                                                )}
                                              </div>
                                              <div>
                                                <div className="font-bold text-[#0B132B]">{aslab.nama}</div>
                                                <div className="text-[10px] text-gray-400">{aslab.nim} • {aslab.posisi || aslab.jabatan || aslab.divisi}</div>
                                              </div>
                                            </div>
                                            {isSelected ? (
                                              <div className="w-5 h-5 rounded-full bg-[#FFC727] flex items-center justify-center text-[#0B132B] shrink-0 shadow-sm">
                                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                                              </div>
                                            ) : (
                                              <div className="w-5 h-5 rounded-full border border-gray-300 flex items-center justify-center text-gray-400 shrink-0 hover:border-gray-400">
                                                <Plus className="w-3 h-3" />
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
                disabled={isSavingSchedule || isLoadingSchedule || currentDayOverlapErrors.length > 0}
                className="bg-[#0B132B] hover:bg-[#1a2b5e] text-white font-bold px-6 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2 text-sm disabled:opacity-50"
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

      {/* Modal: QR Generator (Real-time Status Banner) */}
      {showQRModal && activeAgenda && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm relative flex flex-col items-center text-center shadow-2xl border border-gray-100">
            <button 
              onClick={() => setShowQRModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 transition-colors p-1 rounded-full hover:bg-gray-100"
            >
              <X className="w-6 h-6" />
            </button>
            
            <h2 className="text-2xl font-bold text-[#0B132B] mb-1">
              QR Absensi MyShift
            </h2>
            <p className="text-xs text-gray-500 mb-3 font-semibold">
              {activeAgenda.nama} ({formatTime(activeAgenda.waktuMulai)} - {formatTime(activeAgenda.waktuSelesai)} WIB)
            </p>
            
            {/* Status Banner */}
            {qrStatus === "datang_open" && (
              <div className="bg-green-50 text-green-800 p-2.5 rounded-2xl text-xs mb-3 border border-green-300 w-full text-center font-bold flex items-center justify-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Absen Datang Dibuka
              </div>
            )}

            {qrStatus === "pulang_open" && (
              <div className="bg-yellow-50 text-yellow-900 p-2.5 rounded-2xl text-xs mb-3 border border-yellow-300 w-full text-center font-bold flex items-center justify-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#FFC727] animate-pulse" />
                Absen Pulang Dibuka
              </div>
            )}

            {qrStatus === "closed" && (
              <div className="bg-amber-50 text-amber-900 p-3 rounded-2xl text-xs mb-3 border border-amber-200 w-full text-left flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-amber-900 mb-0.5">Absen Ditutup</strong>
                  <span className="text-[11px] leading-relaxed text-amber-800">{nextWindowInfo}</span>
                </div>
              </div>
            )}

            {qrStatus === "ended" && (
              <div className="bg-gray-100 text-gray-700 p-3 rounded-2xl text-xs mb-3 border border-gray-200 w-full text-center font-bold">
                Shift Telah Berakhir
              </div>
            )}

            {activeAgenda.waktuDatang && (
              <div className="bg-blue-50 text-blue-800 p-2 rounded-xl text-xs mb-3 border border-blue-200 w-full text-center font-semibold">
                ✅ Kamu sudah tercatat absen datang ({formatTime(activeAgenda.waktuDatang)} WIB)
              </div>
            )}

            {activeAgenda.waktuPulang && (
              <div className="bg-purple-50 text-purple-800 p-2 rounded-xl text-xs mb-3 border border-purple-200 w-full text-center font-semibold">
                🏁 Kamu sudah tercatat absen pulang ({formatTime(activeAgenda.waktuPulang)} WIB)
              </div>
            )}
            
            {/* QR Display */}
            {qrStatus === "datang_open" || qrStatus === "pulang_open" || userRole === "admin" ? (
              <>
                <div className="bg-white border-2 border-gray-200 p-4 rounded-[2rem] mb-4 shadow-sm">
                  <QRCode 
                    id="myshift-qr-code-svg"
                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/scan-absensi?token=${(qrStatus === "pulang_open" ? activeAgenda.kodeQrPulang : activeAgenda.kodeQrDatang) || activeAgenda.kodeQrDatang}&type=${qrStatus === "pulang_open" ? "pulang" : "datang"}`}
                    size={220}
                    level="Q"
                    fgColor="#0B132B"
                  />
                </div>
                
                {timeRemaining && (
                  <div className="bg-gray-100 rounded-full px-5 py-1.5 mb-4">
                    <span className="text-xs text-gray-700 font-bold">
                      Refresh Token: {timeRemaining}
                    </span>
                  </div>
                )}

                <button 
                  onClick={() => {
                    const formattedName = `QR_${activeAgenda.nama}_${qrStatus === "pulang_open" ? "Pulang" : "Datang"}`;
                    downloadQRCode("myshift-qr-code-svg", formattedName);
                  }}
                  className="w-full bg-[#0B132B] hover:bg-[#1a2b5e] text-white font-bold py-3 rounded-2xl transition-colors flex items-center justify-center gap-2 text-sm shadow-sm"
                >
                  <Download className="w-4 h-4 text-[#FFC727]" /> Download PNG
                </button>
              </>
            ) : (
              <div className="py-8 px-4 text-center">
                <Clock className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                <p className="text-xs text-gray-500 font-medium leading-relaxed">
                  QR Code hanya dapat di-generate dan di-scan saat jam absensi sedang dibuka.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Agenda Selection (Admin Only if multiple shifts today) */}
      {showAgendaSelectionModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm relative flex flex-col items-center text-center shadow-2xl">
            <button 
              onClick={() => setShowAgendaSelectionModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 transition-colors p-1 rounded-full hover:bg-gray-100"
            >
              <X className="w-6 h-6" />
            </button>
            
            <h2 className="text-xl font-bold text-[#0B132B] mb-2">
              Pilih Sesi Shift
            </h2>
            <p className="text-xs text-gray-500 mb-5">Pilih shift yang ingin dilihat kode QR absensinya</p>
            
            <div className="w-full space-y-3">
              {agendas.map(agenda => (
                <button
                  key={agenda.id}
                  onClick={() => {
                    setActiveAgenda(agenda);
                    setShowAgendaSelectionModal(false);
                    setShowQRModal(true);
                  }}
                  className="w-full bg-gray-50 hover:bg-yellow-50/60 border border-gray-200 hover:border-yellow-300 text-[#0B132B] font-medium py-3.5 px-4 rounded-2xl transition-all text-left flex flex-col relative shadow-sm"
                >
                  <span className="font-bold text-[#0B132B] text-sm mb-1">{agenda.nama}</span>
                  <span className="text-xs text-gray-500 font-semibold">{formatTime(agenda.waktuMulai)} - {formatTime(agenda.waktuSelesai)} WIB</span>
                  <span className="absolute top-3.5 right-3.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200">
                    {agenda.aslabs.length} Aslab
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Empty Agenda / Not Scheduled Popup Modal */}
      {showEmptyAgendaModal && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex flex-col items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden relative flex flex-col items-center justify-center p-8 text-center animate-in zoom-in-95 duration-200 shadow-2xl">
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
            
            <h3 className="text-2xl font-bold text-[#0B132B] mb-3">
              Uppss!!
            </h3>
            
            <p className="text-gray-700 font-medium leading-relaxed max-w-sm text-sm">
              {emptyAgendaMessage}
            </p>

            <button
              onClick={() => setShowEmptyAgendaModal(false)}
              className="mt-6 w-full bg-[#0B132B] hover:bg-[#1a2b5e] text-white font-bold py-3 rounded-2xl transition-colors text-sm"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
