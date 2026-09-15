/**
 * Mock Analysis Service
 *
 * Used in development (VITE_USE_MOCK=true).
 * Returns realistic fake responses to allow full UI development before
 * the backend / ML pipeline is integrated.
 *
 * ⚠️  NEVER ship this as a real result.
 *     Switch VITE_USE_MOCK=false and connect analysisService.ts for production.
 */

import { MOCK_DELAY_MS } from "../constants/config";
import type { AnalysisResult } from "../types/analysis";

const MOCK_AI_RESULT: AnalysisResult = {
  verdict: "LIKELY_AI_GENERATED",
  confidence: 0.94,
  evidence: {
    // In production this URL comes from the backend (Person 4 / Grad-CAM pipeline).
    // For development we use a public placeholder heatmap image.
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Cam_heatmap_sample.jpg/640px-Cam_heatmap_sample.jpg",
    explanation:
      "Unnatural texture patterns detected near image edges. Pixel-level frequency analysis revealed artefacts inconsistent with real camera sensor noise, and colour gradients in the background show irregular blending characteristic of generative models.",
  },
  robustness: {
    original: 0.94,
    compressed: 0.91,
    resized: 0.89,
    screenshot: 0.87,
  },
  generalization: {
    generatorName: "Generator X (Unseen)",
    auc: 0.87,
    description:
      "The model was evaluated against an unseen generator not present in the training distribution. An AUC of 0.87 indicates strong generalisation to novel AI-generation techniques.",
  },
};

const MOCK_REAL_RESULT: AnalysisResult = {
  verdict: "LIKELY_REAL",
  confidence: 0.82,
  evidence: {
    explanation:
      "No significant artefacts detected. Frequency spectrum and texture patterns are consistent with a real camera image. Noise distribution follows expected sensor characteristics.",
  },
  robustness: {
    original: 0.82,
    compressed: 0.79,
    resized: 0.80,
    screenshot: 0.76,
  },
};

let callCount = 0;

/**
 * Simulates the analysis API call.
 * Alternates between AI-generated and real results for easier demo testing.
 */
export async function mockAnalyzeImage(
  _file: File
): Promise<AnalysisResult> {
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));

  callCount += 1;
  // Alternate results so the developer can see both UI states easily.
  return callCount % 2 === 1 ? MOCK_AI_RESULT : MOCK_REAL_RESULT;
}
