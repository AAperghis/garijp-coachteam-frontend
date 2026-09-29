"use client";

import { useState, useMemo } from "react";
import type { BanaanResponse, ScheduleCell } from "../types";

// ── State → visual mapping ──────────────────────────────────────────────

const STATE_CONFIG: Record<string, { bg: string; label: string; icon: string }> = {
  // Instructor states
  instructing:  { bg: "bg-sky-200 dark:bg-sky-900",      label: "Instructing",    icon: "⛵" },
  transit_to:   { bg: "bg-amber-300 dark:bg-amber-800",  label: "→ Island",       icon: "→" },
  on_island:    { bg: "bg-yellow-200 dark:bg-yellow-800", label: "On island",      icon: "🏝️" },
  transit_from: { bg: "bg-amber-300 dark:bg-amber-800",  label: "← Back",         icon: "←" },
  covering:     { bg: "bg-violet-200 dark:bg-violet-800", label: "Covering",       icon: "👀" },
  // Cursist states
  sailing:      { bg: "bg-sky-200 dark:bg-sky-900",      label: "Sailing",        icon: "⛵" },
  prep:         { bg: "bg-orange-200 dark:bg-orange-800", label: "Prep",           icon: "⏳" },
  on_banana:    { bg: "bg-emerald-300 dark:bg-emerald-800", label: "Banana!",      icon: "🍌" },
};

const DEFAULT_CONFIG = { bg: "bg-zinc-200 dark:bg-zinc-700", label: "?", icon: "?" };

function cellConfig(state: string) {
  return STATE_CONFIG[state] ?? DEFAULT_CONFIG;
}

// ── Legend ───────────────────────────────────────────────────────────────

function Legend({ kind }: { kind: "instructor" | "cursist" }) {
  const keys = kind === "instructor"
    ? ["instructing", "transit_to", "on_island", "transit_from", "covering"]
    : ["sailing", "transit_to", "on_island", "prep", "on_banana", "transit_from"];
  return (
    <div className="flex flex-wrap gap-3 text-xs">
      {keys.map((k) => {
        const c = cellConfig(k);
        return (
          <span key={k} className="flex items-center gap-1">
            <span className={`inline-block h-3 w-3 rounded-sm ${c.bg}`} />
            {c.icon} {c.label}
          </span>
        );
      })}
    </div>
  );
}

// ── Tooltip ─────────────────────────────────────────────────────────────

interface TooltipData {
  name: string;
  time: string;
  state: string;
  detail: string;
  x: number;
  y: number;
}

function Tooltip({ data }: { data: TooltipData | null }) {
  if (!data) return null;
  const c = cellConfig(data.state);
  return (
    <div
      className="pointer-events-none fixed z-50 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
      style={{ left: data.x + 12, top: data.y - 8 }}
    >
      <div className="font-semibold">{data.name}</div>
      <div className="text-zinc-500">{data.time}</div>
      <div className="mt-1 flex items-center gap-1">
        <span className={`inline-block h-2 w-2 rounded-sm ${c.bg}`} />
        {c.icon} {c.label}
      </div>
      {data.detail && <div className="mt-0.5 text-zinc-400">{data.detail}</div>}
    </div>
  );
}

// ── Timeline Grid ───────────────────────────────────────────────────────

interface TimelineGridProps {
  times: string[];
  timeline: Record<string, ScheduleCell[]>;
  kind: "instructor" | "cursist";
  /** Currently selected name (highlights the row + related rows) */
  selected: string | null;
  onSelect: (name: string | null) => void;
  /** Map of cursist → instructor at each slot (for cross-highlighting) */
  relatedNames?: Set<string>;
}

function TimelineGrid({
  times,
  timeline,
  kind,
  selected,
  onSelect,
  relatedNames,
}: TimelineGridProps) {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const names = Object.keys(timeline ?? {});

  if (!timeline || names.length === 0) {
    return <p className="text-sm text-zinc-500">No timeline data available. Try solving again.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <Legend kind={kind} />
      <Tooltip data={tooltip} />
      <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="text-xs">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
              <th className="sticky left-0 z-10 bg-zinc-50 px-3 py-1.5 text-left font-medium dark:bg-zinc-900">
                {kind === "instructor" ? "Instructor" : "Cursist"}
              </th>
              {times.map((t) => (
                <th key={t} className="px-1 py-1.5 text-center font-mono font-normal text-zinc-500">
                  {t}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {names.map((name) => {
              const cells = timeline[name];
              const isSelected = selected === name;
              const isRelated = relatedNames?.has(name);
              const dimmed = selected && !isSelected && !isRelated;

              return (
                <tr
                  key={name}
                  className={`cursor-pointer border-b border-zinc-100 transition-opacity dark:border-zinc-800 ${
                    dimmed ? "opacity-25" : ""
                  } ${isSelected ? "ring-2 ring-inset ring-garijp-blue" : ""} ${
                    isRelated && !isSelected ? "bg-garijp-blue/5" : ""
                  }`}
                  onClick={() => onSelect(isSelected ? null : name)}
                >
                  <td className="sticky left-0 z-10 whitespace-nowrap bg-white px-3 py-1 font-medium dark:bg-zinc-950">
                    {name}
                  </td>
                  {cells.map((cell, i) => {
                    const c = cellConfig(cell.state);
                    // Detect state transitions for branch-style dots
                    const prevState = i > 0 ? cells[i - 1].state : null;
                    const isTransition = prevState !== null && prevState !== cell.state;

                    return (
                      <td
                        key={i}
                        className="relative px-0 py-1"
                        onMouseEnter={(e) =>
                          setTooltip({
                            name,
                            time: times[i],
                            state: cell.state,
                            detail: cell.detail,
                            x: e.clientX,
                            y: e.clientY,
                          })
                        }
                        onMouseMove={(e) =>
                          setTooltip((prev) =>
                            prev ? { ...prev, x: e.clientX, y: e.clientY } : null,
                          )
                        }
                        onMouseLeave={() => setTooltip(null)}
                      >
                        <div className="flex items-center justify-center">
                          <div
                            className={`h-5 w-full min-w-[28px] ${c.bg} ${
                              // Rounded ends for state transitions
                              isTransition ? "rounded-l-full" : ""
                            } ${
                              i < cells.length - 1 && cells[i + 1].state !== cell.state
                                ? "rounded-r-full"
                                : ""
                            } flex items-center justify-center text-[10px]`}
                          >
                            {isTransition && (
                              <span className="absolute -left-0.5 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full border-2 border-white bg-zinc-700 dark:border-zinc-900 dark:bg-zinc-300" />
                            )}
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Combined interactive view ───────────────────────────────────────────

interface TimelineViewProps {
  result: BanaanResponse;
}

export default function TimelineView({ result }: TimelineViewProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [view, setView] = useState<"instructors" | "cursists">("instructors");

  // Build cross-reference: when selecting an instructor, highlight their cursists and vice versa
  const relatedNames = useMemo(() => {
    if (!selected) return new Set<string>();

    const related = new Set<string>();

    if (selected in result.instructor_timeline) {
      // Selected an instructor → find cursists supervised by them
      for (const [cursistName, cells] of Object.entries(result.cursist_timeline)) {
        if (cells.some((c) => c.detail === selected)) {
          related.add(cursistName);
        }
      }
      // Also check rides for transport
      for (const ride of result.rides) {
        if (ride.transport_instructors.includes(selected)) {
          ride.cursists.forEach((s) => related.add(s));
        }
      }
    } else if (selected in result.cursist_timeline) {
      // Selected a cursist → find their instructors
      const cells = result.cursist_timeline[selected];
      for (const c of cells) {
        if (c.detail) related.add(c.detail);
      }
      // Also check rides
      for (const ride of result.rides) {
        if (ride.cursists.includes(selected)) {
          ride.transport_instructors.forEach((i) => related.add(i));
        }
      }
    }

    return related;
  }, [selected, result]);

  const tabs = [
    { id: "instructors" as const, label: "Instructors" },
    { id: "cursists" as const, label: "Cursists" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setView(t.id)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                view === t.id
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        {selected && (
          <button
            onClick={() => setSelected(null)}
            className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            Clear selection
          </button>
        )}
      </div>

      {view === "instructors" ? (
        <TimelineGrid
          times={result.times}
          timeline={result.instructor_timeline}
          kind="instructor"
          selected={selected}
          onSelect={setSelected}
          relatedNames={relatedNames}
        />
      ) : (
        <TimelineGrid
          times={result.times}
          timeline={result.cursist_timeline}
          kind="cursist"
          selected={selected}
          onSelect={setSelected}
          relatedNames={relatedNames}
        />
      )}
    </div>
  );
}
