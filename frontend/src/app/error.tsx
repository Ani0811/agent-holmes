"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AlertOctagon, RefreshCw, Home, ChevronDown, ChevronUp, Copy, Check, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RootErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function RootError({ error, reset }: RootErrorProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyDiagnostics = () => {
    const diagnostics = [
      `Timestamp: ${new Date().toISOString()}`,
      `Error Message: ${error.message || "Unknown error"}`,
      `Digest: ${error.digest || "None"}`,
      `Stack Trace:`,
      error.stack || "No stack trace available",
    ].join("\n");

    navigator.clipboard.writeText(diagnostics);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#080c16] bg-cyber-grid text-slate-100 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background ambient red warning glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main cyber error card */}
      <div className="max-w-lg w-full border border-rose-500/30 bg-[#0e1220]/95 rounded-2xl p-8 backdrop-blur-xl shadow-2xl flex flex-col items-center text-center space-y-6 relative z-10">
        {/* Top warning line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-rose-500 to-transparent" />

        {/* Warning Badge & Icon */}
        <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
          <AlertOctagon className="w-8 h-8" />
          <div className="absolute inset-0 rounded-2xl border border-rose-500/30 animate-ping opacity-25" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-[10px] font-mono tracking-widest text-rose-300 uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
            System Fault Detected
          </div>
          <h1 className="text-lg font-bold text-slate-100 font-mono tracking-wide">
            INVESTIGATION DISPATCH ERROR
          </h1>
          <p className="text-xs text-slate-300 font-sans leading-relaxed max-w-sm mx-auto">
            {error.message || "An unexpected error occurred while executing the investigation pipeline."}
          </p>
          {error.digest && (
            <p className="text-[10px] font-mono text-slate-500">
              Fault Digest: <span className="text-rose-300/80">#{error.digest}</span>
            </p>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-center gap-3 w-full">
          <Button
            onClick={() => reset()}
            className="bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold font-mono text-xs h-9 px-4 flex items-center gap-1.5 shadow-lg shadow-rose-500/20"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Re-Initialize Session
          </Button>
          <Link href="/">
            <Button
              variant="outline"
              className="border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-300 font-mono text-xs h-9 px-4 flex items-center gap-1.5"
            >
              <Home className="w-3.5 h-3.5 text-sky-400" />
              Return to Console
            </Button>
          </Link>
          <Button
            variant="ghost"
            onClick={handleCopyDiagnostics}
            className="text-slate-400 hover:text-slate-200 font-mono text-xs h-9 px-3 flex items-center gap-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied Log" : "Copy Diagnostics"}
          </Button>
        </div>

        {/* Expandable Technical Log */}
        <div className="w-full text-left pt-2 border-t border-slate-800/80">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center justify-between w-full text-[11px] font-mono text-slate-400 hover:text-slate-200 transition-colors py-1"
          >
            <span className="flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-slate-500" />
              Technical Diagnostics
            </span>
            {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showDetails && (
            <div className="mt-2 p-3 rounded-lg bg-black/60 border border-slate-800 text-[10px] font-mono text-slate-400 max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed">
              {error.stack || error.message || "No stack trace available."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
