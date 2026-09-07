"use client";

import { useMemo, useState } from "react";
import { usePrefersReducedMotion } from "../useAnalyticsAnimations";

// A ring "arc" is one physically drawn piece. Arcs that share a `group` sit
// flush against each other (no gap) — used so Admin reads as part of the
// Aslab segment of the ring (per the app's role hierarchy) while still being
// visually distinguishable as its own colored piece instead of one color.
// The legend mirrors the ring 1:1 (one row per arc, own value/percent) so
// what's drawn and what's listed always match.
type Arc = { key: string; label: string; value: number; color: string; group: string; groupLabel: string };

const SIZE = 200;
const STROKE = 24;
const HOVER_STROKE = STROKE + 4;
// Radius is deliberately smaller than (SIZE - STROKE) / 2 so the ring's outer
// edge — including the hover-state thicker stroke — stays clear of the
// viewBox edge instead of getting clipped.
const RADIUS = SIZE / 2 - HOVER_STROKE / 2 - 8;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const GAP = 6; // px gap between different groups, in circumference units
// Tiny render-only padding so adjacent arcs overlap by half a pixel on each
// side instead of touching at an exact mathematical boundary — different
// browsers round sub-pixel dasharray/dashoffset values slightly differently,
// which can otherwise show as a hairline gap even where none is intended.
const RENDER_OVERLAP = 1;

export default function RoleDonutChart({ arcs: arcDefs }: { arcs: Arc[] }) {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const reducedMotion = usePrefersReducedMotion();
  const total = arcDefs.reduce((sum, a) => sum + a.value, 0) || 1;

  const placedArcs = useMemo(() => {
    // Gaps are extra space, not free space — reserve it out of the
    // circumference up front so arc lengths + gaps sum to exactly one full
    // circle. Skipping this reservation previously let the last arc wrap
    // past the start and paint over the first arc's boundary.
    const numGaps = arcDefs.reduce(
      (n, a, i) => (i > 0 && arcDefs[i - 1].group !== a.group ? n + 1 : n),
      0
    );
    const availableCircumference = CIRCUMFERENCE - numGaps * GAP;

    return arcDefs.reduce<Array<Arc & { length: number; offset: number }>>((acc, a, i) => {
      const prev = acc[i - 1];
      const sameGroupAsPrev = prev && prev.group === a.group;
      const gap = i === 0 || sameGroupAsPrev ? 0 : GAP;
      const prevEnd = prev ? prev.offset * -1 + prev.length : 0;
      const cursor = prevEnd + gap;
      const rawLength = (a.value / total) * availableCircumference;
      acc.push({ ...a, length: rawLength, offset: -cursor });
      return acc;
    }, []);
  }, [arcDefs, total]);

  const hoveredArc = hoveredKey ? arcDefs.find((a) => a.key === hoveredKey) : null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 sm:p-6 h-full flex flex-col">
      <h3 className="text-base font-bold text-[#0A1024]">Role Distribution</h3>
      <p className="text-xs text-gray-400 mt-0.5 mb-4">Komposisi peran seluruh pengguna</p>

      <div className="flex flex-col sm:flex-row items-center gap-6 flex-1">
        <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
          <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full h-full -rotate-90">
            <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" stroke="#F3F4F6" strokeWidth={STROKE} />
            {placedArcs.map((arc, i) => {
              const isHovered = hoveredKey === arc.key;
              return (
                <circle
                  key={arc.key}
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={RADIUS}
                  fill="none"
                  stroke={arc.color}
                  strokeWidth={isHovered ? HOVER_STROKE : STROKE}
                  strokeLinecap="butt"
                  strokeDasharray={`${arc.length + RENDER_OVERLAP} ${CIRCUMFERENCE}`}
                  strokeDashoffset={arc.offset + RENDER_OVERLAP / 2}
                  onMouseEnter={() => setHoveredKey(arc.key)}
                  onMouseLeave={() => setHoveredKey(null)}
                  className="transition-all duration-200 cursor-pointer"
                  style={
                    reducedMotion
                      ? undefined
                      : {
                          transformOrigin: "center",
                          animation: `donut-in 0.8s cubic-bezier(0.16,1,0.3,1) both`,
                          animationDelay: `${i * 120}ms`,
                        }
                  }
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-bold text-[#0A1024]">{hoveredArc ? hoveredArc.value : total}</span>
            <span className="text-[11px] text-gray-400 font-medium text-center px-2">
              {hoveredArc ? hoveredArc.label : "Total Users"}
            </span>
          </div>
        </div>

        <div className="w-full space-y-2.5">
          {arcDefs.map((a) => {
            const percent = Math.round((a.value / total) * 100);
            return (
              <div
                key={a.key}
                onMouseEnter={() => setHoveredKey(a.key)}
                onMouseLeave={() => setHoveredKey(null)}
                className={`flex items-center justify-between gap-3 px-2.5 py-1.5 rounded-lg transition-colors cursor-default ${
                  hoveredKey === a.key ? "bg-gray-50" : ""
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: a.color }} />
                  <span className="text-sm text-gray-600 truncate">{a.label}</span>
                </div>
                <div className="flex items-baseline gap-1.5 shrink-0">
                  <span className="text-sm font-bold text-[#0A1024]">{a.value}</span>
                  <span className="text-xs text-gray-400">({percent}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
