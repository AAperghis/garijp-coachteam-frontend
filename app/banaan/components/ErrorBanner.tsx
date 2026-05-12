"use client";

import { useBanaan } from "./context";

export default function ErrorBanner() {
  const { error } = useBanaan();
  if (!error) return null;

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
      {error}
    </div>
  );
}
