"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ExternalLink, Users } from "lucide-react";
import ShareCompetitionButton from "./ShareCompetitionButton";

// Used only by the public shared-competition preview (app/competitions/[id]) —
// the listing at /competitions keeps its own card, matched to Figma.
export type CompetitionCardData = {
  id: string;
  title: string;
  organizer: string;
  deadline: string;
  category: string;
  skills: string[] | null;
  link: string | null;
  description?: string | null;
  imageUrl?: string | null;
};

// Hero background is a pale yellow, so a yellow badge would blend in —
// Internal gets a solid navy chip instead; everything else stays plain white.
const CATEGORY_BADGE: Record<string, string> = {
  Internal: "bg-[#0A1024] text-white",
};

function getCategoryBadgeClasses(category: string) {
  return CATEGORY_BADGE[category] || "bg-white text-[#0A1024]";
}

function DeadlineValue({ deadline }: { deadline: string }) {
  // Lazy useState initializer is the sanctioned way to read a one-off impure
  // value (Date.now()) during render — it only ever runs on first mount.
  const [now] = useState(() => Date.now());
  const { isUrgent, label } = useMemo(() => {
    const date = new Date(deadline);
    const daysLeft = Math.ceil((date.getTime() - now) / 86_400_000);
    return {
      isUrgent: daysLeft >= 0 && daysLeft <= 7,
      label: date.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }),
    };
  }, [deadline, now]);
  return <p className={`text-sm font-bold ${isUrgent ? "text-red-500" : "text-[#0A1024]"}`}>{label}</p>;
}

function Hero({ competition }: { competition: CompetitionCardData }) {
  return (
    <div className="relative h-32 sm:h-40 shrink-0 overflow-hidden bg-[#FFF9E6]">
      {competition.imageUrl && (
        <Image src={competition.imageUrl} alt="" fill className="object-cover" sizes="(max-width: 640px) 100vw, 480px" />
      )}

      {competition.category && (
        <span className={`absolute top-4 right-4 px-3 py-1.5 rounded-full text-sm font-semibold ${getCategoryBadgeClasses(competition.category)}`}>
          {competition.category}
        </span>
      )}
    </div>
  );
}

export default function CompetitionCard({
  competition,
  buatTimHref,
}: {
  competition: CompetitionCardData;
  buatTimHref: string;
}) {
  const skillsLine = competition.skills && competition.skills.length > 0 ? competition.skills.join(" · ") : null;
  const detailHref = competition.link ? (competition.link.startsWith("http") ? competition.link : `https://${competition.link}`) : null;

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md">
      <Hero competition={competition} />

      <div className="flex flex-1 flex-col p-5 sm:p-7">
        <div className="mb-1.5 flex items-start justify-between gap-2">
          <h3 className="font-extrabold leading-tight text-[#0A1024] text-xl sm:text-2xl line-clamp-3">{competition.title}</h3>
          <div className="flex shrink-0 items-center gap-1.5">
            <ShareCompetitionButton competition={competition} />
          </div>
        </div>

        {skillsLine && <p className="text-gray-400 font-medium text-sm mb-4">{skillsLine}</p>}

        {competition.description && (
          <p className="mb-5 text-sm leading-relaxed text-gray-600 whitespace-pre-wrap">{competition.description}</p>
        )}

        <div className="mt-auto flex items-center justify-between gap-4 border-t border-gray-100 pt-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Penyelenggara</p>
            <p className="text-sm font-semibold text-[#0A1024] truncate max-w-[140px] sm:max-w-none">{competition.organizer}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Registrasi Ditutup</p>
            <DeadlineValue deadline={competition.deadline} />
          </div>
        </div>

        <div className="flex gap-2 mt-5 flex-col sm:flex-row">
          <Link
            href={buatTimHref}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#FFC700] font-bold text-[#0A1024] transition-colors hover:bg-[#e6b400] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A1024] py-3 text-sm sm:text-base"
          >
            <Users className="w-4 h-4 shrink-0" />
            <span>Buat Tim untuk Lomba Ini</span>
          </Link>

          {detailHref && (
            <a
              href={detailHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-200 font-semibold text-[#0A1024] transition-colors hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A1024] py-3 text-sm sm:text-base"
            >
              <span>Lihat Detail</span>
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
