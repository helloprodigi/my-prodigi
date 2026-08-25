"use client";

import { useMemo, useRef, useState } from "react";
import { usePrefersReducedMotion } from "../useAnalyticsAnimations";

type GrowthPoint = { date: string; total: number };

const RANGES = [
  { key: "7d", label: "7D", days: 7 },
  { key: "30d", label: "30D", days: 30 },
  { key: "90d", label: "90D", days: 90 },
] as const;

const WIDTH = 700;
const HEIGHT = 240;
const PAD_LEFT = 36;
const PAD_RIGHT = 12;
const PAD_TOP = 16;
const PAD_BOTTOM = 28;

function formatDateLabel(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

export default function UserGrowthChart({ data }: { data: GrowthPoint[] }) {
  const [range, setRange] = useState<(typeof RANGES)[number]["key"]>("30d");
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  const rangeDays = RANGES.find((r) => r.key === range)?.days ?? 30;
  const points = useMemo(() => data.slice(-rangeDays), [data, rangeDays]);

  const { path, areaPath, maxVal, minVal, coords } = useMemo(() => {
    if (points.length === 0) {
      return { path: "", areaPath: "", maxVal: 0, minVal: 0, coords: [] as { x: number; y: number }[] };
    }
    const values = points.map((p) => p.total);
    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    const range = max - min || 1;
    const innerW = WIDTH - PAD_LEFT - PAD_RIGHT;
    const innerH = HEIGHT - PAD_TOP - PAD_BOTTOM;

    const coords = points.map((p, i) => {
      const x = PAD_LEFT + (points.length === 1 ? innerW : (i / (points.length - 1)) * innerW);
      const y = PAD_TOP + innerH - ((p.total - min) / range) * innerH;
      return { x, y };
    });

    const linePath = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(2)} ${c.y.toFixed(2)}`).join(" ");
    const area =
      `M ${coords[0].x.toFixed(2)} ${(PAD_TOP + innerH).toFixed(2)} ` +
      coords.map((c) => `L ${c.x.toFixed(2)} ${c.y.toFixed(2)}`).join(" ") +
      ` L ${coords[coords.length - 1].x.toFixed(2)} ${(PAD_TOP + innerH).toFixed(2)} Z`;

    return { path: linePath, areaPath: area, maxVal: max, minVal: min, coords };
  }, [points]);

  const gridLines = useMemo(() => {
    const steps = 3;
    const innerH = HEIGHT - PAD_TOP - PAD_BOTTOM;
    return Array.from({ length: steps + 1 }, (_, i) => {
      const y = PAD_TOP + (innerH / steps) * i;
      const value = Math.round(maxVal - ((maxVal - minVal) / steps) * i);
      return { y, value };
    });
  }, [maxVal, minVal]);

  const handleMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg || coords.length === 0) return;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const local = pt.matrixTransform(ctm.inverse());
    let nearest = 0;
    let nearestDist = Infinity;
    coords.forEach((c, i) => {
      const d = Math.abs(c.x - local.x);
      if (d < nearestDist) {
        nearestDist = d;
        nearest = i;
      }
    });
    setHoverIndex(nearest);
  };

  const hovered = hoverIndex !== null ? { point: points[hoverIndex], coord: coords[hoverIndex] } : null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 sm:p-6 h-full flex flex-col">
      <div className="flex items-start justify-between mb-1">
        <div>
          <h3 className="text-base font-bold text-[#0A1024]">User Growth</h3>
          <p className="text-xs text-gray-400 mt-0.5">Total pengguna kumulatif dari waktu ke waktu</p>
        </div>
        <div className="flex items-center gap-1 border border-gray-200 rounded-lg p-0.5 bg-gray-50 shrink-0">
          {RANGES.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => setRange(r.key)}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors ${
                range === r.key ? "bg-white text-[#0A1024] border border-gray-200" : "text-gray-400 hover:text-gray-700"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative flex-1 mt-2">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="w-full h-full"
          onMouseMove={handleMove}
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id="userGrowthFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFC700" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#FFC700" stopOpacity="0" />
            </linearGradient>
          </defs>

          {gridLines.map((g, i) => (
            <g key={i}>
              <line x1={PAD_LEFT} x2={WIDTH - PAD_RIGHT} y1={g.y} y2={g.y} stroke="#EEF0F3" strokeWidth={1} />
              <text x={PAD_LEFT - 8} y={g.y + 3} textAnchor="end" fontSize={10} fill="#9CA3AF">
                {g.value}
              </text>
            </g>
          ))}

          {points.length > 0 && (
            <>
              <text x={PAD_LEFT} y={HEIGHT - 8} fontSize={10} fill="#9CA3AF">
                {formatDateLabel(points[0].date)}
              </text>
              <text x={WIDTH - PAD_RIGHT} y={HEIGHT - 8} fontSize={10} fill="#9CA3AF" textAnchor="end">
                {formatDateLabel(points[points.length - 1].date)}
              </text>
            </>
          )}

          {areaPath && <path d={areaPath} fill="url(#userGrowthFill)" />}

          {path && (
            <path
              d={path}
              fill="none"
              stroke="#0A1024"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className={reducedMotion ? "" : "animate-draw-line"}
              pathLength={1}
            />
          )}

          {hovered && (
            <line
              x1={hovered.coord.x}
              x2={hovered.coord.x}
              y1={PAD_TOP}
              y2={HEIGHT - PAD_BOTTOM}
              stroke="#D1D5DB"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
          )}

          {coords.length > 0 && (
            <circle
              cx={coords[coords.length - 1].x}
              cy={coords[coords.length - 1].y}
              r={5}
              fill="#FFC700"
              stroke="#FFFFFF"
              strokeWidth={2}
            />
          )}

          {hovered && (
            <circle cx={hovered.coord.x} cy={hovered.coord.y} r={5} fill="#0A1024" stroke="#FFFFFF" strokeWidth={2} />
          )}
        </svg>

        {hovered && (
          <div
            className="absolute pointer-events-none bg-[#0A1024] text-white text-xs rounded-lg px-3 py-2 -translate-x-1/2 -translate-y-full shadow-sm"
            style={{
              left: `${(hovered.coord.x / WIDTH) * 100}%`,
              top: `${(hovered.coord.y / HEIGHT) * 100 - 3}%`,
            }}
          >
            <div className="font-bold text-sm">{hovered.point.total.toLocaleString("id-ID")}</div>
            <div className="text-gray-300">{formatDateLabel(hovered.point.date)}</div>
          </div>
        )}
      </div>
    </div>
  );
}
