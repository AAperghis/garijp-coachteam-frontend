"use client";

import { useRef, useState } from "react";
import { useRoster } from "./context";
import type { PersonInput } from "../types";

let nextId = 1;
function makePersonId() {
  return `p_${Date.now()}_${nextId++}`;
}

export default function InstructorsTab() {
  const { people, setPeople, tasks, config, setConfig, loading } = useRoster();
  const fileRef = useRef<HTMLInputElement>(null);
  const [blockDay, setBlockDay] = useState("");

  function addPerson() {
    setPeople((prev) => [
      ...prev,
      { id: makePersonId(), name: "", editable: true, task_weights: {} },
    ]);
  }

  function updatePerson(index: number, patch: Partial<PersonInput>) {
    setPeople((prev) =>
      prev.map((p, i) => (i === index ? { ...p, ...patch } : p)),
    );
  }

  function updateWeight(personIndex: number, taskId: string, value: number) {
    setPeople((prev) =>
      prev.map((p, i) =>
        i === personIndex
          ? { ...p, task_weights: { ...p.task_weights, [taskId]: value } }
          : p,
      ),
    );
  }

  function removePerson(index: number) {
    setPeople((prev) => prev.filter((_, i) => i !== index));
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const lines = text.split("\n").filter((l) => l.trim());
      if (lines.length < 2) return;

      const headers = lines[0].split(",").map((h) => h.trim());
      const nameIdx = headers.findIndex(
        (h) => h.toLowerCase() === "name" || h.toLowerCase() === "naam",
      );
      const idIdx = headers.findIndex((h) => h.toLowerCase() === "id");

      const taskHeaders = headers.filter(
        (_, i) => i !== nameIdx && i !== idIdx,
      );

      const parsed: PersonInput[] = [];
      for (let r = 1; r < lines.length; r++) {
        const cols = lines[r].split(",").map((c) => c.trim());
        if (!cols[nameIdx ?? 0]) continue;

        const weights: Record<string, number> = {};
        for (const th of taskHeaders) {
          const ci = headers.indexOf(th);
          const val = parseFloat(cols[ci]);
          if (!isNaN(val)) weights[th] = val;
        }

        parsed.push({
          id: idIdx >= 0 ? cols[idIdx] : makePersonId(),
          name: cols[nameIdx >= 0 ? nameIdx : 0],
          task_weights: weights,
        });
      }

      if (parsed.length > 0) setPeople(parsed);
    };
    reader.readAsText(file);
    // reset so same file can be re-uploaded
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Upload bar */}
      <div className="flex items-center gap-3">
        <label className="cursor-pointer rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300">
          {loading ? "Uploading…" : "Upload CSV / XLSX"}
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.xlsx"
            onChange={handleFileUpload}
            className="hidden"
            disabled={loading}
          />
        </label>
        <span className="text-xs text-zinc-500">
          of bewerk de tabel hieronder
        </span>
      </div>

      {/* Editable table */}
      <div>
        <h2 className="text-lg font-semibold">Staf en taak voorkeur</h2>
        <p className="mt-1 text-sm text-zinc-500">
        Vul hier de lijst aan staf in samen met een voorkeur voor bepaalde taken. De optimalisatie zal er voor zorgen dat mensen zoveel mogelijk taken krijgen waar ze een hoge voorkeur voor hebben, maar zal ook rekening houden met de totale verdeling van taken over de staf. De voorkeuren zijn optioneel, je kunt ook alleen een lijst met namen invullen.
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
              <th className="w-16 px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {people.length === 0 && (
              <tr>
                <td
                  colSpan={tasks.length + 2}
                  className="px-4 py-6 text-center text-zinc-400"
                >
                  Nog geen instructeurs. Upload een bestand of voeg er een toe.
                </td>
              </tr>
            )}
            {people.map((person, pi) => (
              <tr
                key={person.id}
                className="border-b border-zinc-100 dark:border-zinc-800"
              >
                <td className="px-4 py-1.5">
                  <input
                    type="text"
                    value={person.name}
                    onChange={(e) =>
                      updatePerson(pi, { name: e.target.value })
                    }
                    placeholder="Naam"
                    className="w-full rounded border border-zinc-200 bg-transparent px-2 py-1 text-sm dark:border-zinc-700"
                  />
                </td>
                {tasks.map((t) => (
                  <td key={t.id} className="px-2 py-1.5">
                    {person.editable ? (
                      <input
                        type="number"
                        min={0}
                        max={10}
                        value={person.task_weights[t.id] ?? 0}
                        onChange={(e) =>
                          updateWeight(pi, t.id, parseFloat(e.target.value) || 0)
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
                <td className="px-4 py-1.5 text-center">
                  <button
                    onClick={() => removePerson(pi)}
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
        onClick={addPerson}
        className="self-start rounded-lg border border-dashed border-zinc-300 px-4 py-2 text-sm text-zinc-500 transition-colors hover:border-zinc-500 hover:text-zinc-700 dark:border-zinc-700 dark:hover:border-zinc-500 dark:hover:text-zinc-300"
      >
        + Instructeur toevoegen
      </button>

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
