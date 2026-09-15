import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

const STEPS = [
  "PREPARE IMAGE",
  "AI DETECTION",
  "EVIDENCE MAP",
  "ROBUSTNESS",
  "COMPILE REPORT",
];

const STEP_INTERVAL_MS = 1500;

export const AnalysisLoader: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((s) => Math.min(s + 1, STEPS.length - 1));
    }, STEP_INTERVAL_MS);

    return () => clearInterval(timer);
  }, []);

  return (
    <div
      role="status"
      aria-label="Analyzing image, please wait"
      className="flex flex-col items-center gap-6 py-8"
    >
      <Loader2 size={36} className="animate-spin text-neon glow" />

      <p className="text-sm font-bold tracking-[0.3em] text-bright">
        ANALYSING
      </p>

      <ol className="w-full max-w-xs flex flex-col gap-2" aria-live="polite">
        {STEPS.map((label, i) => {
          const isDone = i < activeStep;
          const isActive = i === activeStep;
          return (
            <li
              key={label}
              className={`flex items-center gap-2 text-xs tracking-[0.2em] transition-colors duration-500 ${
                isDone
                  ? "text-neondim"
                  : isActive
                  ? "text-bright"
                  : "text-dim"
              }`}
            >
              <span aria-hidden="true" className={isActive ? "text-neon" : ""}>
                {isDone ? "✓" : isActive ? ">" : "·"}
              </span>
              <span>{label}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
};
