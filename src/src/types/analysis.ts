/**
 * SignalScope — TypeScript Interfaces
 *
 * This file is the integration contract between the frontend and the backend.
 * Coordinate with the ML/backend team before finalising the production schema.
 */

export type Verdict = "LIKELY_AI_GENERATED" | "LIKELY_REAL";

export type AppState =
  | "EMPTY"
  | "IMAGE_SELECTED"
  | "ANALYZING"
  | "SUCCESS"
  | "ERROR";

export interface EvidenceResult {
  /** URL to the heatmap / Grad-CAM overlay image produced by Person 4 */
  imageUrl?: string;
  /** Raw region descriptors (structure TBD with Person 4) */
  regions?: unknown[];
  /** Plain-language explanation from the explainability pipeline */
  explanation?: string;
}

export interface RobustnessResult {
  /** Confidence on the original unmodified image (0.0 – 1.0) */
  original: number;
  /** Confidence after JPEG compression (0.0 – 1.0) */
  compressed: number;
  /** Confidence after resize transformation (0.0 – 1.0) */
  resized: number;
  /** Confidence after screenshot-style transformation (0.0 – 1.0) */
  screenshot: number;
}

export interface GeneralizationResult {
  /** Name of the unseen generator used in the holdout evaluation */
  generatorName?: string;
  /** Area Under Curve score (0.0 – 1.0) */
  auc?: number;
  /** Optional prose description supplied by Person 3 */
  description?: string;
}

/**
 * Top-level analysis result returned by the backend.
 *
 * NOTE: confidence is expressed as a fraction (0.0 – 1.0) throughout
 * the service layer. Components receive and display it as a percentage.
 */
export interface AnalysisResult {
  verdict: Verdict;
  /** Confidence in the verdict (0.0 – 1.0) */
  confidence: number;
  evidence?: EvidenceResult;
  robustness?: RobustnessResult;
  generalization?: GeneralizationResult;
}

export interface AnalysisError {
  type: "INVALID_FILE" | "API_FAILURE" | "NETWORK_ERROR" | "UNEXPECTED";
  message: string;
}
