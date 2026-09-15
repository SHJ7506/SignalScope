import React from "react";
import type { GeneralizationResult } from "../../types/analysis";

interface GeneralizationCardProps {
  generalization: GeneralizationResult;
}

export const GeneralizationCard: React.FC<GeneralizationCardProps> = ({
  generalization,
}) => {
  const aucPercent =
    generalization.auc != null ? Math.round(generalization.auc * 100) : null;

  return (
    <section aria-labelledby="generalization-heading" className="border border-line bg-panel">
      <div className="px-4 py-2 border-b border-line">
        <h2
          id="generalization-heading"
          className="text-[10px] font-bold tracking-[0.25em] text-fog"
        >
          GENERALIZATION
        </h2>
        <p className="text-[10px] text-dim">Performance on unseen AI generators</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-line">
        <div className="bg-panel px-4 py-4">
          <p className="text-[10px] tracking-[0.2em] text-dim mb-1">AUC</p>
          {aucPercent != null ? (
            <p className="text-sm font-bold text-neon tabular-nums">
              {generalization.auc!.toFixed(2)}
              <span className="text-dim"> /1.00</span>
            </p>
          ) : (
            <p className="text-sm text-dim">N/A</p>
          )}
        </div>

        <div className="bg-panel px-4 py-4 flex flex-col justify-center">
          <p className="text-[10px] tracking-[0.2em] text-dim mb-2">SCORE</p>
          {aucPercent != null ? (
            <>
              <div className="h-1.5 w-full bg-panel2 overflow-hidden">
                <div
                  className="h-full bg-neon"
                  style={{ width: `${aucPercent}%` }}
                />
              </div>
              <p className="text-[10px] text-neondim mt-1 tabular-nums">
                {aucPercent}%
              </p>
            </>
          ) : (
            <p className="text-sm text-dim">N/A</p>
          )}
        </div>
      </div>
    </section>
  );
};
