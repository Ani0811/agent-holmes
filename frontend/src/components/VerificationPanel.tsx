"use client";

import React from "react";
import { TestResult } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CheckCircle2, XCircle, Terminal, Clock, ShieldCheck, AlertCircle } from "lucide-react";

interface Props {
  results: TestResult[];
}

export function VerificationPanel({ results }: Props) {
  const latestResult = results.length > 0 ? results[results.length - 1] : null;

  const isNoTests = Boolean(
    latestResult &&
      !latestResult.passed &&
      (latestResult.exit_code === 5 ||
        (latestResult.stdout &&
          (latestResult.stdout.includes("collected 0 items") ||
            latestResult.stdout.includes("no tests ran"))))
  );

  return (
    <Card className="bg-[#0c1220] border-slate-800 text-slate-100 flex flex-col h-full">
      <CardHeader className="py-3 px-4 border-b border-slate-800 bg-[#080d1a] flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <CardTitle className="text-sm font-semibold tracking-wide text-slate-200">
            TEST VERIFICATION ENGINE
          </CardTitle>
        </div>
        {latestResult ? (
          latestResult.passed ? (
            <Badge className="bg-emerald-500 text-slate-950 font-bold border-emerald-400 flex items-center gap-1 font-mono text-xs">
              <CheckCircle2 className="w-3.5 h-3.5" /> VERIFIED
            </Badge>
          ) : isNoTests ? (
            <Badge className="bg-amber-500/20 text-amber-300 font-bold border-amber-500/40 flex items-center gap-1 font-mono text-xs">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" /> NO TESTS FOUND
            </Badge>
          ) : (
            <Badge className="bg-rose-500 text-white font-bold border-rose-400 flex items-center gap-1 font-mono text-xs">
              <XCircle className="w-3.5 h-3.5" /> FAILED
            </Badge>
          )
        ) : (
          <Badge variant="outline" className="text-slate-500 border-slate-700 font-mono text-xs">
            NOT VERIFIED
          </Badge>
        )}
      </CardHeader>

      <CardContent className="p-4 space-y-4 overflow-y-auto flex-1">
        {!latestResult ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-500 text-xs text-center">
            <Terminal className="w-8 h-8 text-slate-600 mb-2" />
            <p>Verification runs automatically after a patch is applied or during test auditing.</p>
            <p className="text-[11px] text-slate-600 mt-1">
              Agent Holmes will never claim a bug is solved without verified passing tests.
            </p>
          </div>
        ) : (
          <div className="space-y-3 font-mono text-xs">
            {/* Meta info */}
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800">
                <span className="text-slate-500 block mb-0.5">COMMAND</span>
                <span className="text-sky-300 font-semibold">{latestResult.command}</span>
              </div>
              <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-slate-500 block mb-0.5">EXIT CODE</span>
                  <div className="flex items-baseline gap-1.5">
                    <span
                      className={`font-semibold ${
                        latestResult.exit_code === 0
                          ? "text-emerald-400"
                          : isNoTests
                          ? "text-amber-400"
                          : "text-rose-400"
                      }`}
                    >
                      {latestResult.exit_code}
                    </span>
                    {isNoTests && (
                      <span className="text-[10px] text-amber-400/80 font-normal">
                        (0 tests collected)
                      </span>
                    )}
                  </div>
                </div>
                {latestResult.duration_ms !== null && latestResult.duration_ms !== undefined && (
                  <div className="text-right">
                    <span className="text-slate-500 block mb-0.5">DURATION</span>
                    <span className="text-slate-300 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {latestResult.duration_ms}ms
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Informational Callout when no tests collected */}
            {isNoTests && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-200 text-xs flex items-start gap-2.5 font-sans">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-amber-300 block">
                    No Automated Test Suite Discovered
                  </span>
                  <span className="text-slate-400 text-[11px] block mt-0.5 leading-relaxed">
                    Pytest exited with status code 5 because no test files or test functions matching discovery patterns (e.g. <code className="text-sky-300 font-mono">test_*.py</code>) were detected in this workspace. Baseline tests could not be run.
                  </span>
                </div>
              </div>
            )}

            {/* Test output terminal */}
            <div className="rounded-lg border border-slate-800 bg-[#060a12] p-3 text-[11px] max-h-[300px] overflow-y-auto">
              <div className="text-slate-500 text-[10px] mb-1.5 border-b border-slate-800/80 pb-1 flex items-center justify-between">
                <span>EXECUTION OUTPUT:</span>
                {isNoTests && (
                  <span className="text-amber-400/80 text-[10px]">pytest: exit 5 (empty collection)</span>
                )}
              </div>
              <pre className="text-slate-300 whitespace-pre-wrap leading-relaxed">
                {latestResult.stdout || latestResult.stderr || "No console output recorded."}
              </pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
