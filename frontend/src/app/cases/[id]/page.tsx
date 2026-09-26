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
} from "lucide-react";

const PHASES = [
  { key: "discovery", label: "Discovery" },
  { key: "search", label: "Search" },
  { key: "evidence", label: "Evidence" },
  { key: "hypothesis", label: "Hypothesis" },
  { key: "patch", label: "Patch" },
  { key: "verify", label: "Verify" },
  { key: "report", label: "Resolution" },
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

  const { events, isConnected, phase } = useInvestigationStream(caseId);

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

  // When new events stream in, refresh artifacts periodically
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

  const currentPhaseIndex = PHASES.findIndex(
    (p) => p.key === (phase || caseData?.status)
  );

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col">
      {/* Top Console Bar */}
      <header className="border-b border-slate-800 bg-[#080d1a] px-6 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button
              variant="outline"
              size="sm"
              className="h-8 border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-300"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Cases
            </Button>
          </Link>
          <div className="h-4 w-px bg-slate-800" />
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-sky-400 font-bold">{caseId}</span>
            {caseData && (
              <Badge
                className={
                  caseData.status === "solved"
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                    : caseData.status === "failed"
                    ? "bg-rose-500/20 text-rose-400 border-rose-500/40"
                    : "bg-amber-500/20 text-amber-400 border-amber-500/40 animate-pulse"
                }
              >
                {caseData.status.toUpperCase()}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {reportData && (
            <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-800">
              <button
                onClick={() => setViewMode("resolution")}
                className={`text-xs px-3 py-1 rounded font-medium transition-colors ${
                  viewMode === "resolution"
                    ? "bg-emerald-500/20 text-emerald-300 font-semibold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Resolution View
              </button>
              <button
                onClick={() => setViewMode("investigation")}
                className={`text-xs px-3 py-1 rounded font-medium transition-colors ${
                  viewMode === "investigation"
                    ? "bg-sky-500/20 text-sky-300 font-semibold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Live Feed
              </button>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={fetchFullCase}
            className="h-8 border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-300"
            title="Refresh Case"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </header>

      {/* Phase Stepper Bar */}
      <div className="bg-[#0b101c] border-b border-slate-800 px-6 py-2.5 overflow-x-auto">
        <div className="max-w-6xl mx-auto flex items-center justify-between min-w-[640px] text-xs font-mono">
          {PHASES.map((p, idx) => {
            const isCompleted = idx < currentPhaseIndex;
            const isCurrent = idx === currentPhaseIndex;

            return (
              <div key={p.key} className="flex items-center gap-2">
                <div
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all ${
                    isCurrent
                      ? "bg-sky-500/20 text-sky-400 border-sky-500 shadow-[0_0_12px_rgba(56,189,248,0.2)] animate-pulse"
                      : isCompleted
                      ? "bg-emerald-950/40 text-emerald-400 border-emerald-800/80"
                      : "bg-slate-900/40 text-slate-600 border-slate-800"
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <span className="w-3 text-center">{idx + 1}</span>
                  )}
                  <span>{p.label}</span>
                </div>
                {idx < PHASES.length - 1 && (
                  <div
                    className={`h-0.5 w-6 rounded ${
                      idx < currentPhaseIndex ? "bg-emerald-700" : "bg-slate-800"
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
        {/* Case Symptom Header Card */}
        {caseData && (
          <div className="p-4 rounded-lg bg-[#0c1220] border border-slate-800 text-xs flex flex-col md:flex-row md:items-center justify-between gap-3 font-mono">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-slate-400">
                <GitBranch className="w-3.5 h-3.5 text-sky-400" />
                <span className="text-slate-300 font-semibold">{caseData.repo_url}</span>
              </div>
              <p className="text-slate-200 font-sans text-xs max-w-3xl leading-relaxed">
                <span className="font-semibold text-slate-400 font-mono">SYMPTOM: </span>
                {caseData.bug_description}
              </p>
            </div>
            {caseData.stack_trace && (
              <div className="text-[11px] text-slate-500 truncate max-w-xs self-start md:self-auto bg-slate-900 px-2 py-1 rounded border border-slate-800">
                {caseData.stack_trace}
              </div>
            )}
          </div>
        )}

        {/* View Switcher: Resolution View vs Live Investigation Console */}
        {viewMode === "resolution" && reportData ? (
          <CaseReport report={reportData} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[720px]">
            {/* Left 6 cols: Live Event Stream */}
            <div className="lg:col-span-6 h-full flex flex-col">
              <InvestigationFeed events={events} isConnected={isConnected} />
            </div>

            {/* Right 6 cols: Artifact Tabs */}
            <div className="lg:col-span-6 h-full flex flex-col">
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="flex flex-col h-full bg-[#0c1220] border border-slate-800 rounded-lg overflow-hidden"
              >
                <div className="bg-[#080d1a] border-b border-slate-800 px-3 py-2 flex items-center justify-between">
                  <TabsList className="bg-slate-900 border border-slate-800 h-8 p-0.5">
                    <TabsTrigger
                      value="evidence"
                      className="text-xs h-7 px-2.5 data-[state=active]:bg-sky-500/20 data-[state=active]:text-sky-300"
                    >
                      Evidence ({caseData?.evidence.length || 0})
                    </TabsTrigger>
                    <TabsTrigger
                      value="hypotheses"
                      className="text-xs h-7 px-2.5 data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300"
                    >
                      Hypotheses ({caseData?.hypotheses.length || 0})
                    </TabsTrigger>
                    <TabsTrigger
                      value="patch"
                      className="text-xs h-7 px-2.5 data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300"
                    >
                      Patch ({caseData?.patches.length || 0})
                    </TabsTrigger>
                    <TabsTrigger
                      value="verification"
                      className="text-xs h-7 px-2.5 data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-300"
                    >
                      Tests ({caseData?.test_results.length || 0})
                    </TabsTrigger>
                  </TabsList>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
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
                      <div className="flex flex-col items-center justify-center h-48 text-slate-500 text-xs">
                        <FileCode className="w-8 h-8 text-slate-600 mb-2" />
                        <p>No patches generated yet.</p>
                        <p className="text-[11px] text-slate-600 mt-1">
                          The agent generates patches once a root cause hypothesis is confirmed.
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
