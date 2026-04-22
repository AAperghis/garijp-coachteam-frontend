"use client";

import { useRef, useState } from "react";
import { useBanaan } from "./context";

export default function UploadStep() {
  const { step, loading, handleUpload } = useBanaan();
  const studentsRef = useRef<HTMLInputElement>(null);
  const instructorsRef = useRef<HTMLInputElement>(null);
  const [studentsName, setStudentsName] = useState<string | null>(null);
  const [instructorsName, setInstructorsName] = useState<string | null>(null);

  if (step !== "upload") return null;

  async function onSubmit() {
    const studentsFile = studentsRef.current?.files?.[0];
    if (!studentsFile) return;
    const instructorsFile = instructorsRef.current?.files?.[0] ?? undefined;
    await handleUpload(studentsFile, instructorsFile);
  }

  return (
    <div className="flex flex-col items-center gap-6 rounded-xl border border-dashed border-zinc-300 py-12 dark:border-zinc-700">
      <div className="flex flex-col items-center gap-2">
        <p className="font-medium text-zinc-700 dark:text-zinc-300">
          Students file (required)
        </p>
        <label className="cursor-pointer rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300">
          {studentsName ?? "Choose file"}
          <input
            ref={studentsRef}
            type="file"
            accept=".csv,.xlsx"
            className="hidden"
            disabled={loading}
            onChange={() => setStudentsName(studentsRef.current?.files?.[0]?.name ?? null)}
          />
        </label>
      </div>
      <div className="flex flex-col items-center gap-2">
        <p className="font-medium text-zinc-700 dark:text-zinc-300">
          Instructors file (optional)
        </p>
        <p className="text-xs text-zinc-500">
          If omitted, instructors are derived from the students file
        </p>
        <label className="cursor-pointer rounded-lg border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">
          {instructorsName ?? "Choose file"}
          <input
            ref={instructorsRef}
            type="file"
            accept=".csv,.xlsx"
            className="hidden"
            disabled={loading}
            onChange={() => setInstructorsName(instructorsRef.current?.files?.[0]?.name ?? null)}
          />
        </label>
      </div>
      <button
        onClick={onSubmit}
        disabled={loading || !studentsName}
        className="rounded-lg bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        {loading ? "Uploading…" : "Upload"}
      </button>
    </div>
  );
}
