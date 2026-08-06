"use client";

import React, { useState } from "react";
import { Calendar, Clock, X, Check, AlertCircle } from "lucide-react";
import { formatShiftTimeDisplay } from "./WaktuPelaksanaanPicker";

interface ShiftTimePickerProps {
  dayName?: string;
  waktuMulai: string; // e.g. '08:00'
  waktuSelesai: string; // e.g. '11:30'
  onChange: (waktuMulai: string, waktuSelesai: string) => void;
  placeholder?: string;
  className?: string;
}

// Generate 24 hours (00 - 23)
const HOURS_24 = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"));
// Generate minutes (00 - 59)
const MINUTES_60 = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0"));

export default function ShiftTimePicker({
  dayName,
  waktuMulai,
  waktuSelesai,
  onChange,
  placeholder = "Pilih waktu pelaksanaan",
  className = ""
}: ShiftTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Parse initial hours and minutes
  const parseTime = (timeStr: string, defaultH: string, defaultM: string) => {
    if (!timeStr || !timeStr.includes(":")) return { h: defaultH, m: defaultM };
    const [h, m] = timeStr.split(":");
    return {
      h: (h || defaultH).padStart(2, "0"),
      m: (m || defaultM).padStart(2, "0")
    };
  };

  const initialStart = parseTime(waktuMulai, "08", "00");
  const initialEnd = parseTime(waktuSelesai, "11", "30");

  const [startHour, setStartHour] = useState(initialStart.h);
  const [startMinute, setStartMinute] = useState(initialStart.m);
  const [endHour, setEndHour] = useState(initialEnd.h);
  const [endMinute, setEndMinute] = useState(initialEnd.m);
  const [error, setError] = useState<string | null>(null);

  const displayValue = formatShiftTimeDisplay(waktuMulai, waktuSelesai);

  const handleOpen = () => {
    const s = parseTime(waktuMulai, "08", "00");
    const e = parseTime(waktuSelesai, "11", "30");
    setStartHour(s.h);
    setStartMinute(s.m);
    setEndHour(e.h);
    setEndMinute(e.m);
    setError(null);
    setIsOpen(true);
  };

  const handleSave = () => {
    const startStr = `${startHour.padStart(2, "0")}:${startMinute.padStart(2, "0")}`;
    const endStr = `${endHour.padStart(2, "0")}:${endMinute.padStart(2, "0")}`;

    const startMinutes = parseInt(startHour, 10) * 60 + parseInt(startMinute, 10);
    const endMinutes = parseInt(endHour, 10) * 60 + parseInt(endMinute, 10);

    if (endMinutes <= startMinutes) {
      setError(`Jam selesai (${endStr}) harus lebih lambat dari jam mulai (${startStr}).`);
      return;
    }

    onChange(startStr, endStr);
    setIsOpen(false);
  };

  const currentTempStart = `${startHour.padStart(2, "0")}:${startMinute.padStart(2, "0")}`;
  const currentTempEnd = `${endHour.padStart(2, "0")}:${endMinute.padStart(2, "0")}`;

  return (
    <div className={`w-full ${className}`}>
      {/* Trigger Card matching user screenshot */}
      <div
        onClick={handleOpen}
        className="w-full bg-[#F8F9FB] hover:bg-[#F1F3F7] active:bg-[#EAECEF] border border-gray-200/90 hover:border-gray-300 rounded-2xl px-4 py-3 flex items-center justify-between cursor-pointer transition-all duration-150 shadow-sm group select-none"
      >
        <div className="flex-1 pr-3">
          {displayValue ? (
            <span className="text-[#0B132B] font-medium text-sm sm:text-base block">
              {displayValue}
            </span>
          ) : (
            <span className="text-gray-400 font-normal text-sm sm:text-base block">
              {placeholder}
            </span>
          )}
        </div>

        <div className="text-gray-500 group-hover:text-gray-700 transition-colors flex-shrink-0">
          <Calendar className="w-5 h-5 stroke-[1.75]" />
        </div>
      </div>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100 flex flex-col">
            
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-yellow-50 flex items-center justify-center text-[#0B132B] border border-yellow-200">
                  <Clock className="w-5 h-5 text-[#0B132B]" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Atur Jam Sesi Shift {dayName ? `(${dayName})` : ""}</h3>
                  <p className="text-xs text-gray-500">Format 24 Jam (00:00 – 23:59 WIB)</p>
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

            {/* Body */}
            <div className="p-6 space-y-5">
              {error && (
                <div className="bg-red-50 text-red-700 p-3 rounded-xl border border-red-200 text-xs flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* 24-Hour Time Selectors (No AM/PM) */}
              <div className="grid grid-cols-2 gap-4">
                
                {/* Jam Mulai */}
                <div className="bg-[#F8F9FB] p-3.5 rounded-2xl border border-gray-200">
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-2 text-center">
                    Jam Mulai (24 Jam)
                  </label>
                  <div className="flex items-center justify-center gap-1.5">
                    {/* Hour Select */}
                    <div className="flex flex-col items-center">
                      <select
                        value={startHour}
                        onChange={(e) => {
                          setStartHour(e.target.value);
                          setError(null);
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

                    {/* Minute Select */}
                    <div className="flex flex-col items-center">
                      <select
                        value={startMinute}
                        onChange={(e) => {
                          setStartMinute(e.target.value);
                          setError(null);
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
                    {/* Hour Select */}
                    <div className="flex flex-col items-center">
                      <select
                        value={endHour}
                        onChange={(e) => {
                          setEndHour(e.target.value);
                          setError(null);
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

                    {/* Minute Select */}
                    <div className="flex flex-col items-center">
                      <select
                        value={endMinute}
                        onChange={(e) => {
                          setEndMinute(e.target.value);
                          setError(null);
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

              {/* Live Preview */}
              <div className="bg-yellow-50/70 border border-yellow-200/90 rounded-2xl p-4 text-center">
                <span className="text-[10px] font-bold text-yellow-900 uppercase tracking-wider block mb-1">
                  Format Tampilan Waktu:
                </span>
                <p className="text-base font-bold text-[#0B132B]">
                  {formatShiftTimeDisplay(currentTempStart, currentTempEnd, dayName)}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#0B132B] hover:bg-[#1a2b5e] text-white transition-colors shadow-sm flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5 text-[#FFC727]" />
                Terapkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
