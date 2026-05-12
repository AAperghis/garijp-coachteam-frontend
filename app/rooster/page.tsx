"use client";

import { useState } from "react";
import { RosterProvider, useRoster } from "./components/context";
import TabBar from "../components/TabBar";
import TasksTab from "./components/TasksTab";
import InstructorsTab from "./components/InstructorsTab";
import ResultTab from "./components/ResultTab";
import { LoadingScreen } from "../components/loadingScreen";

const TABS = [
  { id: "taken", label: "Taken" },
  { id: "instructeurs", label: "Instructeurs" },
  { id: "resultaat", label: "Resultaat" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function RoosterPage() {
  return (
    <RosterProvider>
      <RoosterInner />
    </RosterProvider>
  );
}

function RoosterInner() {
  const {
    error,
    loading,
    people,
    tasks,
    step,
    handleSolve,
    restoreDefaults,
    reset,
  } = useRoster();
  const [tab, setTab] = useState<TabId>("taken");

  const canSolve = people.length > 0 && tasks.length > 0;

  return (
    <div className="flex flex-col gap-6">
      <LoadingScreen show={loading} text={"Rooster oplossen..."}/>
      <div className="flex items-center justify-between print:hidden">
        <h1 className="text-2xl font-bold tracking-tight">Rooster</h1>

        <div className="flex gap-3">
        <button
          onClick={() => {
            handleSolve();
            setTab("resultaat");
          }}
          disabled={loading || !canSolve}
          className="self-start rounded-lg bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 print:hidden dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {loading ? "Bezig…" : "Rooster maken"}
        </button>
          <button
            onClick={restoreDefaults}
            className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            Herstel standaard
          </button>
          <button
            onClick={reset}
            className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            Reset alles
          </button>
        </div>

      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 print:hidden dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="print:hidden">
        <TabBar tab={tab} setTab={setTab} tabs={TABS} />
      </div>

      {tab === "taken" && <TasksTab />}
      {tab === "instructeurs" && <InstructorsTab />}
      {tab === "resultaat" && <ResultTab />}

    </div>
  );
}
