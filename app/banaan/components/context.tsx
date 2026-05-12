"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import type {
  StudentInput,
  InstructorInput,
  ConfigInput,
  BanaanResponse,
  Step,
} from "../types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";
const USE_DEV_RESULT = process.env.NEXT_PUBLIC_DEV_RESULT === "true";
const STORAGE_KEY = "banaan-state";
const SCHEMA_VERSION = 2; // bump when PersistedState shape changes

interface PersistedState {
  _v?: number;
  students: StudentInput[] | null;
  instructors: InstructorInput[] | null;
  config: ConfigInput | null;
  result: BanaanResponse | null;
  step: Step;
}

function loadPersistedState(): PersistedState | null {
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, _v: SCHEMA_VERSION }));
  } catch {
    // storage full or unavailable — ignore
  }
}

interface DevFixture {
  students: StudentInput[];
  instructors: InstructorInput[];
  config: ConfigInput;
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

interface BanaanContextValue {
  students: StudentInput[] | null;
  instructors: InstructorInput[] | null;
  config: ConfigInput | null;
  result: BanaanResponse | null;
  error: string | null;
  loading: boolean;
  progress: SolveProgress | null;
  progressHistory: SolveProgress[];
  timeout: number;
  step: Step;
  setStudents: React.Dispatch<React.SetStateAction<StudentInput[] | null>>;
  setInstructors: React.Dispatch<React.SetStateAction<InstructorInput[] | null>>;
  setConfig: React.Dispatch<React.SetStateAction<ConfigInput | null>>;
  setTimeout: React.Dispatch<React.SetStateAction<number>>;
  handleUpload: (students: File, instructors?: File) => Promise<void>;
  handleSolve: () => Promise<void>;
  handleDownload: () => Promise<void>;
  handleSaveDevResult: () => void;
  stopSolve: () => Promise<void>;
  reset: () => void;
}

const BanaanContext = createContext<BanaanContextValue | null>(null);

export function BanaanProvider({ children }: { children: React.ReactNode }) {
  const persisted = useRef(loadPersistedState());
  const [students, setStudents] = useState<StudentInput[] | null>(persisted.current?.students ?? null);
  const [instructors, setInstructors] = useState<InstructorInput[] | null>(persisted.current?.instructors ?? null);
  const [config, setConfig] = useState<ConfigInput | null>(persisted.current?.config ?? null);
  const [result, setResult] = useState<BanaanResponse | null>(persisted.current?.result ?? null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<Step>(persisted.current?.step ?? "upload");
  const [progress, setProgress] = useState<SolveProgress | null>(null);
  const [progressHistory, setProgressHistory] = useState<SolveProgress[]>([]);
  const [timeout, setSolveTimeout] = useState(600);
  const solveIdRef = useRef<string | null>(null);

  // Persist state to localStorage on change
  useEffect(() => {
    savePersistedState({ students, instructors, config, result, step });
  }, [students, instructors, config, result, step]);

  // Load dev fixture when NEXT_PUBLIC_DEV_RESULT is set
  useEffect(() => {
    if (!USE_DEV_RESULT) return;
    fetch("/devFixture.json")
      .then((res) => {
        if (!res.ok) throw new Error("No dev fixture found");
        return res.json();
      })
      .then((data: DevFixture) => {
        setStudents(data.students);
        setInstructors(data.instructors);
        setConfig(data.config);
        setResult(data.result);
        setStep("result");
      })
      .catch((err) => {
        console.warn("Dev fixture load failed:", err.message);
      });
  }, []);

  async function handleUpload(studentsFile: File, instructorsFile?: File) {
    setError(null);
    setLoading(true);

    const form = new FormData();
    form.append("file", studentsFile);
    if (instructorsFile) {
      form.append("instructors_file", instructorsFile);
    }

    try {
      const res = await fetch(`${API_URL}/banaan/upload`, {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.detail ?? `Upload failed (${res.status})`);
      }
      const data = await res.json();
      setStudents(data.students);
      setInstructors(data.instructors);
      setConfig(data.config);
      setResult(null);
      setStep("preview");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleSolve() {
    if (!students || !instructors || !config) return;
    setError(null);
    setLoading(true);
    setProgress(null);
    setProgressHistory([]);
    solveIdRef.current = null;

    try {
      const res = await fetch(`${API_URL}/banaan/solve-stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ students, instructors, config, timeout }),
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
    if (!students || !instructors || !config) return;
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/banaan/download`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ students, instructors, config, timeout }),
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

  function reset() {
    setStudents(null);
    setInstructors(null);
    setConfig(null);
    setResult(null);
    setError(null);
    setProgress(null);
    setProgressHistory([]);
    setStep("upload");
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }

  function handleSaveDevResult() {
    if (!students || !instructors || !config || !result) return;
    const fixture: DevFixture = { students, instructors, config, result };
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
        students,
        instructors,
        config,
        result,
        error,
        loading,
        progress,
        progressHistory,
        timeout,
        step,
        setStudents,
        setInstructors,
        setConfig,
        setTimeout: setSolveTimeout,
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
