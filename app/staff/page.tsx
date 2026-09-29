"use client";

import { useCallback, useEffect, useState } from "react";
import { useWeek } from "../context/weekContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

interface StaffMember {
  id: number;
  week_id: number;
  name: string;
  sex: string;
  discipline: string;
  cwo: number;
  transport_capacity: number;
  cover_capacity: number;
  active: boolean;
}

export default function StaffPage() {
  const { activeWeekId, activeWeek, weeks } = useWeek();
  const [rows, setRows] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copyFrom, setCopyFrom] = useState<string>("");

  const load = useCallback(async () => {
    if (activeWeekId === null) {
      setRows([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/weeks/${activeWeekId}/staff`);
      if (!res.ok) throw new Error(`Kon staf niet laden (${res.status})`);
      setRows((await res.json()) as StaffMember[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kon staf niet laden");
    } finally {
      setLoading(false);
    }
  }, [activeWeekId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function addRow() {
    if (activeWeekId === null) return;
    const res = await fetch(`${API_URL}/weeks/${activeWeekId}/staff`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "" }),
    });
    if (res.ok) {
      const created = (await res.json()) as StaffMember;
      setRows((prev) => [...prev, created]);
    }
  }

  function setLocal(id: number, patch: Partial<StaffMember>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  async function persist(id: number, patch: Partial<StaffMember>) {
    if (activeWeekId === null) return;
    const res = await fetch(`${API_URL}/weeks/${activeWeekId}/staff/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.ok) {
      const updated = (await res.json()) as StaffMember;
      setRows((prev) => prev.map((r) => (r.id === id ? updated : r)));
    }
  }

  async function removeRow(id: number) {
    if (activeWeekId === null) return;
    const res = await fetch(`${API_URL}/weeks/${activeWeekId}/staff/${id}`, {
      method: "DELETE",
    });
    if (res.ok || res.status === 204)
      setRows((prev) => prev.filter((r) => r.id !== id));
  }

  async function handleCopyFrom() {
    if (activeWeekId === null || !copyFrom) return;
    setLoading(true);
    const res = await fetch(
      `${API_URL}/weeks/${activeWeekId}/staff/copy-from/${copyFrom}`,
      { method: "POST" },
    );
    setLoading(false);
    if (res.ok) {
      setRows((await res.json()) as StaffMember[]);
      setCopyFrom("");
    }
  }

  if (activeWeekId === null) {
    return (
      <div className="rounded-lg border border-zinc-200 p-8 text-center text-zinc-500 dark:border-zinc-800">
        Selecteer of maak eerst een week aan (rechtsboven).
      </div>
    );
  }

  const numInput =
    "w-16 rounded border border-zinc-200 bg-transparent px-2 py-1 text-sm dark:border-zinc-700";

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Staff</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Stafleden voor week <strong>{activeWeek?.name}</strong>. Deze lijst
          wordt gebruikt door de Banaan- en Roostertools.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={addRow}
          className="rounded-lg bg-garijp-blue px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          + Staflid
        </button>
        <div className="flex items-center gap-2">
          <select
            value={copyFrom}
            onChange={(e) => setCopyFrom(e.target.value)}
            className="rounded border border-zinc-300 bg-transparent px-2 py-1.5 text-sm dark:border-zinc-700"
          >
            <option value="">Kopieer staf uit week…</option>
            {weeks
              .filter((w) => w.id !== activeWeekId)
              .map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.year})
                </option>
              ))}
          </select>
          <button
            onClick={handleCopyFrom}
            disabled={!copyFrom}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Kopieer
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
            <tr>
              <th className="px-4 py-2">Naam</th>
              <th className="px-2 py-2">Geslacht</th>
              <th className="px-2 py-2">Discipline</th>
              <th className="px-2 py-2 text-center">CWO voorkeur</th>
              <th className="px-2 py-2 text-center">Transport</th>
              <th className="px-2 py-2 text-center">Cover</th>
              <th className="px-2 py-2 text-center">Actief</th>
              <th className="w-12 px-2 py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && !loading && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-zinc-400">
                  Nog geen stafleden. Voeg er een toe of kopieer uit een andere
                  week.
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
                    value={r.name}
                    onChange={(e) => setLocal(r.id, { name: e.target.value })}
                    onBlur={(e) => persist(r.id, { name: e.target.value })}
                    placeholder="Naam"
                    className="w-full rounded border border-zinc-200 bg-transparent px-2 py-1 text-sm dark:border-zinc-700"
                  />
                </td>
                <td className="px-2 py-1.5">
                  <select
                    value={r.sex}
                    onChange={(e) => persist(r.id, { sex: e.target.value })}
                    className="rounded border border-zinc-200 bg-transparent px-2 py-1 text-sm dark:border-zinc-700"
                  >
                    <option value="">—</option>
                    <option value="M">M</option>
                    <option value="F">F</option>
                  </select>
                </td>
                <td className="px-2 py-1.5">
                  <select
                    value={r.discipline}
                    onChange={(e) => persist(r.id, { discipline: e.target.value })}
                    className="rounded border border-zinc-200 bg-transparent px-2 py-1 text-sm dark:border-zinc-700"
                  >
                    <option value="wal">—</option>
                    <option value="opti">Optimist</option>
                    <option value="laerling">Laerling</option>
                    <option value="valk">Valk</option>
                    <option value="tirion">Tirion</option>
                    <option value="zb">Zwaardboot</option>
                    <option value="cat">Catamaran</option>
                    <option value="surf">Windsurf</option>
                    <option value="wingfoil">Wingfoil</option>
                  </select>
                </td>
                <td className="px-2 py-1.5 text-center">
                  <input
                    type="number"
                    value={r.cwo}
                    onChange={(e) =>
                      setLocal(r.id, { cwo: Number(e.target.value) })
                    }
                    onBlur={(e) =>
                      persist(r.id, { cwo: Number(e.target.value) })
                    }
                    className={numInput}
                  />
                </td>
                <td className="px-2 py-1.5 text-center">
                  <input
                    type="number"
                    value={r.transport_capacity}
                    onChange={(e) =>
                      setLocal(r.id, {
                        transport_capacity: Number(e.target.value),
                      })
                    }
                    onBlur={(e) =>
                      persist(r.id, {
                        transport_capacity: Number(e.target.value),
                      })
                    }
                    className={numInput}
                  />
                </td>
                <td className="px-2 py-1.5 text-center">
                  <input
                    type="number"
                    value={r.cover_capacity}
                    onChange={(e) =>
                      setLocal(r.id, {
                        cover_capacity: Number(e.target.value),
                      })
                    }
                    onBlur={(e) =>
                      persist(r.id, { cover_capacity: Number(e.target.value) })
                    }
                    className={numInput}
                  />
                </td>
                <td className="px-2 py-1.5 text-center">
                  <input
                    type="checkbox"
                    checked={r.active}
                    onChange={(e) => persist(r.id, { active: e.target.checked })}
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
