"use client";

import { useCallback, useEffect, useState } from "react";
import { useWeek } from "../context/weekContext";
import { useDisciplines } from "../context/disciplineContext";
import DisciplineSelect from "../components/DisciplineSelect";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

interface Cursist {
  id: number;
  week_id: number;
  first_name: string;
  surname: string;
  age: number;
  discipline: string;
  cwo: number;
  instructor: string;
  wants_banana: boolean;
  friends: string[];
}

interface StaffMember {
  id: number;
  name: string;
  discipline: string;
  active: boolean;
}

export default function CursistenPage() {
  const { activeWeekId, activeWeek } = useWeek();
  const { groupOf } = useDisciplines();
  const [rows, setRows] = useState<Cursist[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (activeWeekId === null) {
      setRows([]);
      setStaff([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [cursistsRes, staffRes] = await Promise.all([
        fetch(`${API_URL}/weeks/${activeWeekId}/cursists`),
        fetch(`${API_URL}/weeks/${activeWeekId}/staff`),
      ]);
      if (!cursistsRes.ok) throw new Error(`Kon cursisten niet laden (${cursistsRes.status})`);
      if (!staffRes.ok) throw new Error(`Kon staf niet laden (${staffRes.status})`);
      setRows((await cursistsRes.json()) as Cursist[]);
      setStaff((await staffRes.json()) as StaffMember[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kon cursisten niet laden");
    } finally {
      setLoading(false);
    }
  }, [activeWeekId]);

  // Active staff whose simplified group matches the cursist's (e.g. opti + laerling both -> jz).
  function instructorsFor(discipline: string): StaffMember[] {
    if (!discipline) return staff.filter((s) => s.active);
    const group = groupOf(discipline);
    return staff.filter((s) => s.active && groupOf(s.discipline) === group);
  }

  useEffect(() => {
    void load();
  }, [load]);

  async function addRow() {
    if (activeWeekId === null) return;
    const res = await fetch(`${API_URL}/weeks/${activeWeekId}/cursists`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ first_name: "" }),
    });
    if (res.ok) {
      const created = (await res.json()) as Cursist;
      setRows((prev) => [...prev, created]);
    }
  }

  function setLocal(id: number, patch: Partial<Cursist>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  async function persist(id: number, patch: Partial<Cursist>) {
    if (activeWeekId === null) return;
    const res = await fetch(`${API_URL}/weeks/${activeWeekId}/cursists/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.ok) {
      const updated = (await res.json()) as Cursist;
      setRows((prev) => prev.map((r) => (r.id === id ? updated : r)));
    }
  }

  async function removeRow(id: number) {
    if (activeWeekId === null) return;
    const res = await fetch(`${API_URL}/weeks/${activeWeekId}/cursists/${id}`, {
      method: "DELETE",
    });
    if (res.ok || res.status === 204)
      setRows((prev) => prev.filter((r) => r.id !== id));
  }

  if (activeWeekId === null) {
    return (
      <div className="rounded-lg border border-zinc-200 p-8 text-center text-zinc-500 dark:border-zinc-800">
        Selecteer of maak eerst een week aan (rechtsboven).
      </div>
    );
  }

  const textInput =
    "w-full rounded border border-zinc-200 bg-transparent px-2 py-1 text-sm dark:border-zinc-700";
  const numInput =
    "w-16 rounded border border-zinc-200 bg-transparent px-2 py-1 text-sm dark:border-zinc-700";

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Cursisten</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Cursisten voor week <strong>{activeWeek?.name}</strong>.
        </p>
        <p className="mt-1 text-xs text-amber-600 dark:text-amber-500">
          Persoonsgegevens van minderjarigen. Vul alleen het hoognodige in;
          achternaam is optioneel. Deze gegevens worden na het seizoen
          (oktober) automatisch verwijderd.
        </p>
      </div>

      <div>
        <button
          onClick={addRow}
          className="rounded-lg bg-garijp-blue px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          + Cursist
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
            <tr>
              <th className="px-4 py-2">Voornaam</th>
              <th className="px-2 py-2">Achternaam</th>
              <th className="px-2 py-2 text-center">Leeftijd</th>
              <th className="px-2 py-2">Discipline</th>
              <th className="px-2 py-2 text-center">CWO</th>
              <th className="px-2 py-2">Instructeur</th>
              <th className="px-2 py-2 text-center">Banaan</th>
              <th className="px-2 py-2">Vrienden</th>
              <th className="w-12 px-2 py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && !loading && (
              <tr>
                <td colSpan={9} className="px-4 py-6 text-center text-zinc-400">
                  Nog geen cursisten. Voeg er een toe.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr
                key={r.id}
                className="border-b border-zinc-100 dark:border-zinc-800"
              >
                <td className="px-4 py-1.5">
                  <input
                    type="text"
                    value={r.first_name}
                    onChange={(e) =>
                      setLocal(r.id, { first_name: e.target.value })
                    }
                    onBlur={(e) => persist(r.id, { first_name: e.target.value })}
                    placeholder="Voornaam"
                    className={textInput}
                  />
                </td>
                <td className="px-2 py-1.5">
                  <input
                    type="text"
                    value={r.surname}
                    onChange={(e) =>
                      setLocal(r.id, { surname: e.target.value })
                    }
                    onBlur={(e) => persist(r.id, { surname: e.target.value })}
                    placeholder="optioneel"
                    className={textInput}
                  />
                </td>
                <td className="px-2 py-1.5 text-center">
                  <input
                    type="number"
                    value={r.age}
                    onChange={(e) =>
                      setLocal(r.id, { age: Number(e.target.value) })
                    }
                    onBlur={(e) => persist(r.id, { age: Number(e.target.value) })}
                    className={numInput}
                  />
                </td>
                <td className="px-2 py-1.5">
                  <DisciplineSelect
                    value={r.discipline}
                    onChange={(v) => persist(r.id, { discipline: v })}
                    forCursists
                  />
                </td>
                <td className="px-2 py-1.5 text-center">
                  <input
                    type="number"
                    value={r.cwo}
                    onChange={(e) =>
                      setLocal(r.id, { cwo: Number(e.target.value) })
                    }
                    onBlur={(e) => persist(r.id, { cwo: Number(e.target.value) })}
                    className={numInput}
                  />
                </td>
                <td className="px-2 py-1.5">
                  {(() => {
                    const options = instructorsFor(r.discipline);
                    // Keep a stale/foreign name selectable so it isn't silently dropped.
                    const unknown =
                      r.instructor && !options.some((s) => s.name === r.instructor);
                    return (
                      <select
                        value={r.instructor}
                        onChange={(e) => persist(r.id, { instructor: e.target.value })}
                        className={textInput}
                      >
                        <option value="">—</option>
                        {unknown && (
                          <option value={r.instructor}>{r.instructor} (?)</option>
                        )}
                        {options.map((s) => (
                          <option key={s.id} value={s.name}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    );
                  })()}
                </td>
                <td className="px-2 py-1.5 text-center">
                  <input
                    type="checkbox"
                    checked={r.wants_banana}
                    onChange={(e) =>
                      persist(r.id, { wants_banana: e.target.checked })
                    }
                  />
                </td>
                <td className="px-2 py-1.5">
                  <input
                    type="text"
                    value={r.friends.join(", ")}
                    onChange={(e) =>
                      setLocal(r.id, {
                        friends: e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      })
                    }
                    onBlur={(e) =>
                      persist(r.id, {
                        friends: e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      })
                    }
                    placeholder="komma-gescheiden"
                    className={textInput}
                  />
                </td>
                <td className="px-2 py-1.5 text-center">
                  <button
                    onClick={() => removeRow(r.id)}
                    title="Verwijderen"
                    className="text-zinc-400 hover:text-red-600"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
