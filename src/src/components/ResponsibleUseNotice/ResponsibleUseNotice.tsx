import React from "react";

export const ResponsibleUseNotice: React.FC = () => {
  return (
    <aside
      aria-labelledby="responsible-use-heading"
      className="border border-line bg-panel2 px-4 py-3"
    >
      <p
        id="responsible-use-heading"
        className="text-[10px] tracking-[0.2em] text-dim text-center"
      >
        PROBABILISTIC OUTPUT — VERIFY BEFORE ACTING
      </p>
    </aside>
  );
};
