"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  PersonInput,
  TaskInput,
  RosterConfig,
  Schedule,
  Step,
} from "../types";
import { DEFAULT_TASKS, DEFAULT_CONFIG_ZOMER, FIXED_PEOPLE, WAL_ALLOWED_TASKS } from "../defaults";
import { useWeek } from "../../context/weekContext";
import { useDisciplines } from "../../context/disciplineContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";
const STORAGE_PREFIX = "rooster-state";
const SCHEMA_VERSION = 7;

// Roster person ids for week staff are prefixed so they can't clash with FIXED_PEOPLE.
export const STAFF_ID_PREFIX = "staff-";

interface StaffMember {
  id: number;
  name: string;
  sex: string;
  discipline: string;
  active: boolean;
}

// Task preferences per roster person id; roster-specific, so kept out of the staff table.
type TaskWeights = Record<string, Record<string, number>>;

interface PersistedState {
  _v?: number;
  tasks: TaskInput[];
  people: PersonInput[]; // resolved list, for the print page
  taskWeights: TaskWeights;
  walBlockedIds: string[]; // people whose default Wal blocks were applied (so manual edits stick)
  config: RosterConfig;
  schedule: Schedule | null;
  step: Step;
}

export function rosterStorageKey(weekId: number) {
  return `${STORAGE_PREFIX}-${weekId}`;
}

function loadPersistedState(weekId: number): PersistedState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(rosterStorageKey(weekId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedState;
    if (parsed._v !== SCHEMA_VERSION) {
      localStorage.removeItem(rosterStorageKey(weekId));
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function savePersistedState(weekId: number, state: PersistedState) {
  try {
    localStorage.setItem(
      rosterStorageKey(weekId),
      JSON.stringify({ ...state, _v: SCHEMA_VERSION }),
    );
  } catch {
    // ignore
  }
}

interface RosterContextValue {
  weekId: number | null;
  tasks: TaskInput[];
  people: PersonInput[];
  config: RosterConfig;
  schedule: Schedule | null;
  error: string | null;
  loading: boolean;
  step: Step;
  setTasks: React.Dispatch<React.SetStateAction<TaskInput[]>>;
  setConfig: React.Dispatch<React.SetStateAction<RosterConfig>>;
  /** Replace the config with a preset; Wal default blocks are re-applied on top. */
  applyPreset: (preset: RosterConfig) => void;
  setTaskWeight: (personId: string, taskId: string, value: number) => void;
  refreshStaff: () => Promise<void>;
  handleSolve: () => Promise<void>;
  handleDownload: () => Promise<void>;
  restoreDefaults: () => void;
  reset: () => void;
}

const RosterContext = createContext<RosterContextValue | null>(null);

export function RosterProvider({ children }: { children: React.ReactNode }) {
  const { activeWeekId: weekId } = useWeek();
  const { groupOf } = useDisciplines();

  const [tasks, setTasks] = useState<TaskInput[]>([...DEFAULT_TASKS]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [taskWeights, setTaskWeights] = useState<TaskWeights>({});
  const [walBlockedIds, setWalBlockedIds] = useState<string[]>([]);
  const [config, setConfig] = useState<RosterConfig>({ ...DEFAULT_CONFIG_ZOMER });
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<Step>("input");
  // Week whose persisted state has been restored; guards against saving during load.
  const loadedWeekRef = useRef<number | null>(null);

  const people = useMemo<PersonInput[]>(
    () => [
      ...FIXED_PEOPLE,
      ...staff
        .filter((s) => s.active)
        .map((s) => {
          const id = `${STAFF_ID_PREFIX}${s.id}`;
          return {
            id,
            name: s.name,
            editable: true,
            sex: s.sex,
            discipline: s.discipline,
            task_weights: taskWeights[id] ?? {},
          };
        }),
    ],
    [staff, taskWeights],
  );

  const fetchStaff = useCallback(async (id: number): Promise<StaffMember[]> => {
    const res = await fetch(`${API_URL}/weeks/${id}/staff`);
    if (!res.ok) throw new Error(`Kon staf niet laden (${res.status})`);
    return (await res.json()) as StaffMember[];
  }, []);

  // Restore per-week tool state and load the week's staff when the week changes.
  useEffect(() => {
    loadedWeekRef.current = null;
    setError(null);
    if (weekId === null) {
      setStaff([]);
      return;
    }

    const persisted = loadPersistedState(weekId);
    setTasks(persisted?.tasks ?? [...DEFAULT_TASKS]);
    setTaskWeights(persisted?.taskWeights ?? {});
    setWalBlockedIds(persisted?.walBlockedIds ?? []);
    setConfig(persisted?.config ?? { ...DEFAULT_CONFIG_ZOMER });
    setSchedule(persisted?.schedule ?? null);
    setStep(persisted?.step ?? "input");
    loadedWeekRef.current = weekId;

    let cancelled = false;
    setLoading(true);
    fetchStaff(weekId)
      .then((data) => {
        if (!cancelled) setStaff(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Kon staf niet laden");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [weekId, fetchStaff]);

  useEffect(() => {
    if (weekId === null || loadedWeekRef.current !== weekId) return;
    savePersistedState(weekId, { tasks, people, taskWeights, walBlockedIds, config, schedule, step });
  }, [weekId, tasks, people, taskWeights, walBlockedIds, config, schedule, step]);

  // Newly seen Wal staff get blocked from everything but WAL_ALLOWED_TASKS; applied once per
  // person so the user can still unblock them in the matrix afterwards.
  useEffect(() => {
    if (weekId === null || loadedWeekRef.current !== weekId) return;
    const fresh = staff.filter(
      (s) => s.active && groupOf(s.discipline) === "wal" && !walBlockedIds.includes(`${STAFF_ID_PREFIX}${s.id}`),
    );
    if (fresh.length === 0) return;
    const ids = fresh.map((s) => `${STAFF_ID_PREFIX}${s.id}`);
    setConfig((prev) => {
      const have = new Set(prev.task_blocks.map(([p, t, d]) => `${p}|${t}|${d}`));
      const added: [string, string, string][] = [];
      for (const pid of ids) {
        for (const t of tasks) {
          if (WAL_ALLOWED_TASKS.includes(t.id) || have.has(`${pid}|${t.id}|`)) continue;
          added.push([pid, t.id, ""]);
        }
      }
      return added.length ? { ...prev, task_blocks: [...prev.task_blocks, ...added] } : prev;
    });
    setWalBlockedIds((prev) => [...prev, ...ids]);
  }, [weekId, staff, tasks, walBlockedIds, groupOf]);

  async function refreshStaff() {
    if (weekId === null) return;
    setError(null);
    try {
      setStaff(await fetchStaff(weekId));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Kon staf niet laden");
    }
  }

  function applyPreset(preset: RosterConfig) {
    setWalBlockedIds([]);
    setConfig({ ...preset });
  }

  function setTaskWeight(personId: string, taskId: string, value: number) {
    setTaskWeights((prev) => ({
      ...prev,
      [personId]: { ...(prev[personId] ?? {}), [taskId]: value },
    }));
  }

  async function handleSolve() {
    if (people.length === 0 || tasks.length === 0) return;
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/roster/solve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ people, tasks, config }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const detail = body?.detail;
        const msg = typeof detail === "string" ? detail : detail ? JSON.stringify(detail) : `Solve failed (${res.status})`;
        throw new Error(msg);
      }
      const data = await res.json();
      setSchedule(data.schedule);
      setStep("result");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Solve failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload() {
    if (people.length === 0 || tasks.length === 0) return;
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/roster/download`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ people, tasks, config }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const detail = body?.detail;
        const msg = typeof detail === "string" ? detail : detail ? JSON.stringify(detail) : `Download failed (${res.status})`;
        throw new Error(msg);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "rooster.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Download failed");
    } finally {
      setLoading(false);
    }
  }

  function restoreDefaults() {
    setTasks([...DEFAULT_TASKS]);
    setTaskWeights({});
    setWalBlockedIds([]); // Wal defaults get re-applied on the fresh config
    setConfig({ ...DEFAULT_CONFIG_ZOMER });
    setSchedule(null);
    setStep("input");
  }

  // Clears tool-local state; the week's staff list is untouched.
  function reset() {
    restoreDefaults();
    setError(null);
    if (weekId !== null) {
      try {
        localStorage.removeItem(rosterStorageKey(weekId));
      } catch {}
    }
  }

  return (
    <RosterContext.Provider
      value={{
        weekId,
        tasks,
        people,
        config,
        schedule,
        error,
        loading,
        step,
        setTasks,
        setConfig,
        applyPreset,
        setTaskWeight,
        refreshStaff,
        handleSolve,
        handleDownload,
        restoreDefaults,
        reset,
      }}
    >
      {children}
    </RosterContext.Provider>
  );
}

export function useRoster() {
  const ctx = useContext(RosterContext);
  if (!ctx) throw new Error("useRoster must be used within a RosterProvider");
  return ctx;
}
