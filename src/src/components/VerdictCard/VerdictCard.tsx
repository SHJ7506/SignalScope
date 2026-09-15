import React from "react";
import type { Verdict } from "../../types/analysis";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import clsx from "clsx";

interface VerdictCardProps {
  verdict: Verdict;
}

const VERDICT_CONFIG = {
  LIKELY_AI_GENERATED: {
    label: "LIKELY AI-GENERATED",
    plain: "Shows signs of AI generation.",
    icon: <ShieldAlert size={22} />,
    panelClass: "border-alert/60",
    textClass: "text-alert glow-alert",
  },
  LIKELY_REAL: {
    label: "LIKELY REAL",
    plain: "Consistent with a real photograph.",
    icon: <ShieldCheck size={22} />,
    panelClass: "border-neon/60",
    textClass: "text-neon glow",
  },
} as const;

export const VerdictCard: React.FC<VerdictCardProps> = ({ verdict }) => {
  const cfg = VERDICT_CONFIG[verdict];

  return (
    <div
      role="region"
      aria-label={`Verdict: ${cfg.label}`}
      className={clsx("border bg-panel", cfg.panelClass)}
    >
      <div className="px-4 py-2 border-b border-line text-[10px] font-bold tracking-[0.25em] text-fog">
        VERDICT
      </div>
      <div className="px-4 py-4">
        <div className="flex items-center gap-3">
          <span className={cfg.textClass}>{cfg.icon}</span>
          <span
            className={clsx(
              "text-base sm:text-lg font-extrabold tracking-[0.15em]",
              cfg.textClass
            )}
          >
            {cfg.label}
          </span>
        </div>
        <p className="mt-2 text-xs text-fog">{cfg.plain}</p>
      </div>
    </div>
  );
};
