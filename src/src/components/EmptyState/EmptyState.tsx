import React from "react";
import { ScanSearch } from "lucide-react";

export const EmptyState: React.FC = () => {
  return (
    <div className="flex flex-col items-center gap-3 py-4 text-center">
      <ScanSearch size={28} className="text-dim" />
      <p className="text-[10px] tracking-[0.3em] text-dim">
        &gt; AWAITING INPUT
      </p>
    </div>
  );
};
