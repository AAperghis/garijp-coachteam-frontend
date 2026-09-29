"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

// Mirrors backend/disciplines.json (served by GET /disciplines).
export interface DisciplineGroup {
  label: string;
  phase: number | null;
  instructs?: boolean;
  covered_by: string[];
}

export interface Discipline {
  label: string;
  group: string;
  transport_capacity: number;
  cover_capacity: number;
  for_cursists?: boolean;
  for_staff?: boolean;
}

export interface DisciplineRegistry {
  groups: Record<string, DisciplineGroup>;
  disciplines: Record<string, Discipline>;
  aliases: Record<string, string>;
}

interface DisciplineContextValue {
  registry: DisciplineRegistry | null;
  loading: boolean;
  error: string | null;
  /** Detailed disciplines in config order, filtered to those valid for cursists and/or staff. */
  options: (opts?: { forCursists?: boolean; forStaff?: boolean }) => { key: string; label: string; group: string }[];
  /** Canonical key for any spelling (alias-resolved, lower-cased). */
  resolve: (raw: string) => string;
  /** Human label for a discipline or group key; falls back to the key itself. */
  labelOf: (raw: string) => string;
  /** Simplified group key (what Banaan/Rooster reason about). */
  groupOf: (raw: string) => string;
  capacitiesOf: (raw: string) => { transport: number; cover: number } | null;
}

const DisciplineContext = createContext<DisciplineContextValue | null>(null);

export function DisciplineProvider({ children }: { children: React.ReactNode }) {
  const [registry, setRegistry] = useState<DisciplineRegistry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_URL}/disciplines`)
      .then((res) => {
        if (!res.ok) throw new Error(`Kon disciplines niet laden (${res.status})`);
        return res.json() as Promise<DisciplineRegistry>;
      })
      .then((data) => {
        if (!cancelled) setRegistry(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Kon disciplines niet laden");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<DisciplineContextValue>(() => {
    const resolve = (raw: string) => {
      const low = raw.trim().toLowerCase();
      return registry?.aliases[low] ?? low;
    };
    const groupOf = (raw: string) => {
      const key = resolve(raw);
      return registry?.disciplines[key]?.group ?? key;
    };
    const labelOf = (raw: string) => {
      const key = resolve(raw);
      return registry?.disciplines[key]?.label ?? registry?.groups[key]?.label ?? raw;
    };
    const capacitiesOf = (raw: string) => {
      const d = registry?.disciplines[resolve(raw)];
      return d ? { transport: d.transport_capacity, cover: d.cover_capacity } : null;
    };
    const options = (opts?: { forCursists?: boolean; forStaff?: boolean }) =>
      Object.entries(registry?.disciplines ?? {})
        .filter(([, d]) => !opts?.forCursists || d.for_cursists !== false)
        .filter(([, d]) => !opts?.forStaff || d.for_staff !== false)
        .map(([key, d]) => ({ key, label: d.label, group: d.group }));
    return { registry, loading, error, options, resolve, labelOf, groupOf, capacitiesOf };
  }, [registry, loading, error]);

  return <DisciplineContext.Provider value={value}>{children}</DisciplineContext.Provider>;
}

export function useDisciplines() {
  const ctx = useContext(DisciplineContext);
  if (!ctx) throw new Error("useDisciplines must be used within a DisciplineProvider");
  return ctx;
}
