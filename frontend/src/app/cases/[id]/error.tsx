"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw, ArrowLeft, Terminal, Copy, Check, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CaseErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function CaseError({ error, reset }: CaseErrorProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyDiagnostics = () => {
    const text = [
      `Timestamp: ${new Date().toISOString()}`,
      `Error Message: ${error.message || "Failed to load case dossier"}`,
      `Digest: ${error.digest || "None"}`,
      `Stack Trace:`,
      error.stack || "No stack trace available",
    ].join("\n");

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#080c16] bg-cyber-grid text-slate-100 flex flex-col">
      {/* Header Bar */}
      <header className="border-b border-slate-800/80 bg-[#080c16]/95 px-6 py-3 flex items-center justify-between sticky top-0 z-50">
        <Link href="/">
          <Button
            variant="outline"
            size="sm"
            className="h-8 border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-300 text-xs font-mono"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back to Dossiers
          </Button>
        </Link>
        <span className="font-mono text-xs text-rose-400">TELEMETRY FAULT</span>
      </header>

      {/* Main Error Box */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-lg w-full border border-rose-500/30 bg-[#0e1220]/95 rounded-2xl p-8 backdrop-blur-xl shadow-2xl flex flex-col items-center text-center space-y-6 relative overflow-hidden">
          {/* Top warning line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-rose-500 to-transparent" />

          {/* Icon */}
          <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
            <AlertCircle className="w-8 h-8" />
            <div className="absolute inset-0 rounded-2xl border border-rose-500/30 animate-ping opacity-25" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-[10px] font-mono tracking-widest text-rose-300 uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
              Dossier Feed Severed
            </div>
            <h1 className="text-base font-bold text-slate-100 font-mono tracking-wide">
              FAILED TO LOAD CASE DOSSIER
            </h1>
            <p className="text-xs text-slate-300 font-sans leading-relaxed max-w-sm mx-auto">
              {error.message || "Unable to retrieve case metadata, investigation artifacts, or telemetry stream."}
            </p>
            {error.digest && (
              <p className="text-[10px] font-mono text-slate-500">
                Fault Digest: <span className="text-rose-300/80">#{error.digest}</span>
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 w-full">
            <Button
              onClick={() => reset()}
              className="bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold font-mono text-xs h-9 px-4 flex items-center gap-1.5 shadow-lg shadow-rose-500/20"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry Connection
            </Button>
            <Link href="/">
              <Button
                variant="outline"
                className="border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-300 font-mono text-xs h-9 px-4 flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Case Archives
              </Button>
            </Link>
            <Button
              variant="ghost"
              onClick={handleCopyDiagnostics}
              className="text-slate-400 hover:text-slate-200 font-mono text-xs h-9 px-3 flex items-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied" : "Copy Log"}
            </Button>
          </div>

          {/* Technical Diagnostics */}
          <div className="w-full text-left pt-2 border-t border-slate-800/80">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center justify-between w-full text-[11px] font-mono text-slate-400 hover:text-slate-200 transition-colors py-1"
            >
              <span className="flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-slate-500" />
                Dossier Exception Log
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
      </main>
    </div>
  );
}
