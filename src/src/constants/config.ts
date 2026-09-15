/**
 * SignalScope — Global Configuration
 *
 * All configurable limits and constants live here.
 * Do NOT scatter these values across components.
 */

/** Maximum allowed upload size in bytes (default: 10 MB) */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/** Human-readable file size limit shown in UI */
export const MAX_FILE_SIZE_LABEL = "10 MB";

/** Accepted MIME types */
export const SUPPORTED_IMAGE_TYPES: string[] = [
  "image/jpeg",
  "image/png",
];

/** Accepted file extensions (for the `accept` attribute) */
export const SUPPORTED_EXTENSIONS = ".jpg,.jpeg,.png";

/**
 * Base URL for the analysis API.
 *
 * Set VITE_API_BASE_URL in .env.local for development
 * and in your deployment environment for production.
 */
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

/**
 * When true the app uses mockAnalysisService instead of the real API.
 *
 * Set VITE_USE_MOCK=false to connect to the real backend.
 * Never commit .env.local to version control.
 */
export const USE_MOCK =
  import.meta.env.VITE_USE_MOCK !== "false";

/** Analysis API endpoint path */
export const ANALYZE_ENDPOINT = "/api/analyze";

/** Simulated mock delay (ms) — makes dev UX realistic */
export const MOCK_DELAY_MS = 3000;
