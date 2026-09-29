"use client";

import { useRef, useState } from "react";
import { useBanaan } from "./context";

export default function UploadStep() {
  const { step, loading, cursists, handleUpload } = useBanaan();
  const cursistsRef = useRef<HTMLInputElement>(null);
  const instructorsRef = useRef<HTMLInputElement>(null);
  const [cursistsName, setCursistsName] = useState<string | null>(null);
  const [instructorsName, setInstructorsName] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const hasCursists = (cursists?.length ?? 0) > 0;
  if (step !== "upload" && !hasCursists) return null;

  async function onSubmit() {
    const cursistsFile = cursistsRef.current?.files?.[0];
    if (!cursistsFile) return;
    const instructorsFile = instructorsRef.current?.files?.[0] ?? undefined;
    await handleUpload(cursistsFile, instructorsFile);
    setCursistsName(null);
    setInstructorsName(null);
    setOpen(false);
  }

  // Week already has cursists: collapse the importer behind a toggle.
  if (hasCursists && !open) {
    return (
      <div className="mb-4 flex items-center justify-between rounded-lg border border-zinc-200 px-4 py-2 text-sm dark:border-zinc-800">
        <span className="text-zinc-500">
          Cursisten en staf komen uit de geselecteerde week.
        </span>
        <button
          onClick={() => setOpen(true)}
          className="text-zinc-700 underline-offset-2 hover:underline dark:text-zinc-300"
        >
          Opnieuw importeren uit bestand…
        </button>
      </div>
    );
  }

  return (
    <div className="mb-4 flex flex-col items-center gap-6 rounded-xl border border-dashed border-zinc-300 py-12 dark:border-zinc-700">
      {hasCursists && (
        <p className="max-w-md text-center text-xs text-amber-600 dark:text-amber-500">
          Importeren vervangt alle cursisten van deze week; stafleden worden op
          naam bijgewerkt.
        </p>
      )}
      <div className="flex flex-col items-center gap-2">
        <p className="font-medium text-zinc-700 dark:text-zinc-300">
          Cursists file (required)
        </p>
        <label className="cursor-pointer rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300">
          {cursistsName ?? "Choose file"}
          <input
            ref={cursistsRef}
            type="file"
            accept=".csv,.xlsx"
            className="hidden"
            disabled={loading}
            onChange={() => setCursistsName(cursistsRef.current?.files?.[0]?.name ?? null)}
          />
        </label>
      </div>
      <div className="flex flex-col items-center gap-2">
        <p className="font-medium text-zinc-700 dark:text-zinc-300">
          Instructors file (optional)
        </p>
        <p className="text-xs text-zinc-500">
          If omitted, instructors are derived from the cursists file
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
      <div className="flex items-center gap-4">
        <button
          onClick={onSubmit}
          disabled={loading || !cursistsName}
          className="rounded-lg bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {loading ? "Uploading…" : "Upload"}
        </button>
        {hasCursists && (
          <button
            onClick={() => setOpen(false)}
            className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            Annuleren
          </button>
        )}
      </div>
    </div>
  );
}
