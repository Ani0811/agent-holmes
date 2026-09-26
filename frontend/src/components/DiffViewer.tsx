"use client";

import React, { useState } from "react";
import { GitCommit, Copy, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Props {
  unifiedDiff: string;
  explanation?: string | null;
  filePaths?: string[];
}

export function DiffViewer({ unifiedDiff, explanation, filePaths }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(unifiedDiff);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = unifiedDiff.split("\n");

  return (
    <div className="rounded-lg border border-slate-800 bg-[#090e1a] overflow-hidden flex flex-col font-mono text-xs">
      {/* Diff Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#060a14] border-b border-slate-800">
        <div className="flex items-center gap-2">
          <GitCommit className="w-4 h-4 text-purple-400" />
          <span className="font-semibold text-slate-200">PROPOSED UNIFIED PATCH</span>
          {filePaths && filePaths.length > 0 && (
            <div className="flex gap-1 ml-2">
              {filePaths.map((f, idx) => (
                <Badge key={idx} variant="outline" className="text-[10px] border-slate-700 text-purple-300 py-0 px-1.5">
                  {f}
                </Badge>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 px-2 py-1 rounded bg-slate-800/60 hover:bg-slate-800 transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? "Copied" : "Copy Diff"}</span>
        </button>
      </div>

      {explanation && (
        <div className="px-4 py-2 bg-purple-950/20 border-b border-purple-900/30 text-purple-200 text-xs font-sans">
          <span className="font-semibold text-purple-300">Rationale: </span>
          {explanation}
        </div>
      )}

      {/* Code Viewer */}
      <div className="overflow-x-auto p-3 text-xs leading-relaxed max-h-[380px] overflow-y-auto">
        <table className="w-full border-collapse">
          <tbody>
            {lines.map((line, idx) => {
              let rowBg = "hover:bg-slate-900/50";
              let textColor = "text-slate-300";
              let prefixColor = "text-slate-500";

              if (line.startsWith("+++") || line.startsWith("---")) {
                rowBg = "bg-slate-900/80 font-bold";
                textColor = "text-sky-300";
              } else if (line.startsWith("@@")) {
                rowBg = "bg-slate-900/90 text-cyan-400 font-semibold";
                textColor = "text-cyan-400";
              } else if (line.startsWith("+")) {
                rowBg = "bg-emerald-950/40 hover:bg-emerald-950/60";
                textColor = "text-emerald-300";
                prefixColor = "text-emerald-400 font-bold";
              } else if (line.startsWith("-")) {
                rowBg = "bg-rose-950/40 hover:bg-rose-950/60";
                textColor = "text-rose-300";
                prefixColor = "text-rose-400 font-bold";
              }

              return (
                <tr key={idx} className={`${rowBg} transition-colors`}>
                  <td className="w-8 select-none text-right pr-3 text-[10px] text-slate-600 font-mono">
                    {idx + 1}
                  </td>
                  <td className="w-4 select-none text-center font-mono">
                    <span className={prefixColor}>{line.slice(0, 1)}</span>
                  </td>
                  <td className={`whitespace-pre pl-2 ${textColor}`}>
                    {line.slice(1)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
