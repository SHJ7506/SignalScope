import {
  MAX_FILE_SIZE,
  SUPPORTED_IMAGE_TYPES,
  MAX_FILE_SIZE_LABEL,
} from "../constants/config";

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate an uploaded file against allowed types and max size.
 */
export function validateImageFile(file: File): ValidationResult {
  if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error:
        "Unsupported file format. Please upload a JPG, JPEG, or PNG image.",
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File is too large. Maximum allowed size is ${MAX_FILE_SIZE_LABEL}.`,
    };
  }

  return { valid: true };
}

/** Format bytes into a human-readable string (KB / MB). */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
