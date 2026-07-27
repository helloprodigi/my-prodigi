"use client";

import { useState } from "react";
import toast from "react-hot-toast";

interface DownloadDraftButtonProps {
  url: string;
  filename?: string;
  className?: string;
  children?: React.ReactNode;
}

export default function DownloadDraftButton({
  url,
  filename,
  className = "flex-1 rounded-lg bg-[#FFC700] py-2.5 text-center text-sm font-semibold text-[#0A1024] transition-colors hover:bg-[#e6b400] cursor-pointer flex items-center justify-center gap-2",
  children = "Download",
}: DownloadDraftButtonProps) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!url || url === "#") {
      toast.error("Dokumen belum tersedia.");
      return;
    }

    const targetUrl = url.startsWith("http") ? url : `https://${url}`;
    const urlFilename = targetUrl.split("/").pop() || "dokumen-draft.pdf";
    const suggestedFilename = filename || urlFilename;
    const finalFilename = suggestedFilename.toLowerCase().endsWith(".pdf")
      ? suggestedFilename
      : `${suggestedFilename}.pdf`;

    setDownloading(true);
    try {
      const response = await fetch(targetUrl);
      if (!response.ok) throw new Error("Gagal mengambil berkas");

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = finalFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(blobUrl);
      toast.success("Dokumen berhasil diunduh!");
    } catch (err) {
      // Fallback: If blob fetch is blocked by CORS, trigger direct link download
      const link = document.createElement("a");
      link.href = targetUrl;
      link.target = "_blank";
      link.download = finalFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={downloading}
      className={className}
    >
      {downloading && (
        <span className="w-4 h-4 rounded-full border-2 border-black border-t-transparent animate-spin inline-block" />
      )}
      {downloading ? "Mengunduh..." : children}
    </button>
  );
}
