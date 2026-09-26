"use client";

import React from "react";
import { EvidenceItem } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { FileCode2, ShieldAlert } from "lucide-react";

interface Props {
  evidence: EvidenceItem[];
}

export function EvidencePanel({ evidence }: Props) {
  return (
    <Card className="bg-[#0c1220] border-slate-800 text-slate-100 flex flex-col h-full">
      <CardHeader className="py-3 px-4 border-b border-slate-800 bg-[#080d1a] flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-cyan-400" />
          <CardTitle className="text-sm font-semibold tracking-wide text-slate-200">
            STRUCTURED EVIDENCE LOG
          </CardTitle>
        </div>
        <Badge variant="outline" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30 text-xs">
          {evidence.length} {evidence.length === 1 ? "Item" : "Items"}
        </Badge>
      </CardHeader>

      <CardContent className="p-3 overflow-y-auto space-y-3 flex-1">
        {evidence.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-slate-500 text-xs">
            <p>No evidence items captured yet.</p>
            <p className="text-[11px] text-slate-600 mt-1">
              Evidence appears here as the investigator parses code & logs.
            </p>
          </div>
        ) : (
          evidence.map((item) => (
            <div
              key={item.id}
              className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5 font-mono text-xs text-sky-300">
                  <FileCode2 className="w-3.5 h-3.5 text-sky-400" />
                  <span>{item.file}</span>
                  {item.line && (
                    <span className="text-slate-400">:{item.line}</span>
                  )}
                </div>
                <Badge
                  variant="outline"
                  className="text-[10px] bg-slate-800/80 text-cyan-300 border-cyan-800"
                >
                  {Math.round(item.confidence * 100)}% CONFIDENCE
                </Badge>
              </div>

              <h4 className="text-xs font-semibold text-slate-100 mb-1">
                {item.claim}
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed mb-2.5 font-sans">
                {item.description}
              </p>

              {item.code_snippet && (
                <div className="p-2.5 bg-[#050811] rounded border border-slate-800/90 font-mono text-[11px] text-slate-300 overflow-x-auto">
                  <pre>{item.code_snippet}</pre>
                </div>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
