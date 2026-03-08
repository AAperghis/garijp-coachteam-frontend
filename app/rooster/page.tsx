"use client";

import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

interface PersonInput {
  id: string;
  name: string;
  task_weights: Record<string, number>;
}

interface TaskInput {
  id: string;
  name: string;
  preferred_people: number;
  min_people: number;
}

interface RosterConfig {
  days: string[];
  task_conflicts: [string, string][];
  max_task_assignments: Record<string, number>;
  pre_assignments: [string, string, string][];
}

type Schedule = Record<string, Record<string, string[]>>;

interface RosterResponse {
  schedule: Schedule;
}

export default function RoosterPage() {
  const [people, setPeople] = useState<PersonInput[] | null>(null);
  const [tasks, setTasks] = useState<TaskInput[] | null>(null);
  const [config, setConfig] = useState<RosterConfig | null>(null);
  const [result, setResult] = useState<RosterResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"upload" | "preview" | "result">("upload");

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
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
      setTasks(data.tasks);
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
    if (!people || !tasks || !config) return;
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
        throw new Error(body?.detail ?? `Solve failed (${res.status})`);
      }
      const data: RosterResponse = await res.json();
      setResult(data);
      setStep("result");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Solve failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload() {
    if (!people || !tasks || !config) return;
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
        throw new Error(body?.detail ?? `Download failed (${res.status})`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "roster.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Download failed");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setPeople(null);
    setTasks(null);
    setConfig(null);
    setResult(null);
    setError(null);
    setStep("upload");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Rooster</h1>
        {step !== "upload" && (
          <button
            onClick={reset}
            className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            Start over
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Step 1: Upload */}
      {step === "upload" && (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-zinc-300 py-16 dark:border-zinc-700">
          <p className="text-zinc-600 dark:text-zinc-400">
            Upload a roster config (JSON)
          </p>
          <label className="cursor-pointer rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300">
            {loading ? "Uploading…" : "Choose file"}
            <input
              type="file"
              accept=".json"
              onChange={handleUpload}
              className="hidden"
              disabled={loading}
            />
          </label>
        </div>
      )}

      {/* Step 2: Preview */}
      {step === "preview" && people && tasks && config && (
        <div className="flex flex-col gap-6">
          <section>
            <h2 className="mb-2 text-lg font-semibold">
              People ({people.length})
            </h2>
            <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
                  <tr>
                    <th className="px-4 py-2">ID</th>
                    <th className="px-4 py-2">Name</th>
                    <th className="px-4 py-2">Task Weights</th>
                  </tr>
                </thead>
                <tbody>
                  {people.map((p) => (
                    <tr
                      key={p.id}
                      className="border-b border-zinc-100 dark:border-zinc-800"
                    >
                      <td className="px-4 py-2">{p.id}</td>
                      <td className="px-4 py-2">{p.name}</td>
                      <td className="px-4 py-2">
                        {Object.entries(p.task_weights)
                          .map(([k, v]) => `${k}: ${v}`)
                          .join(", ") || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold">
              Tasks ({tasks.length})
            </h2>
            <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
                  <tr>
                    <th className="px-4 py-2">ID</th>
                    <th className="px-4 py-2">Name</th>
                    <th className="px-4 py-2">Preferred</th>
                    <th className="px-4 py-2">Min</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((t) => (
                    <tr
                      key={t.id}
                      className="border-b border-zinc-100 dark:border-zinc-800"
                    >
                      <td className="px-4 py-2">{t.id}</td>
                      <td className="px-4 py-2">{t.name}</td>
                      <td className="px-4 py-2">{t.preferred_people}</td>
                      <td className="px-4 py-2">{t.min_people}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold">Config</h2>
            <div className="rounded-lg border border-zinc-200 p-4 text-sm dark:border-zinc-800">
              <div>
                <span className="text-zinc-500">Days:</span>{" "}
                {config.days.join(", ")}
              </div>
              {config.task_conflicts.length > 0 && (
                <div className="mt-1">
                  <span className="text-zinc-500">Task conflicts:</span>{" "}
                  {config.task_conflicts
                    .map(([a, b]) => `${a} / ${b}`)
                    .join("; ")}
                </div>
              )}
              {config.pre_assignments.length > 0 && (
                <div className="mt-1">
                  <span className="text-zinc-500">Pre-assignments:</span>{" "}
                  {config.pre_assignments.length}
                </div>
              )}
            </div>
          </section>

          <button
            onClick={handleSolve}
            disabled={loading}
            className="self-start rounded-lg bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            {loading ? "Solving…" : "Solve"}
          </button>
        </div>
      )}

      {/* Step 3: Result */}
      {step === "result" && result && (
        <div className="flex flex-col gap-6">
          <section>
            <h2 className="mb-2 text-lg font-semibold">Schedule</h2>
            <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
                  <tr>
                    <th className="px-4 py-2">Day</th>
                    <th className="px-4 py-2">Task</th>
                    <th className="px-4 py-2">Assigned</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(result.schedule).map(([day, taskMap]) =>
                    Object.entries(taskMap).map(([task, people], i) => (
                      <tr
                        key={`${day}-${task}`}
                        className="border-b border-zinc-100 dark:border-zinc-800"
                      >
                        {i === 0 ? (
                          <td
                            className="px-4 py-2 font-medium"
                            rowSpan={Object.keys(taskMap).length}
                          >
                            {day}
                          </td>
                        ) : null}
                        <td className="px-4 py-2">{task}</td>
                        <td className="px-4 py-2">{people.join(", ")}</td>
                      </tr>
                    )),
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <button
            onClick={handleDownload}
            disabled={loading}
            className="self-start rounded-lg bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            {loading ? "Downloading…" : "Download XLSX"}
          </button>
        </div>
      )}
    </div>
  );
}
