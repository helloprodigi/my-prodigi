"use client";

import React, { useState } from "react";

export default function AslabDashboard() {
  const [currentDate] = useState(new Date("2026-07-14"));

  return (
    <div className="min-h-screen bg-[#FBFBFB] relative overflow-hidden flex flex-col p-8">
      <div className="w-full z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-6 w-full">
          <h1 className="text-3xl font-bold text-[#0A1024]">Dashboard</h1>
        </div>

        {/* Proker & Informasi Terdekat */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-[#0A1024] mb-4">
            Proker & Informasi Terdekat
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1 */}
            <div className="bg-[#FFF9E6] border border-[#FFE899] rounded-xl p-5 shadow-sm">
              <div className="text-xs font-semibold text-gray-500 mb-1">
                Product Team
              </div>
              <h3 className="font-bold text-lg text-[#0A1024] mb-2">
                Master Design Systems
              </h3>
              <div className="text-xs text-gray-500 mb-4">Rabu, 28 Juli 2026</div>
              <p className="text-xs text-gray-600 line-clamp-2">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit ut
                aliquam, purus sit amet luctus venenatis, lectus...
              </p>
            </div>
            
            {/* Card 2 */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <div className="text-xs font-semibold text-gray-500 mb-1">
                Data Mining
              </div>
              <h3 className="font-bold text-lg text-[#0A1024] mb-2 truncate">
                Pembinaan Lomba Satria Dat...
              </h3>
              <div className="text-xs text-gray-500 mb-4">Rabu, 28 Juli 2026</div>
              <p className="text-xs text-gray-600 line-clamp-2">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit ut
                aliquam, purus sit amet luctus venenatis, lectus...
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <div className="text-xs font-semibold text-gray-500 mb-1">
                Data Mining
              </div>
              <h3 className="font-bold text-lg text-[#0A1024] mb-2 truncate">
                Pembinaan Lomba Satria Dat...
              </h3>
              <div className="text-xs text-gray-500 mb-4">Rabu, 28 Juli 2026</div>
              <p className="text-xs text-gray-600 line-clamp-2">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit ut
                aliquam, purus sit amet luctus venenatis, lectus...
              </p>
            </div>

            {/* Card 4 */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <div className="text-xs font-semibold text-gray-500 mb-1">
                Data Mining
              </div>
              <h3 className="font-bold text-lg text-[#0A1024] mb-2 truncate">
                Pembinaan Lomba Satria Dat...
              </h3>
              <div className="text-xs text-gray-500 mb-4">Rabu, 28 Juli 2026</div>
              <p className="text-xs text-gray-600 line-clamp-2">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit ut
                aliquam, purus sit amet luctus venenatis, lectus...
              </p>
            </div>
          </div>
        </section>

        {/* Kalender & Legenda */}
        <section className="flex flex-col lg:flex-row gap-6">
          {/* Calendar Area */}
          <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-bold text-[#0A1024]">
                  Tuesday, July 14, 2026
                </h2>
                <div className="flex items-center gap-2 border border-gray-200 rounded-lg overflow-hidden p-1">
                  <button className="px-3 hover:bg-gray-100 rounded-md transition-colors">&lt;</button>
                  <button className="px-3 text-sm font-medium hover:bg-gray-100 rounded-md transition-colors">Today</button>
                  <button className="px-3 hover:bg-gray-100 rounded-md transition-colors">&gt;</button>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2 border border-gray-200 rounded-lg overflow-hidden p-1 bg-gray-50">
                  <button className="px-4 py-1.5 text-sm font-medium bg-white shadow-sm rounded-md border border-gray-200 flex items-center gap-2">
                    📅 Month
                  </button>
                  <button className="px-4 py-1.5 text-sm font-medium text-gray-500 flex items-center gap-2 hover:bg-gray-100 rounded-md transition-colors">
                    ⊞ Week
                  </button>
                </div>
                <select className="border border-gray-200 rounded-lg px-4 py-2 text-sm font-medium outline-none text-[#0A1024]">
                  <option>Semua Departmen</option>
                </select>
              </div>
            </div>

            {/* Mock Calendar Grid */}
            <div className="w-full">
              <div className="grid grid-cols-7 border-t border-l border-gray-200">
                {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((day) => (
                  <div key={day} className="text-center py-2 text-xs font-semibold text-gray-500 border-b border-r border-gray-200 bg-gray-50">
                    {day}
                  </div>
                ))}
                
                {/* 5 weeks * 7 days = 35 cells mockup for July 2026 */}
                {Array.from({ length: 35 }).map((_, i) => {
                  const dayNum = i - 1; // offset for the month start
                  const isValidDay = dayNum > 0 && dayNum <= 31;
                  return (
                    <div key={i} className="h-28 border-b border-r border-gray-200 p-1 relative">
                      {isValidDay && (
                        <>
                          <span className={`text-xs p-1 ${dayNum === 14 ? "bg-[#FFC700] text-white rounded-full w-6 h-6 flex items-center justify-center font-bold" : "text-gray-500"}`}>
                            {dayNum}
                          </span>
                          
                          {/* Mock Events */}
                          {dayNum === 3 && (
                            <div className="mt-1 w-full bg-[#00BFA5] text-white text-[9px] px-1.5 py-0.5 rounded truncate">
                              Workshop UI/UX
                            </div>
                          )}
                          {dayNum === 8 && (
                            <div className="mt-1 w-full bg-[#2979FF] text-white text-[9px] px-1.5 py-0.5 rounded truncate">
                              Rapat Koordinasi
                            </div>
                          )}
                          {dayNum === 14 && (
                            <>
                              <div className="mt-1 w-full bg-[#FF6D00] text-white text-[9px] px-1.5 py-0.5 rounded truncate">
                                Audit Inventaris
                              </div>
                              <div className="mt-1 w-full bg-[#9C27B0] text-white text-[9px] px-1.5 py-0.5 rounded truncate">
                                Sosialisasi
                              </div>
                            </>
                          )}
                        </>
                      )}
                      {!isValidDay && <span className="text-xs p-1 text-gray-300">{i === 0 ? 28 : i === 1 ? 29 : i === 2 ? 30 : dayNum - 31}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Legenda Divisi */}
          <div className="w-full lg:w-72 bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex-shrink-0 self-start">
            <h3 className="text-lg font-bold text-[#0A1024] mb-6">Legenda Divisi</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-[#2979FF]"></div>
                <span className="text-sm text-gray-600">Divisi Competitive Programming</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-[#FF6D00]"></div>
                <span className="text-sm text-gray-600">Divisi Data Mining</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-[#7C4DFF]"></div>
                <span className="text-sm text-gray-600">Divisi Cybersecurity</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-[#9C27B0]"></div>
                <span className="text-sm text-gray-600">Divisi Entrepreneurship</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-[#E53935]"></div>
                <span className="text-sm text-gray-600">Data Event Organizer</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-[#43A047]"></div>
                <span className="text-sm text-gray-600">Divisi Human Capital</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-[#00BFA5]"></div>
                <span className="text-sm text-gray-600">Divisi Innovation</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-[#795548]"></div>
                <span className="text-sm text-gray-600">Divisi Media & Design</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-[#F57C00]"></div>
                <span className="text-sm text-gray-600">Divisi Partnership</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-[#00C853]"></div>
                <span className="text-sm text-gray-600">Divisi Product</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
