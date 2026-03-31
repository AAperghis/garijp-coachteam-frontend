"use client";

import { createContext, useContext, useState } from "react";
import type {
  StudentInput,
  InstructorInput,
  ConfigInput,
  BanaanResponse,
  Step,
} from "../types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

interface BanaanContextValue {
  students: StudentInput[] | null;
  instructors: InstructorInput[] | null;
  config: ConfigInput | null;
  result: BanaanResponse | null;
  error: string | null;
  loading: boolean;
  step: Step;
  handleUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleSolve: () => Promise<void>;
  handleDownload: () => Promise<void>;
  reset: () => void;
}

const BanaanContext = createContext<BanaanContextValue | null>(null);

export function BanaanProvider({ children }: { children: React.ReactNode }) {
  const [students, setStudents] = useState<StudentInput[] | null>(null);
  const [instructors, setInstructors] = useState<InstructorInput[] | null>(null);
  const [config, setConfig] = useState<ConfigInput | null>(null);
  const [result, setResult] = useState<BanaanResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<Step>("upload");

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setLoading(true);

    const form = new FormData();
    form.append("file", file);

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

    try {
      const res = await fetch(`${API_URL}/banaan/solve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ students, instructors, config }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.detail ?? `Solve failed (${res.status})`);
      }
      const data: BanaanResponse = await res.json();
      setResult(data);
      setStep("result");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Solve failed");
    } finally {
      setLoading(false);
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
        body: JSON.stringify({ students, instructors, config }),
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
    setStep("upload");
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
        step,
        handleUpload,
        handleSolve,
        handleDownload,
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
