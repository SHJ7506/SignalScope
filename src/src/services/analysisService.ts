/**
 * Analysis Service — Production
 *
 * Sends the uploaded image to the backend and returns a structured AnalysisResult.
 * The backend is expected to return JSON matching the AnalysisResult interface.
 *
 * Configure the base URL via VITE_API_BASE_URL in your environment.
 */

import axios, { AxiosError } from "axios";
import { API_BASE_URL, ANALYZE_ENDPOINT } from "../constants/config";
import type { AnalysisError, AnalysisResult } from "../types/analysis";

/**
 * Send the image to the backend analysis endpoint.
 *
 * @param file - The validated image file chosen by the user.
 * @returns Resolved AnalysisResult on success.
 * @throws AnalysisError on any failure.
 */
export async function analyzeImage(file: File): Promise<AnalysisResult> {
  const formData = new FormData();
  formData.append("image", file);

  try {
    const response = await axios.post<AnalysisResult>(
      `${API_BASE_URL}${ANALYZE_ENDPOINT}`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 120_000, // 2 minutes — ML inference can be slow
      }
    );

    return response.data;
  } catch (err) {
    const analysisError = mapError(err);
    throw analysisError;
  }
}

function mapError(err: unknown): AnalysisError {
  if (err instanceof AxiosError) {
    if (!err.response) {
      return {
        type: "NETWORK_ERROR",
        message:
          "Unable to connect to the analysis service. Please check your connection and try again.",
      };
    }
    if (err.response.status >= 400 && err.response.status < 500) {
      return {
        type: "API_FAILURE",
        message:
          "We couldn't analyse this image. Please try again.",
      };
    }
    if (err.response.status >= 500) {
      return {
        type: "API_FAILURE",
        message:
          "The analysis service encountered an error. Please try again later.",
      };
    }
  }

  return {
    type: "UNEXPECTED",
    message:
      "The analysis result could not be displayed. Please try again.",
  };
}
