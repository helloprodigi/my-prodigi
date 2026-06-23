"use client";

import Image from "next/image";
import React, { useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function RequestResetPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const supabase = createClient();

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/forgotPassword`,
            });

            if (error) throw error;

            setSuccess("Tautan atur ulang kata sandi telah dikirim ke email Anda. Silakan periksa kotak masuk atau folder spam Anda.");
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
                            <h2 className="text-base font-bold text-gray-900 tracking-tight mt-1">Lupa Password</h2>
                            <p className="text-xs text-gray-500 mt-2 text-center">
                                Masukkan email Anda yang terdaftar untuk menerima tautan atur ulang kata sandi.
                            </p>
                        </div>

                        {/* Form Utama */}
                        <form onSubmit={submit} className="flex flex-col w-full items-center mt-6">
                            {error && <div className="text-xs text-red-600 bg-red-50 p-2 rounded-md w-[340px] mb-3">{error}</div>}
                            {success && <div className="text-xs text-green-600 bg-green-50 p-3 rounded-md w-[340px] mb-4 text-center leading-relaxed font-medium">{success}</div>}

                            {!success && (
                                <>
                                    {/* Input Email */}
                                    <div className="w-[340px] mb-6">
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

                                    {/* Tombol Kirim */}
                                    <div className="w-[340px]">
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full text-black font-bold rounded-md text-xs tracking-wide transition-all hover:brightness-105 active:scale-[0.99] disabled:opacity-50"
                                            style={{ height: '46px', backgroundColor: '#FFC917' }}
                                        >
                                            {loading ? "Mengirim..." : "Kirim Tautan"}
                                        </button>
                                    </div>
                                </>
                            )}
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
