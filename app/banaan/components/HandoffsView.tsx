"use client";

import { useMemo, useState } from "react";
import type { BanaanResponse } from "../types";

// ── Types ───────────────────────────────────────────────────────────────

/** A group change for one instructor at one slot boundary. */
interface GroupChange {
  slot: number;
  time: string;
  instructor: string;
  gained: string[]; // cursists who joined this instructor's group
  lost: string[];   // cursists who left this instructor's group
  /** Where each lost cursist went: cursist → destination (instructor name, "island", or "gone") */
  lostTo: Record<string, string>;
  /** Where each gained cursist came from: cursist → source (instructor name, "island", or "new") */
  gainedFrom: Record<string, string>;
  /** Group size after the change */
  groupAfter: number;
}

/** Summary of an instructor's coordination load. */
interface InstructorSummary {
  name: string;
  /** Number of slot transitions where the group changed. */
  changeCount: number;
  /** Total cursists gained/lost across all changes. */
  totalMovements: number;
  /** Other instructors they exchange cursists with. */
  partners: string[];
}

// ── Build instructor→cursists mapping per slot ──────────────────────────

function buildInstructorGroups(result: BanaanResponse): Map<string, string[]>[] {
  const { cursist_timeline, times, rides } = result;
  const slotCount = times.length;

  // Build cursist → transport instructor lookup from rides
  const cursistTransportInst = new Map<string, string>();
  for (const ride of rides) {
    for (const [cursist, inst] of Object.entries(ride.cursist_transport)) {
      cursistTransportInst.set(cursist, inst);
    }
    // Fallback: if cursist_transport is empty, use the first transport instructor
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

      // If the cursist has a covering instructor (sailing), use that
      let inst: string | undefined = cell.detail;

      // If no detail (transit/island/banana states), attribute them to
      // their transport instructor so that a cursist staying with the
      // same instructor doesn't show as a handoff
   
   
















































































































      

      if (!inst) continue;
      if (!groups.has(inst)) groups.set(inst, []);
      groups.get(inst)!.push(cursistName);
    }
    // Sort each group for stable comparison
    for (const cursists of groups.values()) cursists.sort();
    slots.push(groups);
  }

  return slots;
}

function computeGroupChanges(result: BanaanResponse): GroupChange[] {
  const slots = buildInstructorGroups(result);
  const { cursist_timeline, times, rides } = result;
  const changes: GroupChange[] = [];

  // Build cursist → transport instructor lookup from rides
  const cursistTransport = new Map<string, string>();
  for (const ride of rides) {
    for (const [cursist, inst] of Object.entries(ride.cursist_transport)) {
      cursistTransport.set(cursist, inst);
    }
  }

  // All instructor names that appear anywhere
  const allInstructors = new Set<string>();
  for (const slot of slots) {
    for (const name of slot.keys()) allInstructors.add(name);
  }

  for (let t = 1; t < slots.length; t++) {
    const prev = slots[t - 1];
    const curr = slots[t];

    for (const instructor of allInstructors) {
      const prevCursists = new Set(prev.get(instructor) ?? []);
      const currCursists = new Set(curr.get(instructor) ?? []);

      const gained = [...currCursists].filter((s) => !prevCursists.has(s));
      const lost = [...prevCursists].filter((s) => !currCursists.has(s));

      if (gained.length === 0 && lost.length === 0) continue;

      // Figure out where lost cursists went
      const lostTo: Record<string, string> = {};
      for (const s of lost) {
        const cell = cursist_timeline[s]?.[t];
        if (cell?.detail && cell.detail !== instructor) {
          // Went to another instructor
          lostTo[s] = cell.detail;
        } else if (cell?.state && cell.state !== "sailing") {
          // Went to island — show the transport instructor if known
          const transport = cursistTransport.get(s);
          const stateName = cell.state.replace(/_/g, " ");
          lostTo[s] = transport ? `${stateName} (${transport})` : stateName;
        } else {
          lostTo[s] = "–";
        }
      }

      // Figure out where gained cursists came from
      const gainedFrom: Record<string, string> = {};
      for (const s of gained) {
        const prevCell = cursist_timeline[s]?.[t - 1];
        if (prevCell?.detail && prevCell.detail !== instructor) {
          // Came from another instructor
          gainedFrom[s] = prevCell.detail;
        } else if (prevCell?.state && prevCell.state !== "sailing") {
          // Returning from island — show the transport instructor if known
          const transport = cursistTransport.get(s);
          const stateName = prevCell.state.replace(/_/g, " ");
          gainedFrom[s] = transport ? `${stateName} (${transport})` : stateName;
        } else {
          gainedFrom[s] = "–";
        }
      }

      changes.push({
        slot: t,
        time: times[t] ?? `slot ${t}`,
        instructor,
        gained,
        lost,
        lostTo,
        gainedFrom,
        groupAfter: currCursists.size,
      });
    }
  }

  changes.sort((a, b) => a.slot - b.slot || a.instructor.localeCompare(b.instructor));
  return changes;
}

function computeSummaries(changes: GroupChange[]): InstructorSummary[] {
  const map = new Map<string, { changes: number; movements: number; partners: Set<string> }>();

  for (const c of changes) {
    if (!map.has(c.instructor)) {
      map.set(c.instructor, { changes: 0, movements: 0, partners: new Set() });
    }
    const entry = map.get(c.instructor)!;
    entry.changes++;
    entry.movements += c.gained.length + c.lost.length;

    // Track partner instructors
    for (const dest of Object.values(c.lostTo)) {
      if (dest !== "–" && !dest.includes(" ")) entry.partners.add(dest);
    }
    for (const src of Object.values(c.gainedFrom)) {
      if (src !== "–" && !src.includes(" ")) entry.partners.add(src);
    }
  }

  return Array.from(map.entries())
    .map(([name, data]) => ({
      name,
      changeCount: data.changes,
      totalMovements: data.movements,
      partners: Array.from(data.partners).sort(),
    }))
    .sort((a, b) => b.totalMovements - a.totalMovements);
}

// ── Components ──────────────────────────────────────────────────────────

function CursistChip({
  name,
  annotation,
  variant,
}: {
  name: string;
  annotation?: string;
  variant: "gained" | "lost";
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${
        variant === "gained"
          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
          : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
      }`}
    >
      {variant === "gained" ? "+" : "−"} {name}
      {annotation && (
        <span className="text-[10px] opacity-70">
          ({variant === "gained" ? "from" : "to"} {annotation})
        </span>
      )}
    </span>
  );
}

function ChangeCard({ change }: { change: GroupChange }) {
  return (
    <div className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
      <div className="flex items-center gap-3">
        <div className="flex h-8 min-w-[3.5rem] items-center justify-center rounded bg-zinc-100 text-xs font-mono font-medium dark:bg-zinc-800">
          {change.time}
        </div>
        <span className="text-sm font-medium">{change.instructor}</span>
        <span className="text-xs text-zinc-400">
          → {change.groupAfter} cursist{change.groupAfter !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {change.gained.map((s) => (
          <CursistChip
            key={s}
            name={s}
            annotation={change.gainedFrom[s]}
            variant="gained"
          />
        ))}
        {change.lost.map((s) => (
          <CursistChip
            key={s}
            name={s}
            annotation={change.lostTo[s]}
            variant="lost"
          />
        ))}
      </div>
    </div>
  );
}

function SummaryTable({ summaries }: { summaries: InstructorSummary[] }) {
  if (summaries.length === 0) return null;

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
          <tr>
            <th className="px-4 py-2">Instructor</th>
            <th className="px-4 py-2 text-right">Group changes</th>
            <th className="px-4 py-2 text-right">Cursists moved</th>
            <th className="px-4 py-2">Coordinates with</th>
          </tr>
        </thead>
        <tbody>
          {summaries.map((row) => (
            <tr
              key={row.name}
              className="border-b border-zinc-100 last:border-b-0 dark:border-zinc-800"
            >
              <td className="px-4 py-2 font-medium">{row.name}</td>
              <td className="px-4 py-2 text-right">{row.changeCount}</td>
              <td className="px-4 py-2 text-right">{row.totalMovements}</td>
              <td className="px-4 py-2 text-zinc-500">
                {row.partners.join(", ") || "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Main export ─────────────────────────────────────────────────────────

interface HandoffsViewProps {
  result: BanaanResponse;
}

export default function HandoffsView({ result }: HandoffsViewProps) {
  const changes = useMemo(() => computeGroupChanges(result), [result]);
  const summaries = useMemo(() => computeSummaries(changes), [changes]);
  const [filterInstructor, setFilterInstructor] = useState<string | null>(null);

  const instructorNames = useMemo(
    () => Array.from(new Set(summaries.map((s) => s.name))).sort(),
    [summaries],
  );

  const filtered = filterInstructor
    ? changes.filter((c) => c.instructor === filterInstructor)
    : changes;

  if (changes.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        No group changes — every instructor keeps the same cursists throughout
        the day.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Summary */}
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          Instructor coordination summary
        </h3>
        <p className="text-xs text-zinc-500">
          How many times each instructor&apos;s group of cursists changes, and
          which other instructors they need to coordinate with.
        </p>
        <SummaryTable summaries={summaries} />
      </div>

      {/* Change timeline */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            Group changes
          </h3>
          <div className="flex items-center gap-2">
            {filterInstructor && (
              <button
                onClick={() => setFilterInstructor(null)}
                className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                Clear filter
              </button>
            )}
            <select
              value={filterInstructor ?? ""}
              onChange={(e) => setFilterInstructor(e.target.value || null)}
              className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
            >
              <option value="">All instructors</option>
              {instructorNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <p className="text-xs text-zinc-500">
          Each card shows when an instructor&apos;s group changes.{" "}
          <span className="text-green-600 dark:text-green-400">Green</span>{" "}
          chips are cursists joining,{" "}
          <span className="text-red-600 dark:text-red-400">red</span> chips are
          cursists leaving, with where they came from or went to.
        </p>
        <div className="flex flex-col gap-2">
          {filtered.map((c, i) => (
            <ChangeCard
              key={`${c.slot}-${c.instructor}-${i}`}
              change={c}
            />
          ))}
          {filtered.length === 0 && filterInstructor && (
            <p className="text-sm text-zinc-500">
              No group changes for {filterInstructor}.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
