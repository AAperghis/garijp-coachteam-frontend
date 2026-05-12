"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import type {
  PersonInput,
  TaskInput,
  RosterConfig,
  Schedule,
  Step,
} from "../types";
import { DEFAULT_TASKS, DEFAULT_CONFIG_ZOMER, DEFAULT_PEOPLE } from "../defaults";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";
const STORAGE_KEY = "rooster-state";
const SCHEMA_VERSION = 5;

interface PersistedState {
  _v?: number;
  tasks: TaskInput[];
  people: PersonInput[];
  config: RosterConfig;
  schedule: Schedule | null;
  step: Step;
}

function loadPersistedState(): PersistedState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedState;
    if (parsed._v !== SCHEMA_VERSION) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function savePersistedState(state: PersistedState) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...state, _v: SCHEMA_VERSION }),
    );
  } catch {
    // ignore
  }
}

interface RosterContextValue {
  tasks: TaskInput[];
  people: PersonInput[];
  config: RosterConfig;
  schedule: Schedule | null;
  error: string | null;
  loading: boolean;
  step: Step;
  setTasks: React.Dispatch<React.SetStateAction<TaskInput[]>>;
  setPeople: React.Dispatch<React.SetStateAction<PersonInput[]>>;
  setConfig: React.Dispatch<React.SetStateAction<RosterConfig>>;
  handleUploadPeople: (file: File) => Promise<void>;
  handleSolve: () => Promise<void>;
  handleDownload: () => Promise<void>;
  restoreDefaults: () => void;
  reset: () => void;
}

const RosterContext = createContext<RosterContextValue | null>(null);

export function RosterProvider({ children }: { children: React.ReactNode }) {
  const persisted = useRef(loadPersistedState());

  const [tasks, setTasks] = useState<TaskInput[]>(
    persisted.current?.tasks ?? [...DEFAULT_TASKS],
  );
  const [people, setPeople] = useState<PersonInput[]>(
    persisted.current?.people ?? [...DEFAULT_PEOPLE],
  );
  const [config, setConfig] = useState<RosterConfig>(
    persisted.current?.config ?? { ...DEFAULT_CONFIG_ZOMER },
  );
  const [schedule, setSchedule] = useState<Schedule | null>(
    persisted.current?.schedule ?? null,
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<Step>(persisted.current?.step ?? "input");

  useEffect(() => {
    savePersistedState({ tasks, people, config, schedule, step });
  }, [tasks, people, config, schedule, step]);

  async function handleUploadPeople(file: File) {
    setError(null);
    setLoading(true);

    const form = new FormData();
    form.append("file", file);

    try {
      const res = await fetch(`${API_URL}/roster/upload`, {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.detail ?? `Upload failed (${res.status})`);
      }
      const data = await res.json();
      setPeople(data.people);
      if (data.tasks?.length) setTasks(data.tasks);
      if (data.config) {
        setConfig((prev) => ({ ...prev, ...data.config }));
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLoading(false);
    }
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
    setPeople([...DEFAULT_PEOPLE]);
    setConfig({ ...DEFAULT_CONFIG_ZOMER });
    setSchedule(null);
    setStep("input");
  }

  function reset() {
    setTasks([...DEFAULT_TASKS]);
    setPeople([...DEFAULT_PEOPLE]);
    setConfig({ ...DEFAULT_CONFIG_ZOMER });
    setSchedule(null);
    setError(null);
    setStep("input");
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }

  return (
    <RosterContext.Provider
      value={{
        tasks,
        people,
        config,
        schedule,
        error,
        loading,
        step,
        setTasks,
        setPeople,
        setConfig,
        handleUploadPeople,
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
