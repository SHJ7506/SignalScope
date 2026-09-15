import React from "react";
import { Map } from "lucide-react";

interface EvidenceMapProps {
  previewUrl: string;
  overlayUrl?: string;
}

export const EvidenceMap: React.FC<EvidenceMapProps> = ({ previewUrl, overlayUrl }) => {
  return (
    <section aria-labelledby="evidence-map-heading" className="border border-line bg-panel">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-line">
        <Map size={12} className="text-neondim" />
        <h2
          id="evidence-map-heading"
          className="text-[10px] font-bold tracking-[0.25em] text-fog"
        >
          EVIDENCE MAP
        </h2>
      </div>

      <div className="p-4">
        <div className={`grid ${overlayUrl ? "grid-cols-2" : "grid-cols-1"} gap-3`}>
          <div className="flex flex-col gap-2">
            <p className="text-[10px] tracking-[0.2em] text-dim text-center">
              ORIGINAL
            </p>
            <div className="flex items-center justify-center bg-void border border-line p-3 min-h-40">
              <img
                src={previewUrl}
                alt="Original uploaded image"
                className="max-h-64 max-w-full object-contain"
              />
            </div>
          </div>

          {overlayUrl && (
            <div className="flex flex-col gap-2">
              <p className="text-[10px] tracking-[0.2em] text-dim text-center">
                AI EVIDENCE HEATMAP
              </p>
              <div className="flex items-center justify-center bg-void border border-line p-3 min-h-40">
                <img
                  src={overlayUrl}
                  alt="Grad-CAM evidence heatmap highlighting suspicious regions"
                  className="max-h-64 max-w-full object-contain"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
