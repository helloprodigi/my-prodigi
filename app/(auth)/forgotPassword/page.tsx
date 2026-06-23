"use client";

import Image from "next/image";
import React, { useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function ForgotPasswordPage() {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const supabase = createClient();

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        // Validasi kecocokan password di sisi client
        if (password !== confirmPassword) {
            setError("Password dan konfirmasi password tidak cocok.");
            setLoading(false);
            return;
        }

        try {
            const { error } = await supabase.auth.updateUser({
                password: password,
            });

            if (error) throw error;

            setSuccess("Password Anda berhasil diperbarui! Mengalihkan...");

            // Redirect ke halaman profile setelah sukses
            setTimeout(() => {
                window.location.href = "/profile";
            }, 2000);
        } catch (err: any) {
            setError(err.message || String(err));
        } finally {
            setLoading(false);
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
                            <h2 className="text-base font-bold text-gray-900 tracking-tight mt-1">Reset Password</h2>
                        </div>

                        {/* Form Utama */}
                        <form onSubmit={submit} className="flex flex-col w-full items-center mt-6">
                            {error && <div className="text-xs text-red-600 bg-red-50 p-2 rounded-md w-[340px] mb-3">{error}</div>}
                            {success && <div className="text-xs text-green-600 bg-green-50 p-2 rounded-md w-[340px] mb-3">{success}</div>}

                            {/* Input New Password */}
                            <div className="w-[340px] mb-4">
                                <label className="block text-[11px] text-[#6E7980] font-semibold mb-1.5 pl-0.5">New Password</label>
                                <div className="relative w-full">
                                    <span className="absolute inset-y-0 left-3 flex items-center text-[#6E7980] z-10">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                                        </svg>
                                    </span>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        required
                                        placeholder="Masukkan password baru"
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

                            {/* Input Confirm New Password */}
                            <div className="w-[340px] mb-6">
                                <label className="block text-[11px] text-[#6E7980] font-semibold mb-1.5 pl-0.5">Confirm New Password</label>
                                <div className="relative w-full">
                                    <span className="absolute inset-y-0 left-3 flex items-center text-[#6E7980] z-10">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                                        </svg>
                                    </span>
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        required
                                        placeholder="Ulangi password baru"
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

                            {/* Tombol Simpan Password */}
                            <div className="w-[340px]">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full text-black font-bold rounded-md text-xs tracking-wide transition-all hover:brightness-105 active:scale-[0.99] disabled:opacity-50"
                                    style={{ height: '46px', backgroundColor: '#FFC917' }}
                                >
                                    {loading ? "Menyimpan..." : "Simpan Password Baru"}
                                </button>
                            </div>
                        </form>

                        {/* Footer Kartu */}
                        <div className="w-full text-center mt-6">
                            <p className="text-xs text-gray-500">
                                Kembali ke halaman <a href="/login" className="text-[#FFC917] font-semibold hover:underline">Masuk</a>
                            </p>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
}