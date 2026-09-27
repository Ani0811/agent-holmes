"use client";

import React, { useState } from "react";
import { EvidenceItem, Hypothesis, Patch, TestResult } from "@/lib/api";
import {
  GitBranch,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Layers,
  ChevronDown,
  ChevronUp,
  Brain,
  Wrench,
  Pin,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface EvidenceBoardProps {
  repoUrl: string;
  caseId: string;
  evidence: EvidenceItem[];
  hypotheses: Hypothesis[];
  patch?: Patch | null;
  verification?: TestResult | null;
  rootCause?: string | null;
  isSolved?: boolean;
}

export function EvidenceBoard({
  repoUrl,
  caseId,
  evidence,
  hypotheses,
  patch,
  verification,
  rootCause,
  isSolved,
}: EvidenceBoardProps) {
  const [expandedSnippetId, setExpandedSnippetId] = useState<number | null>(null);
  const [activeHoverNode, setActiveHoverNode] = useState<string | null>(null);

  const shortId = caseId.replace(/^case_/, "");
  const winningHypo = hypotheses.find((h) => h.status === "confirmed") || hypotheses[hypotheses.length - 1];

  return (
    <div className="space-y-4">
      {/* Board Header Bar */}
      <div className="p-4 rounded-xl bg-[#090e1c] border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-wide font-mono uppercase">
                Forensic Investigation Board
              </h2>
              <Badge variant="outline" className="font-mono text-[10px] border-emerald-500/30 text-emerald-400">
                ACTIVE EVIDENCE MATRIX
              </Badge>
            </div>
            <p className="text-xs text-slate-400 font-sans">
              Dynamic graph connecting repository discovery, line-anchored clues, deductions, and test-verified patches
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-400">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>Scene</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-400">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Clues ({evidence.length})</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Resolution</span>
          </div>
        </div>
      </div>

      {/* Main Forensic Canvas */}
      <div className="relative p-4 sm:p-6 rounded-2xl bg-[#050811] border border-slate-800/90 overflow-x-auto min-h-[580px] bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px]">
        {/* Subtle Decorative Laser Banner */}
        <div className="absolute top-3 left-6 right-6 flex items-center justify-between text-[10px] font-mono text-slate-600 border-b border-slate-800/60 pb-2">
          <span>FORENSIC NODE CHAIN: CASE #{shortId}</span>
          <span className="text-emerald-500/80">AUTHENTICATED SANDBOX ARTIFACTS</span>
        </div>

        {/* 4-Stage Connected Workflow Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative pt-8 z-10 min-w-[900px]">
          {/* ================= STAGE 1: THE SCENE (REPO) ================= */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>1. The Crime Scene</span>
            </div>

            <Card
              onMouseEnter={() => setActiveHoverNode("scene")}
              onMouseLeave={() => setActiveHoverNode(null)}
              className={`bg-[#0a0f1d]/90 border transition-all duration-300 ${
                activeHoverNode === "scene"
                  ? "border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.2)]"
                  : "border-slate-800 hover:border-slate-700"
              }`}
            >
              <CardHeader className="p-3.5 border-b border-slate-800 bg-[#080d1a] flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-cyan-400" />
                  <CardTitle className="text-xs font-mono text-slate-200">Repository Origin</CardTitle>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono border-cyan-500/40 text-cyan-300">
                  SANDBOX
                </Badge>
              </CardHeader>
              <CardContent className="p-3.5 space-y-2 text-xs">
                <p className="font-mono text-slate-300 break-all bg-slate-900/80 p-2 rounded border border-slate-800 text-[11px]">
                  {repoUrl}
                </p>
                <div className="text-[11px] text-slate-400 space-y-1 pt-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-mono">Status:</span>
                    <span className="text-emerald-400 font-mono">Isolated</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-mono">Artifacts Indexed:</span>
                    <span className="text-slate-300 font-mono">{evidence.length > 0 ? "Indexed" : "Pending"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Forensic Memo */}
            <div className="p-3 rounded-lg bg-cyan-950/20 border border-cyan-800/30 text-[11px] text-cyan-300/80 font-mono space-y-1">
              <span className="font-bold block text-cyan-300">Target Investigation:</span>
              <p className="line-clamp-3 font-sans text-slate-300 text-xs">
                {rootCause || "Autonomous forensic scan initiated across repository commit tree."}
              </p>
            </div>
          </div>

          {/* ================= STAGE 2: THE CLUES (EVIDENCE) ================= */}
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
              <div className="flex items-center gap-2">
                <Pin className="w-3.5 h-3.5 text-amber-400" />
                <span>2. Clues & Evidence</span>
              </div>
              <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px] font-mono">
                {evidence.length} PINS
              </Badge>
            </div>

            <div className="space-y-3">
              {evidence.length === 0 ? (
                <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/30 text-center text-xs text-slate-500 font-mono">
                  Scanning file trees for evidence pins...
                </div>
              ) : (
                evidence.map((ev, idx) => {
                  const isExpanded = expandedSnippetId === ev.id;
                  return (
                    <Card
                      key={ev.id || idx}
                      onMouseEnter={() => setActiveHoverNode(`evidence-${ev.id}`)}
                      onMouseLeave={() => setActiveHoverNode(null)}
                      className={`bg-[#0a0f1d]/90 border transition-all duration-300 relative ${
                        activeHoverNode === `evidence-${ev.id}`
                          ? "border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)]"
                          : "border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      {/* Pinned Badge Effect */}
                      <div className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[9px] font-mono font-bold flex items-center gap-1 shadow-sm">
                        <span>CLUE #{idx + 1}</span>
                      </div>

                      <CardHeader className="p-3 border-b border-slate-800 bg-[#080d1a] pt-3.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono text-slate-200 font-semibold truncate max-w-[160px]">
                            {ev.file}
                          </span>
                          {ev.line && (
                            <Badge variant="outline" className="font-mono text-[10px] text-amber-400 border-amber-500/30">
                              L:{ev.line}
                            </Badge>
                          )}
                        </div>
                      </CardHeader>

                      <CardContent className="p-3 space-y-2 text-xs">
                        <p className="font-semibold text-slate-200 text-xs leading-snug">
                          {ev.claim}
                        </p>
                        <p className="text-slate-400 text-[11px] leading-relaxed">
                          {ev.description}
                        </p>

                        {ev.code_snippet && (
                          <div className="pt-1">
                            <button
                              onClick={() => setExpandedSnippetId(isExpanded ? null : ev.id)}
                              className="text-[10px] font-mono text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
                            >
                              <span>{isExpanded ? "Hide Code Snippet" : "Inspect Pinned Snippet"}</span>
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                            {isExpanded && (
                              <pre className="mt-1.5 p-2 rounded bg-black/70 border border-slate-800 text-[10px] font-mono text-amber-200/90 overflow-x-auto leading-relaxed">
                                {ev.code_snippet}
                              </pre>
                            )}
                          </div>
                        )}

                        <div className="flex items-center justify-between text-[10px] font-mono pt-1 text-slate-500 border-t border-slate-800/60">
                          <span>Confidence:</span>
                          <span className="text-amber-400 font-bold">{Math.round((ev.confidence || 0.9) * 100)}%</span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </div>

          {/* ================= STAGE 3: THE DEDUCTION (HYPOTHESIS) ================= */}
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-violet-400 uppercase tracking-wider">
              <div className="flex items-center gap-2">
                <Brain className="w-3.5 h-3.5 text-violet-400" />
                <span>3. Deductions & Theory</span>
              </div>
              <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30 text-[10px] font-mono">
                HYPOTHESIS
              </Badge>
            </div>

            {winningHypo ? (
              <Card
                onMouseEnter={() => setActiveHoverNode("hypo")}
                onMouseLeave={() => setActiveHoverNode(null)}
                className={`bg-[#0a0f1d]/90 border transition-all duration-300 ${
                  activeHoverNode === "hypo"
                    ? "border-violet-400 shadow-[0_0_20px_rgba(168,85,247,0.2)]"
                    : "border-slate-800 hover:border-slate-700"
                }`}
              >
                <CardHeader className="p-3.5 border-b border-slate-800 bg-[#080d1a] flex flex-row items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-violet-400" />
                    <CardTitle className="text-xs font-bold text-white">Confirmed Root Cause</CardTitle>
                  </div>
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[10px] font-mono">
                    CONFIRMED
                  </Badge>
                </CardHeader>
                <CardContent className="p-3.5 space-y-3 text-xs">
                  <div>
                    <h4 className="font-semibold text-slate-100 text-xs mb-1">
                      {winningHypo.title}
                    </h4>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      {winningHypo.description}
                    </p>
                  </div>

                  <div className="p-2.5 rounded bg-violet-950/20 border border-violet-800/40 space-y-1">
                    <div className="flex justify-between text-[11px] font-mono">
                      <span className="text-slate-400">Diagnostic Confidence:</span>
                      <span className="text-violet-300 font-bold">{Math.round(winningHypo.confidence * 100)}%</span>
                    </div>
                    <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-violet-500 to-emerald-400 h-full rounded-full"
                        style={{ width: `${Math.round(winningHypo.confidence * 100)}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/30 text-center text-xs text-slate-500 font-mono">
                Synthesizing deductive reasoning from evidence pins...
              </div>
            )}
          </div>

          {/* ================= STAGE 4: THE VERDICT & PATCH (RESOLUTION) ================= */}
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>4. Verified Resolution</span>
              </div>
              <Badge
                className={`text-[10px] font-mono ${
                  isSolved
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                    : "bg-slate-800 text-slate-400 border-slate-700"
                }`}
              >
                {isSolved ? "VERIFIED GREEN" : "EVALUATING"}
              </Badge>
            </div>

            {/* Patch Card */}
            {patch ? (
              <Card className="bg-[#0a0f1d]/90 border border-slate-800 hover:border-slate-700 transition-all">
                <CardHeader className="p-3 border-b border-slate-800 bg-[#080d1a] flex flex-row items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5 text-emerald-400" />
                    <CardTitle className="text-xs font-mono text-slate-200">Surgical Patch</CardTitle>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-mono border-emerald-500/40 text-emerald-400">
                    APPLIED
                  </Badge>
                </CardHeader>
                <CardContent className="p-3 space-y-2 text-xs">
                  <p className="text-[11px] text-slate-400 leading-snug">
                    {patch.explanation || "Unified diff generated to resolve identified regression."}
                  </p>
                  <pre className="p-2 rounded bg-black/80 border border-slate-800 font-mono text-[10px] text-emerald-400 overflow-x-auto max-h-24">
                    {patch.unified_diff}
                  </pre>
                </CardContent>
              </Card>
            ) : (
              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/30 text-center text-xs text-slate-500 font-mono">
                No code modification required for this review.
              </div>
            )}

            {/* Test Verification Card */}
            {verification ? (
              <Card className="bg-gradient-to-br from-emerald-950/40 via-emerald-900/10 to-slate-900 border border-emerald-500/40 shadow-lg shadow-emerald-500/10">
                <CardHeader className="p-3 border-b border-emerald-500/20 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <CardTitle className="text-xs font-bold text-white font-mono">Test Verification</CardTitle>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">EXIT {verification.exit_code}</span>
                </CardHeader>
                <CardContent className="p-3 space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">Runner:</span>
                    <span className="text-emerald-300 font-bold">{verification.command}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">Test Outcome:</span>
                    <span className="text-emerald-400 font-bold">
                      {verification.passed ? "ALL TESTS PASSED" : "UNVERIFIED"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/20 text-center text-xs text-slate-500 font-mono">
                Awaiting sandbox verification execution...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
