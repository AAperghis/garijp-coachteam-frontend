"use client";

import { useState } from "react";
import { useBanaan } from "./context";
import TimelineView from "./TimelineView";
import TabBar from "../../components/TabBar";

const RESULT_TABS = [
  { id: "timeline", label: "Timeline" },
  { id: "rides", label: "Rides" },
] as const;

type ResultTab = (typeof RESULT_TABS)[number]["id"];

export default function ResultStep() {
  const { step, result, loading, handleDownload, handleSaveDevResult } = useBanaan();
  const [tab, setTab] = useState<ResultTab>("timeline");

  if (step !== "result" || !result) return null;

  const hasTimeline = result.times && result.instructor_timeline && result.student_timeline;

  return (
    <div className="flex flex-col gap-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <div className="text-2xl font-bold">{result.total_rides}</div>
          <div className="text-sm text-zinc-500">Rides</div>
        </div>
        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <div className="text-2xl font-bold">
            {result.total_banana_students}
          </div>
          <div className="text-sm text-zinc-500">Banana students</div>
        </div>
        {hasTimeline && (
          <>
            <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
              <div className="text-2xl font-bold">
                {Object.keys(result.instructor_timeline).length}
              </div>
              <div className="text-sm text-zinc-500">Instructors</div>
            </div>
            <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
              <div className="text-2xl font-bold">{result.times.length}</div>
              <div className="text-sm text-zinc-500">Time slots</div>
            </div>
          </>
        )}
      </div>

      {hasTimeline && <TabBar tab={tab} setTab={setTab} tabs={RESULT_TABS} />}

      {/* Timeline view */}
      <div className={!hasTimeline || tab !== "timeline" ? "hidden" : ""}>
        <TimelineView result={result} />
      </div>

      {/* Rides table */}
      <div className={hasTimeline && tab !== "rides" ? "hidden" : ""}>
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
              <tr>
                <th className="px-4 py-2">#</th>
                <th className="px-4 py-2">Time</th>
                <th className="px-4 py-2">Students</th>
                <th className="px-4 py-2">Count</th>
                <th className="px-4 py-2">Transport</th>
              </tr>
            </thead>
            <tbody>
              {result.rides.map((r, i) => (
                <tr
                  key={i}
                  className="border-b border-zinc-100 dark:border-zinc-800"
                >
                  <td className="px-4 py-2">{i + 1}</td>
                  <td className="px-4 py-2">{r.time}</td>
                  <td className="px-4 py-2">{r.students.join(", ")}</td>
                  <td className="px-4 py-2">{r.count}</td>
                  <td className="px-4 py-2">
                    {r.transport_instructors.join(", ") || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleDownload}
          disabled={loading}
          className="self-start rounded-lg bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {loading ? "Downloading…" : "Download XLSX"}
        </button>
        {process.env.NODE_ENV === "development" && (
          <button
            onClick={handleSaveDevResult}
            className="self-start rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            Save dev fixture
          </button>
        )}
      </div>
    </div>
  );
}
