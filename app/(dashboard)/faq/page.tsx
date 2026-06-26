"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";

interface FAQItem {
    id: string;
    question: string;
    answer: string;
}

export default function TutorialFAQPage() {
    // State untuk melacak accordion mana yang sedang terbuka (null artinya semua tertutup)
    const [openFaqId, setOpenFaqId] = useState<string | null>("faq-1"); // Default terbuka yang pertama sesuai hifi

    const faqData: FAQItem[] = [
        {
            id: "faq-1",
            question: "Mengapa fitur Matchmaking saya tidak bisa diaktifkan?",
            answer: "Untuk menjaga kualitas rekomendasi tim, pastikan profil Anda sudah lengkap, termasuk CV, kategori skill, dan minat lomba. Fitur Matchmaking akan aktif setelah seluruh data wajib berhasil diverifikasi.",
        },
        {
            id: "faq-2",
            question: "Bagaimana sistem Matchmaking bekerja?",
            answer: "MyProdigi mencocokkan anggota tim berdasarkan kombinasi skill, pengalaman kompetisi, relevansi CV, dan minat lomba. Semakin lengkap profil Anda, semakin akurat rekomendasi yang diberikan",
        },
        {
            id: "faq-3",
            question: "Apakah pengguna lain bisa melihat nomor WhatsApp saya?",
            answer: "Tidak. Nomor WhatsApp hanya akan ditampilkan kepada anggota tim yang sudah saling terhubung dan menyetujui undangan tim.",
        },
        {
            id: "faq-4",
            question: "Bagaimana cara membuat tim baru?",
            answer: "Pilih lomba yang ingin diikuti, klik tombol Buat Tim, lalu tentukan posisi atau skill yang sedang dibutuhkan. Sistem akan membantu merekomendasikan kandidat yang sesuai.",
        },
        {
            id: "faq-5",
            question: "Mengapa saya belum mendapatkan rekomendasi tim?",
            answer: "Beberapa kemungkinan:\n• Profil belum lengkap\n• Fitur Open to Match belum diaktifkan\n• Skill atau minat lomba yang dipilih masih terbatas\n• Belum ada tim yang sedang mencari posisi yang sesuai dengan profil Anda\nLengkapi profil untuk meningkatkan peluang mendapatkan rekomendasi.",
        },
        {
            id: "faq-6",
            question: "Apakah saya bisa mengikuti lebih dari satu lomba?",
            answer: "Ya. Anda dapat mengikuti beberapa lomba sekaligus selama tidak melanggar aturan yang ditetapkan oleh masing-masing penyelenggara lomba.",
        },
        {
            id: "faq-7",
            question: "Berapa lama undangan tim berlaku?",
            answer: "Setiap undangan memiliki batas waktu respons. Jika tidak direspons dalam periode yang ditentukan, sistem akan otomatis mencari kandidat lain agar proses pembentukan tim tidak terhambat.",
        },
        {
            id: "faq-8",
            question: "Bagaimana MyProdigi menjaga privasi pengguna?",
            answer: "MyProdigi dirancang dengan memperhatikan keamanan dan privasi data pengguna. Informasi yang Anda berikan hanya digunakan untuk meningkatkan akurasi rekomendasi tim dan tidak digunakan untuk tujuan lain.",
        },
    ];

    const toggleFaq = (id: string) => {
        setOpenFaqId(openFaqId === id ? null : id);
    };

    const handleContactWA = () => {
        window.open("https://wa.me/6281243205089?text=Halo%20Admin%20Prodigi,%20saya%20butuh%20bantuan", "_blank");
    };

    return (
        <div className="min-h-screen bg-[#FBFBFB] w-full overflow-y-auto">
            {/* Wrapper Konten Utama */}
            <div className="w-full z-10 max-w-[1400px] pl-6 pr-4 pb-20">

                {/* Header Section */}
                <div className="flex items-center justify-between pt-8 pb-6 w-full">
                    <h1 className="text-3xl font-bold text-[#0A1024]">Tutorial & FAQ</h1>
                    <Link href="/matchmaking">
                        <button className="bg-[#FFC700] text-[#0A1024] font-bold px-9 py-3 rounded-[8px] text-sm hover:brightness-95 transition-all shadow-sm">
                            Buat Tim
                        </button>
                    </Link>
                </div>

                {/* Video Tutorial Banner Section */}
                <div className="w-full bg-[#FFF9E6] rounded-[12px] p-8 md:p-12 relative overflow-hidden flex items-center justify-center min-h-[360px] md:min-h-[460px] mb-14 border border-[#FFF0C2]">
                    {/* Top-Right Decorative Circle (Diperbesar, Dipertebal, Digeser lebih ke Pojok Kanan Atas) */}
                    <div className="absolute top-[-50px] right-[-50px] w-[200px] h-[200px] opacity-80 pointer-events-none">
                        <div className="w-full h-full border-[5px] border-[#FFC700] rounded-full" />
                        <div className="w-[82%] h-[82%] border-[5px] border-[#FFC700] rounded-full absolute top-3 right-3" />
                    </div>
                    {/* Bottom-Left Decorative Circle (Diperbesar, Dipertebal, Digeser lebih ke Pojok Kiri Bawah) */}
                    <div className="absolute bottom-[-50px] left-[-50px] w-[200px] h-[200px] opacity-80 pointer-events-none">
                        <div className="w-full h-full border-[5px] border-[#FFC700] rounded-full" />
                        <div className="w-[82%] h-[82%] border-[5px] border-[#FFC700] rounded-full absolute bottom-3 left-3" />
                    </div>

                    {/* Video Container Card */}
                    <div className="w-full max-w-[780px] bg-black rounded-[10px] aspect-video relative shadow-md overflow-hidden group flex flex-col justify-between z-10">
                        <iframe
                            className="w-full h-full"
                            src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                            title="YouTube video player"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen>
                        </iframe>
                    </div>
                </div>

                {/* FAQ Header Title */}
                <div className="w-full text-center mb-8">
                    <h2 className="text-2xl font-bold text-[#0A1024] tracking-wide mb-2">
                        Pertanyaan yang sering ditanyakan
                    </h2>
                    <p className="text-xs text-gray-400 font-medium tracking-normal">
                        Temukan jawaban seputar matchmaking, tim, dan kompetisi di PRODIGI.
                    </p>
                </div>

                {/* Accordion List */}
                <div className="w-full max-w-[840px] mx-auto flex flex-col mb-16">
                    {faqData.map((item) => {
                        const isOpen = openFaqId === item.id;
                        return (
                            <div
                                key={item.id}
                                className="w-full border-b border-gray-100 transition-colors"
                            >
                                {/* Header Akordion */}
                                <button
                                    type="button"
                                    onClick={() => toggleFaq(item.id)}
                                    className="w-full flex items-center justify-between py-4 text-left text-[15px] font-bold text-[#0A1024] hover:text-[#FFC700] transition-colors gap-4"
                                >
                                    <span>{item.question}</span>
                                    <span className="flex-shrink-0 text-gray-400">
                                        {isOpen ? (
                                            /* Icon Minus (-) */
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 text-[#0A1024]">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        ) : (
                                            /* Icon Plus (+) */
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 text-[#0A1024]">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        )}
                                    </span>
                                </button>

                                {/* Konten Jawaban Akordion */}
                                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "max-h-[300px] opacity-100 pb-5" : "max-h-0 opacity-0"
                                    }`}>
                                    <p className="text-sm text-gray-400 font-medium leading-relaxed">
                                        {item.answer}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Customer Support Call-Out Box */}
                <div className="w-full max-w-[840px] mx-auto bg-white rounded-[12px] border border-[#F4F5F6] p-8 flex flex-col items-center justify-center text-center shadow-xs">
                    {/* Avatar Robot / Maskot */}
                    <div className="w-24 h-24 rounded-full flex items-center justify-center relative mb-4 shadow-sm animate-bounce-slow bg-transparent">
                        <Image src="/assets/faq/faqBot.svg" alt="FAQ Bot" width={96} height={96} className="w-full h-full" />
                        {/* Bubble Chat kecil di atas telinga */}
                        <div className="absolute top-0 left-[-2px] bg-white text-[9px] px-1.5 py-0.5 rounded-full border border-gray-100 shadow-xs">
                            •••
                        </div>
                    </div>

                    <h4 className="text-sm font-bold text-[#0A1024] mb-1">
                        Butuh bantuan lebih lanjut?
                    </h4>
                    <p className="text-xs text-gray-400 font-medium max-w-[420px] leading-relaxed mb-5">
                        Hubungi tim kami jika kamu mengalami kendala terkait matchmaking, tim, atau kompetisi.
                    </p>

                    <button
                        type="button"
                        onClick={handleContactWA}
                        className="bg-[#FFC700] text-[#0A1024] font-bold px-6 py-2.5 rounded-[6px] text-xs hover:brightness-95 transition-all shadow-xs"
                    >
                        Chat Whatsapp
                    </button>
                </div>

            </div>
        </div>
    );
}