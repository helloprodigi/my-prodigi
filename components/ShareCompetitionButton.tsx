"use client";

import { Share2 } from "lucide-react";
import toast from "react-hot-toast";

type Competition = {
  id: string;
  title: string;
  organizer: string;
  deadline: string;
  skills: string[] | null;
  link: string | null;
};

export default function ShareCompetitionButton({ competition }: { competition: Competition }) {
  const shareUrl =
    competition.link && competition.link.trim().length > 0
      ? competition.link
      : `${typeof window !== "undefined" ? window.location.origin : ""}/competitions/${competition.id}`;

  const deadlineLabel = new Date(competition.deadline).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const shareText = `${competition.title} — diselenggarakan oleh ${competition.organizer}. Deadline ${deadlineLabel}. Cek di MyProdigi!`;

  const handleShare = async () => {
    // Devices with a native share sheet (mostly mobile) get the OS picker —
    // WhatsApp, Instagram, Contacts, etc. Everything else (desktop) just
    // copies the link, since there's no equivalent native picker to defer to.
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: competition.title, text: shareText, url: shareUrl });
      } catch (err) {
        if ((err as Error)?.name !== "AbortError") {
          toast.error("Gagal membuka menu bagikan.");
        }
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link lomba disalin!");
    } catch {
      toast.error("Gagal menyalin link.");
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      className="p-1.5 bg-gray-50 text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
      title="Bagikan Lomba"
    >
      <Share2 className="w-4 h-4" />
    </button>
  );
}
