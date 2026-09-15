/**
 * useAnalysis — Custom Hook
 *
 * Manages the full analysis state machine:
 *   EMPTY → IMAGE_SELECTED → ANALYZING → SUCCESS | ERROR
 *
 * Picks mock vs production service via the USE_MOCK flag.
 */

import { useCallback, useReducer } from "react";
import { USE_MOCK } from "../constants/config";
import { analyzeImage } from "../services/analysisService";
import { mockAnalyzeImage } from "../services/mockAnalysisService";
import type { AnalysisError, AnalysisResult, AppState } from "../types/analysis";

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

interface State {
  appState: AppState;
  selectedFile: File | null;
  previewUrl: string | null;
  result: AnalysisResult | null;
  error: AnalysisError | null;
}

const initialState: State = {
  appState: "EMPTY",
  selectedFile: null,
  previewUrl: null,
  result: null,
  error: null,
};

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

type Action =
  | { type: "SELECT_FILE"; file: File; previewUrl: string }
  | { type: "REMOVE_FILE" }
  | { type: "START_ANALYSIS" }
  | { type: "ANALYSIS_SUCCESS"; result: AnalysisResult }
  | { type: "ANALYSIS_ERROR"; error: AnalysisError }
  | { type: "RESET" };

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SELECT_FILE":
      // Revoke previous object URL to avoid memory leaks
      if (state.previewUrl) URL.revokeObjectURL(state.previewUrl);
      return {
        ...initialState,
        appState: "IMAGE_SELECTED",
        selectedFile: action.file,
        previewUrl: action.previewUrl,
      };

    case "REMOVE_FILE":
      if (state.previewUrl) URL.revokeObjectURL(state.previewUrl);
      return initialState;

    case "START_ANALYSIS":
      return { ...state, appState: "ANALYZING", error: null };

    case "ANALYSIS_SUCCESS":
      return { ...state, appState: "SUCCESS", result: action.result };

    case "ANALYSIS_ERROR":
      return { ...state, appState: "ERROR", error: action.error };

    case "RESET":
      if (state.previewUrl) URL.revokeObjectURL(state.previewUrl);
      return initialState;

    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAnalysis() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const selectFile = useCallback((file: File) => {
    const previewUrl = URL.createObjectURL(file);
    dispatch({ type: "SELECT_FILE", file, previewUrl });
  }, []);

  const removeFile = useCallback(() => {
    dispatch({ type: "REMOVE_FILE" });
  }, []);

  const analyze = useCallback(async () => {
    if (!state.selectedFile || state.appState === "ANALYZING") return;

    dispatch({ type: "START_ANALYSIS" });

    try {
      const service = USE_MOCK ? mockAnalyzeImage : analyzeImage;
      const result = await service(state.selectedFile);
      dispatch({ type: "ANALYSIS_SUCCESS", result });
    } catch (err) {
      const analysisError = err as AnalysisError;
      dispatch({
        type: "ANALYSIS_ERROR",
        error: analysisError ?? {
          type: "UNEXPECTED",
          message: "An unexpected error occurred. Please try again.",
        },
      });
    }
  }, [state.selectedFile, state.appState]);

  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  return {
    ...state,
    selectFile,
    removeFile,
    analyze,
    reset,
  };
}
