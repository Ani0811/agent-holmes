"use client";

import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" className="dark h-full">
      <body className="min-h-full bg-[#080c16] text-slate-100 flex flex-col items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full border border-rose-500/30 bg-[#0e1220] rounded-2xl p-8 shadow-2xl flex flex-col items-center text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-base font-bold font-mono text-slate-100 tracking-wide">
              CRITICAL TELEMETRY FAULT
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
              A critical exception occurred within the root application shell.
            </p>
            {error.digest && (
              <p className="text-[10px] font-mono text-slate-500">
                Digest: <span className="text-rose-400">#{error.digest}</span>
              </p>
            )}
          </div>

          <button
            onClick={() => reset()}
            className="bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold font-mono text-xs h-9 px-5 rounded-lg flex items-center gap-2 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reload Application
          </button>
        </div>
      </body>
    </html>
  );
}
