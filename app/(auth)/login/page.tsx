"use client";
import Image from "next/image";
import React, { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { setRememberMe } from "@/utils/supabase/remember-me";
import { getSafeRedirect } from "@/utils/getSafeRedirect";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      setRememberMe(remember);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      window.location.href = getSafeRedirect();
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full overflow-y-auto bg-cover bg-center font-sans" style={{ backgroundImage: "url('/assets/login/background.svg')" }}>
      <div className="flex flex-col lg:grid lg:grid-cols-12 lg:h-full lg:items-center">

        {/* Sisi Kiri - Branding & Ilustrasi (hidden on mobile) */}
        <div className="hidden lg:flex lg:col-span-6 px-16 py-12 flex-col justify-center h-full">
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
        <div className="min-h-screen flex items-center justify-center px-5 py-8 lg:min-h-0 lg:col-span-6 lg:h-full lg:px-0 lg:py-0 lg:-translate-x-6 transition-transform">
          <div
            className="bg-white rounded-2xl lg:rounded-lg shadow-xl p-7 pt-8 pb-8 flex flex-col justify-start box-border w-full max-w-[400px]"
          >
            {/* Header Kartu */}
            <div className="flex flex-col items-center w-full">
              <div className="flex justify-center items-center w-full px-2">
                <Image
                  src="/assets/myprodigi-logo.svg"
                  alt="logo"
                  width={218}
                  height={50}
                  className="object-contain w-full max-w-[310px] h-auto"
                />
              </div>
              <div className="w-full max-w-[310px] h-[1px] bg-gray-100 my-3" />
              <h2 className="text-base font-bold text-gray-900 tracking-tight mt-1">Masuk Sekarang</h2>
            </div>

            {/* Form Utama */}
            <form onSubmit={submit} className="flex flex-col w-full items-center mt-6">
              {error && <div className="text-xs text-red-600 bg-red-50 p-2 rounded-md w-full mb-3">{error}</div>}

              {/* Input Email */}
              <div className="w-full mb-4">
                <label className="block text-[11px] text-[#6E7980] font-semibold mb-1.5 pl-0.5">Email Address</label>
                <div className="relative w-full">
                  <span className="absolute inset-y-0 left-3 flex items-center text-[#6E7980] z-10">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                    </svg>
                  </span>
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-4 rounded-md bg-gray-100 text-[#6E7980] placeholder-[#6E7980]/50 text-xs focus:outline-none border-0"
                    style={{ height: '44px' }}
                  />
                </div>
              </div>

              {/* Input Password */}
              <div className="w-full mb-5">
                <div className="flex items-center justify-between mb-1.5 pl-0.5">
                  <label className="text-[11px] text-[#6E7980] font-semibold">Password</label>
                  <a className="text-[#FFC917] text-xs font-semibold hover:underline" href="/request-reset">Forgot Password?</a>
                </div>
                <div className="relative w-full">
                  <span className="absolute inset-y-0 left-3 flex items-center text-[#6E7980] z-10">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                    </svg>
                  </span>
                  <input
                    type={show ? "text" : "password"}
                    required
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-10 rounded-md bg-gray-100 text-[#6E7980] placeholder-[#6E7980]/50 text-xs focus:outline-none border-0"
                    style={{ height: '44px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShow((s) => !s)}
                    className="absolute inset-y-0 right-3 flex items-center text-[#6E7980] hover:opacity-80 z-10"
                  >
                    {show ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="w-full mb-4 flex items-center">
                <label className="flex items-center gap-2 text-[11px] text-[#6E7980] font-semibold cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-gray-300 accent-[#FFC917] text-[#FFC917] focus:ring-[#FFC917] focus:ring-offset-0"
                  />
                  Ingat saya
                </label>
              </div>

              {/* Tombol Masuk */}
              <div className="w-full mb-3.5">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full text-black font-bold rounded-md text-xs tracking-wide transition-all hover:brightness-105 active:scale-[0.99] disabled:opacity-50"
                  style={{ height: '46px', backgroundColor: '#FFC917' }}
                >
                  {loading ? "Masuk..." : "Masuk"}
                </button>
              </div>

              {/* Tombol Google OAuth */}
              <div className="w-full">
                <GoogleSignInButton
                  intent="login"
                  label="Sign In With Google"
                  loadingLabel="Connecting..."
                  remember={remember}
                  onError={setError}
                />
              </div>
            </form>

            {/* Footer Kartu */}
            <div className="w-full text-center mt-5">
              <p className="text-xs text-gray-500">
                Belum punya akun? <a href="/register" className="text-[#FFC917] font-semibold hover:underline">Sign Up</a>
              </p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}