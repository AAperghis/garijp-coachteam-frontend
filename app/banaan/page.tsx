"use client";

import { useEffect, useState } from "react";
import { BanaanProvider, useBanaan } from "./components/context";
import ErrorBanner from "./components/ErrorBanner";
import UploadStep from "./components/UploadStep";
import PreviewStep from "./components/StudentInput";
import ResultStep from "./components/ResultStep";
import { BanaanExamples } from "./components/Examples";
import TabBar from "../components/TabBar";

function SolveProgressOverlay() {
  const { loading, progress, stopSolve } = useBanaan();
  if (!loading) return null;

  const timePct = progress ? Math.round(progress.time_fraction * 100) : 0;
  const qualityPct = progress && progress.solutions_found > 0
    ? Math.max(0, Math.min(100, Math.round((1 - progress.gap) * 100)))
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="mx-4 flex w-full max-w-md flex-col gap-4 rounded-2xl bg-white p-8 shadow-xl dark:bg-zinc-900">
        <h2 className="text-center text-lg font-semibold">Solving…</h2>

        {/* Time progress */}
        <div>
          <div className="mb-1 flex justify-between text-xs text-zinc-500">
            <span>Elapsed time</span>
            <span>{progress ? `${progress.elapsed.toFixed(0)}s / ${progress.timeout}s` : "–"}</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
            <div
              className="h-full rounded-full bg-garijp-blue transition-all duration-500 ease-out"
              style={{ width: `${timePct}%` }}
            />
          </div>
        </div>

        {/* Solution quality / convergence */}
        <div>
          <div className="mb-1 flex justify-between text-xs text-zinc-500">
            <span>Solution quality</span>
            <span>{progress && progress.solutions_found > 0 ? `${qualityPct}%` : "–"}</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${qualityPct}%`,
                backgroundColor:
                  qualityPct >= 95 ? "#22c55e" : qualityPct >= 80 ? "#eab308" : "#f97316",
              }}
            />
          </div>
        </div>

        {progress ? (
          <div className="flex justify-between text-sm text-zinc-500">
            <span>
              {progress.solutions_found} solution{progress.solutions_found !== 1 ? "s" : ""} found
            </span>
            {progress.gap === 0 && (
              <span className="font-medium text-green-600 dark:text-green-400">Optimal!</span>
            )}
          </div>
        ) : (
          <p className="text-center text-sm text-zinc-500">Starting solver…</p>
        )}

        {/* Stop button — use current best solution */}
        {progress && progress.solutions_found > 0 && (
          <button
            onClick={stopSolve}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Stop &amp; use current solution
          </button>
        )}
      </div>
    </div>
  );
}

function BanaanHeader() {
  const { step, reset, handleSolve, loading } = useBanaan();

  return (
    <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Banaan</h1>
        <div className="flex items-center gap-4">
        {step !== "upload" && (
          <button
            onClick={handleSolve}
            disabled={loading}
            className="self-start rounded-lg bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            {loading ? "Solving…" : "Solve"}
          </button>
        )}
        {step !== "upload" && (
          <button
            onClick={reset}
            className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            Start over
          </button>
        )}
        </div>
      </div>
  );
}

type Tab = "input" | "output";

const BANAAN_TABS: { id: Tab; label: string }[] = [
  { id: "input", label: "Input" },
  { id: "output", label: "Output" },
];

function BanaanContent() {
  const { step, result } = useBanaan();
  const [tab, setTab] = useState<Tab>("input");
  const hasResult = step === "result" && result;

  useEffect(() => {
    if (step === "result") setTab("output");
  }, [step]);

  return (
    <div className="flex flex-col gap-6">
      <SolveProgressOverlay />
      <BanaanHeader />
      {hasResult && <TabBar tab={tab} setTab={setTab} tabs={BANAAN_TABS} />}
      <div className={hasResult && tab !== "input" ? "hidden" : ""}>
        <div className="flex flex-col gap-6 md:flex-row">
          <div className="shrink-0">
            <BanaanExamples />
          </div>
          <div className="min-w-0 flex-1">
            <ErrorBanner />
            <UploadStep />
            <PreviewStep />
          </div>
        </div>
      </div>
      <div className={!hasResult || tab !== "output" ? "hidden" : ""}>
        <ResultStep />
      </div>
    </div>
  );
}

export default function BanaanPage() {
  return (
    <BanaanProvider>
      <BanaanContent />
    </BanaanProvider>
  );
}
