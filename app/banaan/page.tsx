"use client";

import { useEffect, useState } from "react";
import { BanaanProvider, useBanaan } from "./components/context";
import ErrorBanner from "./components/ErrorBanner";
import UploadStep from "./components/UploadStep";
import PreviewStep from "./components/StudentInput";
import ResultStep from "./components/ResultStep";
import { BanaanExamples } from "./components/Examples";

function BanaanHeader() {
  const { step, reset } = useBanaan();

  return (
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
  );
}

type Tab = "input" | "output";

function TabBar({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  const tabs: { id: Tab; label: string }[] = [
    { id: "input", label: "Input" },
    { id: "output", label: "Output" },
  ];

  return (
    <div className="flex gap-1 border-b border-zinc-200 dark:border-zinc-800">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => setTab(t.id)}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            tab === t.id
              ? "border-b-2 border-garijp-blue text-foreground"
              : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

function BanaanContent() {
  const { step, result } = useBanaan();
  const [tab, setTab] = useState<Tab>("input");
  const hasResult = step === "result" && result;

  useEffect(() => {
    if (step === "result") setTab("output");
  }, [step]);

  return (
    <div className="flex flex-col gap-6">
      <BanaanHeader />
      {hasResult && <TabBar tab={tab} setTab={setTab} />}
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
