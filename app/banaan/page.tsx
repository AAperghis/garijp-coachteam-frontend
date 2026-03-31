"use client";

import { BanaanProvider, useBanaan } from "./components/context";
import ErrorBanner from "./components/ErrorBanner";
import UploadStep from "./components/UploadStep";
import PreviewStep from "./components/PreviewStep";
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

function BanaanContent() {
  return (
    <div className="flex flex-col gap-6">
      <BanaanHeader />
      <div >
        <BanaanExamples />
      </div>
      <div>
      <ErrorBanner />
      <UploadStep />
      <PreviewStep />
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
