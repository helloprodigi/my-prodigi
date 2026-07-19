"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { divisions } from "@/lib/divisions";

const legendLabels: Record<string, string> = {
  "Competitive Programming": "Divisi Competitive Programming",
  "Data Mining": "Divisi Data Mining",
  "Cybersecurity": "Divisi Cybersecurity",
  "Entrepreneurship": "Divisi Entrepreneurship",
  "Event Originazer": "Data Event Organizer",
  "Human Capital": "Divisi Human Capital",
  "Innovation": "Divisi Innovation",
  "Media & Design": "Divisi Media & Design",
  "Partnertship": "Divisi Partnership",
  "Product": "Divisi Product",
};

interface Proker {
  id: string;
  divisi: string;
  nama: string;
  deskripsi: string | null;
  tanggalMulai: string;
  tanggalSelesai: string;
  status: string;
  createdAt: string;
}

export default function AslabDashboard() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [prokers, setProkers] = useState<Proker[]>([]);
  const [selectedDivisi, setSelectedDivisi] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"month" | "week">("month");

  useEffect(() => {
    async function fetchProkers() {
      setLoading(true);
      try {
        const url = selectedDivisi ? `/api/proker?divisi=${encodeURIComponent(selectedDivisi)}` : "/api/proker";
        const res = await fetch(url);
        const data = await res.json();
        if (data.programKerja) {
          setProkers(data.programKerja);
        }
      } catch (err) {
        console.error("Failed to fetch prokers", err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchProkers();
  }, [selectedDivisi]);

  const closestProkers = useMemo(() => {
    const today = new Date();
    // Set to start of day to include prokers starting today
    today.setHours(0, 0, 0, 0); 
    
    return [...prokers]
      .filter((p) => new Date(p.tanggalMulai) >= today)
      .sort((a, b) => new Date(a.tanggalMulai).getTime() - new Date(b.tanggalMulai).getTime())
      .slice(0, 4);
  }, [prokers]);

  const handlePrev = () => {
    if (viewMode === "month") {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    } else {
      const prevWeek = new Date(currentDate);
      prevWeek.setDate(currentDate.getDate() - 7);
      setCurrentDate(prevWeek);
    }
  };

  const handleNext = () => {
    if (viewMode === "month") {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    } else {
      const nextWeek = new Date(currentDate);
      nextWeek.setDate(currentDate.getDate() + 7);
      setCurrentDate(nextWeek);
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const calendarCells = useMemo(() => {
    if (viewMode === "month") {
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const startDayOfWeek = startOfMonth.getDay();
      const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
      const totalCells = startDayOfWeek + daysInMonth > 35 ? 42 : 35;

      return Array.from({ length: totalCells }).map((_, i) => {
        const cellDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        cellDate.setDate(1 - startDayOfWeek + i);
        return cellDate;
      });
    } else {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      return Array.from({ length: 7 }).map((_, i) => {
        const cellDate = new Date(startOfWeek);
        cellDate.setDate(startOfWeek.getDate() + i);
        return cellDate;
      });
    }
  }, [currentDate, viewMode]);

  const formattedDate = useMemo(() => {
    if (viewMode === "month") {
      return currentDate.toLocaleDateString("en-US", { 
        year: 'numeric', 
        month: 'long'
      });
    } else {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      
      const startStr = startOfWeek.toLocaleDateString("en-US", { month: 'short', day: 'numeric' });
      const endStr = endOfWeek.toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' });
      
      return `${startStr} - ${endStr}`;
    }
  }, [currentDate, viewMode]);

  return (
    <div className="min-h-screen bg-[#FBFBFB] relative overflow-hidden flex flex-col p-8">
      <div className="w-full z-10">
        {/* Header */}
        <div className="flex items-center justify-between pb-6 w-full">
          <h1 className="text-[22px] sm:text-3xl md:text-4xl font-bold text-[#0A1024]">Dashboard</h1>
        </div>

        {/* Proker & Informasi Terdekat */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-[#0A1024] mb-4">
            Proker & Informasi Terdekat
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {loading ? (
              <div className="text-sm text-gray-500 py-4">Memuat data...</div>
            ) : closestProkers.length > 0 ? (
              closestProkers.map((proker, index) => {
                const formattedProkerDate = new Date(proker.tanggalMulai).toLocaleDateString("id-ID", {
                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                });

                return (
                  <div key={proker.id} className={`${index === 0 ? "bg-[#FFF9E6]" : "bg-white"} rounded-xl p-5 w-72 shrink-0 border border-gray-100`}>
                    <div className="text-xs font-semibold text-gray-500 mb-1">
                      {proker.divisi}
                    </div>
                    <h3 className="font-bold text-lg text-[#0A1024] mb-2 truncate">
                      {proker.nama}
                    </h3>
                    <div className="text-xs text-gray-500 mb-4">{formattedProkerDate}</div>
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {proker.deskripsi || "Tidak ada deskripsi"}
                    </p>
                  </div>
                );
              })
            ) : (
              <div className="text-sm text-gray-500 py-4">Belum ada proker terdekat.</div>
            )}
          </div>
        </section>

        {/* Kalender & Legenda */}
        <section className="flex flex-col lg:flex-row gap-6">
          {/* Calendar Area */}
          <div className="flex-1 bg-white rounded-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-bold text-[#0A1024]">
                  {formattedDate}
                </h2>
                <div className="flex items-center gap-2">
                  <button onClick={handlePrev} className="w-10 h-10 flex items-center justify-center border border-gray-200 rounded-lg text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors shadow-sm bg-white">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button onClick={handleToday} className="h-10 px-6 flex items-center justify-center text-sm font-semibold border border-gray-200 rounded-lg text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors shadow-sm bg-white">
                    Today
                  </button>
                  <button onClick={handleNext} className="w-10 h-10 flex items-center justify-center border border-gray-200 rounded-lg text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors shadow-sm bg-white">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="h-10 flex items-center gap-1 border border-gray-200 rounded-lg overflow-hidden p-1 bg-gray-50 shadow-sm">
                  <button 
                    onClick={() => setViewMode("month")}
                    className={`h-full px-4 text-sm font-semibold rounded-md flex items-center gap-2 transition-all ${
                      viewMode === "month" 
                        ? "bg-white text-gray-900 shadow-sm border border-gray-200/60" 
                        : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                    }`}
                  >
                    <Image src="/assets/dashboard-aslab/uil_calender.svg" alt="" width={16} height={16} className={viewMode === "month" ? "opacity-100" : "opacity-60"} />
                    Month
                  </button>
                  <button 
                    onClick={() => setViewMode("week")}
                    className={`h-full px-4 text-sm font-semibold rounded-md flex items-center gap-2 transition-all ${
                      viewMode === "week" 
                        ? "bg-white text-gray-900 shadow-sm border border-gray-200/60" 
                        : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                    }`}
                  >
                    <Image src="/assets/dashboard-aslab/boxicons_grid.svg" alt="" width={16} height={16} className={viewMode === "week" ? "opacity-100" : "opacity-60"} />
                    Week
                  </button>
                </div>
                <div className="relative z-20">
                  <button 
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    className="h-10 border border-gray-200 rounded-lg pl-4 pr-10 text-sm font-medium text-[#0A1024] bg-white flex items-center justify-between min-w-[200px] hover:border-gray-300 transition-colors shadow-sm"
                  >
                    <span className="truncate">
                      {selectedDivisi ? selectedDivisi : "Semua Departmen"}
                    </span>
                    <ChevronDown className={`absolute right-3 w-4 h-4 text-gray-500 transition-transform duration-200 ${isFilterOpen ? "rotate-180" : ""}`} />
                  </button>
                  
                  {isFilterOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setIsFilterOpen(false)}></div>
                      <div className="absolute right-0 mt-2 w-full min-w-[220px] bg-white border border-gray-100 rounded-xl shadow-lg z-20 py-1 origin-top animate-in fade-in zoom-in-95 duration-100">
                        <div className="max-h-60 overflow-y-auto p-1.5 space-y-0.5 custom-scrollbar">
                          <button
                            onClick={() => { setSelectedDivisi(""); setIsFilterOpen(false); }}
                            className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors flex items-center gap-3 ${selectedDivisi === "" ? "bg-[#FFF9E6] text-[#0A1024] font-semibold" : "text-gray-600 hover:bg-gray-50"}`}
                          >
                            <div className={`w-2 h-2 rounded-full ${selectedDivisi === "" ? "bg-[#FFC700]" : "bg-transparent"}`}></div>
                            Semua Departmen
                          </button>
                          {divisions.map((d) => (
                            <button
                              key={d.name}
                              onClick={() => { setSelectedDivisi(d.name); setIsFilterOpen(false); }}
                              className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors flex items-center gap-3 ${selectedDivisi === d.name ? "bg-[#FFF9E6] text-[#0A1024] font-semibold" : "text-gray-600 hover:bg-gray-50"}`}
                            >
                              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.color }}></div>
                              <span className="truncate">{d.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Dynamic Calendar Grid */}
            <div className="w-full">
              <div className="grid grid-cols-7 border-t border-l border-gray-200">
                {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((day) => (
                  <div key={day} className="text-center py-2 text-xs font-bold text-gray-700 border-b border-r border-gray-200 bg-gray-50/50">
                    {day}
                  </div>
                ))}
                
                {calendarCells.map((cellDate, i) => {
                  const isCurrentMonth = cellDate.getMonth() === currentDate.getMonth();
                  const isToday = cellDate.toDateString() === new Date().toDateString();
                  const isWeekend = cellDate.getDay() === 0 || cellDate.getDay() === 6;
                  const dayNum = cellDate.getDate();
                  
                  const showAsFaded = viewMode === "month" && !isCurrentMonth;

                  const dayProkers = prokers.filter(p => {
                    const pDate = new Date(p.tanggalMulai);
                    return pDate.toDateString() === cellDate.toDateString();
                  });

                  return (
                    <div
                      key={i}
                      className={`h-28 border-b border-r border-gray-200 p-1.5 relative ${isWeekend ? "bg-[#F8F9FA]" : "bg-white"}`}
                    >
                      <div className="flex justify-end mb-1">
                        <span className={`text-xs w-6 h-6 flex items-center justify-center rounded-full font-semibold ${
                          isToday ? "bg-[#FFC700] text-white shadow-sm" : 
                          showAsFaded ? "text-gray-300" : "text-gray-700"
                        }`}>
                          {dayNum}
                        </span>
                      </div>

                      {/* Real Events */}
                      <div className="space-y-1 overflow-y-auto max-h-[72px] custom-scrollbar">
                        {dayProkers.map(p => {
                          const division = divisions.find(d => d.name === p.divisi);
                          return (
                            <div 
                              key={p.id} 
                              className="w-full text-white text-[10px] leading-tight px-1.5 py-0.5 rounded truncate shadow-sm cursor-pointer hover:opacity-90 transition-opacity" 
                              style={{ backgroundColor: division?.color || '#2979FF' }}
                              title={p.nama}
                            >
                              {p.nama}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Legenda Divisi */}
          <div className="w-full lg:w-72 bg-white rounded-xl p-6 flex-shrink-0 self-start">
            <h3 className="text-lg font-bold text-[#0A1024] mb-6">Legenda Divisi</h3>
            <div className="space-y-4">
              {divisions.map((division) => (
                <div key={division.name} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: division.color }}></div>
                  <span className="text-sm text-gray-600">{legendLabels[division.name] || `Divisi ${division.name}`}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
