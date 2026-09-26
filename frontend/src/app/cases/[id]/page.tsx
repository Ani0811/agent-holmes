"use client";

import React, { useEffect, useState, use, useRef } from "react";
import Link from "next/link";
import { getCase, getCaseReport, CaseDetail, CaseReport as CaseReportType } from "@/lib/api";
import { useInvestigationStream } from "@/lib/websocket";
import { InvestigationFeed } from "@/components/InvestigationFeed";
import { EvidencePanel } from "@/components/EvidencePanel";
import { HypothesisPanel } from "@/components/HypothesisPanel";
import { DiffViewer } from "@/components/DiffViewer";
import { VerificationPanel } from "@/components/VerificationPanel";
import { CaseReport } from "@/components/CaseReport";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ArrowLeft,
  RefreshCw,
  CheckCircle2,
  FileCode,
  GitBranch,
  Terminal,
  Clock,
  AlertCircle,
} from "lucide-react";

const BUG_PHASES = [
  { key: "discovery", label: "Discovery" },
  { key: "search", label: "Search" },
  { key: "evidence", label: "Evidence" },
  { key: "hypothesis", label: "Hypothesis" },
  { key: "patch", label: "Patch" },
  { key: "verify", label: "Verify" },
  { key: "report", label: "Report" },
];

const REVIEW_PHASES = [
  { key: "discovery", label: "Discovery" },
  { key: "search", label: "Code Scan" },
  { key: "evidence", label: "Findings" },
  { key: "hypothesis", label: "Analysis" },
  { key: "patch", label: "Refactor" },
  { key: "verify", label: "Tests" },
  { key: "report", label: "Audit" },
];

export default function CaseInvestigationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const caseId = resolvedParams.id;

  const [caseData, setCaseData] = useState<CaseDetail | null>(null);
  const [reportData, setReportData] = useState<CaseReportType | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("evidence");
  const [viewMode, setViewMode] = useState<"investigation" | "resolution">("investigation");
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  const isReview = caseData?.case_type === "repo_review";
  const activePhases = isReview ? REVIEW_PHASES : BUG_PHASES;

  // Track the event count we last triggered fetchFullCase on, to avoid
  // firing on historical replayed events.
  const lastFetchedAtEventCount = useRef(0);

  const { events, isConnected, phase, isSolved } = useInvestigationStream(caseId);

  // Timer — stops once the investigation reaches a terminal state
  useEffect(() => {
    if (isSolved !== null) return; // already finished
    const timer = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isSolved]);

  const [loadingStep, setLoadingStep] = useState(0);

  const fetchFullCase = async (isInitial = false) => {
    const startTime = Date.now();
    let t1: NodeJS.Timeout | null = null;
    let t2: NodeJS.Timeout | null = null;

    try {
      if (isInitial) {
        setLoading(true);
        setLoadingStep(0);
        t1 = setTimeout(() => setLoadingStep(1), 450);
        t2 = setTimeout(() => setLoadingStep(2), 900);
      }

      const data = await getCase(caseId);
      setCaseData(data);
      setPageError(null);

      if (data.status === "solved" || data.status === "failed") {
        try {
          const rep = await getCaseReport(caseId);
          setReportData(rep);
          setViewMode("resolution");
        } catch (e) {
          console.warn("Could not fetch report yet:", e);
        }
      }

      if (isInitial) {
        const elapsed = Date.now() - startTime;
        const MIN_DISPLAY_MS = 1400; // Ensure visible for at least 1.4s so the sequence is perceived
        if (elapsed < MIN_DISPLAY_MS) {
          await new Promise((resolve) => setTimeout(resolve, MIN_DISPLAY_MS - elapsed));
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load case data.";
      setPageError(msg);
    } finally {
      if (t1) clearTimeout(t1);
      if (t2) clearTimeout(t2);
      if (isInitial) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchFullCase(true);
  }, [caseId]);

  // Refresh case artifacts only when *new* actionable events arrive — not on
  // historical replay events that were already counted when we first loaded.
  const ACTIONABLE_EVENTS = new Set([
    "evidence_found",
    "hypothesis_created",
    "patch_applied",
    "command_executed",
    "case_solved",
    "case_failed",
  ]);

  useEffect(() => {
    if (events.length <= lastFetchedAtEventCount.current) return;

    // Check only the newly arrived events (those beyond the last seen count)
    const newEvents = events.slice(lastFetchedAtEventCount.current);
    const hasActionable = newEvents.some((ev) => ACTIONABLE_EVENTS.has(ev.event_type));

    if (hasActionable) {
      lastFetchedAtEventCount.current = events.length;
      fetchFullCase();
    } else {
      lastFetchedAtEventCount.current = events.length;
    }
  }, [events.length]);

  const activePhaseKey = phase || caseData?.status || "discovery";
  const currentPhaseIndex = activePhases.findIndex((p) => p.key === activePhaseKey);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const statusBadgeClass =
    caseData?.status === "solved"
      ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/40 text-[10px] font-mono font-bold"
      : caseData?.status === "failed"
      ? "bg-rose-500/15 text-rose-400 border-rose-500/40 text-[10px] font-mono font-bold"
      : "bg-sky-500/15 text-sky-400 border-sky-500/40 text-[10px] font-mono font-bold";

  const repoName = caseData?.repo_url
    ? caseData.repo_url.replace(/\\+/g, "/").replace(/\/+$/, "").replace(/\.git$/, "").split("/").pop() || "Workspace"
    : null;
  const dossierId = caseId.replace(/^case_/, "");

  const LOADING_STEPS = [
    { label: "Synchronizing telemetry event stream", pct: "35%" },
    { label: "Mounting repository workspace sandbox", pct: "70%" },
    { label: "Bootstrapping neural agentic inspectors", pct: "100%" },
  ];

  if (loading) {
    const currentStep = LOADING_STEPS[Math.min(loadingStep, LOADING_STEPS.length - 1)];

    return (
      <div className="min-h-screen bg-cyber-grid bg-[#080c16] text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full border border-slate-800/80 bg-[#0c1220]/95 rounded-2xl p-8 backdrop-blur-xl shadow-2xl flex flex-col items-center text-center space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-sky-400 to-transparent" />

          {/* Central radar scanner badge with rotating dual ring */}
          <div className="relative flex items-center justify-center w-20 h-20 my-1">
            <div className="absolute inset-0 rounded-full border border-sky-400/20 animate-ping opacity-30" />
            <div
              className="absolute inset-1 rounded-full border-2 border-dashed border-sky-400/50 animate-spin"
              style={{ animationDuration: "6s" }}
            />
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500/20 to-indigo-500/20 border border-sky-400/60 flex items-center justify-center shadow-lg shadow-sky-500/10">
              <Terminal className="w-6 h-6 text-sky-400" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-[10px] font-mono tracking-widest text-sky-400 uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
              Dossier Boot Sequence
            </div>
            <h2 className="text-base font-bold text-slate-100 tracking-wide font-mono uppercase">
              Initializing Investigation
            </h2>
            <p className="text-xs text-sky-300/85 font-mono transition-all duration-300">
              {currentStep.label}…
            </p>
          </div>

          {/* Dossier tag */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300">
            <span className="text-slate-500">Dossier Reference:</span>
            <span className="text-sky-300 font-bold">#{dossierId}</span>
          </div>

          {/* Dynamic smooth progress bar */}
          <div className="w-full space-y-1.5">
            <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800/80 p-0.5">
              <div
                className="h-full bg-gradient-to-r from-sky-500 via-indigo-500 to-emerald-400 rounded-full transition-all duration-500 ease-out"
                style={{ width: currentStep.pct }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-mono text-slate-500 px-0.5">
              <span>Stage {loadingStep + 1} of 3</span>
              <span>{currentStep.pct}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (pageError && !caseData) {
    return (
      <div className="min-h-screen bg-[#080c16] text-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-sm max-w-md text-center px-6">
          <AlertCircle className="w-8 h-8 text-rose-400" />
          <p className="text-slate-300 font-sans">{pageError}</p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchFullCase(false)}
              className="border-slate-700 text-slate-300"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Retry
            </Button>
            <Link href="/">
              <Button variant="outline" size="sm" className="border-slate-700 text-slate-300">
                <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cyber-grid bg-[#080c16] text-slate-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800/80 bg-[#080c16]/95 backdrop-blur-md px-6 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button
              variant="outline"
              size="sm"
              className="h-8 border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-300 text-xs font-mono"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Dossiers
            </Button>
          </Link>
          <div className="h-4 w-px bg-slate-800" />
          <div className="flex items-center gap-2.5">
            <Terminal className="w-3.5 h-3.5 text-sky-400" />
            <div className="flex items-baseline gap-2">
              <span className="font-semibold text-sm text-slate-100 font-sans tracking-tight">
                {repoName || "Investigation"}
              </span>
              <span className="font-mono text-xs text-sky-400/90 font-bold bg-sky-950/40 border border-sky-800/40 px-1.5 py-0.5 rounded">
                #{dossierId}
              </span>
            </div>
            {caseData && (
              <Badge className={statusBadgeClass}>
                {isReview ? "AUDIT · " : ""}{caseData.status.toUpperCase()}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Timer */}
          <div className="hidden sm:flex items-center gap-1.5 font-mono text-xs text-slate-400 bg-slate-900/60 border border-slate-800 px-3 py-1 rounded-full">
            <Clock className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-slate-200 tabular-nums">{formatTimer(secondsElapsed)}</span>
            {isSolved !== null && (
              <span className="text-slate-500 text-[10px]">done</span>
            )}
          </div>

          {/* View switcher — only visible when report is available */}
          {reportData && (
            <div className="flex items-center bg-slate-900/90 rounded-lg p-0.5 border border-slate-800 font-mono text-xs">
              <button
                onClick={() => setViewMode("resolution")}
                className={`px-3 py-1 rounded-md transition-all ${
                  viewMode === "resolution"
                    ? "bg-emerald-500/20 text-emerald-300 font-bold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Verdict
              </button>
              <button
                onClick={() => setViewMode("investigation")}
                className={`px-3 py-1 rounded-md transition-all ${
                  viewMode === "investigation"
                    ? "bg-sky-500/20 text-sky-300 font-bold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Console
              </button>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchFullCase(false)}
            className="h-8 border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-300"
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </header>

      {/* Phase progress bar — clean line-based stepper */}
      <div className="bg-[#0b101c] border-b border-slate-800/80 px-6 py-3 overflow-x-auto">
        <div className="max-w-7xl mx-auto min-w-[600px]">
          <div className="flex items-center">
            {activePhases.map((p, idx) => {
              const isCompleted = idx < currentPhaseIndex;
              const isCurrent = idx === currentPhaseIndex;

              return (
                <React.Fragment key={p.key}>
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border transition-colors ${
                        isCompleted
                          ? "bg-emerald-500 border-emerald-500 text-slate-950"
                          : isCurrent
                          ? "bg-sky-500 border-sky-400 text-slate-950"
                          : "bg-slate-900 border-slate-700 text-slate-600"
                      }`}
                    >
                      {isCompleted ? <CheckCircle2 className="w-3 h-3" /> : idx + 1}
                    </div>
                    <span
                      className={`text-[10px] font-mono whitespace-nowrap transition-colors ${
                        isCompleted
                          ? "text-emerald-500"
                          : isCurrent
                          ? "text-sky-400 font-semibold"
                          : "text-slate-600"
                      }`}
                    >
                      {p.label}
                    </span>
                  </div>
                  {idx < activePhases.length - 1 && (
                    <div
                      className={`flex-1 h-[2px] mx-1 rounded transition-colors ${
                        idx < currentPhaseIndex ? "bg-emerald-700" : "bg-slate-800"
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Body */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-4">
        {/* Case dossier info strip */}
        {caseData && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-xs font-mono border border-slate-800 rounded-lg px-4 py-2.5 bg-slate-900/40">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <GitBranch className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span className="text-slate-300 truncate">{caseData.repo_url}</span>
            </div>
            <div className="h-4 w-px bg-slate-800 hidden sm:block" />
            <p className="text-slate-400 font-sans text-xs truncate max-w-xl">
              {caseData.bug_description}
            </p>
          </div>
        )}

        {pageError && caseData && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-rose-800/60 bg-rose-950/30 text-rose-300 text-xs font-mono">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{pageError}</span>
          </div>
        )}

        {/* Resolution or Investigation view */}
        {viewMode === "resolution" && reportData ? (
          <CaseReport report={reportData} />
        ) : (
          /* Investigation console: feed (7 cols) + exhibit tabs (5 cols) */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5" style={{ minHeight: "70vh" }}>
            {/* Left — live event feed (wider) */}
            <div className="lg:col-span-7 flex flex-col" style={{ minHeight: "60vh" }}>
              <InvestigationFeed events={events} isConnected={isConnected} />
            </div>

            {/* Right — exhibit tabs */}
            <div className="lg:col-span-5 flex flex-col" style={{ minHeight: "60vh" }}>
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="flex flex-col h-full border border-slate-800 rounded-lg overflow-hidden bg-[#0a0f1d]"
              >
                <div className="bg-[#080d1a] border-b border-slate-800 px-3 py-2">
                  <TabsList className="bg-slate-900/90 border border-slate-800 h-7 p-0.5 font-mono text-xs w-full grid grid-cols-4">
                    <TabsTrigger
                      value="evidence"
                      className="text-[11px] h-6 data-[state=active]:bg-sky-500/20 data-[state=active]:text-sky-300"
                    >
                      {isReview ? "Findings" : "Evidence"} {caseData?.evidence?.length ? `(${caseData.evidence.length})` : ""}
                    </TabsTrigger>
                    <TabsTrigger
                      value="hypotheses"
                      className="text-[11px] h-6 data-[state=active]:bg-sky-500/20 data-[state=active]:text-sky-300"
                    >
                      {isReview ? "Analysis" : "Hypotheses"} {caseData?.hypotheses?.length ? `(${caseData.hypotheses.length})` : ""}
                    </TabsTrigger>
                    <TabsTrigger
                      value="patch"
                      className="text-[11px] h-6 data-[state=active]:bg-sky-500/20 data-[state=active]:text-sky-300"
                    >
                      {isReview ? "Refactor" : "Patch"} {caseData?.patches?.length ? `(${caseData.patches.length})` : ""}
                    </TabsTrigger>
                    <TabsTrigger
                      value="verification"
                      className="text-[11px] h-6 data-[state=active]:bg-sky-500/20 data-[state=active]:text-sky-300"
                    >
                      {isReview ? "Test Health" : "Tests"} {caseData?.test_results?.length ? `(${caseData.test_results.length})` : ""}
                    </TabsTrigger>
                  </TabsList>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                  <TabsContent value="evidence" className="m-0">
                    <EvidencePanel evidence={caseData?.evidence || []} />
                  </TabsContent>
                  <TabsContent value="hypotheses" className="m-0">
                    <HypothesisPanel hypotheses={caseData?.hypotheses || []} />
                  </TabsContent>
                  <TabsContent value="patch" className="m-0">
                    {caseData?.patches && caseData.patches.length > 0 ? (
                      <DiffViewer
                        unifiedDiff={caseData.patches[caseData.patches.length - 1].unified_diff}
                        explanation={caseData.patches[caseData.patches.length - 1].explanation}
                        filePaths={caseData.patches[caseData.patches.length - 1].file_paths}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-48 text-slate-500 text-xs font-mono gap-2">
                        <FileCode className="w-7 h-7 text-slate-700" />
                        <p>{isReview ? "No code changes suggested." : "No patch yet."}</p>
                        <p className="text-[11px] text-slate-600">
                          {isReview
                            ? "Audit findings and recommendations documented in Findings and Analysis tabs."
                            : "Generated once root cause is confirmed."}
                        </p>
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="verification" className="m-0">
                    <VerificationPanel results={caseData?.test_results || []} />
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
