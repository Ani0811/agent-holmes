import React from "react";
import Link from "next/link";
import { FileQuestion, ArrowLeft, Search, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#080c16] bg-cyber-grid text-slate-100 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main card */}
      <div className="max-w-md w-full border border-slate-800/80 bg-[#0c1220]/90 rounded-2xl p-8 backdrop-blur-xl shadow-2xl flex flex-col items-center text-center space-y-6 relative z-10">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

        {/* 404 Badge & Icon */}
        <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
          <FileQuestion className="w-8 h-8" />
          <div className="absolute inset-0 rounded-2xl border border-amber-500/30 animate-ping opacity-20" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-[10px] font-mono tracking-widest text-amber-400 uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            404 // Record Unindexed
          </div>
          <h1 className="text-lg font-bold text-slate-100 font-mono tracking-wide">
            DOSSIER NOT FOUND
          </h1>
          <p className="text-xs text-slate-400 font-sans leading-relaxed max-w-xs mx-auto">
            The requested investigation dossier, telemetry feed, or endpoint does not exist or has been archived.
          </p>
        </div>

        {/* Info panel */}
        <div className="w-full p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px] font-mono text-slate-400 flex items-center gap-2.5">
          <Terminal className="w-4 h-4 text-sky-400 shrink-0" />
          <span className="truncate">Check target case ID or return to the main console.</span>
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center justify-center gap-3 w-full">
          <Link href="/">
            <Button className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold font-mono text-xs h-9 px-4 flex items-center gap-1.5">
              <ArrowLeft className="w-3.5 h-3.5" />
              Return to Dispatch
            </Button>
          </Link>
          <Link href="/#archives">
            <Button
              variant="outline"
              className="border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-300 font-mono text-xs h-9 px-4 flex items-center gap-1.5"
            >
              <Search className="w-3.5 h-3.5 text-slate-400" />
              Browse Archives
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
