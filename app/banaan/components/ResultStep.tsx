"use client";

import { useBanaan } from "./context";

export default function ResultStep() {
  const { step, result, loading, handleDownload } = useBanaan();
  if (step !== "result" || !result) return null;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <div className="text-2xl font-bold">{result.total_groups}</div>
          <div className="text-sm text-zinc-500">Groups</div>
        </div>
        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <div className="text-2xl font-bold">
            {result.total_banana_students}
          </div>
          <div className="text-sm text-zinc-500">Banana students</div>
        </div>
      </div>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Schedule</h2>
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
              <tr>
                <th className="px-4 py-2">#</th>
                <th className="px-4 py-2">Time</th>
                <th className="px-4 py-2">Phase</th>
                <th className="px-4 py-2">Students</th>
                <th className="px-4 py-2">Disciplines</th>
                <th className="px-4 py-2">Transport</th>
              </tr>
            </thead>
            <tbody>
              {result.groups.map((g) => (
                <tr
                  key={g.index}
                  className="border-b border-zinc-100 dark:border-zinc-800"
                >
                  <td className="px-4 py-2">{g.index + 1}</td>
                  <td className="px-4 py-2">{g.time}</td>
                  <td className="px-4 py-2">{g.phase}</td>
                  <td className="px-4 py-2">{g.students.join(", ")}</td>
                  <td className="px-4 py-2">{g.disciplines.join(", ")}</td>
                  <td className="px-4 py-2">
                    {g.transport_instructor ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {Object.keys(result.non_banana_assignments).length > 0 && (
        <section>
          <h2 className="mb-2 text-lg font-semibold">
            Non-banana assignments
          </h2>
          <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
                <tr>
                  <th className="px-4 py-2">Student</th>
                  <th className="px-4 py-2">Instructor</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(result.non_banana_assignments).map(
                  ([student, instructor]) => (
                    <tr
                      key={student}
                      className="border-b border-zinc-100 dark:border-zinc-800"
                    >
                      <td className="px-4 py-2">{student}</td>
                      <td className="px-4 py-2">{instructor}</td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <button
        onClick={handleDownload}
        disabled={loading}
        className="self-start rounded-lg bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        {loading ? "Downloading…" : "Download XLSX"}
      </button>
    </div>
  );
}
