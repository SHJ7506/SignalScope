import React from "react";

interface ExplanationCardProps {
  explanation: string;
}

export const ExplanationCard: React.FC<ExplanationCardProps> = ({
  explanation,
}) => {
  return (
    <section aria-labelledby="explanation-heading" className="border border-line bg-panel">
      <div
        id="explanation-heading"
        className="px-4 py-2 border-b border-line text-[10px] font-bold tracking-[0.25em] text-fog"
      >
        WHY THIS VERDICT
      </div>
      <blockquote className="border-l-2 border-neon px-4 py-4">
        <p className="text-sm text-fog leading-relaxed">{explanation}</p>
      </blockquote>
    </section>
  );
};
