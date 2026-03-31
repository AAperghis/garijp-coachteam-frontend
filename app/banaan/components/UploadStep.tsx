"use client";

import { useBanaan } from "./context";

export default function UploadStep() {
  const { step, loading, handleUpload } = useBanaan();
  if (step !== "upload") return null;

  return (
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
  );
}
