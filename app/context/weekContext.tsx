"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";
const ACTIVE_WEEK_KEY = "active-week-id";

export interface Week {
  id: number;
  name: string;
  year: number;
  created_at: string;
  updated_at: string;
}

interface WeekContextValue {
  weeks: Week[];
  activeWeekId: number | null;
  activeWeek: Week | null;
  loading: boolean;
  error: string | null;
  refreshWeeks: () => Promise<void>;
  selectWeek: (id: number | null) => void;
  createWeek: (name: string, year?: number) => Promise<Week | null>;
  deleteWeek: (id: number) => Promise<void>;
}

const WeekContext = createContext<WeekContextValue | null>(null);

export function WeekProvider({ children }: { children: React.ReactNode }) {
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [activeWeekId, setActiveWeekId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectWeek = useCallback((id: number | null) => {
    setActiveWeekId(id);
    try {
      if (id === null) localStorage.removeItem(ACTIVE_WEEK_KEY);
      else localStorage.setItem(ACTIVE_WEEK_KEY, String(id));
    } catch {
      // storage unavailable — ignore
    }
  }, []);

  const refreshWeeks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/weeks`);
      if (!res.ok) throw new Error(`Kon weken niet laden (${res.status})`);
      const data = (await res.json()) as Week[];
      setWeeks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kon weken niet laden");
    } finally {
      setLoading(false);
    }
  }, []);

  const createWeek = useCallback(
    async (name: string, year?: number): Promise<Week | null> => {
      setError(null);
      try {
        const res = await fetch(`${API_URL}/weeks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, year }),
        });
        if (!res.ok) throw new Error(`Kon week niet aanmaken (${res.status})`);
        const week = (await res.json()) as Week;
        await refreshWeeks();
        selectWeek(week.id);
        return week;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Kon week niet aanmaken");
        return null;
      }
    },
    [refreshWeeks, selectWeek],
  );

  const deleteWeek = useCallback(
    async (id: number) => {
      setError(null);
      try {
        const res = await fetch(`${API_URL}/weeks/${id}`, { method: "DELETE" });
        if (!res.ok && res.status !== 204)
          throw new Error(`Kon week niet verwijderen (${res.status})`);
        if (activeWeekId === id) selectWeek(null);
        await refreshWeeks();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Kon week niet verwijderen");
      }
    },
    [activeWeekId, refreshWeeks, selectWeek],
  );

  // Restore the previously selected week, then load the list once on mount.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(ACTIVE_WEEK_KEY);
      if (stored) setActiveWeekId(Number(stored));
    } catch {
      // ignore
    }
    void refreshWeeks();
  }, [refreshWeeks]);

  const activeWeek = weeks.find((w) => w.id === activeWeekId) ?? null;

  return (
    <WeekContext.Provider
      value={{
        weeks,
        activeWeekId,
        activeWeek,
        loading,
        error,
        refreshWeeks,
        selectWeek,
        createWeek,
        deleteWeek,
      }}
    >
      {children}
    </WeekContext.Provider>
  );
}

export function useWeek() {
  const ctx = useContext(WeekContext);
  if (!ctx) throw new Error("useWeek must be used within a WeekProvider");
  return ctx;
}
