import React from "react";
import { Loader2 } from "lucide-react";
import clsx from "clsx";

interface AnalyzeButtonProps {
  disabled: boolean;
  loading: boolean;
  onClick: () => void;
}

export const AnalyzeButton: React.FC<AnalyzeButtonProps> = ({
  disabled,
  loading,
  onClick,
}) => {
  return (
    <button
      id="analyze-button"
      onClick={onClick}
      disabled={disabled || loading}
      aria-disabled={disabled || loading}
      aria-busy={loading}
      className={clsx(
        "w-full flex items-center justify-center gap-3 px-8 py-3.5",
        "text-sm font-extrabold tracking-[0.3em] transition-all duration-200",
        "focus:outline-none focus:ring-2 focus:ring-neon focus:ring-offset-2 focus:ring-offset-panel",
        disabled || loading
          ? "bg-panel2 text-dim border border-line cursor-not-allowed"
          : "bg-neon text-void glow hover:brightness-110 active:scale-[0.99]"
      )}
    >
      {loading ? (
        <>
          <Loader2 size={16} className="animate-spin" />
          SCANNING…
        </>
      ) : (
        <>[ ANALYZE ]</>
      )}
    </button>
  );
};
