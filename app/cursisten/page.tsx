"use client";

import { useCallback, useEffect, useState } from "react";
import { useWeek } from "../context/weekContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

interface Student {
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

export default function CursistenPage() {
  const { activeWeekId, activeWeek } = useWeek();
  const [rows, setRows] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (activeWeekId === null) {
      setRows([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/weeks/${activeWeekId}/students`);
      if (!res.ok) throw new Error(`Kon cursisten niet laden (${res.status})`);
      setRows((await res.json()) as Student[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kon cursisten niet laden");
    } finally {
      setLoading(false);
    }
  }, [activeWeekId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function addRow() {
    if (activeWeekId === null) return;
    const res = await fetch(`${API_URL}/weeks/${activeWeekId}/students`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ first_name: "" }),
    });
    if (res.ok) {
      const created = (await res.json()) as Student;
      setRows((prev) => [...prev, created]);
    }
  }

  function setLocal(id: number, patch: Partial<Student>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  async function persist(id: number, patch: Partial<Student>) {
    if (activeWeekId === null) return;
    const res = await fetch(`${API_URL}/weeks/${activeWeekId}/students/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.ok) {
      const updated = (await res.json()) as Student;
      setRows((prev) => prev.map((r) => (r.id === id ? updated : r)));
    }
  }

  async function removeRow(id: number) {
    if (activeWeekId === null) return;
    const res = await fetch(`${API_URL}/weeks/${activeWeekId}/students/${id}`, {
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
                  <input
                    type="text"
                    value={r.discipline}
                    onChange={(e) =>
                      setLocal(r.id, { discipline: e.target.value })
                    }
                    onBlur={(e) =>
                      persist(r.id, { discipline: e.target.value })
                    }
                    placeholder="bv. jz"
                    className="w-24 rounded border border-zinc-200 bg-transparent px-2 py-1 text-sm dark:border-zinc-700"
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
                  <input
                    type="text"
                    value={r.instructor}
                    onChange={(e) =>
                      setLocal(r.id, { instructor: e.target.value })
                    }
                    onBlur={(e) =>
                      persist(r.id, { instructor: e.target.value })
                    }
                    placeholder="Naam"
                    className={textInput}
                  />
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
