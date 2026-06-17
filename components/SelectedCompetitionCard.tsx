import React from "react";
import Image from "next/image";

const CATEGORY_COLORS: Record<string, string> = {
  "Data Science": "bg-[#E0F2FE] text-[#0A1024]",
  "UI/UX Design": "bg-[#E0E7FF] text-[#0A1024]",
  "Business Plan": "bg-[#FEE2E2] text-[#0A1024]",
  "Web Development": "bg-[#FEF9C3] text-[#0A1024]",
};

export function getCategoryClass(category: string) {
  return CATEGORY_COLORS[category] || "bg-gray-200 text-[#0A1024]";
}

export interface SelectedCompetitionCardProps {
  title: string;
  deadline: string;
  organizer: string;
  categories: string[];
}

const SelectedCompetitionCard: React.FC<SelectedCompetitionCardProps> = ({
  title,
  deadline,
  organizer,
  categories = [],
}) => {
  return (
    <div className="relative w-full bg-[#FFFAE8] rounded-[8px] p-6 flex flex-col justify-center mb-6 overflow-hidden">
      <div className="flex flex-col gap-1 z-10">
        <div className="text-[#FFC700] font-semibold text-sm">Deadline • {deadline}</div>
        <div className="text-2xl font-bold text-[#0A1024]">{title}</div>
        <div className="text-gray-500 text-sm mb-2">Diselenggarakan oleh : {organizer}</div>
        <div className="flex flex-row gap-2 mt-2 flex-wrap">
          {categories.map((cat) => (
            <span
              key={cat}
              className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryClass(cat)}`}
            >
              {cat}
            </span>
          ))}
        </div>
      </div>
        <div className="pointer-events-none absolute bottom-0 right-0 h-[92px] w-[120px] md:h-[110px] md:w-[140px] select-none">
          <Image
            src="/assets/matchmaking/cropped-yellowcircle.svg"
            alt="Yellow Circle"
            fill
            className="object-right-bottom object-contain"
          />
        </div>
    </div>
  );
};

export default SelectedCompetitionCard;
