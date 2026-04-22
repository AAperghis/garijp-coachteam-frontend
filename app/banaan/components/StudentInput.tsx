"use client";

import { useBanaan } from "./context";
import SearchableSelect from "./SearchableSelect";
import { DISCIPLINES } from "../disciplines";
import type { StudentInput as StudentType, InstructorInput, ConfigInput } from "../types";
import { useState } from "react";
import TabBar from "../../components/TabBar";

const cellClass =
  "w-full bg-transparent px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-garijp-blue";

const inputTabs = [
  { id: "students", label: "Students" },
  { id: "instructors", label: "Instructors" },
  { id: "config", label: "Config" },
] as const;

export default function StudentInputStep() {
  const {
    step,
    students,
    instructors,
    config,
    timeout,
    setStudents,
    setInstructors,
    setConfig,
    setTimeout,
  } = useBanaan();
  const [currentView, setCurrentView] = useState<"students" | "instructors" | "config">("students");

  if ((step !== "preview" && step !== "result") || !students || !instructors || !config)
    return null;

  function updateStudent<K extends keyof StudentType>(
    index: number,
    key: K,
    value: StudentType[K],
  ) {
    setStudents((prev) => {
      if (!prev) return prev;
      const next = [...prev];
      next[index] = { ...next[index], [key]: value };
      return next;
    });
  }

  function updateInstructor<K extends keyof InstructorInput>(
    index: number,
    key: K,
    value: InstructorInput[K],
  ) {
    setInstructors((prev) => {
      if (!prev) return prev;
      const next = [...prev];
      next[index] = { ...next[index], [key]: value };
      return next;
    });
  }

  function updateConfig<K extends keyof ConfigInput>(key: K, value: ConfigInput[K]) {
    setConfig((prev) => {
      if (!prev) return prev;
      return { ...prev, [key]: value };
    });
  }

  const studentNames = students.map((s) => s.name);
  const instructorNames = instructors.map((inst) => inst.name);
  const disciplineOptions = [...DISCIPLINES];

  return (
    <div className="flex flex-col gap-6">
      <TabBar tab={currentView} setTab={setCurrentView} tabs={inputTabs} />

      <section className={currentView !== "students" ? "hidden" : ""}>
        <h2 className="mb-2 text-lg font-semibold">
          Students ({students.length})
        </h2>
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Discipline</th>
                <th className="px-4 py-2">Instructor</th>
                <th className="px-4 py-2">Banana?</th>
                <th className="px-4 py-2">Friends</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s, i) => (
                <tr
                  key={i}
                  className="border-b border-zinc-100 dark:border-zinc-800"
                >
                  <td>
                    <input
                      className={cellClass}
                      value={s.name}
                      onChange={(e) => updateStudent(i, "name", e.target.value)}
                    />
                  </td>
                  <td>
                    <SearchableSelect
                      value={s.discipline}
                      options={disciplineOptions}
                      onChange={(v) => updateStudent(i, "discipline", v)}
                    />
                  </td>
                  <td>
                    <SearchableSelect
                      value={s.instructor}
                      options={instructorNames}
                      onChange={(v) => updateStudent(i, "instructor", v)}
                    />
                  </td>
                  <td className="px-2">
                    <input
                      type="checkbox"
                      checked={s.wants_banana}
                      onChange={(e) => updateStudent(i, "wants_banana", e.target.checked)}
                      className="h-4 w-4 accent-garijp-blue"
                    />
                  </td>
                  <td>
                    <SearchableSelect
                      value={s.friends?.[0] ?? ""}
                      options={studentNames.filter((n) => n !== s.name)}
                      onChange={(v) => updateStudent(i, "friends", v ? [v] : null)}
                      placeholder="—"
                      allowEmpty
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className={currentView !== "instructors" ? "hidden" : ""}>
        <h2 className="mb-2 text-lg font-semibold">
          Instructors ({instructors.length})
        </h2>
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Discipline</th>
                <th className="px-4 py-2">Transport Capacity</th>
              </tr>
            </thead>
            <tbody>
              {instructors.map((inst, i) => (
                <tr
                  key={i}
                  className="border-b border-zinc-100 dark:border-zinc-800"
                >
                  <td>
                    <input
                      className={cellClass}
                      value={inst.name}
                      onChange={(e) => updateInstructor(i, "name", e.target.value)}
                    />
                  </td>
                  <td>
                    <SearchableSelect
                      value={inst.discipline}
                      options={disciplineOptions}
                      onChange={(v) => updateInstructor(i, "discipline", v)}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      className={cellClass}
                      value={inst.transport_capacity}
                      onChange={(e) =>
                        updateInstructor(i, "transport_capacity", Number(e.target.value))
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className={currentView !== "config" ? "hidden" : ""}>
        <h2 className="mb-2 text-lg font-semibold">Config</h2>
        <div className="grid grid-cols-2 gap-2 rounded-lg border border-zinc-200 p-4 text-sm dark:border-zinc-800 sm:grid-cols-3">
          <label className="flex flex-col gap-1">
            <span className="text-zinc-500">Boat capacity</span>
            <input
              type="number"
              className="rounded border border-zinc-200 bg-transparent px-2 py-1 dark:border-zinc-700"
              value={config.boat_capacity}
              onChange={(e) => updateConfig("boat_capacity", Number(e.target.value))}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-zinc-500">Slot duration (min)</span>
            <input
              type="number"
              className="rounded border border-zinc-200 bg-transparent px-2 py-1 dark:border-zinc-700"
              value={config.slot_duration_min}
              onChange={(e) => updateConfig("slot_duration_min", Number(e.target.value))}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-zinc-500">Prep slots</span>
            <input
              type="number"
              className="rounded border border-zinc-200 bg-transparent px-2 py-1 dark:border-zinc-700"
              value={config.prep_slots}
              onChange={(e) => updateConfig("prep_slots", Number(e.target.value))}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-zinc-500">Transit slots</span>
            <input
              type="number"
              className="rounded border border-zinc-200 bg-transparent px-2 py-1 dark:border-zinc-700"
              value={config.transit_slots}
              onChange={(e) => updateConfig("transit_slots", Number(e.target.value))}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-zinc-500">Start time</span>
            <input
              type="time"
              className="rounded border border-zinc-200 bg-transparent px-2 py-1 dark:border-zinc-700"
              value={config.start_time}
              onChange={(e) => updateConfig("start_time", e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-zinc-500">End time</span>
            <input
              type="time"
              className="rounded border border-zinc-200 bg-transparent px-2 py-1 dark:border-zinc-700"
              value={config.end_time}
              onChange={(e) => updateConfig("end_time", e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-zinc-500">Solver timeout (s)</span>
            <input
              type="number"
              min={30}
              max={3600}
              className="rounded border border-zinc-200 bg-transparent px-2 py-1 dark:border-zinc-700"
              value={timeout}
              onChange={(e) => setTimeout(Number(e.target.value))}
            />
          </label>
        </div>
      </section>
    </div>
  );
}
