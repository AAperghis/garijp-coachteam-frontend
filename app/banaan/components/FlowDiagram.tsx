"use client";

import { useMemo } from "react";
import type { BanaanResponse } from "../types";
import { useBanaan } from "./context";

// ── Build instructor→cursists mapping per slot (same logic as HandoffsView) ──

function buildInstructorGroups(result: BanaanResponse): Map<string, string[]>[] {
  const { cursist_timeline, times, rides } = result;
  const slotCount = times.length;

  const cursistTransportInst = new Map<string, string>();
  for (const ride of rides) {
    for (const [cursist, inst] of Object.entries(ride.cursist_transport)) {
      cursistTransportInst.set(cursist, inst);
    }
    if (ride.transport_instructors.length > 0) {
      for (const cursist of ride.cursists) {
        if (!cursistTransportInst.has(cursist)) {
          cursistTransportInst.set(cursist, ride.transport_instructors[0]);
        }
      }
    }
  }

  const slots: Map<string, string[]>[] = [];
  for (let t = 0; t < slotCount; t++) {
    const groups = new Map<string, string[]>();
    for (const [cursistName, cells] of Object.entries(cursist_timeline)) {
      const cell = cells[t];
      if (!cell) continue;
      let inst: string | undefined = cell.detail;
      if (!inst && cell.state !== "sailing") {
        inst = cursistTransportInst.get(cursistName);
      }
      if (!inst) continue;
      if (!groups.has(inst)) groups.set(inst, []);
      groups.get(inst)!.push(cursistName);
    }
    for (const cursists of groups.values()) cursists.sort();
    slots.push(groups);
  }
  return slots;
}

// ── Flow diagram layout types ───────────────────────────────────────────

interface Transfer {
  from: string;
  to: string;
  cursists: string[];
}

// ── Colour palette ──────────────────────────────────────────────────────

// Each discipline has multiple shades so instructors within the same
// discipline are visually distinct.  The first shade is the "base" used
// for discipline headers / separators.
const DISC_SHADES: Record<string, string[]> = {
  jz:       ["#3b82f6", "#60a5fa", "#2563eb", "#93c5fd"],
  opti:     ["#06b6d4", "#22d3ee", "#0891b2", "#67e8f9"],
  laerling: ["#8b5cf6", "#a78bfa", "#7c3aed", "#c4b5fd"],
  zb:       ["#22c55e", "#4ade80", "#16a34a", "#86efac"],
  surf:     ["#f59e0b", "#fbbf24", "#d97706", "#fcd34d"],
  cat:      ["#ef4444", "#f87171", "#dc2626", "#fca5a5"],
  kb:       ["#ec4899", "#f472b6", "#db2777", "#f9a8d4"],
};

const FALLBACK_SHADES = [
  ["#64748b", "#94a3b8", "#475569", "#cbd5e1"],
  ["#84cc16", "#a3e635", "#65a30d", "#bef264"],
  ["#14b8a6", "#2dd4bf", "#0d9488", "#5eead4"],
];

/** Get the base discipline colour (for headers / separators). */
function disciplineColor(disc: string, fallbackIdx: number): string {
  return (DISC_SHADES[disc] ?? FALLBACK_SHADES[fallbackIdx % FALLBACK_SHADES.length])[0];
}

/** Get a shade for a specific instructor index within its discipline group. */
function instructorShade(disc: string, indexInGroup: number, fallbackIdx: number): string {
  const shades = DISC_SHADES[disc] ?? FALLBACK_SHADES[fallbackIdx % FALLBACK_SHADES.length];
  return shades[indexInGroup % shades.length];
}

// ── SVG flow diagram ────────────────────────────────────────────────────

interface FlowDiagramProps {
  result: BanaanResponse;
}

export default function FlowDiagram({ result }: FlowDiagramProps) {
  const { instructors: instructorInputs } = useBanaan();
  const slots = useMemo(() => buildInstructorGroups(result), [result]);
  const times = result.times;

  // Build name→discipline map from the input data
  const instDiscipline = useMemo(() => {
    const map = new Map<string, string>();
    if (instructorInputs) {
      for (const inst of instructorInputs) {
        map.set(inst.name, inst.discipline.toLowerCase());
      }
    }
    return map;
  }, [instructorInputs]);

  // Collect all instructor names that appear in the solution
  const allInstructorNames = useMemo(() => {
    const names = new Set<string>();
    for (const slot of slots) {
      for (const name of slot.keys()) names.add(name);
    }
    return names;
  }, [slots]);

  // Group by discipline, then sort within each discipline by name
  const { allInstructors, disciplineGroups } = useMemo(() => {
    const discMap = new Map<string, string[]>();
    for (const name of allInstructorNames) {
      const disc = instDiscipline.get(name) ?? "other";
      if (!discMap.has(disc)) discMap.set(disc, []);
      discMap.get(disc)!.push(name);
    }
    // Sort instructors within each discipline
    for (const names of discMap.values()) names.sort();

    // Discipline display order
    const discOrder = ["jz", "opti", "laerling", "zb", "surf", "cat", "kb"];
    const sortedDiscs = Array.from(discMap.keys()).sort((a, b) => {
      const ai = discOrder.indexOf(a);
      const bi = discOrder.indexOf(b);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });

    const ordered: string[] = [];
    const groups: { discipline: string; startIdx: number; count: number }[] = [];
    for (const disc of sortedDiscs) {
      const names = discMap.get(disc)!;
      groups.push({ discipline: disc, startIdx: ordered.length, count: names.length });
      ordered.push(...names);
    }
    return { allInstructors: ordered, disciplineGroups: groups };
  }, [allInstructorNames, instDiscipline]);

  // Colour each instructor — different shade per instructor within each discipline
  const colorMap = useMemo(() => {
    const map = new Map<string, string>();
    // Track index within each discipline group
    const discCounter = new Map<string, number>();
    let fallbackIdx = 0;
    for (const name of allInstructors) {
      const disc = instDiscipline.get(name) ?? "other";
      const idxInGroup = discCounter.get(disc) ?? 0;
      discCounter.set(disc, idxInGroup + 1);
      map.set(name, instructorShade(disc, idxInGroup, fallbackIdx++));
    }
    return map;
  }, [allInstructors, instDiscipline]);

  // Find max group size across all slots for scaling
  const maxGroupSize = useMemo(() => {
    let max = 1;
    for (const slot of slots) {
      for (const cursists of slot.values()) {
        max = Math.max(max, cursists.length);
      }
    }
    return max;
  }, [slots]);

  // Layout parameters
  const nInst = allInstructors.length;
  const nSlots = slots.length;
  if (nInst === 0 || nSlots === 0) return null;

  const colWidth = 120; // space per instructor column
  const barMaxWidth = colWidth * 0.7; // max bar width at maxGroupSize
  const rowHeight = 56; // vertical space per slot
  const discHeaderHeight = 20; // discipline label row
  const headerHeight = 48 + discHeaderHeight; // instructor names + discipline labels
  const timeColWidth = 52;
  const labelRowHeight = 20;
  const padX = 16;
  const padY = 12;

  const svgWidth = timeColWidth + padX * 2 + nInst * colWidth;
  const svgHeight = headerHeight + labelRowHeight + nSlots * rowHeight + padY * 2;

  // Helpers
  const colCenter = (instIdx: number) =>
    timeColWidth + padX + instIdx * colWidth + colWidth / 2;
  const barWidth = (count: number) =>
    Math.max(4, (count / maxGroupSize) * barMaxWidth);
  const rowY = (t: number) => headerHeight + labelRowHeight + t * rowHeight + padY;

  // Compute transfers between consecutive slots
  const transfers: Transfer[][] = [];
  for (let t = 1; t < nSlots; t++) {
    const prev = slots[t - 1];
    const curr = slots[t];
    const slotTransfers: Transfer[] = [];

    for (const [fromInst, prevCursists] of prev.entries()) {
      const prevSet = new Set(prevCursists);
      for (const [toInst, currCursists] of curr.entries()) {
        if (fromInst === toInst) continue;
        const moved = currCursists.filter((s) => prevSet.has(s));
        if (moved.length > 0) {
          slotTransfers.push({ from: fromInst, to: toInst, cursists: moved });
        }
      }
    }
    transfers.push(slotTransfers);
  }

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full"
        style={{ minWidth: Math.min(svgWidth, 600), maxWidth: svgWidth }}
      >
        {/* Discipline group headers and separators */}
        {disciplineGroups.map((group) => {
          const groupLeft = colCenter(group.startIdx) - colWidth / 2;
          const groupRight = colCenter(group.startIdx + group.count - 1) + colWidth / 2;
          const groupCenterX = (groupLeft + groupRight) / 2;
          const discY = 18;
          const color = disciplineColor(group.discipline, group.startIdx);

          return (
            <g key={`disc-${group.discipline}`}>
              {/* Discipline label */}
              <text
                x={groupCenterX}
                y={discY}
                textAnchor="middle"
                fontSize={10}
                fontWeight={700}
                fill={color}
                letterSpacing={1}
              >
                {group.discipline.toUpperCase()}
              </text>
              {/* Underline */}
              <line
                x1={groupLeft + 4}
                x2={groupRight - 4}
                y1={discY + 4}
                y2={discY + 4}
                stroke={color}
                strokeWidth={1.5}
                opacity={0.5}
              />
              {/* Vertical separator before group (skip first) */}
              {group.startIdx > 0 && (
                <line
                  x1={groupLeft}
                  x2={groupLeft}
                  y1={discY - 10}
                  y2={svgHeight - padY}
                  className="stroke-zinc-300 dark:stroke-zinc-600"
                  strokeWidth={1}
                  strokeDasharray="2 3"
                  opacity={0.5}
                />
              )}
            </g>
          );
        })}

        {/* Instructor header labels */}
        {allInstructors.map((name, i) => (
          <text
            key={`hdr-${name}`}
            x={colCenter(i)}
            y={headerHeight - 8}
            textAnchor="middle"
            className="fill-zinc-700 dark:fill-zinc-300"
            fontSize={11}
            fontWeight={600}
          >
            {name}
          </text>
        ))}

        {/* Column colour indicators */}
        {allInstructors.map((name, i) => (
          <line
            key={`col-line-${name}`}
            x1={colCenter(i)}
            y1={headerHeight}
            x2={colCenter(i)}
            y2={svgHeight - padY}
            stroke={colorMap.get(name)}
            strokeWidth={1}
            strokeDasharray="4 4"
            opacity={0.25}
          />
        ))}

        {/* Time labels */}
        {times.map((time, t) => (
          <text
            key={`time-${t}`}
            x={timeColWidth - 4}
            y={rowY(t) + rowHeight / 2 + 4}
            textAnchor="end"
            className="fill-zinc-400"
            fontSize={10}
            fontFamily="monospace"
          >
            {time}
          </text>
        ))}

        {/* Bars per slot */}
        {slots.map((groups, t) =>
          allInstructors.map((inst, i) => {
            const cursists = groups.get(inst);
            if (!cursists || cursists.length === 0) return null;
            const w = barWidth(cursists.length);
            const cx = colCenter(i);
            const y = rowY(t);
            const h = rowHeight - 4;
            return (
              <g key={`bar-${t}-${inst}`}>
                <rect
                  x={cx - w / 2}
                  y={y + 2}
                  width={w}
                  height={h}
                  rx={3}
                  fill={colorMap.get(inst)}
                  opacity={0.7}
                />
                <text
                  x={cx}
                  y={y + h / 2 + 5}
                  textAnchor="middle"
                  className="fill-white dark:fill-zinc-100"
                  fontSize={10}
                  fontWeight={600}
                >
                  {cursists.length}
                </text>
              </g>
            );
          }),
        )}

        {/* Transfer lines between slots */}
        {transfers.map((slotTransfers, tIdx) => {
          const t = tIdx + 1; // target slot
          return slotTransfers.map((tr, trIdx) => {
            const fromIdx = allInstructors.indexOf(tr.from);
            const toIdx = allInstructors.indexOf(tr.to);
            if (fromIdx < 0 || toIdx < 0) return null;

            const fromCursists = slots[t - 1].get(tr.from) ?? [];
            const toCursists = slots[t].get(tr.to) ?? [];
            const fromW = barWidth(fromCursists.length);
            const toW = barWidth(toCursists.length);

            const x1 = colCenter(fromIdx) + (toIdx > fromIdx ? fromW / 2 : -fromW / 2);
            const y1 = rowY(t - 1) + rowHeight - 2;
            const x2 = colCenter(toIdx) + (fromIdx > toIdx ? toW / 2 : -toW / 2);
            const y2 = rowY(t) + 2;

            const strokeW = Math.max(2, (tr.cursists.length / maxGroupSize) * barMaxWidth * 0.6);
            const midY = (y1 + y2) / 2;

            // Curved path
            const path = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;

            // Label position
            const labelX = (x1 + x2) / 2;
            const labelY = midY;

            return (
              <g key={`transfer-${tIdx}-${trIdx}`}>
                <path
                  d={path}
                  fill="none"
                  stroke={colorMap.get(tr.from)}
                  strokeWidth={strokeW}
                  opacity={0.45}
                  strokeLinecap="round"
                />
                {/* Cursist names along the transfer line */}
                <text
                  x={labelX}
                  y={labelY}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="fill-zinc-700 dark:fill-zinc-200"
                  fontSize={9}
                  fontWeight={500}
                >
                  {tr.cursists.length <= 3
                    ? tr.cursists.join(", ")
                    : `${tr.cursists.slice(0, 2).join(", ")} +${tr.cursists.length - 2}`}
                </text>
              </g>
            );
          });
        })}
      </svg>
    </div>
  );
}
