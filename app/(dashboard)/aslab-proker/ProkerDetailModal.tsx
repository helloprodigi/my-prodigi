"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { X } from "lucide-react";
import toast from "react-hot-toast";

import type { DivisionData } from "./ProkerGrid";

type ProkerItem = {
  id: string;
  nama: string;
  deskripsi: string | null;
  tanggalMulai: string;
  status: "SELESAI" | "BELUM_SELESAI";
};

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function ProkerDetailModal({
  division,
  canCheck,
  canEdit,
  onClose,
}: {
  division: DivisionData;
  canCheck: boolean;
  canEdit: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [items, setItems] = useState<ProkerItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [checkedMap, setCheckedMap] = useState<Record<string, boolean>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/proker?divisi=${encodeURIComponent(division.name)}`)
      .then((res) => res.json())
      .then((data) => {
        const list: ProkerItem[] = data.programKerja ?? [];
        setItems(list);
        setCheckedMap(Object.fromEntries(list.map((item) => [item.id, item.status === "SELESAI"])));
        setSelectedId(list[0]?.id ?? null);
      })
      .catch(() => toast.error("Gagal memuat program kerja"))
      .finally(() => setIsLoading(false));
  }, [division.name]);

  const handleClose = async () => {
    if (!canCheck) {
      onClose();
      return;
    }

    const changed = items.filter((item) => checkedMap[item.id] !== (item.status === "SELESAI"));
    if (changed.length === 0) {
      onClose();
      return;
    }

    setIsSaving(true);
    try {
      await Promise.all(
        changed.map((item) =>
          fetch(`/api/proker/${item.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: checkedMap[item.id] ? "SELESAI" : "BELUM_SELESAI" }),
          })
        )
      );
      router.refresh();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Gagal menyimpan perubahan");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditProker = () => {
    if (!selectedId) return;
    router.push(`/aslab-proker/edit/${selectedId}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl flex flex-col">
        <div className="shrink-0 flex justify-end px-6 pt-6 pb-4">
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-[#0A1024] transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="shrink-0 px-6">
          <div className="relative overflow-hidden rounded-2xl px-8 py-6" style={{ backgroundColor: division.color }}>
            <div className="absolute bottom-0 right-0 pointer-events-none w-36 h-24 select-none flex items-end justify-end opacity-90 [filter:brightness(0)_invert(1)]">
              <Image
                src="/assets/matchmaking/cropped-yellowcircle.svg"
                alt=""
                width={240}
                height={180}
                className="object-right-bottom object-contain m-0 p-0 block w-full h-full"
              />
            </div>
            <div className="relative">
              <p className="text-white/80 text-xs font-semibold mb-1">Detail Program Kerja</p>
              <h2 className="text-white text-2xl sm:text-3xl font-bold">{division.name}</h2>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5">
          {isLoading ? (
            <p className="text-sm text-gray-400">Memuat...</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-gray-400">Belum ada program kerja untuk divisi ini.</p>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                onClick={() => canEdit && setSelectedId(item.id)}
                className={`flex items-start gap-3 rounded-lg -mx-3 px-3 py-2 transition-colors ${
                  canEdit ? "cursor-pointer" : ""
                } ${canEdit && selectedId === item.id ? "bg-[#FFF9E6]" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={checkedMap[item.id] ?? false}
                  disabled={!canCheck}
                  onChange={(e) => {
                    e.stopPropagation();
                    setCheckedMap((prev) => ({ ...prev, [item.id]: e.target.checked }));
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="mt-1.5 w-4 h-4 rounded accent-[#FFC700] shrink-0 disabled:opacity-60"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="font-bold text-[#0A1024]">{item.nama}</h3>
                    <span className="text-xs text-gray-400 whitespace-nowrap shrink-0">
                      {dateFormatter.format(new Date(item.tanggalMulai))}
                    </span>
                  </div>
                  {item.deskripsi && (
                    <p className="text-sm text-gray-500 mt-1">{item.deskripsi}</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="shrink-0 flex items-center justify-end gap-3 px-8 py-5 border-t border-gray-100">
          <button
            onClick={handleClose}
            disabled={isSaving}
            className="bg-[#FFF3CC] text-[#0A1024] font-semibold px-6 py-2.5 rounded-lg text-sm hover:bg-[#ffedad] transition-colors disabled:opacity-60"
          >
            {isSaving ? "Menyimpan..." : "Close"}
          </button>
          {canEdit && (
            <button
              onClick={handleEditProker}
              disabled={!selectedId}
              className="bg-[#FFC700] text-[#0A1024] font-semibold px-6 py-2.5 rounded-lg text-sm hover:bg-[#e6b400] transition-colors disabled:opacity-50"
            >
              Edit Proker
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
