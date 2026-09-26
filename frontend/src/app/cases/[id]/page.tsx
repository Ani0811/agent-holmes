"use client";

import React, { useEffect, useState, use } from "react";
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
  Search,
  CheckCircle2,
  XCircle,
  FileCode,
  ShieldCheck,
  GitBranch,
  Terminal,
  Activity,
  Layers,
  Sparkles,
  Clock,
  ChevronRight,
} from "lucide-react";

const PHASES = [
  { key: "discovery", label: "Discovery", desc: "Sandbox & Index" },
  { key: "search", label: "Code Search", desc: "AST & Symbol Scan" },
  { key: "evidence", label: "Evidence", desc: "Offending Citations" },
  { key: "hypothesis", label: "Hypothesis", desc: "Root Cause Lab" },
  { key: "patch", label: "Patch", desc: "Diff Synthesis" },
  { key: "verify", label: "Verify", desc: "Automated Tests" },
  { key: "report", label: "Resolution", desc: "Case Solved" },
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
  const [activeTab, setActiveTab] = useState<string>("evidence");
  const [viewMode, setViewMode] = useState<"investigation" | "resolution">("investigation");
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  const { events, isConnected, phase } = useInvestigationStream(caseId);

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchFullCase = async () => {
    try {
      const data = await getCase(caseId);
      setCaseData(data);

      if (data.status === "solved" || data.status === "failed") {
        try {
          const rep = await getCaseReport(caseId);
          setReportData(rep);
          setViewMode("resolution");
        } catch (e) {
          console.warn("Could not fetch report yet:", e);
        }
      }
    } catch (err) {
      console.error("Failed to load case data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFullCase();
  }, [caseId]);

  // When events stream in, refresh artifacts
  useEffect(() => {
    if (events.length > 0) {
      const latest = events[events.length - 1];
      if (
        [
          "evidence_found",
          "hypothesis_created",
          "patch_applied",
          "command_executed",
          "case_solved",
          "case_failed",
        ].includes(latest.event_type)
      ) {
        fetchFullCase();
      }
    }
  }, [events.length]);

  const activePhaseKey = phase || caseData?.status || "discovery";
  const currentPhaseIndex = PHASES.findIndex((p) => p.key === activePhaseKey);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}s`;
  };

  return (
    <div className="min-h-screen bg-cyber-grid bg-[#080c16] text-slate-100 flex flex-col selection:bg-sky-500 selection:text-slate-950">
      {/* Top Console Bar */}
      <header className="border-b border-slate-800/80 bg-[#080c16]/90 backdrop-blur-md px-6 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button
              variant="outline"
              size="sm"
              className="h-8 border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-300 text-xs font-mono"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back to Dossiers
            </Button>
          </Link>
          <div className="h-4 w-px bg-slate-800" />
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-sky-400 font-bold tracking-wider">{caseId}</span>
            {caseData && (
              <Badge
                className={
                  caseData.status === "solved"
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 text-[10px] font-mono font-bold"
                    : caseData.status === "failed"
                    ? "bg-rose-500/20 text-rose-400 border-rose-500/40 text-[10px] font-mono font-bold"
                    : "bg-amber-500/20 text-amber-400 border-amber-500/40 animate-pulse text-[10px] font-mono font-bold"
                }
              >
                {caseData.status.toUpperCase()}
              </Badge>
            )}
          </div>
        </div>

        {/* Action Controls & Mode Switcher */}
        <div className="flex items-center gap-3">
          {/* Live timer */}
          <div className="hidden sm:flex items-center gap-1.5 font-mono text-xs text-slate-400 bg-slate-900/60 border border-slate-800 px-3 py-1 rounded-full">
            <Clock className="w-3.5 h-3.5 text-sky-400" />
            <span>SESSION:</span>
            <span className="text-slate-200 font-semibold">{formatTimer(secondsElapsed)}</span>
          </div>

          {reportData && (
            <div className="flex items-center bg-slate-900/90 rounded-lg p-0.5 border border-slate-800 font-mono text-xs">
              <button
                onClick={() => setViewMode("resolution")}
                className={`px-3 py-1 rounded-md transition-all ${
                  viewMode === "resolution"
                    ? "bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Resolution Verdict
              </button>
              <button
                onClick={() => setViewMode("investigation")}
                className={`px-3 py-1 rounded-md transition-all ${
                  viewMode === "investigation"
                    ? "bg-sky-500/20 text-sky-300 font-bold border border-sky-500/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Live Event Console
              </button>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={fetchFullCase}
            className="h-8 border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-300"
            title="Refresh Case State"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </header>

      {/* Cyber Phase Stepper Bar */}
      <div className="bg-[#0b101c] border-b border-slate-800/80 px-6 py-2.5 overflow-x-auto shadow-inner">
        <div className="max-w-7xl mx-auto flex items-center justify-between min-w-[700px] text-xs font-mono">
          {PHASES.map((p, idx) => {
            const isCompleted = idx < currentPhaseIndex;
            const isCurrent = idx === currentPhaseIndex;

            return (
              <div key={p.key} className="flex items-center gap-2">
                <div
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${
                    isCurrent
                      ? "bg-sky-950/60 text-sky-300 border-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.25)] font-bold animate-pulse"
                      : isCompleted
                      ? "bg-emerald-950/40 text-emerald-400 border-emerald-800/80 font-medium"
                      : "bg-slate-900/30 text-slate-600 border-slate-800/60"
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isCompleted
                        ? "bg-emerald-500 text-slate-950"
                        : isCurrent
                        ? "bg-sky-400 text-slate-950"
                        : "bg-slate-800 text-slate-500"
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="w-3 h-3" /> : idx + 1}
                  </span>
                  <div>
                    <span className="block leading-tight text-[11px]">{p.label}</span>
                  </div>
                </div>

                {idx < PHASES.length - 1 && (
                  <div
                    className={`h-[1px] w-6 rounded transition-colors ${
                      idx < currentPhaseIndex ? "bg-emerald-600" : "bg-slate-800"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Body */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Case Dossier Header Pill */}
        {caseData && (
          <div className="glass-panel p-4 rounded-xl border border-slate-800/90 text-xs flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono shadow-lg">
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex items-center gap-2 text-slate-400">
                <GitBranch className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span className="text-slate-200 font-semibold truncate">{caseData.repo_url}</span>
              </div>
              <p className="text-slate-300 font-sans text-xs leading-relaxed">
                <span className="font-semibold text-slate-400 font-mono">SYMPTOM: </span>
                {caseData.bug_description}
              </p>
            </div>

            {caseData.stack_trace && (
              <div className="text-[11px] text-purple-300 bg-purple-950/30 border border-purple-900/50 px-3 py-1.5 rounded-lg max-w-md truncate self-start md:self-auto shrink-0">
                <span className="font-bold mr-1">TRACE:</span>
                {caseData.stack_trace}
              </div>
            )}
          </div>
        )}

        {/* View Switcher: Resolution View vs Live Investigation Console */}
        {viewMode === "resolution" && reportData ? (
          <CaseReport report={reportData} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[760px]">
            {/* Left 6 cols: Live Event Stream Terminal */}
            <div className="lg:col-span-6 h-full flex flex-col">
              <InvestigationFeed events={events} isConnected={isConnected} />
            </div>

            {/* Right 6 cols: Exhibit Drawer */}
            <div className="lg:col-span-6 h-full flex flex-col">
              <Tabs
                defaultValue="evidence"
                value={activeTab}
                onValueChange={setActiveTab}
                className="flex flex-col h-full glass-panel rounded-xl overflow-hidden border border-slate-800"
              >
                <div className="bg-[#080d1a] border-b border-slate-800/80 px-3 py-2 flex items-center justify-between">
                  <TabsList className="bg-slate-900/90 border border-slate-800 h-8 p-0.5 font-mono text-xs">
                    <TabsTrigger
                      value="evidence"
                      className="text-xs h-7 px-3 data-[state=active]:bg-sky-500/20 data-[state=active]:text-sky-300 data-[state=active]:font-bold"
                    >
                      Evidence ({caseData?.evidence.length || 0})
                    </TabsTrigger>
                    <TabsTrigger
                      value="hypotheses"
                      className="text-xs h-7 px-3 data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300 data-[state=active]:font-bold"
                    >
                      Hypotheses ({caseData?.hypotheses.length || 0})
                    </TabsTrigger>
                    <TabsTrigger
                      value="patch"
                      className="text-xs h-7 px-3 data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300 data-[state=active]:font-bold"
                    >
                      Patch ({caseData?.patches.length || 0})
                    </TabsTrigger>
                    <TabsTrigger
                      value="verification"
                      className="text-xs h-7 px-3 data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-300 data-[state=active]:font-bold"
                    >
                      Tests ({caseData?.test_results.length || 0})
                    </TabsTrigger>
                  </TabsList>
                </div>

                <div className="flex-1 overflow-y-auto p-4 bg-[#0a0f1d]/50">
                  <TabsContent value="evidence" className="m-0 h-full">
                    <EvidencePanel evidence={caseData?.evidence || []} />
                  </TabsContent>

                  <TabsContent value="hypotheses" className="m-0 h-full">
                    <HypothesisPanel hypotheses={caseData?.hypotheses || []} />
                  </TabsContent>

                  <TabsContent value="patch" className="m-0 h-full">
                    {caseData?.patches && caseData.patches.length > 0 ? (
                      <DiffViewer
                        unifiedDiff={caseData.patches[caseData.patches.length - 1].unified_diff}
                        explanation={caseData.patches[caseData.patches.length - 1].explanation}
                        filePaths={caseData.patches[caseData.patches.length - 1].file_paths}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-56 text-slate-500 text-xs font-mono">
                        <FileCode className="w-8 h-8 text-slate-600 mb-2 animate-bounce" />
                        <p>No patches synthesized yet.</p>
                        <p className="text-[11px] text-slate-600 mt-1">
                          A surgical unified diff is generated once the root cause hypothesis is confirmed.
                        </p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="verification" className="m-0 h-full">
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
