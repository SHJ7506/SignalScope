import React, { useCallback, useRef, useState } from "react";
import { Upload, ImageIcon } from "lucide-react";
import { SUPPORTED_EXTENSIONS } from "../../constants/config";
import { validateImageFile } from "../../utils/fileValidation";
import clsx from "clsx";

interface ImageUploaderProps {
  onFileSelected: (file: File) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  onFileSelected,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleFile = useCallback(
    (file: File) => {
      const result = validateImageFile(file);
      if (!result.valid) {
        setValidationError(result.error ?? "Invalid file.");
        return;
      }
      setValidationError(null);
      onFileSelected(file);
    },
    [onFileSelected]
  );

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  };

  const onDragLeave = () => setDragOver(false);

  return (
    <div className="w-full">
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload image — click or drag and drop"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={clsx(
          "relative flex flex-col items-center justify-center gap-4",
          "border border-dashed p-10 cursor-pointer transition-colors duration-200",
          dragOver
            ? "border-neon bg-panel2"
            : "border-line2 bg-panel2/40 hover:border-neondim"
        )}
      >
        {dragOver ? (
          <ImageIcon size={32} className="text-neon" />
        ) : (
          <Upload size={32} className="text-neondim" />
        )}

        <p className="text-sm font-extrabold tracking-[0.25em] text-bright">
          {dragOver ? "RELEASE TO UPLOAD" : "DROP IMAGE"}
        </p>

        <span className="bg-neon text-void px-4 py-1.5 text-[10px] font-extrabold tracking-[0.2em] pointer-events-none">
          [ BROWSE ]
        </span>

        <span className="text-[10px] tracking-[0.2em] text-dim">
          JPG/PNG · MAX 10MB
        </span>

        {dragOver && (
          <span className="absolute inset-0 border border-neon animate-pulse pointer-events-none" />
        )}
      </div>

      <input
        ref={inputRef}
        id="image-upload-input"
        type="file"
        accept={SUPPORTED_EXTENSIONS}
        onChange={onInputChange}
        className="sr-only"
        aria-label="Upload image file"
      />

      {validationError && (
        <div
          role="alert"
          className="mt-3 border border-alert/50 bg-alert/10 px-4 py-2 text-xs tracking-wider text-alert"
        >
          ! {validationError}
        </div>
      )}
    </div>
  );
};
