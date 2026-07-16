"use client";

import Image from "next/image";
import Link from "next/link";

import { divisions } from "@/lib/divisions";

function ProkerCard({ name, color, badgeBg, badgeText }: (typeof divisions)[number]) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden">
      <div className="relative h-40 overflow-hidden" style={{ backgroundColor: color }}>
        <div className="absolute top-4 left-4">
          <Image src="/assets/myprodigi-sidebar.svg" alt="" width={32} height={36} className="w-8 h-9 object-contain" />
        </div>
        <div className="absolute bottom-0 right-0 pointer-events-none w-28 h-16 md:w-36 md:h-20 select-none flex items-end justify-end opacity-90 [filter:brightness(0)_invert(1)]">
          <Image
            src="/assets/matchmaking/cropped-yellowcircle.svg"
            alt=""
            width={240}
            height={180}
            className="object-right-bottom object-contain m-0 p-0 block w-full h-full"
          />
        </div>
      </div>

      <div className="p-5">
        <div className="text-xs font-semibold mb-1" style={{ color: "#FFC700" }}>
          Program Kerja Divisi
        </div>
        <h3 className="font-bold text-xl text-[#0A1024] mb-3">{name}</h3>
        <p className="text-sm text-gray-500 mb-3">
          Person In Charge : <span className="font-semibold text-[#0A1024]">Ahmad Rafiansyah</span>
        </p>
        <span
          className="inline-block text-xs font-medium px-3 py-1.5 rounded-full mb-4"
          style={{ backgroundColor: badgeBg, color: badgeText }}
        >
          Jumlah Proker Selesai : 1/5
        </span>
        <button className="w-full bg-[#FFC700] text-[#0A1024] font-semibold py-2.5 rounded-lg text-sm hover:bg-[#e6b400] transition-colors">
          Lihat Detail
        </button>
      </div>
    </div>
  );
}

export default function AslabProkerPage() {
  return (
    <div className="min-h-screen bg-[#FBFBFB] p-8">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <h1 className="text-[22px] sm:text-3xl md:text-4xl font-bold text-[#0A1024]">Program Kerja</h1>
        <div className="flex items-center gap-3">
          <Link
            href="/aslab-proker/buat-laporan"
            className="bg-[#0A1024] text-white font-semibold px-5 py-2.5 rounded-lg text-sm hover:bg-[#1E2538] transition-colors"
          >
            Buat Laporan
          </Link>
          <Link
            href="/aslab-proker/buat-proker"
            className="bg-[#FFC700] text-[#0A1024] font-semibold px-5 py-2.5 rounded-lg text-sm hover:bg-[#e6b400] transition-colors"
          >
            Buat Proker
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {divisions.map((division) => (
          <ProkerCard key={division.name} {...division} />
        ))}
      </div>
    </div>
  );
}
