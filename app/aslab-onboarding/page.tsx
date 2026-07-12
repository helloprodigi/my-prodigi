"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import toast from "react-hot-toast";
import { ChevronDown } from "lucide-react";
import strukturOrganisasi from "@/data/struktur_organisasi.json";

export default function AslabOnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    divisi: "",
    jabatan: "",
  });

  // Extract all unique divisions
  const divisions = strukturOrganisasi.map((item) => item.divisi);

  // Extract unique roles based on selected division, grouped per team with
  // "Kepala Divisi" always placed above its regular members
  const availableRoles = formData.divisi
    ? (() => {
        const members =
          strukturOrganisasi.find((item) => item.divisi === formData.divisi)
            ?.members || [];

        const groups = new Map<string, { kepala?: string; anggota?: string }>();
        for (const { posisi } of members) {
          const isKepala = posisi.includes("(Kepala Divisi)");
          const team = posisi.replace(" (Kepala Divisi)", "").trim();
          const group = groups.get(team) || {};
          if (isKepala) group.kepala = posisi;
          else group.anggota = posisi;
          groups.set(team, group);
        }

        return Array.from(groups.values()).flatMap((g) =>
          [g.kepala, g.anggota].filter((v): v is string => Boolean(v))
        );
      })()
    : [];

  const handleSubmit = async () => {
    if (!formData.divisi || !formData.jabatan) {
      toast.error("Silakan lengkapi divisi dan jabatan.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/aslab-onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success("Profil Asisten Lab berhasil disimpan!");
        router.push("/dashboard");
      } else {
        const errorData = await res.json();
        console.error("Failed to save aslab data:", errorData.error);
        toast.error("Error saving data: " + errorData.error);
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan sistem.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col font-sans relative overflow-hidden">
      {/* Decorative circle at bottom left */}
      <div className="absolute -bottom-32 -left-32 w-96 h-96 border-[8px] border-[#FFC700] rounded-full opacity-80 pointer-events-none"></div>
      <div className="absolute -bottom-40 -left-20 w-96 h-96 border-[4px] border-[#FFC700] rounded-full opacity-50 pointer-events-none"></div>

      {/* Header */}
      <header className="w-full bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center px-10 py-4 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center cursor-pointer">
          <Image
            src="/assets/myprodigi-logo.svg"
            alt="MyProdigi Logo"
            width={160}
            height={48}
            className="h-12 w-auto object-contain"
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-8 z-10">
        <div className="w-full max-w-xl">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-[#0A1024] mb-2">
              Lengkapi Profil Aslab
            </h1>
            <p className="text-gray-500">
              Silahkan lengkapi data dibawah untuk keperluan registrasi
            </p>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">Divisi</label>
              <div className="relative">
                <select
                  className="select-clean w-full p-4 pr-10 bg-[#F6F6F6] border border-gray-200 rounded-xl outline-none focus:outline-none focus:ring-0 appearance-none text-gray-900"
                  value={formData.divisi}
                  onChange={(e) =>
                    setFormData({ divisi: e.target.value, jabatan: "" })
                  }
                >
                  <option value="" disabled>
                    Pilih Divisi
                  </option>
                  {divisions.map((div) => (
                    <option key={div} value={div}>
                      {div}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-6 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-500" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">
                Posisi/Jabatan
              </label>
              <div className="relative">
                <select
                  className="select-clean w-full p-4 pr-10 bg-[#F6F6F6] border border-gray-200 rounded-xl outline-none focus:outline-none focus:ring-0 appearance-none text-gray-900 disabled:opacity-50"
                  value={formData.jabatan}
                  onChange={(e) =>
                    setFormData({ ...formData, jabatan: e.target.value })
                  }
                  disabled={!formData.divisi}
                >
                  <option value="" disabled>
                    Pilih Jabatan
                  </option>
                  {availableRoles.map((role, idx) => (
                    <option key={idx} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-6 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-500" />
              </div>
            </div>

            <div className="flex justify-end mt-10">
              <button
                onClick={handleSubmit}
                disabled={!formData.divisi || !formData.jabatan || loading}
                className="bg-[#FFC700] text-[#0A1024] font-semibold py-3 px-10 rounded-xl hover:bg-[#e6b400] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Menyimpan..." : "Continue"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
