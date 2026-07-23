"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, CheckCircle2, XCircle, MapPin } from "lucide-react";

function ScanAbsensiContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const type = searchParams.get("type"); // "datang" or "pulang"

  const [status, setStatus] = useState<"loading" | "locating" | "success" | "error">("locating");
  const [message, setMessage] = useState("Meminta akses lokasi...");

  useEffect(() => {
    if (!token || !type) {
      setStatus("error");
      setMessage("Token atau tipe absen tidak valid.");
      return;
    }

    if (!navigator.geolocation) {
      setStatus("error");
      setMessage("Geolokasi tidak didukung oleh browser Anda.");
      return;
    }

    // Get location
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        submitAbsensi(latitude, longitude);
      },
      (error) => {
        setStatus("error");
        if (error.code === error.PERMISSION_DENIED) {
          setMessage("Akses lokasi ditolak. Harap izinkan akses lokasi untuk melakukan absensi.");
        } else {
          setMessage("Gagal mendapatkan lokasi Anda.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [token, type]);

  const submitAbsensi = async (lat: number, lng: number) => {
    setStatus("loading");
    setMessage("Memverifikasi lokasi dan mencatat absensi...");

    try {
      const res = await fetch("/api/absensi/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, type, lat, lng })
      });

      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        setMessage(data.message || "Absensi berhasil dicatat!");
      } else {
        setStatus("error");
        setMessage(data.error || data.message || "Gagal melakukan absensi.");
      }
    } catch (error) {
      setStatus("error");
      setMessage("Terjadi kesalahan jaringan.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="bg-[#111] border border-white/10 rounded-2xl p-8 max-w-md w-full text-center space-y-6">
        
        {status === "locating" && (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-4">
              <MapPin className="w-8 h-8 text-blue-500 animate-bounce" />
            </div>
            <h1 className="text-xl font-bold text-white">Memeriksa Lokasi</h1>
            <p className="text-gray-400 mt-2">{message}</p>
          </div>
        )}

        {status === "loading" && (
          <div className="flex flex-col items-center">
            <Loader2 className="w-12 h-12 text-red-500 animate-spin mb-4" />
            <h1 className="text-xl font-bold text-white">Memproses Absensi</h1>
            <p className="text-gray-400 mt-2">{message}</p>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-12 h-12 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Berhasil!</h1>
            <p className="text-green-400 mb-8">{message}</p>
            <button 
              onClick={() => router.push("/myshift")}
              className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Kembali ke MyShift
            </button>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
              <XCircle className="w-12 h-12 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Gagal</h1>
            <p className="text-red-400 mb-8">{message}</p>
            <button 
              onClick={() => {
                if (message.includes("lokasi")) {
                  window.location.reload();
                } else {
                  router.push("/myshift");
                }
              }}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              {message.includes("lokasi") ? "Coba Lagi" : "Kembali"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ScanAbsensiPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-white">Loading...</div>}>
      <ScanAbsensiContent />
    </Suspense>
  );
}
