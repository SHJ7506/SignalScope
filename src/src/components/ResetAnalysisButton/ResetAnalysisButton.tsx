import React from "react";
import { RotateCcw } from "lucide-react";

interface ResetAnalysisButtonProps {
  onClick: () => void;
}

export const ResetAnalysisButton: React.FC<ResetAnalysisButtonProps> = ({
  onClick,
}) => {
  return (
    <button
      id="reset-analysis-button"
      onClick={onClick}
      className="flex items-center gap-2 rounded-lg bg-neon text-void glow px-6 py-3 text-xs font-extrabold tracking-[0.2em] transition hover:brightness-110 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-neon/60"
    >
      <RotateCcw size={14} />
      [ ANALYSE ANOTHER ]
    </button>
  );
};
