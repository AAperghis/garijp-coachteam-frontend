"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type {
  CursistInput,
  InstructorInput,
  ConfigInput,
  BanaanResponse,
  Step,
} from "../types";
import { useWeek } from "../../context/weekContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";
const USE_DEV_RESULT = process.env.NEXT_PUBLIC_DEV_RESULT === "true";
const STORAGE_PREFIX = "banaan-state";
const SCHEMA_VERSION = 3; // bump when PersistedState shape changes

// Cursists/instructors live in the week (DB); only tool-local state is persisted.
interface PersistedState {
  _v?: number;
  config: ConfigInput | null;
  result: BanaanResponse | null;
}

function storageKey(weekId: number) {
  return `${STORAGE_PREFIX}-${weekId}`;
}

function loadPersistedState(weekId: number): PersistedState | null {
  try {
    const raw = localStorage.getItem(storageKey(weekId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedState;
    if (parsed._v !== SCHEMA_VERSION) {
      localStorage.removeItem(storageKey(weekId));
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
      storageKey(weekId),
      JSON.stringify({ ...state, _v: SCHEMA_VERSION }),
    );
  } catch {
    // storage full or unavailable — ignore
  }
}

interface WeekInputs {
  cursists: CursistInput[];
  instructors: InstructorInput[];
  config: ConfigInput;
}

interface DevFixture extends WeekInputs {
  result: BanaanResponse;
}

export interface SolveProgress {
  solve_id?: string;
  elapsed: number;
  timeout: number;
  time_fraction: number;
  gap: number;
  objective: number;
  bound: number;
  solutions_found: number;
}

// The only cursist fields the banaan tool writes back; everything else is managed on the Cursisten page.
export type CursistPatch = Partial<Pick<CursistInput, "wants_banana" | "friends">>;

interface BanaanContextValue {
  weekId: number | null;
  cursists: CursistInput[] | null;
  instructors: InstructorInput[] | null;
  config: ConfigInput | null;
  result: BanaanResponse | null;
  error: string | null;
  loading: boolean;
  progress: SolveProgress | null;
  progressHistory: SolveProgress[];
  timeout: number;
  step: Step;
  setConfig: React.Dispatch<React.SetStateAction<ConfigInput | null>>;
  setTimeout: React.Dispatch<React.SetStateAction<number>>;
  updateCursist: (index: number, patch: CursistPatch) => Promise<void>;
  refreshInputs: () => Promise<void>;
  handleUpload: (cursists: File, instructors?: File) => Promise<void>;
  handleSolve: () => Promise<void>;
  handleDownload: () => Promise<void>;
  handleSaveDevResult: () => void;
  stopSolve: () => Promise<void>;
  reset: () => void;
}

const BanaanContext = createContext<BanaanContextValue | null>(null);

export function BanaanProvider({ children }: { children: React.ReactNode }) {
  const { activeWeekId: weekId } = useWeek();
  const [cursists, setCursists] = useState<CursistInput[] | null>(null);
  const [instructors, setInstructors] = useState<InstructorInput[] | null>(null);
  const [config, setConfig] = useState<ConfigInput | null>(null);
  const [result, setResult] = useState<BanaanResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<Step>("upload");
  const [progress, setProgress] = useState<SolveProgress | null>(null);
  const [progressHistory, setProgressHistory] = useState<SolveProgress[]>([]);
  const [timeout, setSolveTimeout] = useState(600);
  const solveIdRef = useRef<string | null>(null);
  const defaultConfigRef = useRef<ConfigInput | null>(null);
  // Week whose persisted state has been restored; guards against saving during load.
  const loadedWeekRef = useRef<number | null>(null);

  const fetchWeekInputs = useCallback(async (id: number): Promise<WeekInputs> => {
    const res = await fetch(`${API_URL}/banaan/week/${id}`);
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { detail?: string } | null;
      throw new Error(body?.detail ?? `Kon weekgegevens niet laden (${res.status})`);
    }
    return (await res.json()) as WeekInputs;
  }, []);

  // (Re)load week data whenever the active week changes.
  useEffect(() => {
    loadedWeekRef.current = null;
    setError(null);
    setResult(null);
    setProgress(null);
    setProgressHistory([]);

    if (weekId === null) {
      setCursists(null);
      setInstructors(null);
      setConfig(null);
      setStep("upload");
      return;
    }

    let cancelled = false;
    setLoading(true);
    fetchWeekInputs(weekId)
      .then((data) => {
        if (cancelled) return;
        const persisted = loadPersistedState(weekId);
        defaultConfigRef.current = data.config;
        setCursists(data.cursists);
        setInstructors(data.instructors);
        setConfig(persisted?.config ?? data.config);
        setResult(persisted?.result ?? null);
        setStep(
          data.cursists.length === 0
            ? "upload"
            : persisted?.result
              ? "result"
              : "preview",
        );
        loadedWeekRef.current = weekId;
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Kon weekgegevens niet laden");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [weekId, fetchWeekInputs]);

  // Persist tool-local state per week.
  useEffect(() => {
    if (weekId === null || loadedWeekRef.current !== weekId) return;
    savePersistedState(weekId, { config, result });
  }, [weekId, config, result]);

  // Load dev fixture when NEXT_PUBLIC_DEV_RESULT is set
  useEffect(() => {
    if (!USE_DEV_RESULT) return;
    fetch("/devFixture.json")
      .then((res) => {
        if (!res.ok) throw new Error("No dev fixture found");
        return res.json();
      })
      .then((data: DevFixture) => {
        setCursists(data.cursists);
        setInstructors(data.instructors);
        setConfig(data.config);
        setResult(data.result);
        setStep("result");
      })
      .catch((err) => {
        console.warn("Dev fixture load failed:", err.message);
      });
  }, []);

  async function refreshInputs() {
    if (weekId === null) return;
    setError(null);
    try {
      const data = await fetchWeekInputs(weekId);
      setCursists(data.cursists);
      setInstructors(data.instructors);
      if (step === "upload" && data.cursists.length > 0) setStep("preview");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Kon weekgegevens niet laden");
    }
  }

  async function updateCursist(index: number, patch: CursistPatch) {
    const id = cursists?.[index]?.id;
    setCursists((prev) => {
      if (!prev) return prev;
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      return next;
    });
    if (weekId === null || id == null) return;
    // DB stores friends as a list; the tool uses null for "none".
    const { friends, ...rest } = patch;
    const body = friends === undefined ? rest : { ...rest, friends: friends ?? [] };
    const res = await fetch(`${API_URL}/weeks/${weekId}/cursists/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) setError(`Kon cursist niet opslaan (${res.status})`);
  }

  async function handleUpload(cursistsFile: File, instructorsFile?: File) {
    if (weekId === null) return;
    setError(null);
    setLoading(true);

    const form = new FormData();
    form.append("file", cursistsFile);
    if (instructorsFile) {
      form.append("instructors_file", instructorsFile);
    }
    form.append("week_id", String(weekId));

    try {
      const res = await fetch(`${API_URL}/banaan/upload`, {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.detail ?? `Upload failed (${res.status})`);
      }
      const data = (await res.json()) as WeekInputs;
      defaultConfigRef.current = data.config;
      setCursists(data.cursists);
      setInstructors(data.instructors);
      setConfig((prev) => prev ?? data.config);
      setResult(null);
      setStep("preview");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleSolve() {
    if (!cursists || !instructors || !config) return;
    setError(null);
    setLoading(true);
    setProgress(null);
    setProgressHistory([]);
    solveIdRef.current = null;

    try {
      const res = await fetch(`${API_URL}/banaan/solve-stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cursists, instructors, config, timeout }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.detail ?? `Solve failed (${res.status})`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("Streaming not supported");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";

        for (const chunk of lines) {
          const line = chunk.replace(/^data: /, "").trim();
          if (!line) continue;
          const event = JSON.parse(line);

          if (event.type === "progress") {
            const p = event as SolveProgress;
            if (p.solve_id) solveIdRef.current = p.solve_id;
            setProgress(p);
            setProgressHistory((prev) => [...prev, p]);
          } else if (event.type === "result") {
            const { type, ...rest } = event;
            setResult(rest as BanaanResponse);
            setStep("result");
          } else if (event.type === "error") {
            throw new Error(event.detail);
          }
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Solve failed");
    } finally {
      setLoading(false);
      setProgress(null);
    }
  }

  async function stopSolve() {
    const id = solveIdRef.current;
    if (!id) return;
    try {
      await fetch(`${API_URL}/banaan/stop`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ solve_id: id }),
      });
    } catch {
      // best-effort — solve will finish on its own eventually
    }
  }

  async function handleDownload() {
    if (!cursists || !instructors || !config) return;
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/banaan/download`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cursists, instructors, config, timeout }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.detail ?? `Download failed (${res.status})`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "banaan_schedule.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Download failed");
    } finally {
      setLoading(false);
    }
  }

  // Clears the result and config; the week's cursists/instructors are untouched.
  function reset() {
    setConfig(defaultConfigRef.current);
    setResult(null);
    setError(null);
    setProgress(null);
    setProgressHistory([]);
    setStep(cursists && cursists.length > 0 ? "preview" : "upload");
    if (weekId !== null) {
      try { localStorage.removeItem(storageKey(weekId)); } catch {}
    }
  }

  function handleSaveDevResult() {
    if (!cursists || !instructors || !config || !result) return;
    const fixture: DevFixture = { cursists, instructors, config, result };
    const blob = new Blob([JSON.stringify(fixture, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "devFixture.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <BanaanContext.Provider
      value={{
        weekId,
        cursists,
        instructors,
        config,
        result,
        error,
        loading,
        progress,
        progressHistory,
        timeout,
        step,
        setConfig,
        setTimeout: setSolveTimeout,
        updateCursist,
        refreshInputs,
        handleUpload,
        handleSolve,
        handleDownload,
        handleSaveDevResult,
        stopSolve,
        reset,
      }}
    >
      {children}
    </BanaanContext.Provider>
  );
}

export function useBanaan() {
  const ctx = useContext(BanaanContext);
  if (!ctx) throw new Error("useBanaan must be used within a BanaanProvider");
  return ctx;
}
