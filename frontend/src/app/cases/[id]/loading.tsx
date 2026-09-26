import React from "react";
import { Terminal, Shield, Activity, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function CaseLoading() {
  return (
    <div className="min-h-screen bg-cyber-grid bg-[#080c16] text-slate-100 flex flex-col">
      {/* Header Skeleton Bar */}
      <header className="border-b border-slate-800/80 bg-[#080c16]/95 px-6 py-3 flex items-center justify-between sticky top-0 z-50">
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
          <div className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-sky-400" />
            <div className="h-4 w-32 bg-slate-800/80 rounded animate-pulse" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-6 w-20 bg-slate-800/80 rounded-full animate-pulse" />
        </div>
      </header>

      {/* Main Centered Loading Card */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full border border-slate-800/80 bg-[#0c1220]/90 rounded-2xl p-8 backdrop-blur-xl shadow-2xl flex flex-col items-center text-center space-y-6 relative overflow-hidden">
          {/* Top cyan neon line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-sky-400 to-transparent" />

          {/* Animated radar badge */}
          <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-sky-400">
            <Terminal className="w-7 h-7" />
            <div className="absolute inset-0 rounded-2xl border border-sky-400/30 animate-ping opacity-25" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-[10px] font-mono tracking-widest text-sky-400 uppercase">
              <Activity className="w-3 h-3 animate-pulse" />
              Live Telemetry
            </div>
            <h1 className="text-sm font-bold text-slate-100 tracking-wider font-mono uppercase">
              Connecting Investigation Dossier
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed font-sans max-w-xs mx-auto">
              Synchronizing forensic event streams, restoring workspace snapshot, and booting agentic inspectors.
            </p>
          </div>

          {/* Info pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Sandbox Verification Active</span>
          </div>

          {/* Shimmer progress beam */}
          <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
            <div className="h-full bg-gradient-to-r from-sky-500 to-emerald-400 w-3/4 rounded-full animate-pulse" />
          </div>
        </div>
      </main>
    </div>
  );
}
