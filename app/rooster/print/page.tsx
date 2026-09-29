"use client";

import { useEffect, useState } from "react";
import type { PersonInput, TaskInput, Schedule } from "../types";
import { rosterStorageKey } from "../components/context";

// Mirrors weekContext's storage key; the print page has no provider tree.
const ACTIVE_WEEK_KEY = "active-week-id";

interface PersistedState {
  tasks: TaskInput[];
  people: PersonInput[];
  schedule: Schedule | null;
  config: { days: string[] };
}

export default function PrintPage() {
  const [data, setData] = useState<PersistedState | null>(null);

  useEffect(() => {
    try {
      const weekId = localStorage.getItem(ACTIVE_WEEK_KEY);
      if (!weekId) return;
      const raw = localStorage.getItem(rosterStorageKey(Number(weekId)));
      if (raw) setData(JSON.parse(raw));
    } catch {}
  }, []);

  if (!data?.schedule) {
    return (
      <p className="p-8 text-zinc-500">
        Geen rooster gevonden. Genereer eerst een rooster.
      </p>
    );
  }

  const { schedule, tasks, people, config } = data;
  const days = Object.keys(schedule);
  const taskIds = Array.from(
    new Set(Object.values(schedule).flatMap((m) => Object.keys(m))),
  );

  const taskName = (id: string) =>
    tasks.find((t) => t.id === id)?.name || id;
  const personName = (id: string) =>
    people.find((p) => p.id === id)?.name || id;

  const today = new Date().toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex min-h-screen flex-col">
      {/* Print button — hidden when printing */}
      <div className="flex justify-center gap-3 p-3 print:hidden">
        <button
          onClick={() => window.print()}
          className="rounded-lg bg-[#0fb0d4] px-6 py-2.5 text-sm font-medium text-white hover:opacity-90"
        >
          Print / Opslaan als PDF
        </button>
      </div>

      {/* Header */}
      <header className="flex items-baseline gap-4 bg-[#0fb0d4] px-8 py-6 text-white">
        <h1
          className="text-4xl text-[rgb(235,86,94)]"
          style={{ fontFamily: "var(--font-one-direction), cursive" }}
        >
          Rooster
        </h1>
        <span className="text-sm opacity-85">Surfkamp Garijp</span>
      </header>

      {/* Table */}
      <main className="flex-1 p-8">
        <table className="w-full border-collapse text-[11px]">
          <thead>
            <tr>
              <th className="border border-zinc-300 bg-sky-50 px-2 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wide text-cyan-700">
                Dag
              </th>
              {taskIds.map((t) => (
                <th
                  key={t}
                  className="border border-zinc-300 bg-sky-50 px-2 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wide text-cyan-700"
                >
                  {taskName(t)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {days.map((day, i) => (
              <tr key={day} className={i % 2 === 1 ? "bg-zinc-50" : ""}>
                <td className="border border-zinc-300 px-2 py-1.5 font-semibold whitespace-nowrap">
                  {day}
                </td>
                {taskIds.map((t) => (
                  <td key={t} className="border border-zinc-300 px-2 py-1.5">
                    {schedule[day]?.[t]?.map(personName).join(", ") || "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </main>

      {/* Footer */}
      <footer className="flex items-center justify-between bg-[#0fb0d4] px-8 py-2.5 text-[10px] text-white opacity-90">
        <span>Gegenereerd door Garijp CoachTeam v1.0</span>
        <span>{today}</span>
      </footer>
    </div>
  );
}
