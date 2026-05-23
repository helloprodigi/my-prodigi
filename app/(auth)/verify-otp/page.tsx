"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = useMemo(() => searchParams.get("email") ?? "", [searchParams]);
  const token = useMemo(() => searchParams.get("token") ?? "", [searchParams]);
  const [status, setStatus] = useState<"idle" | "checking" | "verified" | "error">(
    token ? "checking" : "idle",
  );
  const [message, setMessage] = useState("Cek inbox kamu untuk link verifikasi.");
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!token || !email) {
      return;
    }

    const verify = async () => {
      setStatus("checking");
      const response = await fetch(
        `/api/auth/verify-email?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`,
      );
      const result = await response.json();

      if (!response.ok) {
        setStatus("error");
        setMessage(result.error || "Link verifikasi tidak valid.");
        return;
      }

      setStatus("verified");
      setMessage("Verifikasi berhasil! Anda akan diarahkan ke login page.");
    };

    void verify();
  }, [email, token]);

  useEffect(() => {
    if (status !== "verified") {
      return;
    }

    const timeout = window.setTimeout(() => {
      router.replace("/login?verified=1");
    }, 2200);

    return () => window.clearTimeout(timeout);
  }, [status, router]);

  const resend = async () => {
    if (!email) return;

    setResending(true);
    setMessage("Mengirim ulang email verifikasi...");

    try {
      const response = await fetch("/api/auth/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Gagal mengirim ulang email.");
      }

      setStatus("idle");
      setMessage("Email verifikasi sudah dikirim ulang.");
    } catch (error: any) {
      setStatus("error");
      setMessage(error.message || "Gagal mengirim ulang email.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="h-screen w-full overflow-hidden bg-cover bg-center font-sans" style={{ backgroundImage: "url('/assets/register/background.svg')" }}>
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
              <Image src="/assets/register/puzzle.svg" alt="puzzle" width={440} height={290} priority />
            </div>
          </div>
        </div>

        {/* Sisi Kanan - Container Kartu Putih */}
        <div className="lg:col-span-6 flex items-center justify-center w-full h-full lg:-translate-x-6 transition-transform">
          {/* Lebar disamakan 380px dan padding p-5 agar compact */}
          <div 
            className="bg-white rounded-lg shadow-xl p-5 pt-6 pb-6 flex flex-col justify-start items-center box-border" 
            style={{ width: '380px' }}
          >
            {/* Header Kartu */}
            <div className="flex flex-col items-center w-full">
              <div className="flex justify-center items-center w-full px-2">
                <Image 
                  src="/assets/register/myprodigi-logo.svg" 
                  alt="logo" 
                  width={310} 
                  height={91.5} 
                  className="object-contain"
                />
              </div>
              <div className="w-full max-w-[310px] h-[1px] bg-gray-100 my-2.5" />
              <h2 className="text-base font-bold text-gray-900 tracking-tight mt-0.5">Verifikasi Email</h2>
            </div>

            {/* Konten Utama */}
            <div className="flex flex-col items-center w-[320px] mt-4 text-center">
              
              {/* Status Icon Indicator */}
              <div className="mb-4 w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-[#FFC917] transition-all">
                {status === "verified" ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : status === "error" ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : status === "checking" ? (
                  <svg className="animate-spin h-5 w-5 text-[#FFC917]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                  </svg>
                )}
              </div>

              {/* Status Message */}
              <p className={`text-xs leading-relaxed px-2 mb-5 min-h-[36px] flex items-center justify-center ${status === "verified" ? "text-green-600 font-semibold" : "text-[#6E7980]"}`}>
                {message}
              </p>

              {/* Tombol Kirim Ulang */}
              <div className="w-full mb-3">
                <button
                  type="button"
                  onClick={resend}
                  disabled={!email || resending}
                  className="w-full text-black font-bold rounded-md text-xs tracking-wide transition-all hover:brightness-105 active:scale-[0.99] disabled:opacity-50"
                  style={{ height: '46px', backgroundColor: '#FFC917' }}
                >
                  {resending ? "Mengirim..." : "Kirim Ulang Email"}
                </button>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-sm text-[#6E7980]">Memuat verifikasi...</div>}>
      <VerifyOtpContent />
    </Suspense>
  );
}