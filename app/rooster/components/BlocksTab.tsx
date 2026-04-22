"use client";

import { useState } from "react";
import { useRoster } from "./context";

export default function ConstraintsTab() {
  return (
    <div className="flex flex-col gap-8">
      <TaskConflictsSection />
      <TaskBlocksSection />
    </div>
  );
}

/* ── Task conflicts (two tasks can't be done by the same person on the same day) ── */

function TaskConflictsSection() {
  const { config, setConfig, tasks } = useRoster();
  const conflicts = config.task_conflicts;

  const [taskA, setTaskA] = useState("");
  const [taskB, setTaskB] = useState("");

  function addConflict() {
    if (!taskA || !taskB || taskA === taskB) return;
    // Check for duplicate (either order)
    const exists = conflicts.some(
      ([a, b]) =>
        (a === taskA && b === taskB) || (a === taskB && b === taskA),
    );
    if (exists) return;

    setConfig((prev) => ({
      ...prev,
      task_conflicts: [...prev.task_conflicts, [taskA, taskB]],
    }));
    setTaskA("");
    setTaskB("");
  }

  function removeConflict(index: number) {
    setConfig((prev) => ({
      ...prev,
      task_conflicts: prev.task_conflicts.filter((_, i) => i !== index),
    }));
  }

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Taak-incompatibiliteiten</h2>
      <p className="text-xs text-zinc-500">
        Twee taken die niet door dezelfde persoon op dezelfde dag gedaan mogen
        worden.
      </p>

      {/* Add form */}
      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-zinc-500">Taak A</label>
          <select
            value={taskA}
            onChange={(e) => setTaskA(e.target.value)}
            className="rounded border border-zinc-200 bg-transparent px-2 py-1.5 text-sm dark:border-zinc-700"
          >
            <option value="">— kies —</option>
            {tasks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name || t.id}
              </option>
            ))}
          </select>
        </div>

        <span className="pb-1.5 text-sm text-zinc-400">✕</span>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-zinc-500">Taak B</label>
          <select
            value={taskB}
            onChange={(e) => setTaskB(e.target.value)}
            className="rounded border border-zinc-200 bg-transparent px-2 py-1.5 text-sm dark:border-zinc-700"
          >
            <option value="">— kies —</option>
            {tasks
              .filter((t) => t.id !== taskA)
              .map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name || t.id}
                </option>
              ))}
          </select>
        </div>

        <button
          onClick={addConflict}
          disabled={!taskA || !taskB || taskA === taskB}
          className="rounded-lg bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Toevoegen
        </button>
      </div>

      {/* List */}
      {conflicts.length === 0 ? (
        <p className="text-sm text-zinc-400">
          Geen taak-incompatibiliteiten ingesteld.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {conflicts.map(([a, b], i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 px-3 py-1 text-sm dark:border-zinc-700"
            >
              {tasks.find((t) => t.id === a)?.name || a}
              {" / "}
              {tasks.find((t) => t.id === b)?.name || b}
              <button
                onClick={() => removeConflict(i)}
                className="ml-0.5 text-zinc-400 hover:text-red-500"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}
    </section>
  );
}

/* ── Task blocks (person blocked from task, optionally per day) ── */

function TaskBlocksSection() {
  const { config, setConfig, people, tasks } = useRoster();
  const blocks = config.task_blocks;

  const [personId, setPersonId] = useState("");
  const [taskId, setTaskId] = useState("");
  const [day, setDay] = useState("");
  const [mode, setMode] = useState<"block" | "allow">("block");

  function addBlock() {
    if (!personId || !taskId) return;

    if (mode === "block") {
      // Block this person from this task (on this day or all days)
      setConfig((prev) => ({
        ...prev,
        task_blocks: [...prev.task_blocks, [personId, taskId, day]],
      }));
    } else {
      // Allow only: block this person from ALL OTHER tasks (on this day or all days)
      const otherTasks = tasks.filter((t) => t.id !== taskId);
      const newBlocks: [string, string, string][] = otherTasks.map((t) => [
        personId,
        t.id,
        day,
      ]);
      // Deduplicate with existing blocks
      const existing = new Set(
        prev_blocks_key(config.task_blocks),
      );
      const filtered = newBlocks.filter(
        (b) => !existing.has(blockKey(b)),
      );
      setConfig((prev) => ({
        ...prev,
        task_blocks: [...prev.task_blocks, ...filtered],
      }));
    }

    setPersonId("");
    setTaskId("");
    setDay("");
  }

  function removeBlock(index: number) {
    setConfig((prev) => ({
      ...prev,
      task_blocks: prev.task_blocks.filter((_, i) => i !== index),
    }));
  }

  // Group blocks by person for display
  const grouped = groupBlocks(blocks, people, tasks, config.days);

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Blokkades</h2>
      <p className="text-xs text-zinc-500">
        Blokkeer een instructeur van een taak, of sta alleen een specifieke taak
        toe.
      </p>

      {/* Add block form */}
      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-zinc-500">Modus</label>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as "block" | "allow")}
            className="rounded border border-zinc-200 bg-transparent px-2 py-1.5 text-sm dark:border-zinc-700"
          >
            <option value="block">Blokkeer taak</option>
            <option value="allow">Alleen deze taak</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-zinc-500">Instructeur</label>
          <select
            value={personId}
            onChange={(e) => setPersonId(e.target.value)}
            className="rounded border border-zinc-200 bg-transparent px-2 py-1.5 text-sm dark:border-zinc-700"
          >
            <option value="">— kies —</option>
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name || p.id}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-zinc-500">Taak</label>
          <select
            value={taskId}
            onChange={(e) => setTaskId(e.target.value)}
            className="rounded border border-zinc-200 bg-transparent px-2 py-1.5 text-sm dark:border-zinc-700"
          >
            <option value="">— kies —</option>
            {tasks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name || t.id}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-zinc-500">Dag (optioneel)</label>
          <select
            value={day}
            onChange={(e) => setDay(e.target.value)}
            className="rounded border border-zinc-200 bg-transparent px-2 py-1.5 text-sm dark:border-zinc-700"
          >
            <option value="">Alle dagen</option>
            {config.days.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={addBlock}
          disabled={!personId || !taskId}
          className="rounded-lg bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Toevoegen
        </button>
      </div>

      {/* Current blocks */}
      {blocks.length === 0 ? (
        <p className="text-sm text-zinc-400">
          Nog geen blokkades ingesteld.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
              <tr>
                <th className="px-4 py-2">Instructeur</th>
                <th className="px-4 py-2">Geblokkeerde taak</th>
                <th className="px-4 py-2">Dag</th>
                <th className="w-16 px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {blocks.map(([pid, tid, d], i) => (
                <tr
                  key={i}
                  className="border-b border-zinc-100 dark:border-zinc-800"
                >
                  <td className="px-4 py-2">
                    {people.find((p) => p.id === pid)?.name || pid}
                  </td>
                  <td className="px-4 py-2">
                    {tasks.find((t) => t.id === tid)?.name || tid}
                  </td>
                  <td className="px-4 py-2">{d || "Alle dagen"}</td>
                  <td className="px-4 py-2 text-center">
                    <button
                      onClick={() => removeBlock(i)}
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
      )}

      {/* Summary of effective restrictions */}
      {grouped.length > 0 && (
        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <h3 className="mb-2 text-sm font-semibold text-zinc-600 dark:text-zinc-400">
            Samenvatting
          </h3>
          <ul className="space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
            {grouped.map((g, i) => (
              <li key={i}>
                <span className="font-medium text-foreground">
                  {g.personName}
                </span>{" "}
                → geblokkeerd van{" "}
                <span className="font-medium">{g.taskNames.join(", ")}</span>
                {g.day ? ` op ${g.day}` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function blockKey(b: [string, string, string]) {
  return `${b[0]}:${b[1]}:${b[2]}`;
}

function prev_blocks_key(blocks: [string, string, string][]) {
  return new Set(blocks.map(blockKey));
}

interface BlockGroup {
  personId: string;
  personName: string;
  taskNames: string[];
  day: string;
}

function groupBlocks(
  blocks: [string, string, string][],
  people: { id: string; name: string }[],
  tasks: { id: string; name: string }[],
  _days: string[],
): BlockGroup[] {
  const map = new Map<string, { personId: string; personName: string; taskIds: string[]; day: string }>();

  for (const [pid, tid, d] of blocks) {
    const key = `${pid}:${d}`;
    if (!map.has(key)) {
      const p = people.find((p) => p.id === pid);
      map.set(key, {
        personId: pid,
        personName: p?.name || pid,
        taskIds: [],
        day: d,
      });
    }
    map.get(key)!.taskIds.push(tid);
  }

  return Array.from(map.values()).map((g) => ({
    personId: g.personId,
    personName: g.personName,
    taskNames: g.taskIds.map(
      (tid) => tasks.find((t) => t.id === tid)?.name || tid,
    ),
    day: g.day,
  }));
}
