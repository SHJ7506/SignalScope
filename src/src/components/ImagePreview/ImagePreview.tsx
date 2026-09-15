import React from "react";
import { X } from "lucide-react";
import { formatFileSize } from "../../utils/fileValidation";

interface ImagePreviewProps {
  file: File;
  previewUrl: string;
  onRemove: () => void;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({
  file,
  previewUrl,
  onRemove,
}) => {
  return (
    <div className="w-full border border-line bg-panel2 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-line">
        <span className="text-[10px] font-bold tracking-[0.25em] text-fog">
          PREVIEW
        </span>
        <button
          onClick={onRemove}
          aria-label="Remove selected image"
          className="flex items-center gap-1 px-2 py-1 text-[10px] tracking-[0.2em] text-dim hover:text-alert transition-colors focus:outline-none focus:ring-1 focus:ring-alert"
        >
          <X size={12} />
          REMOVE
        </button>
      </div>

      <div className="flex items-center justify-center bg-void p-4 max-h-96">
        <img
          src={previewUrl}
          alt={`Preview of uploaded image: ${file.name}`}
          className="max-w-full max-h-80 object-contain border border-line"
        />
      </div>

      <div className="flex items-center justify-between px-4 py-2 border-t border-line text-[10px] tracking-wider">
        <span className="truncate text-fog" title={file.name}>
          {file.name}
        </span>
        <span className="text-dim flex-shrink-0 ml-3">
          {formatFileSize(file.size)}
        </span>
      </div>
    </div>
  );
};
