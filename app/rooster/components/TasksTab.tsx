"use client";

import { useRoster } from "./context";
import type { TaskInput } from "../types";

let nextId = 1;
function makeId() {
  return `task_${Date.now()}_${nextId++}`;
}

export default function TasksTab() {
  const { tasks, setTasks, config, setConfig } = useRoster();

  function addTask() {
    setTasks((prev) => [
      ...prev,
      { id: makeId(), name: "", preferred_people: 2, min_people: 1 },
    ]);
  }

  function updateTask(index: number, patch: Partial<TaskInput>) {
    setTasks((prev) =>
      prev.map((t, i) => (i === index ? { ...t, ...patch } : t)),
    );
  }

  function removeTask(index: number) {
    setTasks((prev) => prev.filter((_, i) => i !== index));
  }

  // ─── Conflict helpers ───

  function hasConflict(a: string, b: string) {
    return config.task_conflicts.some(
      ([x, y]) => (x === a && y === b) || (x === b && y === a),
    );
  }

  function toggleConflict(a: string, b: string) {
    if (hasConflict(a, b)) {
      setConfig((prev) => ({
        ...prev,
        task_conflicts: prev.task_conflicts.filter(
          ([x, y]) => !((x === a && y === b) || (x === b && y === a)),
        ),
      }));
    } else {
      setConfig((prev) => ({
        ...prev,
        task_conflicts: [...prev.task_conflicts, [a, b]],
      }));
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
            <tr>
              <th className="px-4 py-2">Naam</th>
              <th className="w-28 px-4 py-2">Voorkeur</th>
              <th className="w-28 px-4 py-2">Min</th>
              <th className="w-16 px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {tasks.map((task, i) => (
              <tr
                key={task.id}
                className="border-b border-zinc-100 dark:border-zinc-800"
              >
                <td className="px-4 py-1.5">
                  <input
                    type="text"
                    value={task.name}
                    onChange={(e) => updateTask(i, { name: e.target.value })}
                    placeholder="Taaknaam"
                    className="w-full rounded border border-zinc-200 bg-transparent px-2 py-1 text-sm dark:border-zinc-700"
                  />
                </td>
                <td className="px-4 py-1.5">
                  <input
                    type="number"
                    min={0}
                    value={task.preferred_people}
                    onChange={(e) =>
                      updateTask(i, {
                        preferred_people: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full rounded border border-zinc-200 bg-transparent px-2 py-1 text-sm dark:border-zinc-700"
                  />
                </td>
                <td className="px-4 py-1.5">
                  <input
                    type="number"
                    min={0}
                    value={task.min_people}
                    onChange={(e) =>
                      updateTask(i, {
                        min_people: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full rounded border border-zinc-200 bg-transparent px-2 py-1 text-sm dark:border-zinc-700"
                  />
                </td>
                <td className="px-4 py-1.5 text-center">
                  <button
                    onClick={() => removeTask(i)}
                    className="text-zinc-400 hover:text-red-500"
                    title="Verwijderen"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        onClick={addTask}
        className="self-start rounded-lg border border-dashed border-zinc-300 px-4 py-2 text-sm text-zinc-500 transition-colors hover:border-zinc-500 hover:text-zinc-700 dark:border-zinc-700 dark:hover:border-zinc-500 dark:hover:text-zinc-300"
      >
        + Taak toevoegen
      </button>

      {/* Conflict matrix */}
      {tasks.length >= 2 && (
        <section className="flex flex-col gap-3">
          <div>
            <h2 className="text-lg font-semibold">Taak-incompatibiliteiten</h2>
            <p className="mt-1 text-xs text-zinc-500">
              Taken die niet door dezelfde persoon op dezelfde dag mogen worden
              gedaan.
            </p>
          </div>

          <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
            <table className="text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
                <tr>
                  <th className="px-3 py-2" />
                  {tasks.map((t) => (
                    <th
                      key={t.id}
                      className="whitespace-nowrap px-2 py-2 text-center text-xs font-medium"
                    >
                      {t.name || t.id}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tasks.map((row, ri) => (
                  <tr
                    key={row.id}
                    className="border-b border-zinc-100 last:border-0 dark:border-zinc-800"
                  >
                    <td className="whitespace-nowrap px-3 py-1.5 text-sm font-medium">
                      {row.name || row.id}
                    </td>
                    {tasks.map((col, ci) => (
                      <td key={col.id} className="px-2 py-1.5 text-center">
                        {ri === ci ? (
                          <span className="text-zinc-300 dark:text-zinc-700">
                            —
                          </span>
                        ) : (
                          <input
                            type="checkbox"
                            checked={hasConflict(row.id, col.id)}
                            onChange={() => toggleConflict(row.id, col.id)}
                            className="h-4 w-4 cursor-pointer rounded border-zinc-300 accent-zinc-900 dark:border-zinc-600 dark:accent-zinc-100"
                          />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
