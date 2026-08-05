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

export default function ShiftTimePicker({
  dayName,
  waktuMulai,
  waktuSelesai,
  onChange,
  placeholder = "Pilih waktu pelaksanaan",
  className = ""
}: ShiftTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempStart, setTempStart] = useState(waktuMulai || "08:00");
  const [tempEnd, setTempEnd] = useState(waktuSelesai || "11:30");
  const [error, setError] = useState<string | null>(null);

  const displayValue = formatShiftTimeDisplay(waktuMulai, waktuSelesai);

  const handleOpen = () => {
    setTempStart(waktuMulai || "08:00");
    setTempEnd(waktuSelesai || "11:30");
    setError(null);
    setIsOpen(true);
  };

  const handleSave = () => {
    if (!tempStart || !tempEnd) {
      setError("Harap tentukan jam mulai dan selesai.");
      return;
    }
    if (tempEnd <= tempStart) {
      setError("Jam selesai harus lebih lambat dari jam mulai.");
      return;
    }
    onChange(tempStart, tempEnd);
    setIsOpen(false);
  };

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
                  <p className="text-xs text-gray-500">Format 24 Jam (WIB)</p>
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Jam Mulai
                  </label>
                  <input
                    type="time"
                    step="60"
                    value={tempStart}
                    onChange={(e) => {
                      setTempStart(e.target.value);
                      setError(null);
                    }}
                    className="w-full bg-[#F8F9FB] border border-gray-200 rounded-xl px-4 py-3 text-sm text-[#0B132B] font-semibold focus:outline-none focus:ring-2 focus:ring-[#FFC727] focus:bg-white transition-all text-center"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Jam Selesai
                  </label>
                  <input
                    type="time"
                    step="60"
                    value={tempEnd}
                    onChange={(e) => {
                      setTempEnd(e.target.value);
                      setError(null);
                    }}
                    className="w-full bg-[#F8F9FB] border border-gray-200 rounded-xl px-4 py-3 text-sm text-[#0B132B] font-semibold focus:outline-none focus:ring-2 focus:ring-[#FFC727] focus:bg-white transition-all text-center"
                  />
                </div>
              </div>

              {/* Quick Presets */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Preset Sesi Shift
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { label: "Shift Pagi (08.00–11.30)", start: "08:00", end: "11:30" },
                    { label: "Shift Siang (13.00–16.30)", start: "13:00", end: "16:30" },
                    { label: "Shift Sore (16.30–18.30)", start: "16:30", end: "18:30" },
                    { label: "Shift Malam (19.00–21.00)", start: "19:00", end: "21:00" },
                  ].map((preset, idx) => {
                    const isSelected = tempStart === preset.start && tempEnd === preset.end;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setTempStart(preset.start);
                          setTempEnd(preset.end);
                          setError(null);
                        }}
                        className={`px-3.5 py-2.5 rounded-xl text-xs sm:text-[13px] font-semibold transition-all duration-150 text-left border shadow-sm ${
                          isSelected
                            ? "bg-yellow-100/80 border-yellow-400 text-[#0B132B] ring-2 ring-[#FFC727]/40"
                            : "bg-[#F4F5F8] hover:bg-yellow-50/70 border-gray-300 text-[#0B132B] hover:border-yellow-300"
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Live Preview */}
              {tempStart && tempEnd && (
                <div className="bg-yellow-50/60 border border-yellow-200/80 rounded-2xl p-3.5">
                  <span className="text-[10px] font-bold text-yellow-800 uppercase tracking-wider block mb-1">
                    Tampilan Waktu:
                  </span>
                  <p className="text-sm font-semibold text-[#0B132B]">
                    {formatShiftTimeDisplay(tempStart, tempEnd, dayName)}
                  </p>
                </div>
              )}
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
