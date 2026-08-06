"use client";

import React, { useState, useEffect } from "react";
import { Calendar, Clock, X, Check, AlertCircle } from "lucide-react";

interface WaktuPelaksanaanPickerProps {
  waktuMulai: string; // ISO format or 'YYYY-MM-DDTHH:mm'
  waktuSelesai: string; // ISO format or 'YYYY-MM-DDTHH:mm'
  onChange: (waktuMulai: string, waktuSelesai: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  className?: string;
  error?: string;
}

const DAYS_ID = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const MONTHS_ID = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

// Generate 24 hours (00 - 23)
const HOURS_24 = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"));
// Generate minutes (00 - 59)
const MINUTES_60 = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0"));

export function formatWaktuPelaksanaanDisplay(waktuMulaiStr?: string, waktuSelesaiStr?: string): string | null {
  if (!waktuMulaiStr || !waktuSelesaiStr) return null;

  try {
    const startDate = new Date(waktuMulaiStr);
    const endDate = new Date(waktuSelesaiStr);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return null;

    const dayName = DAYS_ID[startDate.getDay()];
    const dateNum = startDate.getDate();
    const monthName = MONTHS_ID[startDate.getMonth()];
    const year = startDate.getFullYear();

    const pad = (n: number) => n.toString().padStart(2, "0");
    const startH = pad(startDate.getHours());
    const startM = pad(startDate.getMinutes());
    const endH = pad(endDate.getHours());
    const endM = pad(endDate.getMinutes());

    return `${dayName}, ${dateNum} ${monthName} ${year} • ${startH}.${startM}–${endH}.${endM} WIB`;
  } catch {
    return null;
  }
}

export function formatShiftTimeDisplay(waktuMulaiStr?: string, waktuSelesaiStr?: string, dayName?: string): string | null {
  if (!waktuMulaiStr || !waktuSelesaiStr) return null;

  const cleanMulai = waktuMulaiStr.replace(":", ".");
  const cleanSelesai = waktuSelesaiStr.replace(":", ".");

  if (dayName) {
    return `${dayName} • ${cleanMulai}–${cleanSelesai} WIB`;
  }
  return `${cleanMulai}–${cleanSelesai} WIB`;
}

export default function WaktuPelaksanaanPicker({
  waktuMulai,
  waktuSelesai,
  onChange,
  placeholder = "Pilih waktu pelaksanaan",
  label,
  required = false,
  className = "",
  error
}: WaktuPelaksanaanPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Local state for modal/popover editing
  const [tempDate, setTempDate] = useState("");
  const [startHour, setStartHour] = useState("08");
  const [startMinute, setStartMinute] = useState("00");
  const [endHour, setEndHour] = useState("11");
  const [endMinute, setEndMinute] = useState("30");
  const [modalError, setModalError] = useState<string | null>(null);

  // Initialize temp state when opening or when props change
  useEffect(() => {
    if (waktuMulai) {
      try {
        const d = new Date(waktuMulai);
        if (!isNaN(d.getTime())) {
          const yyyy = d.getFullYear();
          const mm = String(d.getMonth() + 1).padStart(2, "0");
          const dd = String(d.getDate()).padStart(2, "0");
          setTempDate(`${yyyy}-${mm}-${dd}`);

          const hh = String(d.getHours()).padStart(2, "0");
          const min = String(d.getMinutes()).padStart(2, "0");
          setStartHour(hh);
          setStartMinute(min);
        }
      } catch {}
    } else {
      // Default to today
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      const dd = String(now.getDate()).padStart(2, "0");
      setTempDate(`${yyyy}-${mm}-${dd}`);
    }

    if (waktuSelesai) {
      try {
        const d = new Date(waktuSelesai);
        if (!isNaN(d.getTime())) {
          const hh = String(d.getHours()).padStart(2, "0");
          const min = String(d.getMinutes()).padStart(2, "0");
          setEndHour(hh);
          setEndMinute(min);
        }
      } catch {}
    }
  }, [waktuMulai, waktuSelesai, isOpen]);

  const displayValue = formatWaktuPelaksanaanDisplay(waktuMulai, waktuSelesai);

  const handleOpen = () => {
    setModalError(null);
    setIsOpen(true);
  };

  const handleSave = () => {
    if (!tempDate) {
      setModalError("Harap pilih tanggal pelaksanaan.");
      return;
    }

    const startMinutes = parseInt(startHour, 10) * 60 + parseInt(startMinute, 10);
    const endMinutes = parseInt(endHour, 10) * 60 + parseInt(endMinute, 10);

    if (endMinutes <= startMinutes) {
      setModalError(`Jam selesai (${endHour}:${endMinute}) harus lebih lambat dari jam mulai (${startHour}:${startMinute}).`);
      return;
    }

    const startIso = `${tempDate}T${startHour.padStart(2, "0")}:${startMinute.padStart(2, "0")}`;
    const endIso = `${tempDate}T${endHour.padStart(2, "0")}:${endMinute.padStart(2, "0")}`;

    onChange(startIso, endIso);
    setIsOpen(false);
  };

  // Preview string in modal
  const previewString = tempDate && startHour && endHour
    ? formatWaktuPelaksanaanDisplay(
        `${tempDate}T${startHour.padStart(2, "0")}:${startMinute.padStart(2, "0")}`,
        `${tempDate}T${endHour.padStart(2, "0")}:${endMinute.padStart(2, "0")}`
      )
    : null;

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {/* Main Trigger Card matching design */}
      <div
        onClick={handleOpen}
        className={`w-full bg-[#F8F9FB] hover:bg-[#F1F3F7] active:bg-[#EAECEF] border ${
          error ? "border-red-400 bg-red-50/20" : "border-gray-200/90 hover:border-gray-300"
        } rounded-2xl px-5 py-4 flex items-center justify-between cursor-pointer transition-all duration-150 shadow-sm group select-none`}
      >
        <div className="flex-1 pr-4">
          {displayValue ? (
            <span className="text-[#0B132B] font-medium text-base sm:text-lg block tracking-tight">
              {displayValue}
            </span>
          ) : (
            <span className="text-gray-400 font-normal text-base sm:text-lg block">
              {placeholder}
            </span>
          )}
        </div>

        <div className="text-gray-500 group-hover:text-gray-700 transition-colors flex-shrink-0">
          <Calendar className="w-6 h-6 stroke-[1.75]" />
        </div>
      </div>

      {error && <p className="text-xs text-red-500 mt-1.5 font-medium">{error}</p>}

      {/* Interactive Picker Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100 flex flex-col">
            
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-yellow-50 flex items-center justify-center text-[#0B132B] border border-yellow-200">
                  <Calendar className="w-5 h-5 text-[#0B132B]" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">Pilih Waktu Pelaksanaan</h3>
                  <p className="text-xs text-gray-500">Tentukan tanggal dan rentang jam pelaksanaan (24 Jam WIB)</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {modalError && (
                <div className="bg-red-50 text-red-700 p-3.5 rounded-xl border border-red-200 text-xs flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Date Input */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Tanggal Pelaksanaan
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={tempDate}
                    onChange={(e) => {
                      setTempDate(e.target.value);
                      setModalError(null);
                    }}
                    className="w-full bg-[#F8F9FB] border border-gray-200 rounded-xl px-4 py-3 text-sm text-[#0B132B] font-semibold focus:outline-none focus:ring-2 focus:ring-[#FFC727] focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* 24-Hour Time Selectors (No AM/PM) */}
              <div className="grid grid-cols-2 gap-4">
                
                {/* Jam Mulai */}
                <div className="bg-[#F8F9FB] p-3.5 rounded-2xl border border-gray-200">
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-2 text-center">
                    Jam Mulai (24 Jam)
                  </label>
                  <div className="flex items-center justify-center gap-1.5">
                    <div className="flex flex-col items-center">
                      <select
                        value={startHour}
                        onChange={(e) => {
                          setStartHour(e.target.value);
                          setModalError(null);
                        }}
                        className="bg-white border border-gray-300 rounded-xl px-2.5 py-2 text-lg font-bold text-[#0B132B] text-center focus:outline-none focus:ring-2 focus:ring-[#FFC727] cursor-pointer shadow-sm"
                      >
                        {HOURS_24.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                      <span className="text-[10px] text-gray-400 font-medium mt-1">Jam</span>
                    </div>

                    <span className="text-xl font-bold text-gray-400 pb-4">:</span>

                    <div className="flex flex-col items-center">
                      <select
                        value={startMinute}
                        onChange={(e) => {
                          setStartMinute(e.target.value);
                          setModalError(null);
                        }}
                        className="bg-white border border-gray-300 rounded-xl px-2.5 py-2 text-lg font-bold text-[#0B132B] text-center focus:outline-none focus:ring-2 focus:ring-[#FFC727] cursor-pointer shadow-sm"
                      >
                        {MINUTES_60.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                      <span className="text-[10px] text-gray-400 font-medium mt-1">Menit</span>
                    </div>
                  </div>
                </div>

                {/* Jam Selesai */}
                <div className="bg-[#F8F9FB] p-3.5 rounded-2xl border border-gray-200">
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-2 text-center">
                    Jam Selesai (24 Jam)
                  </label>
                  <div className="flex items-center justify-center gap-1.5">
                    <div className="flex flex-col items-center">
                      <select
                        value={endHour}
                        onChange={(e) => {
                          setEndHour(e.target.value);
                          setModalError(null);
                        }}
                        className="bg-white border border-gray-300 rounded-xl px-2.5 py-2 text-lg font-bold text-[#0B132B] text-center focus:outline-none focus:ring-2 focus:ring-[#FFC727] cursor-pointer shadow-sm"
                      >
                        {HOURS_24.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                      <span className="text-[10px] text-gray-400 font-medium mt-1">Jam</span>
                    </div>

                    <span className="text-xl font-bold text-gray-400 pb-4">:</span>

                    <div className="flex flex-col items-center">
                      <select
                        value={endMinute}
                        onChange={(e) => {
                          setEndMinute(e.target.value);
                          setModalError(null);
                        }}
                        className="bg-white border border-gray-300 rounded-xl px-2.5 py-2 text-lg font-bold text-[#0B132B] text-center focus:outline-none focus:ring-2 focus:ring-[#FFC727] cursor-pointer shadow-sm"
                      >
                        {MINUTES_60.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                      <span className="text-[10px] text-gray-400 font-medium mt-1">Menit</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Live Preview Box */}
              {previewString && (
                <div className="bg-yellow-50/70 border border-yellow-200/90 rounded-2xl p-4 text-center">
                  <span className="text-[11px] font-bold text-yellow-900 uppercase tracking-wider block mb-1">
                    Hasil Format Tampilan:
                  </span>
                  <p className="text-base font-bold text-[#0B132B]">
                    {previewString}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-[#0B132B] hover:bg-[#1a2b5e] text-white transition-colors shadow-sm flex items-center gap-2"
              >
                <Check className="w-4 h-4 text-[#FFC727]" />
                Simpan Waktu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
