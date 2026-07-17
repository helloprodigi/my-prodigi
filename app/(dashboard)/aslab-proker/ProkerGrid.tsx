"use client";

import { useState } from "react";
import Image from "next/image";

import { divisions } from "@/lib/divisions";
import { ProkerDetailModal } from "./ProkerDetailModal";

type Division = (typeof divisions)[number];
export type DivisionData = Division & { pic: string; selesai: number; total: number };

function ProkerCard({ data, onLihatDetail }: { data: DivisionData; onLihatDetail: () => void }) {
  const { name, color, badgeBg, badgeText, pic, selesai, total } = data;
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
          Person In Charge : <span className="font-semibold text-[#0A1024]">{pic}</span>
        </p>
        <span
          className="inline-block text-xs font-medium px-3 py-1.5 rounded-full mb-4"
          style={{ backgroundColor: badgeBg, color: badgeText }}
        >
          Jumlah Proker Selesai : {selesai}/{total}
        </span>
        <button
          onClick={onLihatDetail}
          className="w-full bg-[#FFC700] text-[#0A1024] font-semibold py-2.5 rounded-lg text-sm hover:bg-[#e6b400] transition-colors"
        >
          Lihat Detail
        </button>
      </div>
    </div>
  );
}

export function ProkerGrid({
  divisionsData,
  isKetua,
  myDivisionName,
}: {
  divisionsData: DivisionData[];
  isKetua: boolean;
  myDivisionName: string | null;
}) {
  const [openDivision, setOpenDivision] = useState<DivisionData | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {divisionsData.map((division) => (
          <ProkerCard key={division.name} data={division} onLihatDetail={() => setOpenDivision(division)} />
        ))}
      </div>

      {openDivision && (
        <ProkerDetailModal
          division={openDivision}
          canCheck={isKetua}
          canEdit={isKetua || myDivisionName === openDivision.name}
          onClose={() => setOpenDivision(null)}
        />
      )}
    </>
  );
}
