import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { RobustnessResult } from "../../types/analysis";
import clsx from "clsx";

interface RobustnessChartProps {
  robustness: RobustnessResult;
}

const TRANSFORMATIONS: { key: keyof RobustnessResult; label: string }[] = [
  { key: "original", label: "ORIGINAL" },
  { key: "compressed", label: "JPEG" },
  { key: "resized", label: "RESIZED" },
  { key: "screenshot", label: "SCREEN" },
];

const BAR_COLOR = "var(--accent)";
const LOW_COLOR = "var(--warn)";

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="border border-line2 bg-panel px-3 py-2 text-xs">
        <p className="text-dim tracking-widest">{label}</p>
        <p className="text-neon font-bold">
          {Math.round(payload[0].value * 100)}%
        </p>
      </div>
    );
  }
  return null;
};

export const RobustnessChart: React.FC<RobustnessChartProps> = ({
  robustness,
}) => {
  const chartData = TRANSFORMATIONS.map(({ key, label }) => ({
    name: label,
    confidence: robustness[key],
  }));

  return (
    <section
      aria-labelledby="robustness-heading"
      className="border border-line bg-panel"
    >
      <div className="px-4 py-2 border-b border-line">
        <h2
          id="robustness-heading"
          className="text-[10px] font-bold tracking-[0.25em] text-fog"
        >
          ROBUSTNESS
        </h2>
        <p className="text-[10px] text-dim">
          Score holds up after edits &amp; compression
        </p>
      </div>

      <div className="h-52 p-4" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 5, right: 10, left: -14, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fill: "var(--muted)", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 1]}
              tickFormatter={(v: number) => `${Math.round(v * 100)}%`}
              tick={{ fill: "var(--muted)", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={40}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "color-mix(in srgb, var(--accent) 6%, transparent)" }}
            />
            <Bar dataKey="confidence" radius={[0, 0, 0, 0]}>
              {chartData.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={entry.confidence < 0.7 ? LOW_COLOR : BAR_COLOR}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Neat numeric readout of the chart */}
      <ul className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-line border-t border-line">
        {TRANSFORMATIONS.map(({ key, label }) => {
          const val = robustness[key];
          const low = val < 0.7;
          return (
            <li key={key} className="bg-panel px-4 py-3 text-center">
              <p className="text-[10px] tracking-[0.2em] text-dim">{label}</p>
              <p
                className={clsx(
                  "text-sm font-bold tabular-nums",
                  low ? "text-warn" : "text-neon"
                )}
              >
                {Math.round(val * 100)}%
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
};
