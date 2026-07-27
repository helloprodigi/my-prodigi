"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

type DraftCompetition = {
  id: string;
  title: string;
  organizer: string;
  tab: string;
  skills: string[];
  description: string | null;
  link: string | null;
};

const TAB_OPTIONS = [
  { label: "Guidebook", value: "Guidebook" },
  { label: "Proposal", value: "Proposal" },
  { label: "Pitch Deck", value: "Pitch Deck" },
];

export default function DraftCompetitionManager() {
  const [items, setItems] = useState<DraftCompetition[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "",
    organizer: "",
    tab: "Guidebook",
    tags: "UI/UX Design, Innovation",
    description: "",
    link: "",
  });

  const loadItems = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/draft-competitions");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setItems(data.draftCompetitions || []);
    } catch (error: any) {
      toast.error(error.message || "Gagal memuat draft competition");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadItems();
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/draft-competitions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          organizer: form.organizer,
          tab: form.tab,
          skills: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
          description: form.description,
          link: form.link,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan");

      toast.success("Draft competition tersimpan");
      setForm({ title: "", organizer: "", tab: "Guidebook", tags: "UI/UX Design, Innovation", description: "", link: "" });
      await loadItems();
    } catch (error: any) {
      toast.error(error.message || "Gagal menyimpan draft competition");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
      <form onSubmit={submit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div>
          <h2 className="text-xl font-bold text-[#0A1024]">Tambah Draft Competition</h2>
          <p className="text-sm text-gray-500 mt-1">Simpan guidebook, proposal, atau pitch deck sebagai data asli di Supabase.</p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Judul</label>
          <input className="w-full rounded-xl border border-transparent bg-gray-50 px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-inset focus:ring-[#FFC700] focus:border-[#FFC700] transition-all" value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} required />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Organizer</label>
          <input className="w-full rounded-xl border border-transparent bg-gray-50 px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-inset focus:ring-[#FFC700] focus:border-[#FFC700] transition-all" value={form.organizer} onChange={(e) => setForm((prev) => ({ ...prev, organizer: e.target.value }))} required />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Tab</label>
          <select className="w-full rounded-xl border border-transparent bg-gray-50 px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-inset focus:ring-[#FFC700] focus:border-[#FFC700] transition-all" value={form.tab} onChange={(e) => setForm((prev) => ({ ...prev, tab: e.target.value }))}>
            {TAB_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Tags</label>
          <input className="w-full rounded-xl border border-transparent bg-gray-50 px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-inset focus:ring-[#FFC700] focus:border-[#FFC700] transition-all" placeholder="UI/UX Design, Innovation" value={form.tags} onChange={(e) => setForm((prev) => ({ ...prev, tags: e.target.value }))} />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Deskripsi</label>
          <textarea className="w-full rounded-xl border border-transparent bg-gray-50 px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-inset focus:ring-[#FFC700] focus:border-[#FFC700] transition-all min-h-28" value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Link</label>
          <input className="w-full rounded-xl border border-transparent bg-gray-50 px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-inset focus:ring-[#FFC700] focus:border-[#FFC700] transition-all" value={form.link} onChange={(e) => setForm((prev) => ({ ...prev, link: e.target.value }))} />
        </div>

        <button disabled={submitting} className="w-full rounded-xl bg-[#FFC700] px-4 py-3 font-semibold text-[#0A1024] hover:bg-[#e6b400] disabled:opacity-60">
          {submitting ? "Menyimpan..." : "Simpan Draft"}
        </button>
      </form>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-[#0A1024]">Data Draft</h2>
            <p className="text-sm text-gray-500">Isi di sini akan muncul di page Draft Competition aslab.</p>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-gray-500">Memuat data...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-gray-500">Belum ada draft competition.</p>
        ) : (
          <div className="space-y-3 max-h-[70vh] overflow-auto pr-1">
            {items.map((item) => (
              <div key={item.id} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold text-[#FFC700] mb-1">{item.tab}</p>
                    <h3 className="font-semibold text-[#0A1024]">{item.title}</h3>
                    <p className="text-sm text-gray-500">{item.organizer}</p>
                  </div>
                </div>
                <p className="mt-3 text-sm text-gray-600">{item.description || "-"}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}