"use client";

import { useState } from "react";
import { RosterProvider, useRoster } from "./components/context";
import { ROOSTER_PRESETS, DEFAULT_PRESET_KEY } from "./defaults";
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
    weekId,
    config,
    setConfig,
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
  const [presetKey, setPresetKey] = useState(DEFAULT_PRESET_KEY);

  const canSolve = people.length > 0 && tasks.length > 0;

  if (weekId === null) {
    return (
      <div className="rounded-lg border border-zinc-200 p-8 text-center text-zinc-500 dark:border-zinc-800">
        Selecteer of maak eerst een week aan (rechtsboven).
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <LoadingScreen show={loading} text={"Rooster oplossen..."}/>
      <div className="flex items-center justify-between print:hidden">
        <h1 className="text-2xl font-bold tracking-tight">Rooster</h1>

        <div className="flex items-center gap-3">
          <select
            value={presetKey}
            onChange={(e) => {
              const key = e.target.value;
              const preset = ROOSTER_PRESETS[key];
              if (preset) {
                setPresetKey(key);
                setConfig({ ...preset });
              }
            }}
            className="rounded-lg border border-zinc-200 bg-transparent px-3 py-2 text-sm dark:border-zinc-700"
          >
            {Object.keys(ROOSTER_PRESETS).map((label) => (
              <option key={label} value={label}>
                {label}
              </option>
            ))}
          </select>
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
            onClick={() => { setPresetKey(DEFAULT_PRESET_KEY); restoreDefaults(); }}
            className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            Herstel standaard
          </button>
          <button
            onClick={() => { setPresetKey(DEFAULT_PRESET_KEY); reset(); }}
            className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            Reset alles
          </button>
        </div>

      </div>

      {error && (
        <div className="whitespace-pre-line rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 print:hidden dark:border-red-900 dark:bg-red-950 dark:text-red-300">
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
