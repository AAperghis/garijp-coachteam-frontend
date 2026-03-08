"use client";

import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

interface StudentInput {
  name: string;
  discipline: string;
  instructor: string;
  wants_banana: boolean;
  friend: string | null;
}

interface InstructorInput {
  name: string;
  discipline: string;
  transport_capacity: number;
}

interface ConfigInput {
  boat_capacity: number;
  slot_duration_min: number;
  prep_time_min: number;
  transport_time_min: number;
  start_time: string;
  end_time: string;
  weights: Record<string, number>;
}

interface GroupOutput {
  index: number;
  slot: number;
  time: string;
  phase: number;
  students: string[];
  disciplines: string[];
  transport_instructor: string | null;
}

interface BanaanResponse {
  groups: GroupOutput[];
  non_banana_assignments: Record<string, string>;
  total_groups: number;
  total_banana_students: number;
}

export default function BanaanPage() {
  const [students, setStudents] = useState<StudentInput[] | null>(null);
  const [instructors, setInstructors] = useState<InstructorInput[] | null>(
    null,
  );
  const [config, setConfig] = useState<ConfigInput | null>(null);
  const [result, setResult] = useState<BanaanResponse | null>(null);
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
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Banaan</h1>
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
            Upload a student list (CSV or XLSX)
          </p>
          <label className="cursor-pointer rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300">
            {loading ? "Uploading…" : "Choose file"}
            <input
              type="file"
              accept=".csv,.xlsx"
              onChange={handleUpload}
              className="hidden"
              disabled={loading}
            />
          </label>
        </div>
      )}

      {/* Step 2: Preview */}
      {step === "preview" && students && instructors && config && (
        <div className="flex flex-col gap-6">
          <section>
            <h2 className="mb-2 text-lg font-semibold">
              Students ({students.length})
            </h2>
            <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
                  <tr>
                    <th className="px-4 py-2">Name</th>
                    <th className="px-4 py-2">Discipline</th>
                    <th className="px-4 py-2">Instructor</th>
                    <th className="px-4 py-2">Banana?</th>
                    <th className="px-4 py-2">Friend</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s, i) => (
                    <tr
                      key={i}
                      className="border-b border-zinc-100 dark:border-zinc-800"
                    >
                      <td className="px-4 py-2">{s.name}</td>
                      <td className="px-4 py-2">{s.discipline}</td>
                      <td className="px-4 py-2">{s.instructor}</td>
                      <td className="px-4 py-2">
                        {s.wants_banana ? "Yes" : "No"}
                      </td>
                      <td className="px-4 py-2">{s.friend ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold">
              Instructors ({instructors.length})
            </h2>
            <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
                  <tr>
                    <th className="px-4 py-2">Name</th>
                    <th className="px-4 py-2">Discipline</th>
                    <th className="px-4 py-2">Transport Capacity</th>
                  </tr>
                </thead>
                <tbody>
                  {instructors.map((inst, i) => (
                    <tr
                      key={i}
                      className="border-b border-zinc-100 dark:border-zinc-800"
                    >
                      <td className="px-4 py-2">{inst.name}</td>
                      <td className="px-4 py-2">{inst.discipline}</td>
                      <td className="px-4 py-2">{inst.transport_capacity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold">Config</h2>
            <div className="grid grid-cols-2 gap-2 rounded-lg border border-zinc-200 p-4 text-sm dark:border-zinc-800 sm:grid-cols-3">
              <div>
                <span className="text-zinc-500">Boat capacity:</span>{" "}
                {config.boat_capacity}
              </div>
              <div>
                <span className="text-zinc-500">Slot duration:</span>{" "}
                {config.slot_duration_min} min
              </div>
              <div>
                <span className="text-zinc-500">Prep time:</span>{" "}
                {config.prep_time_min} min
              </div>
              <div>
                <span className="text-zinc-500">Transport time:</span>{" "}
                {config.transport_time_min} min
              </div>
              <div>
                <span className="text-zinc-500">Start:</span>{" "}
                {config.start_time}
              </div>
              <div>
                <span className="text-zinc-500">End:</span> {config.end_time}
              </div>
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
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
              <div className="text-2xl font-bold">{result.total_groups}</div>
              <div className="text-sm text-zinc-500">Groups</div>
            </div>
            <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
              <div className="text-2xl font-bold">
                {result.total_banana_students}
              </div>
              <div className="text-sm text-zinc-500">Banana students</div>
            </div>
          </div>

          <section>
            <h2 className="mb-2 text-lg font-semibold">Schedule</h2>
            <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
                  <tr>
                    <th className="px-4 py-2">#</th>
                    <th className="px-4 py-2">Time</th>
                    <th className="px-4 py-2">Phase</th>
                    <th className="px-4 py-2">Students</th>
                    <th className="px-4 py-2">Disciplines</th>
                    <th className="px-4 py-2">Transport</th>
                  </tr>
                </thead>
                <tbody>
                  {result.groups.map((g) => (
                    <tr
                      key={g.index}
                      className="border-b border-zinc-100 dark:border-zinc-800"
                    >
                      <td className="px-4 py-2">{g.index + 1}</td>
                      <td className="px-4 py-2">{g.time}</td>
                      <td className="px-4 py-2">{g.phase}</td>
                      <td className="px-4 py-2">{g.students.join(", ")}</td>
                      <td className="px-4 py-2">{g.disciplines.join(", ")}</td>
                      <td className="px-4 py-2">
                        {g.transport_instructor ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {Object.keys(result.non_banana_assignments).length > 0 && (
            <section>
              <h2 className="mb-2 text-lg font-semibold">
                Non-banana assignments
              </h2>
              <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
                    <tr>
                      <th className="px-4 py-2">Student</th>
                      <th className="px-4 py-2">Instructor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(result.non_banana_assignments).map(
                      ([student, instructor]) => (
                        <tr
                          key={student}
                          className="border-b border-zinc-100 dark:border-zinc-800"
                        >
                          <td className="px-4 py-2">{student}</td>
                          <td className="px-4 py-2">{instructor}</td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

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
