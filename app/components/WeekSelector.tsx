"use client";

import { useState } from "react";
import { useWeek } from "../context/weekContext";

export function WeekSelector() {
  const { weeks, activeWeekId, selectWeek, createWeek, loading } = useWeek();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleCreate() {
    const trimmed = name.trim();
    if (!trimmed) return;
    setBusy(true);
    const week = await createWeek(trimmed);
    setBusy(false);
    if (week) {
      setName("");
      setCreating(false);
    }
  }

  if (creating) {
    return (
      <div className="flex items-center gap-2">
        <input
          autoFocus
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void handleCreate();
            if (e.key === "Escape") setCreating(false);
          }}
          placeholder="Naam van de week"
          className="w-40 rounded border border-white/30 bg-white/10 px-2 py-1 text-sm text-white placeholder:text-white/50"
        />
        <button
          onClick={() => void handleCreate()}
          disabled={busy}
          className="rounded bg-white px-2 py-1 text-sm font-medium text-garijp-blue hover:bg-white/90 disabled:opacity-50"
        >
          {busy ? "…" : "Opslaan"}
        </button>
        <button
          onClick={() => setCreating(false)}
          className="text-sm text-white/70 hover:text-white"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={activeWeekId ?? ""}
        onChange={(e) =>
          selectWeek(e.target.value ? Number(e.target.value) : null)
        }
        disabled={loading}
        className="rounded border border-white/30 bg-white/10 px-2 py-1 text-sm text-white [&>option]:text-black"
      >
        <option value="">Geen week</option>
        {weeks.map((w) => (
          <option key={w.id} value={w.id}>
            {w.name} ({w.year})
          </option>
        ))}
      </select>
      <button
        onClick={() => setCreating(true)}
        title="Nieuwe week"
        className="rounded bg-white/10 px-2 py-1 text-sm text-white hover:bg-white/20"
      >
        + Week
      </button>
    </div>
  );
}
