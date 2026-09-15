import React from "react";
import type { AnalysisError } from "../../types/analysis";
import { AlertTriangle } from "lucide-react";

interface ErrorMessageProps {
  error: AnalysisError;
  onRetry?: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  error,
  onRetry,
}) => {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="border border-alert/60 bg-alert/10 p-5 flex flex-col items-center gap-3 text-center"
    >
      <AlertTriangle size={24} className="text-alert" />
      <p className="text-sm font-bold tracking-[0.25em] text-alert">
        ANALYSIS FAILED
      </p>
      <p className="text-xs text-fog">{error.message}</p>

      {onRetry && (
        <button
          onClick={onRetry}
          className="bg-alert text-void px-5 py-2 text-[10px] font-extrabold tracking-[0.25em] hover:brightness-110 transition-all focus:outline-none focus:ring-2 focus:ring-alert"
        >
          [ RETRY ]
        </button>
      )}
    </div>
  );
};
