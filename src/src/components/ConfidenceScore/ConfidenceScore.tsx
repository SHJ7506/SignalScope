import React, { useEffect, useRef, useState } from "react";
import type { Verdict } from "../../types/analysis";
import clsx from "clsx";

interface ConfidenceScoreProps {
  confidence: number; // 0.0 – 1.0
  verdict: Verdict;
}

export const ConfidenceScore: React.FC<ConfidenceScoreProps> = ({
  confidence,
  verdict,
}) => {
  const percentage = Math.round(confidence * 100);
  const [animated, setAnimated] = useState(0);
  const rafRef = useRef<number | null>(null);

  const isAI = verdict === "LIKELY_AI_GENERATED";
  const barColor = isAI ? "bg-alert" : "bg-neon";
  const textColor = isAI ? "text-alert glow-alert" : "text-neon glow";

  useEffect(() => {
    let start: number | null = null;
    const duration = 900;

    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimated(Math.round(eased * percentage));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      }
    };

    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [percentage]);

  return (
    <div
      role="region"
      aria-label={`Confidence score: ${percentage}%`}
      className="border border-line bg-panel"
    >
      <div className="px-4 py-2 border-b border-line">
        <p className="text-[10px] font-bold tracking-[0.25em] text-fog">
          CONFIDENCE
        </p>
        <p className="text-[10px] text-dim">How sure the model is</p>
      </div>
      <div className="px-4 py-5">
        <span
          className={clsx("text-4xl font-extrabold tabular-nums", textColor)}
          aria-live="polite"
        >
          {animated}%
        </span>

        <div
          className="relative mt-4 h-2 w-full bg-panel2 overflow-hidden"
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${percentage}% confidence`}
        >
          <div
            className={clsx("h-full transition-all duration-900", barColor)}
            style={{ width: `${animated}%` }}
          />
        </div>
      </div>
    </div>
  );
};
