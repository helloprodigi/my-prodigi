"use client";
import Image from "next/image";
import React, { useState } from "react";

export default function RegisterPage() {
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Password dan Konfirmasi Password tidak cocok.");
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/send-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          name: nama,
          password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Gagal mengirim email verifikasi.");
      }

      localStorage.setItem("email_for_otp", email);
      window.location.href = `/verify-otp?email=${encodeURIComponent(email)}`;
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setGoogleLoading(true);
    setError(null);

    try {
      const supabaseModule = await import("@/utils/supabase/client");
      const supabase = supabaseModule.createClient();

      await supabase.auth.signOut({ scope: "local" });

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/&intent=register`,
          queryParams: {
            prompt: "select_account",
          },
        },
      });

      if (error) throw error;
    } catch (err: any) {
      setError(err.message || String(err));
      setGoogleLoading(false);
    }
  };

  return (
    <div className="h-screen w-full overflow-y-auto bg-cover bg-center font-sans" style={{ backgroundImage: "url('/assets/register/background.svg')" }}>
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
              <Image src="/assets/register/puzzle.svg" alt="puzzle" width={440} height={290} priority />
            </div>
          </div>
        </div>

        {/* Sisi Kanan - Container Kartu Putih */}
        <div className="min-h-screen flex items-center justify-center px-5 py-8 lg:min-h-0 lg:col-span-6 lg:h-full lg:px-0 lg:py-0 lg:-translate-x-6 transition-transform">
          <div
            className="bg-white rounded-2xl lg:rounded-lg shadow-xl p-5 pt-6 pb-6 flex flex-col justify-start box-border w-full max-w-[400px]"
          >
            {/* Header Kartu */}
            <div className="flex flex-col items-center w-full">
              <div className="flex justify-center items-center w-full px-2">
                <Image
                  src="/assets/register/myprodigi-logo.svg"
                  alt="logo"
                  width={310}
                  height={91.5}
                  className="object-contain w-full max-w-[310px] h-auto"
                />
              </div>
              <div className="w-full max-w-[310px] h-[1px] bg-gray-100 my-2.5" />
              <h2 className="text-base font-bold text-gray-900 tracking-tight mt-0.5">Daftar Sekarang</h2>
            </div>

            {/* Form Utama */}
            <form onSubmit={submit} className="flex flex-col w-full items-center mt-4">
              {error && <div className="text-xs text-red-600 bg-red-50 p-2 rounded-md w-full mb-2.5">{error}</div>}

              {/* Input Nama */}
              <div className="w-full mb-3">
                <label className="block text-[11px] text-[#6E7980] font-semibold mb-1 pl-0.5">Nama</label>
                <div className="relative w-full">
                  <span className="absolute inset-y-0 left-3 flex items-center text-[#6E7980] z-10">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="Jhon Cally"
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    className="block w-full pl-10 pr-4 rounded-md bg-gray-100 text-[#6E7980] placeholder-[#6E7980]/50 text-xs focus:outline-none border-0"
                    style={{ height: '44px' }}
                  />
                </div>
              </div>

              {/* Input Email */}
              <div className="w-full mb-3">
                <label className="block text-[11px] text-[#6E7980] font-semibold mb-1 pl-0.5">Email Address</label>
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
              <div className="w-full mb-3">
                <label className="block text-[11px] text-[#6E7980] font-semibold mb-1 pl-0.5">Password</label>
                <div className="relative w-full">
                  <span className="absolute inset-y-0 left-3 flex items-center text-[#6E7980] z-10">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                    </svg>
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-10 rounded-md bg-gray-100 text-[#6E7980] placeholder-[#6E7980]/50 text-xs focus:outline-none border-0"
                    style={{ height: '44px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute inset-y-0 right-3 flex items-center text-[#6E7980] hover:opacity-80 z-10"
                  >
                    {showPassword ? (
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

              {/* Input Confirm Password - mb dikurangi dari mb-5 ke mb-4 */}
              <div className="w-full mb-4">
                <label className="block text-[11px] text-[#6E7980] font-semibold mb-1 pl-0.5">Confirm Password</label>
                <div className="relative w-full">
                  <span className="absolute inset-y-0 left-3 flex items-center text-[#6E7980] z-10">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                    </svg>
                  </span>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full pl-10 pr-10 rounded-md bg-gray-100 text-[#6E7980] placeholder-[#6E7980]/50 text-xs focus:outline-none border-0"
                    style={{ height: '44px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((s) => !s)}
                    className="absolute inset-y-0 right-3 flex items-center text-[#6E7980] hover:opacity-80 z-10"
                  >
                    {showConfirmPassword ? (
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

              {/* Tombol Daftar */}
              <div className="w-full mb-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full text-black font-bold rounded-md text-xs tracking-wide transition-all hover:brightness-105 active:scale-[0.99] disabled:opacity-50"
                  style={{ height: '46px', backgroundColor: '#FFC917' }}
                >
                  {loading ? "Daftar..." : "Daftar"}
                </button>
              </div>

              {/* Tombol Google OAuth */}
              <div className="w-full">
                <button
                  type="button"
                  className="w-full rounded-md flex items-center justify-center gap-2 text-gray-600 font-medium text-[11px] transition-all hover:bg-gray-50 active:scale-[0.99] disabled:opacity-60"
                  onClick={() => void signInWithGoogle()}
                  disabled={googleLoading || loading}
                  style={{ height: '46px', backgroundColor: '#ffffff', border: '1px solid #D9D9D9' }}
                >
                  <svg width="15" height="15" viewBox="0 0 533.5 544.3" xmlns="http://www.w3.org/2000/svg">
                    <path d="M533.5 278.4c0-17.4-1.5-34.1-4.3-50.4H272v95.4h147.3c-6.3 34.1-25.4 62.9-54.3 82.1v68h87.6c51.3-47.2 81.9-117.1 81.9-195.1z" fill="#4285F4"/>
                    <path d="M272 544.3c73.7 0 135.6-24.4 180.8-66.3l-87.6-68c-24.4 16.4-55.6 26-93.2 26-71.6 0-132.3-48.4-154.1-113.3H29.9v71.1C75.4 489.8 168.6 544.3 272 544.3z" fill="#34A853"/>
                    <path d="M117.9 332.7c-10.7-32.1-10.7-66.8 0-98.9V162.7H29.9c-39 77.6-39 169.7 0 247.3l88-77.3z" fill="#FBBC05"/>
                    <path d="M272 109.1c39.9 0 76 13.7 104.2 40.5l78-78C409.1 24.6 347.2 0 272 0 168.6 0 75.4 54.5 29.9 138.7l88 71.1C139.7 157.5 200.4 109.1 272 109.1z" fill="#EA4335"/>
                  </svg>
                  {googleLoading ? "Connecting..." : "Sign Up With Google"}
                </button>
              </div>
            </form>

            {/* Footer Kartu - mt dikurangi dari mt-5 ke mt-4 */}
            <div className="w-full text-center mt-4">
              <p className="text-xs text-gray-500">
                Sudah punya akun? <a href="/login" className="text-[#FFC917] font-semibold hover:underline">Sign In</a>
              </p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}