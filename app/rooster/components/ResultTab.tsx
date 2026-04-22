"use client";

import { useRoster } from "./context";

export default function ResultTab() {
  const { schedule, tasks, people, handleDownload, loading } = useRoster();

  if (!schedule) {
    return (
      <p className="text-zinc-500">
        Nog geen resultaat. Druk op &quot;Rooster maken&quot; om het rooster te genereren.
      </p>
    );
  }

  const taskName = (id: string) =>
    tasks.find((t) => t.id === id)?.name || id;
  const personName = (id: string) =>
    people.find((p) => p.id === id)?.name || id;

  const days = Object.keys(schedule);
  const allTasks = new Set<string>();
  for (const taskMap of Object.values(schedule)) {
    for (const task of Object.keys(taskMap)) {
      allTasks.add(task);
    }
  }
  const taskList = Array.from(allTasks);

  const today = new Date().toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex flex-col gap-4 print:min-h-screen print:gap-0">
      {/* Print-only branded header */}
      <header className="hidden print:flex items-baseline gap-4 bg-[#0fb0d4] px-8 py-6 text-white">
        <h1
          className="text-4xl text-[rgb(235,86,94)] font-normal"
          style={{ fontFamily: "'OneDirection', cursive" }}
        >
          Rooster
        </h1>
        <span className="text-2xl opacity-85" style={{ fontFamily: "'OneDirection', cursive" }}>Zeilschool 't Garijp</span>
      </header>
      <div className="hidden print:block h-1 bg-[rgb(235,86,94)]" />
      <div className="hidden print:block h-15 " />

      <div className="overflow-x-auto rounded-lg border border-zinc-200 print:flex-1 print:border-zinc-300 print:rounded-none print:px-6 print:py-4 dark:border-zinc-800">
        <table className="w-full text-left text-sm border-collapse border border-zinc-200 dark:border-zinc-700 print:text-[11px] print:border-zinc-400">
          <thead className="bg-zinc-50 print:bg-sky-50 dark:bg-zinc-900">
            <tr>
              <th className="px-4 py-2 border border-zinc-200 dark:border-zinc-700 print:px-2 print:py-1.5 print:text-[14px] print:font-semibold print:uppercase print:tracking-wide print:text-cyan-700 print:border-zinc-400">
                Dag
              </th>
              {taskList.map((t) => (
                <th
                  key={t}
                  className="px-4 py-2 border border-zinc-200 dark:border-zinc-700 print:px-2 print:py-1.5 print:text-[12px] print:font-semibold print:uppercase print:tracking-wide print:text-cyan-700 print:border-zinc-400"
                >
                  {taskName(t)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {days.map((day, i) => (
              <tr
                key={day}
                className={i % 2 === 1 ? "print:bg-zinc-50" : ""}
              >
                <td className="px-4 py-2 font-bold border border-zinc-200 dark:border-zinc-700 print:px-2 print:py-1.5 print:whitespace-nowrap print:border-zinc-400 print:text-[14px]">
                  {day}
                </td>
                {taskList.map((task) => (
                  <td
                    key={task}
                    className="px-4 py-2 border border-zinc-200 dark:border-zinc-700 print:px-2 print:py-1.5 print:border-zinc-400 print:text-[12px]"
                  >
                    {schedule[day]?.[task]?.map(personName).join(", ") || "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="hidden print:block h-1 bg-[rgb(235,86,94)]" />
      {/* Print-only branded footer */}
      <footer className="hidden print:flex items-center justify-between bg-[#0fb0d4] px-8 py-3 text-[10px] text-white">
        <span>Gegenereerd door Garijp CoachTeam Tools v1.0</span>
        <span>{today}</span>
      </footer>

      {/* Action buttons — hidden when printing */}
      <div className="flex gap-0 print:hidden">
        <button
          onClick={handleDownload}
          disabled={loading}
          className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {loading ? "Downloading…" : "Download XLSX"}
        </button>
        <button
          onClick={() => window.print()}
          className="rounded-lg border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Print / PDF
        </button>
      </div>
    </div>
  );
}
