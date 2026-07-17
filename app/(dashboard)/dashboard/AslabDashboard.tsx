"use client";

import React, { useState } from "react";
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

export default function AslabDashboard() {
  const [currentDate] = useState(new Date("2026-07-14"));

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
            {/* Card 1 */}
            <div className="bg-[#FFF9E6] rounded-xl p-5 w-72 shrink-0">
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
            <div className="bg-white rounded-xl p-5 w-72 shrink-0">
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
            <div className="bg-white rounded-xl p-5 w-72 shrink-0">
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
            <div className="bg-white rounded-xl p-5 w-72 shrink-0">
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
          <div className="flex-1 bg-white rounded-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-bold text-[#0A1024]">
                  Tuesday, July 14, 2026
                </h2>
                <div className="flex items-center gap-2">
                  <button className="w-10 h-10 flex items-center justify-center border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button className="h-10 px-6 flex items-center justify-center text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">Today</button>
                  <button className="w-10 h-10 flex items-center justify-center border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="h-10 flex items-center gap-2 border border-gray-200 rounded-lg overflow-hidden p-1 bg-gray-50">
                  <button className="h-full px-4 text-sm font-medium bg-white rounded-md border border-gray-200 flex items-center gap-2">
                    <Image src="/assets/dashboard-aslab/uil_calender.svg" alt="" width={16} height={16} />
                    Month
                  </button>
                  <button className="h-full px-4 text-sm font-medium text-gray-500 flex items-center gap-2 hover:bg-gray-100 rounded-md transition-colors">
                    <Image src="/assets/dashboard-aslab/boxicons_grid.svg" alt="" width={16} height={16} />
                    Week
                  </button>
                </div>
                <div className="relative">
                  <select className="select-clean h-10 border border-gray-200 rounded-lg pl-4 pr-8 text-sm font-medium outline-none appearance-none text-[#0A1024]">
                    <option>Semua Departmen</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                </div>
              </div>
            </div>

            {/* Mock Calendar Grid */}
            <div className="w-full">
              <div className="grid grid-cols-7 border-t border-l border-gray-200">
                {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((day) => (
                  <div key={day} className="text-center py-2 text-xs font-semibold text-gray-500 border-b border-r border-gray-200 bg-white">
                    {day}
                  </div>
                ))}
                
                {/* 5 weeks * 7 days = 35 cells mockup for July 2026 */}
                {Array.from({ length: 35 }).map((_, i) => {
                  const dayNum = i - 1; // offset for the month start
                  const isValidDay = dayNum > 0 && dayNum <= 31;
                  const isWeekend = i % 7 === 0 || i % 7 === 6; // Minggu & Sabtu columns
                  return (
                    <div
                      key={i}
                      className={`h-20 border-b border-r border-gray-200 p-1 relative ${isWeekend ? "bg-[#F8F9FA]" : ""}`}
                    >
                      {isValidDay && (
                        <>
                          <div className="flex justify-end">
                            <span className={`text-xs leading-none p-1 ${dayNum === 14 ? "bg-[#FFC700] text-white rounded-full w-6 h-6 flex items-center justify-center font-bold" : "text-gray-500"}`}>
                              {dayNum}
                            </span>
                          </div>

                          {/* Mock Events */}
                          {dayNum === 3 && (
                            <div className="mt-0.5 w-full bg-[#00BFA5] text-white text-[9px] leading-none px-1.5 py-0.5 rounded truncate">
                              Workshop UI/UX
                            </div>
                          )}
                          {dayNum === 8 && (
                            <div className="mt-0.5 w-full bg-[#2979FF] text-white text-[9px] leading-none px-1.5 py-0.5 rounded truncate">
                              Rapat Koordinasi
                            </div>
                          )}
                          {dayNum === 14 && (
                            <>
                              <div className="mt-0.5 w-full bg-[#FF6D00] text-white text-[9px] leading-none px-1.5 py-0.5 rounded truncate">
                                Audit Inventaris
                              </div>
                              <div className="mt-0.5 w-full bg-[#9C27B0] text-white text-[9px] leading-none px-1.5 py-0.5 rounded truncate">
                                Sosialisasi
                              </div>
                            </>
                          )}
                        </>
                      )}
                      {!isValidDay && (
                        <div className="flex justify-end">
                          <span className="text-xs p-1 text-gray-300">{i === 0 ? 28 : i === 1 ? 29 : i === 2 ? 30 : dayNum - 31}</span>
                        </div>
                      )}
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
                  <span className="text-sm text-gray-600">{legendLabels[division.name]}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
