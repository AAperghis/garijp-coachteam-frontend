"use client";

import { useState } from "react";
import { useBanaan, type SolveProgress } from "./context";

// ── Simple SVG line chart ───────────────────────────────────────────────

interface ChartProps {
  history: SolveProgress[];
  width?: number;
  height?: number;
}

function ConvergenceChart({ history, width = 600, height = 200 }: ChartProps) {
  if (history.length < 2) return null;

  const pad = { top: 24, right: 16, bottom: 32, left: 48 };
  const w = width - pad.left - pad.right;
  const h = height - pad.top - pad.bottom;

  const maxTime = history[history.length - 1].elapsed;
  const minTime = 0;

  // Objective values (lower is better for the solver, but we show quality = 1 - gap)
  const qualityPoints = history
    .filter((p) => p.solutions_found > 0)
    .map((p) => ({ t: p.elapsed, q: (1 - p.gap) * 100 }));

  if (qualityPoints.length < 1) return null;

  const x = (t: number) => pad.left + ((t - minTime) / (maxTime - minTime || 1)) * w;
  const y = (q: number) => pad.top + h - (q / 100) * h;

  // Build polyline for quality
  const qualityLine = qualityPoints.map((p) => `${x(p.t)},${y(p.q)}`).join(" ");

  // Y-axis ticks
  const yTicks = [0, 25, 50, 75, 100];
  // X-axis ticks — up to 5 evenly spaced
  const xTickCount = Math.min(5, Math.floor(maxTime));
  const xTicks = Array.from({ length: xTickCount + 1 }, (_, i) =>
    Math.round((maxTime / xTickCount) * i),
  );

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full"
      style={{ maxWidth: width }}
    >
      {/* Grid lines */}
      {yTicks.map((tick) => (
        <g key={`y-${tick}`}>
          <line
            x1={pad.left}
            x2={width - pad.right}
            y1={y(tick)}
            y2={y(tick)}
            className="stroke-zinc-200 dark:stroke-zinc-700"
            strokeWidth={1}
            strokeDasharray={tick === 0 || tick === 100 ? undefined : "4 2"}
          />
          <text
            x={pad.left - 6}
            y={y(tick) + 4}
            textAnchor="end"
            className="fill-zinc-400 text-[10px]"
          >
            {tick}%
          </text>
        </g>
      ))}

      {/* X-axis ticks */}
      {xTicks.map((tick) => (
        <g key={`x-${tick}`}>
          <text
            x={x(tick)}
            y={height - pad.bottom + 16}
            textAnchor="middle"
            className="fill-zinc-400 text-[10px]"
          >
            {tick}s
          </text>
        </g>
      ))}

      {/* Quality line */}
      <polyline
        points={qualityLine}
        fill="none"
        className="stroke-green-500"
        strokeWidth={2}
        strokeLinejoin="round"
      />

      {/* Dots on solution improvements */}
      {qualityPoints.map((p, i) => (
        <circle
          key={i}
          cx={x(p.t)}
          cy={y(p.q)}
          r={3}
          className="fill-green-500"
        />
      ))}

      {/* Axis labels */}
      <text
        x={width / 2}
        y={height - 2}
        textAnchor="middle"
        className="fill-zinc-500 text-[11px]"
      >
        Time (s)
      </text>
      <text
        x={12}
        y={height / 2}
        textAnchor="middle"
        transform={`rotate(-90, 12, ${height / 2})`}
        className="fill-zinc-500 text-[11px]"
      >
        Quality
      </text>
    </svg>
  );
}

// ── Detailed stats table ────────────────────────────────────────────────

function DetailedStats({ history }: { history: SolveProgress[] }) {
  const last = history[history.length - 1];
  if (!last) return null;

  const firstSolution = history.find((p) => p.solutions_found > 0);
  const timeToFirst = firstSolution ? firstSolution.elapsed : null;
  const totalTime = last.elapsed;

  const rows: [string, string][] = [
    ["Total solve time", `${totalTime.toFixed(1)}s`],
    ["Time to first solution", timeToFirst != null ? `${timeToFirst.toFixed(1)}s` : "–"],
    ["Solutions explored", `${last.solutions_found}`],
    ["Final objective", `${last.objective.toFixed(0)}`],
    ["Bound", `${last.bound.toFixed(0)}`],
    ["Optimality gap", `${(last.gap * 100).toFixed(2)}%`],
    ["Solution quality", `${((1 - last.gap) * 100).toFixed(1)}%`],
  ];

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
      <table className="w-full text-left text-sm">
        <tbody>
          {rows.map(([label, value]) => (
            <tr
              key={label}
              className="border-b border-zinc-100 last:border-b-0 dark:border-zinc-800"
            >
              <td className="px-4 py-2 text-zinc-500">{label}</td>
              <td className="px-4 py-2 font-medium">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Rating helpers ──────────────────────────────────────────────────────

type Rating = "good" | "meh" | "bad";

function getRating(gap: number, solutionsFound: number): Rating {
  if (solutionsFound === 0) return "bad";
  if (gap === 0 || gap < 0.05) return "good";   // optimal or <5% gap
  if (gap < 0.20) return "meh";                  // <20% gap
  return "bad";
}

const RATING_CONFIG: Record<Rating, { label: string; emoji: string; color: string; bg: string }> = {
  good: { label: "Good", emoji: "✓", color: "text-green-600 dark:text-green-400", bg: "bg-green-100 dark:bg-green-900/30" },
  meh:  { label: "Meh",  emoji: "~", color: "text-yellow-600 dark:text-yellow-400", bg: "bg-yellow-100 dark:bg-yellow-900/30" },
  bad:  { label: "Bad",  emoji: "✗", color: "text-red-600 dark:text-red-400", bg: "bg-red-100 dark:bg-red-900/30" },
};

// ── Main component ──────────────────────────────────────────────────────

export default function SolveQuality() {
  const { progressHistory } = useBanaan();
  const [showDetails, setShowDetails] = useState(false);

  if (progressHistory.length === 0) return null;

  const last = progressHistory[progressHistory.length - 1];
  const rating = getRating(last.gap, last.solutions_found);
  const cfg = RATING_CONFIG[rating];

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      {/* Simple summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold ${cfg.bg} ${cfg.color}`}>
            {cfg.emoji}
          </span>
          <span className="text-sm font-medium">
            Solution quality:{" "}
            <span className={cfg.color}>{cfg.label}</span>
          </span>
        </div>
        <button
          onClick={() => setShowDetails((v) => !v)}
          className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          {showDetails ? "Hide details" : "Show details"}
        </button>
      </div>

      {/* Expanded details */}
      {showDetails && (
        <div className="flex flex-col gap-4 pt-2">
          {/* Explanation */}
          <div className="rounded-lg bg-zinc-50 p-3 text-xs leading-relaxed text-zinc-600 dark:bg-zinc-800/50 dark:text-zinc-400">
            <p className="mb-2">
              The solver uses constraint programming to find the best schedule.
              The <strong>optimality gap</strong> measures how far the current
              solution could be from the theoretical best — a gap of 0% means
              the solution is provably optimal.
            </p>
            <p className="mb-1 font-medium text-zinc-700 dark:text-zinc-300">Typical values:</p>
            <ul className="list-inside list-disc space-y-0.5">
              <li><strong>&lt; 5%</strong> — Excellent. The schedule is near-optimal.</li>
              <li><strong>5 – 20%</strong> — Good enough. Minor improvements may be possible but unlikely to matter in practice.</li>
              <li><strong>&gt; 20%</strong> — The solver may need more time. Try increasing the timeout.</li>
            </ul>
            <p className="mt-2 text-zinc-500 dark:text-zinc-500">
              This problem is computationally hard, so reaching 5–15% gap in a
              few minutes is normal. The gap is a worst-case bound — the actual
              schedule is usually much closer to optimal than the gap suggests.
            </p>
          </div>

          <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            Convergence over time
          </h3>
          <ConvergenceChart history={progressHistory} />
          <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            Solver statistics
          </h3>
          <DetailedStats history={progressHistory} />
        </div>
      )}
    </div>
  );
}
