"use client";

import { useBanaan } from "./context";

export default function StudentInput() {
  const { step, students, instructors, config, loading, handleSolve } = useBanaan();
  if ((step !== "preview" && step !== "result") || !students || !instructors || !config) return null;

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h2 className="mb-2 text-lg font-semibold">
          Students ({students.length})
        </h2>
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Discipline</th>
                <th className="px-4 py-2">Instructor</th>
                <th className="px-4 py-2">Banana?</th>
                <th className="px-4 py-2">Friend</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s, i) => (
                <tr
                  key={i}
                  className="border-b border-zinc-100 dark:border-zinc-800"
                >
                  <td className="px-4 py-2">{s.name}</td>
                  <td className="px-4 py-2">{s.discipline}</td>
                  <td className="px-4 py-2">{s.instructor}</td>
                  <td className="px-4 py-2">
                    {s.wants_banana ? "Yes" : "No"}
                  </td>
                  <td className="px-4 py-2">{s.friend ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">
          Instructors ({instructors.length})
        </h2>
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Discipline</th>
                <th className="px-4 py-2">Transport Capacity</th>
              </tr>
            </thead>
            <tbody>
              {instructors.map((inst, i) => (
                <tr
                  key={i}
                  className="border-b border-zinc-100 dark:border-zinc-800"
                >
                  <td className="px-4 py-2">{inst.name}</td>
                  <td className="px-4 py-2">{inst.discipline}</td>
                  <td className="px-4 py-2">{inst.transport_capacity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Config</h2>
        <div className="grid grid-cols-2 gap-2 rounded-lg border border-zinc-200 p-4 text-sm dark:border-zinc-800 sm:grid-cols-3">
          <div>
            <span className="text-zinc-500">Boat capacity:</span>{" "}
            {config.boat_capacity}
          </div>
          <div>
            <span className="text-zinc-500">Slot duration:</span>{" "}
            {config.slot_duration_min} min
          </div>
          <div>
            <span className="text-zinc-500">Prep time:</span>{" "}
            {config.prep_time_min} min
          </div>
          <div>
            <span className="text-zinc-500">Transport time:</span>{" "}
            {config.transport_time_min} min
          </div>
          <div>
            <span className="text-zinc-500">Start:</span>{" "}
            {config.start_time}
          </div>
          <div>
            <span className="text-zinc-500">End:</span> {config.end_time}
          </div>
        </div>
      </section>

      {step === "preview" && (
        <button
          onClick={handleSolve}
          disabled={loading}
          className="self-start rounded-lg bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {loading ? "Solving…" : "Solve"}
        </button>
      )}
    </div>
  );
}
