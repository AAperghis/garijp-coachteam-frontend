"use client";

import { useDisciplines } from "../context/disciplineContext";

interface DisciplineSelectProps {
  value: string;
  onChange: (key: string) => void;
  /** Hide disciplines flagged `for_cursists: false` (e.g. shore staff). */
  forCursists?: boolean;
  /** Hide disciplines flagged `for_staff: false` (e.g. Zwaardboot Eenmans/Tweemans). */
  forStaff?: boolean;
  className?: string;
  disabled?: boolean;
}

const defaultClass =
  "rounded border border-zinc-200 bg-transparent px-2 py-1 text-sm dark:border-zinc-700";

export default function DisciplineSelect({
  value,
  onChange,
  forCursists,
  forStaff,
  className,
  disabled,
}: DisciplineSelectProps) {
  const { options, labelOf, resolve } = useDisciplines();
  const opts = options({ forCursists, forStaff });
  const current = value ? resolve(value) : "";
  // Keep legacy/unknown values (e.g. a bare group key from an old upload) selectable.
  const unknown = current && !opts.some((o) => o.key === current);

  return (
    <select
      value={current}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={className ?? defaultClass}
    >
      <option value="">—</option>
      {unknown && <option value={current}>{labelOf(current)} (oud)</option>}
      {opts.map((o) => (
        <option key={o.key} value={o.key}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
