import React, { useMemo } from "react";
import { useAnalysis } from "../hooks/useAnalysis";
import { ImageUploader } from "../components/ImageUploader/ImageUploader";
import { ImagePreview } from "../components/ImagePreview/ImagePreview";
import { AnalyzeButton } from "../components/AnalyzeButton/AnalyzeButton";
import { AnalysisLoader } from "../components/AnalysisLoader/AnalysisLoader";
import { VerdictCard } from "../components/VerdictCard/VerdictCard";
import { ConfidenceScore } from "../components/ConfidenceScore/ConfidenceScore";
import { EvidenceMap } from "../components/EvidenceMap/EvidenceMap";
import { ExplanationCard } from "../components/ExplanationCard/ExplanationCard";
import { RobustnessChart } from "../components/RobustnessChart/RobustnessChart";
import { GeneralizationCard } from "../components/GeneralizationCard/GeneralizationCard";
import { ResponsibleUseNotice } from "../components/ResponsibleUseNotice/ResponsibleUseNotice";
import { ErrorMessage } from "../components/ErrorMessage/ErrorMessage";
import { EmptyState } from "../components/EmptyState/EmptyState";
import { ResetAnalysisButton } from "../components/ResetAnalysisButton/ResetAnalysisButton";
import { ReportBar } from "../components/ReportBar/ReportBar";
import { ThemeToggle } from "../components/ThemeToggle/ThemeToggle";
import { ScanSearch } from "lucide-react";

const StepHeader: React.FC<{ n: string; title: string; id?: string }> = ({
  n,
  title,
  id,
}) => (
  <div className="flex items-center gap-3 mb-4">
    <span className="text-[10px] font-extrabold text-void bg-neon px-1.5 py-0.5 tracking-widest">
      {n}
    </span>
    <h2
      id={id}
      className="text-xs font-extrabold tracking-[0.3em] text-bright"
    >
      {title}
    </h2>
    <span className="flex-1 h-px bg-line" />
  </div>
);

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const HomePage: React.FC = () => {
  const {
    appState,
    selectedFile,
    previewUrl,
    result,
    error,
    selectFile,
    removeFile,
    analyze,
    reset,
  } = useAnalysis();

  const isAnalyzing = appState === "ANALYZING";
  const hasImage = appState === "IMAGE_SELECTED";
  const isSuccess = appState === "SUCCESS";
  const isError = appState === "ERROR";

  const generatedAt = useMemo(
    () => (result ? new Date().toISOString() : null),
    [result]
  );

  return (
    <div className="min-h-screen bg-void text-fog font-mono">
      {/* ────────────────────────────────────────────── HEADER */}
      <header className="sticky top-0 z-20 border-b border-line bg-void/90 backdrop-blur">
        <div className="mx-auto max-w-4xl flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <ScanSearch size={18} className="text-neon" />
            <span className="text-sm font-bold tracking-[0.2em] text-bright">
              SIGNAL<span className="text-neon">SCOPE</span>
            </span>
          </div>
          <div className="flex items-center gap-3 text-[10px] tracking-[0.2em] text-dim">
            <span className="hidden sm:inline">FORENSICS//v1</span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* ────────────────────────────────────────────── HERO */}
      <section aria-labelledby="hero-heading" className="border-b border-line">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:py-16 text-center">
          <p className="text-[10px] tracking-[0.35em] text-dim mb-4">
            &gt;_ AI IMAGE FORENSICS
          </p>
          <h1
            id="hero-heading"
            className="text-3xl sm:text-5xl font-extrabold tracking-tight text-bright"
          >
            IS THIS IMAGE{" "}
            <span className="text-neon glow">
              AI-GENERATED?
            </span>
          </h1>
        </div>
      </section>

      {/* ────────────────────────────────────────────── MAIN */}
      <main className="mx-auto max-w-4xl px-4 py-10 space-y-8">
        {/* ── Upload / Preview */}
        <section aria-labelledby="upload-heading">
          <h2 id="upload-heading" className="sr-only">
            Image Upload
          </h2>
          <div className="border border-line bg-panel p-5 space-y-4">
            {(appState === "EMPTY" ||
              appState === "IMAGE_SELECTED" ||
              isError) &&
              !selectedFile && <ImageUploader onFileSelected={selectFile} />}

            {selectedFile && previewUrl && !isSuccess && (
              <ImagePreview
                file={selectedFile}
                previewUrl={previewUrl}
                onRemove={removeFile}
              />
            )}

            {(hasImage || isError) && selectedFile && (
              <AnalyzeButton
                disabled={!selectedFile}
                loading={isAnalyzing}
                onClick={analyze}
              />
            )}

            {appState === "EMPTY" && <EmptyState />}
          </div>

          {isSuccess && selectedFile && (
            <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] tracking-[0.15em] text-dim">
              <span className="text-fog">{selectedFile.name}</span>
              <span aria-hidden>·</span>
              <span>{formatBytes(selectedFile.size)}</span>
              {generatedAt && (
                <>
                  <span aria-hidden>·</span>
                  <span>
                    ANALYSED {new Date(generatedAt).toLocaleString()}
                  </span>
                </>
              )}
            </p>
          )}
        </section>

        {/* ── Loading */}
        {isAnalyzing && (
          <section aria-live="polite">
            <StepHeader n="··" title="PROCESSING" />
            <div className="border border-line bg-panel p-5">
              <AnalysisLoader />
            </div>
          </section>
        )}

        {/* ── Error */}
        {isError && error && (
          <section aria-live="assertive">
            <ErrorMessage
              error={error}
              onRetry={() => {
                if (selectedFile) analyze();
              }}
            />
          </section>
        )}

        {/* ── Results pipeline */}
        {isSuccess && result && previewUrl && (
          <div className="space-y-8">
            {/* 01 FINDING */}
            <section aria-labelledby="finding-heading">
              <StepHeader n="01" title="FINDING" id="finding-heading" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <VerdictCard verdict={result.verdict} />
                <ConfidenceScore
                  confidence={result.confidence}
                  verdict={result.verdict}
                />
              </div>
            </section>

            {/* 02 EVIDENCE */}
            {result.evidence && (
              <section aria-labelledby="evidence-heading">
                <StepHeader n="02" title="EVIDENCE" id="evidence-heading" />
                <div className="space-y-4">
                  {result.evidence && (
                    <EvidenceMap
                      previewUrl={previewUrl}
                      overlayUrl={result.evidence.imageUrl}
                    />
                  )}
                  {result.evidence?.explanation && (
                    <ExplanationCard
                      explanation={result.evidence.explanation}
                    />
                  )}
                </div>
              </section>
            )}

            {/* 03 STRESS TESTS */}
            {(result.robustness || result.generalization) && (
              <section aria-labelledby="stress-heading">
                <StepHeader n="03" title="STRESS TESTS" id="stress-heading" />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {result.robustness && (
                    <RobustnessChart robustness={result.robustness} />
                  )}
                  {result.generalization && (
                    <GeneralizationCard
                      generalization={result.generalization}
                    />
                  )}
                </div>
              </section>
            )}

            {/* 04 REPORT */}
            <section aria-labelledby="report-heading">
              <StepHeader n="04" title="REPORT" id="report-heading" />
              <div className="space-y-4">
                <ResponsibleUseNotice />
                <ReportBar
                  result={result}
                  fileName={selectedFile?.name ?? "image"}
                  fileSize={selectedFile ? formatBytes(selectedFile.size) : ""}
                  generatedAt={generatedAt}
                />
                <div className="flex justify-center pt-2 no-print">
                  <ResetAnalysisButton onClick={reset} />
                </div>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
};
