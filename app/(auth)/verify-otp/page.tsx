"use client";

import Image from "next/image";
import React, { useState } from "react";

export default function VerifyOtpPage() {
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const email = typeof window !== "undefined" ? localStorage.getItem("email_for_otp") || "" : "";

      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Kode OTP salah atau telah kedaluwarsa.");
      }

      setSuccess("Verifikasi berhasil! Mengalihkan ke halaman utama...");
      window.location.href = "/";
    } catch (err: any) {
      setError(err.message || "Kode OTP salah atau telah kedaluwarsa.");
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    setResendLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const email = typeof window !== "undefined" ? localStorage.getItem("email_for_otp") || "" : "";
      if (!email) throw new Error("Email tidak ditemukan. Silakan registrasi ulang.");

      const response = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Gagal mengirim ulang OTP.");
      }
      
      setSuccess("Kode verifikasi baru berhasil dikirim ke email Anda.");
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="h-screen w-full overflow-hidden bg-cover bg-center font-sans" style={{ backgroundImage: "url('/assets/login/background.svg')" }}>
      <div className="h-full grid lg:grid-cols-12 items-center">
        
        {/* Sisi Kiri - Branding & Ilustrasi */}
        <div className="lg:col-span-6 px-16 py-12 flex flex-col justify-center h-full">
          <div className="max-w-xl text-left">
            <h1 className="text-3xl lg:text-4xl font-bold leading-tight text-white">
              Bangun tim <span className="text-[#FFC917]">Juara,</span> <br /> Menangkan Kompetisi
            </h1>
            <p className="mt-4 text-white text-sm max-w-lg leading-relaxed">
              Platform informasi lomba serta matchmaking untuk menemukan rekan <br /> terbaik dan memenangkan setiap kompetisi
            </p>

            <div className="mt-8">
              <Image src="/assets/login/puzzle.svg" alt="puzzle" width={440} height={290} priority />
            </div>
          </div>
        </div>

        {/* Sisi Kanan - Container Kartu Putih */}
        <div className="lg:col-span-6 flex items-center justify-center w-full h-full lg:-translate-x-6 transition-transform">
          <div 
            className="bg-white rounded-lg shadow-xl p-7 pt-8 pb-8 flex flex-col justify-start box-border" 
            style={{ width: '400px' }}
          >
            {/* Header Kartu */}
            <div className="flex flex-col items-center w-full">
              <div className="flex justify-center items-center w-full px-2">
                <Image 
                  src="/assets/login/myprodigi-logo.svg" 
                  alt="logo" 
                  width={310} 
                  height={91.5} 
                  className="object-contain"
                />
              </div>
              <div className="w-full max-w-[310px] h-[1px] bg-gray-100 my-3" />
              <h2 className="text-base font-bold text-gray-900 tracking-tight mt-1">Verifikasi Email</h2>
              <p className="text-[11px] text-[#6E7980] text-center max-w-[280px] mt-2 leading-relaxed">
                Masukkan kode verifikasi yang telah dikirim ke email Anda
              </p>
            </div>

            {/* Form Utama */}
            <form onSubmit={submit} className="flex flex-col w-full items-center mt-6">
              {error && <div className="text-xs text-red-600 bg-red-50 p-2 rounded-md w-[340px] mb-3 text-center">{error}</div>}
              {success && <div className="text-xs text-green-600 bg-green-50 p-2 rounded-md w-[340px] mb-3 text-center">{success}</div>}

              {/* Input Kode Verifikasi */}
              <div className="w-[340px] mb-5">
                <label className="block text-[11px] text-[#6E7980] font-semibold mb-1.5 pl-0.5">Kode Verifikasi</label>
                <div className="relative w-full">
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="000000"
                    value={token}
                    onChange={(e) => setToken(e.target.value.replace(/\D/g, ""))} // Hanya menerima angka
                    className="block w-full rounded-md bg-gray-100 text-gray-700 placeholder-gray-300 text-base font-bold text-center tracking-[0.5em] focus:outline-none border-0"
                    style={{ height: '44px' }}
                  />
                </div>
              </div>

              {/* Tombol Verifikasi */}
              <div className="w-[340px] mb-4">
                <button
                  type="submit"
                  disabled={loading || token.length < 6}
                  className="w-full text-black font-bold rounded-md text-xs tracking-wide transition-all hover:brightness-105 active:scale-[0.99] disabled:opacity-50"
                  style={{ height: '46px', backgroundColor: '#FFC917' }}
                >
                  {loading ? "Memverifikasi..." : "Verifikasi"}
                </button>
              </div>
            </form>

            {/* Footer Kartu - Kirim Ulang Kode / Kembali ke Login */}
            <div className="w-full text-center mt-2">
              {error && error.includes("already been registered") ? (
                <button 
                  type="button"
                  onClick={() => window.location.href = "/login"}
                  className="text-xs text-[#FFC917] font-semibold hover:underline bg-transparent border-0 cursor-pointer"
                >
                  Kembali ke Login
                </button>
              ) : (
                <button 
                  type="button"
                  onClick={resendOtp}
                  disabled={resendLoading || loading}
                  className="text-xs text-[#FFC917] font-semibold hover:underline bg-transparent border-0 cursor-pointer disabled:opacity-50"
                >
                  {resendLoading ? "Mengirim ulang..." : "Kirim Ulang Kode"}
                </button>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}