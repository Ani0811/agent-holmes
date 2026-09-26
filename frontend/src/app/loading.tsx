import React from "react";
import { Terminal, Shield, Cpu, Activity } from "lucide-react";

export default function RootLoading() {
  return (
    <div className="min-h-screen bg-[#080c16] bg-cyber-grid text-slate-100 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background ambient glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main cyber loader container */}
      <div className="max-w-md w-full border border-slate-800/80 bg-[#0c1220]/90 rounded-2xl p-8 backdrop-blur-xl shadow-2xl flex flex-col items-center text-center space-y-6 relative z-10 overflow-hidden">
        {/* Top cyan neon line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-sky-400 to-transparent" />

        {/* Central holographic radar ring */}
        <div className="relative flex items-center justify-center w-20 h-20 my-1">
          {/* Outer rotating pulse ring */}
          <div className="absolute inset-0 rounded-full border border-sky-500/20 animate-ping opacity-30" />
          <div className="absolute inset-1 rounded-full border-2 border-dashed border-sky-400/40 animate-spin" style={{ animationDuration: "8s" }} />
          <div className="absolute inset-3 rounded-full border border-indigo-400/30" />
          
          {/* Inner core */}
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500/20 to-indigo-500/20 border border-sky-400/50 flex items-center justify-center shadow-lg shadow-sky-500/10">
            <Terminal className="w-6 h-6 text-sky-400" />
          </div>
        </div>

        {/* Title and description */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-[10px] font-mono tracking-widest text-sky-400 uppercase">
            <Activity className="w-3 h-3 animate-pulse" />
            Agent Holmes Core
          </div>
          <h2 className="text-base font-bold text-slate-100 font-mono tracking-wide">
            INITIALIZING WORKSPACE
          </h2>
          <p className="text-xs text-slate-400 font-sans leading-relaxed max-w-xs mx-auto">
            Bootstrapping forensic telemetry, verifying sandbox runtime, and loading investigation archives.
          </p>
        </div>

        {/* Dynamic telemetry step badges */}
        <div className="w-full grid grid-cols-2 gap-2 text-[10px] font-mono text-left pt-2 border-t border-slate-800/80">
          <div className="p-2 rounded bg-slate-900/60 border border-slate-800/60 flex items-center gap-2 text-slate-300">
            <Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">Sandbox Guard</span>
          </div>
          <div className="p-2 rounded bg-slate-900/60 border border-slate-800/60 flex items-center gap-2 text-slate-300">
            <Cpu className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span className="truncate">Neural Provider</span>
          </div>
        </div>

        {/* Animated gradient progress bar */}
        <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800/80">
          <div className="h-full bg-gradient-to-r from-sky-500 via-indigo-400 to-emerald-400 w-3/4 rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  );
}
