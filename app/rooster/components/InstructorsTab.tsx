"use client";

import Link from "next/link";
import { useState } from "react";
import { useRoster } from "./context";

export default function InstructorsTab() {
  const { people, setTaskWeight, refreshStaff, tasks, config, setConfig, loading } = useRoster();
  const [blockDay, setBlockDay] = useState("");

  return (
    <div className="flex flex-col gap-4">
      {/* Source bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-zinc-200 px-4 py-2 text-sm dark:border-zinc-800">
        <span className="text-zinc-500">
          Instructeurs komen uit de staflijst van de geselecteerde week.
        </span>
        <Link href="/staff" className="text-zinc-700 underline-offset-2 hover:underline dark:text-zinc-300">
          Staf beheren →
        </Link>
        <button
          onClick={() => void refreshStaff()}
          disabled={loading}
          className="ml-auto text-zinc-500 hover:text-zinc-900 disabled:opacity-50 dark:hover:text-zinc-100"
        >
          {loading ? "Laden…" : "Vernieuwen"}
        </button>
      </div>

      {/* Editable table */}
      <div>
        <h2 className="text-lg font-semibold">Staf en taak voorkeur</h2>
        <p className="mt-1 text-sm text-zinc-500">
        Vul hier per staflid een voorkeur voor bepaalde taken in. De optimalisatie zal er voor zorgen dat mensen zoveel mogelijk taken krijgen waar ze een hoge voorkeur voor hebben, maar zal ook rekening houden met de totale verdeling van taken over de staf. De voorkeuren zijn optioneel.
        </p>
      </div>
      <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">


        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
            <tr>
              <th className="px-4 py-2">Naam</th>
              {tasks.map((t) => (
                <th key={t.id} className="w-20 px-2 py-2 text-center">
                  {t.name || t.id}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {people.length === 0 && (
              <tr>
                <td
                  colSpan={tasks.length + 1}
                  className="px-4 py-6 text-center text-zinc-400"
                >
                  Nog geen instructeurs. Voeg stafleden toe op de Staff-pagina.
                </td>
              </tr>
            )}
            {people.map((person) => (
              <tr
                key={person.id}
                className="border-b border-zinc-100 dark:border-zinc-800"
              >
                <td className="px-4 py-1.5">{person.name || person.id}</td>
                {tasks.map((t) => (
                  <td key={t.id} className="px-2 py-1.5">
                    {person.editable ? (
                      <input
                        type="number"
                        min={-10}
                        max={10}
                        value={person.task_weights[t.id] ?? 0}
                        onChange={(e) =>
                          setTaskWeight(person.id, t.id, parseFloat(e.target.value) || 0)
                        }
                        className="w-full rounded border border-zinc-200 bg-transparent px-1 py-1 text-center text-sm dark:border-zinc-700"
                      />
                    ) : (
                      <span className="block w-full text-center text-sm text-zinc-500">
                        {person.task_weights[t.id] ?? 0}
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Blocks matrix */}
      {people.length > 0 && tasks.length > 0 && (
        <BlocksMatrix
          people={people}
          tasks={tasks}
          config={config}
          setConfig={setConfig}
          blockDay={blockDay}
          setBlockDay={setBlockDay}
        />
      )}
    </div>
  );
}

/* ── Blocks matrix (person × task, per day) ── */

function BlocksMatrix({
  people,
  tasks,
  config,
  setConfig,
  blockDay,
  setBlockDay,
}: {
  people: { id: string; name: string }[];
  tasks: { id: string; name: string }[];
  config: import("../types").RosterConfig;
  setConfig: React.Dispatch<React.SetStateAction<import("../types").RosterConfig>>;
  blockDay: string;
  setBlockDay: (d: string) => void;
}) {
  function isBlocked(personId: string, taskId: string, day: string) {
    return config.task_blocks.some(
      ([p, t, d2]) => p === personId && t === taskId && d2 === day,
    );
  }

  function toggleBlock(personId: string, taskId: string) {
    const direct = isBlocked(personId, taskId, blockDay);
    const inherited =
      blockDay !== "" && isBlocked(personId, taskId, "");

    if (inherited && !direct) {
      // Unchecking an inherited "all days" block → remove the all-days entry
      setConfig((prev) => ({
        ...prev,
        task_blocks: prev.task_blocks.filter(
          ([p, t, d]) => !(p === personId && t === taskId && d === ""),
        ),
      }));
    } else if (direct) {
      setConfig((prev) => ({
        ...prev,
        task_blocks: prev.task_blocks.filter(
          ([p, t, d]) => !(p === personId && t === taskId && d === blockDay),
        ),
      }));
    } else {
      setConfig((prev) => ({
        ...prev,
        task_blocks: [...prev.task_blocks, [personId, taskId, blockDay]],
      }));
    }
  }

  function togglePersonRow(personId: string) {
    const toggleable =
      blockDay === ""
        ? tasks
        : tasks.filter((t) => !isBlocked(personId, t.id, ""));
    const allBlocked =
      toggleable.length > 0 &&
      toggleable.every((t) => isBlocked(personId, t.id, blockDay));

    if (allBlocked) {
      setConfig((prev) => ({
        ...prev,
        task_blocks: prev.task_blocks.filter(
          ([p, , d]) => !(p === personId && d === blockDay),
        ),
      }));
    } else {
      const existing = new Set(
        config.task_blocks
          .filter(([p, , d]) => p === personId && d === blockDay)
          .map(([, t]) => t),
      );
      const newBlocks: [string, string, string][] = toggleable
        .filter((t) => !existing.has(t.id))
        .map((t) => [personId, t.id, blockDay]);
      setConfig((prev) => ({
        ...prev,
        task_blocks: [...prev.task_blocks, ...newBlocks],
      }));
    }
  }

  function toggleTaskColumn(taskId: string) {
    const toggleable =
      blockDay === ""
        ? people
        : people.filter((p) => !isBlocked(p.id, taskId, ""));
    const allBlocked =
      toggleable.length > 0 &&
      toggleable.every((p) => isBlocked(p.id, taskId, blockDay));

    if (allBlocked) {
      setConfig((prev) => ({
        ...prev,
        task_blocks: prev.task_blocks.filter(
          ([, t, d]) => !(t === taskId && d === blockDay),
        ),
      }));
    } else {
      const existing = new Set(
        config.task_blocks
          .filter(([, t, d]) => t === taskId && d === blockDay)
          .map(([p]) => p),
      );
      const newBlocks: [string, string, string][] = toggleable
        .filter((p) => !existing.has(p.id))
        .map((p) => [p.id, taskId, blockDay]);
      setConfig((prev) => ({
        ...prev,
        task_blocks: [...prev.task_blocks, ...newBlocks],
      }));
    }
  }

  const dayTabs = [
    { value: "", label: "Alle dagen" },
    ...config.days.map((d) => ({ value: d, label: d.slice(0, 2) })),
  ];

  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-lg font-semibold">Blokkades</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Vink aan om een instructeur te blokkeren van een taak. Klik op een
          naam om een hele rij of kolom te vullen.
        </p>
      </div>

      {/* Day selector */}
      <div className="flex flex-wrap gap-1">
        {dayTabs.map((dt) => (
          <button
            key={dt.value}
            onClick={() => setBlockDay(dt.value)}
            className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
              blockDay === dt.value
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
            }`}
          >
            {dt.label}
          </button>
        ))}
      </div>

      {/* Matrix */}
      <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
            <tr>
              <th className="px-3 py-2" />
              {tasks.map((t) => (
                <th
                  key={t.id}
                  className="whitespace-nowrap px-2 py-2 text-center text-xs"
                >
                  <button
                    onClick={() => toggleTaskColumn(t.id)}
                    className="font-medium hover:text-zinc-900 dark:hover:text-zinc-100"
                    title={`Alles in-/uitschakelen voor ${t.name || t.id}`}
                  >
                    {t.name || t.id}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {people.map((person) => (
              <tr
                key={person.id}
                className="border-b border-zinc-100 last:border-0 dark:border-zinc-800"
              >
                <td className="whitespace-nowrap px-3 py-1.5">
                  <button
                    onClick={() => togglePersonRow(person.id)}
                    className="text-sm font-medium hover:text-zinc-900 dark:hover:text-zinc-100"
                    title={`Alles in-/uitschakelen voor ${person.name || person.id}`}
                  >
                    {person.name || person.id}
                  </button>
                </td>
                {tasks.map((t) => {
                  const inherited =
                    blockDay !== "" && isBlocked(person.id, t.id, "");
                  const direct = isBlocked(person.id, t.id, blockDay);
                  return (
                    <td key={t.id} className="px-2 py-1.5 text-center">
                      <input
                        type="checkbox"
                        checked={direct || inherited}
                        onChange={() => toggleBlock(person.id, t.id)}
                        className={`h-4 w-4 cursor-pointer rounded border-zinc-300 accent-zinc-900 dark:border-zinc-600 dark:accent-zinc-100 ${
                          inherited && !direct ? "opacity-50" : ""
                        }`}
                        title={
                          inherited && !direct
                            ? "Geblokkeerd via 'Alle dagen' — klik om die te verwijderen"
                            : direct
                              ? "Klik om te deblokkeren"
                              : "Klik om te blokkeren"
                        }
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
