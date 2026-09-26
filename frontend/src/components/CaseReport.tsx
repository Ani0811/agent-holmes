"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CaseReport as CaseReportType } from "@/lib/api";
import { DiffViewer } from "./DiffViewer";
import { VerificationPanel } from "./VerificationPanel";
import { EvidencePanel } from "./EvidencePanel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CheckCircle2, XCircle, ArrowLeft, Code, FileText, Check, ShieldCheck, Sparkles } from "lucide-react";

interface Props {
  report: CaseReportType;
}

export function CaseReport({ report }: Props) {
  const [showJson, setShowJson] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(report, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Prominent Resolution Banner */}
      <div
        className={`p-6 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
          report.solved
            ? "bg-gradient-to-r from-emerald-950/80 via-emerald-900/40 to-slate-900 border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.12)]"
            : "bg-gradient-to-r from-rose-950/80 via-rose-900/40 to-slate-900 border-rose-500/50 shadow-[0_0_30px_rgba(244,63,94,0.12)]"
        }`}
      >
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
              report.solved
                ? "bg-emerald-500 text-slate-950"
                : "bg-rose-500 text-white"
            }`}
          >
            {report.solved ? (
              <CheckCircle2 className="w-7 h-7" />
            ) : (
              <XCircle className="w-7 h-7" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`font-black text-xl tracking-wider ${
                  report.solved ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {report.solved ? "CASE SOLVED" : "CASE FAILED / UNVERIFIED"}
              </span>
              <Badge variant="outline" className="text-xs border-slate-700 text-slate-400 font-mono">
                {report.case_id}
              </Badge>
            </div>
            <p className="text-sm text-slate-300 font-sans max-w-2xl leading-relaxed">
              {report.summary}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowJson(!showJson)}
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            <Code className="w-3.5 h-3.5 mr-1.5" />
            {showJson ? "Hide JSON" : "Raw Report"}
          </Button>
          <Link href="/">
            <Button
              size="sm"
              className={
                report.solved
                  ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-200"
              }
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
              New Investigation
            </Button>
          </Link>
        </div>
      </div>

      {showJson && (
        <div className="p-4 rounded-lg bg-[#060a14] border border-slate-800 relative font-mono text-xs text-slate-300 overflow-x-auto">
          <button
            onClick={handleCopyJson}
            className="absolute top-3 right-3 text-xs bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded text-slate-300 flex items-center gap-1 transition-colors"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <FileText className="w-3 h-3" />}
            {copied ? "Copied" : "Copy"}
          </button>
          <pre>{JSON.stringify(report, null, 2)}</pre>
        </div>
      )}

      {/* Main Resolution Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Root Cause & Diff */}
        <div className="space-y-6">
          <Card className="bg-[#0c1220] border-slate-800 text-slate-100">
            <CardHeader className="py-3 px-4 border-b border-slate-800 bg-[#080d1a] flex flex-row items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <CardTitle className="text-sm font-semibold tracking-wide">
                IDENTIFIED ROOT CAUSE
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="p-3.5 rounded-lg bg-emerald-950/20 border border-emerald-800/40 text-xs text-emerald-200 leading-relaxed font-sans">
                <span className="font-bold text-emerald-300 block mb-1">
                  Root Cause Diagnosis:
                </span>
                {report.root_cause || report.summary}
              </div>

              {report.winning_hypothesis && (
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-200">
                      Confirmed Hypothesis
                    </span>
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">
                      {Math.round(report.winning_hypothesis.confidence * 100)}% CONFIDENCE
                    </Badge>
                  </div>
                  <p className="text-slate-400 font-sans leading-relaxed">
                    {report.winning_hypothesis.description}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {report.patch ? (
            <DiffViewer
              unifiedDiff={report.patch.unified_diff}
              explanation={report.patch.explanation}
              filePaths={report.patch.file_paths}
            />
          ) : (
            <div className="p-6 rounded-lg border border-slate-800 bg-slate-900/40 text-center text-xs text-slate-500">
              No patch was generated for this case.
            </div>
          )}
        </div>

        {/* Right Column: Verification & Evidence */}
        <div className="space-y-6">
          <VerificationPanel results={report.verification ? [report.verification] : []} />
          <EvidencePanel evidence={report.key_evidence} />
        </div>
      </div>
    </div>
  );
}
