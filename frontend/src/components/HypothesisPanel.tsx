"use client";

import React from "react";
import { Hypothesis } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Lightbulb, CheckCircle2, XCircle, Clock, Sparkles } from "lucide-react";

interface Props {
  hypotheses: Hypothesis[];
}

export function HypothesisPanel({ hypotheses }: Props) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return (
          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> CONFIRMED
          </Badge>
        );
      case "testing":
        return (
          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/40 flex items-center gap-1">
            <Clock className="w-3 h-3 animate-spin" /> TESTING
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/40 flex items-center gap-1">
            <XCircle className="w-3 h-3" /> REJECTED
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-slate-400 border-slate-700 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> PROPOSED
          </Badge>
        );
    }
  };

  return (
    <Card className="bg-[#0c1220] border-slate-800 text-slate-100 flex flex-col h-full">
      <CardHeader className="py-3 px-4 border-b border-slate-800 bg-[#080d1a] flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-amber-400" />
          <CardTitle className="text-sm font-semibold tracking-wide text-slate-200">
            ROOT CAUSE HYPOTHESES
          </CardTitle>
        </div>
        <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-xs">
          {hypotheses.length} {hypotheses.length === 1 ? "Hypothesis" : "Hypotheses"}
        </Badge>
      </CardHeader>

      <CardContent className="p-3 overflow-y-auto space-y-3 flex-1">
        {hypotheses.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-slate-500 text-xs">
            <p>Formulating hypotheses based on repository search...</p>
          </div>
        ) : (
          hypotheses.map((h) => {
            const pct = Math.round(h.confidence * 100);
            return (
              <div
                key={h.id}
                className={`p-3 rounded-lg border transition-all ${
                  h.status === "confirmed"
                    ? "bg-emerald-950/20 border-emerald-800/80 shadow-[0_0_15px_rgba(16,185,129,0.07)]"
                    : h.status === "rejected"
                    ? "bg-slate-900/40 border-slate-800 opacity-60"
                    : "bg-slate-900/80 border-slate-800"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="text-xs font-semibold text-slate-100 flex-1 leading-snug">
                    {h.title}
                  </h4>
                  {getStatusBadge(h.status)}
                </div>

                <p className="text-xs text-slate-400 leading-relaxed mb-3 font-sans">
                  {h.description}
                </p>

                {/* Confidence Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>CONFIDENCE SCORE</span>
                    <span className="font-semibold text-slate-200">{pct}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        h.status === "confirmed"
                          ? "bg-emerald-400"
                          : h.status === "rejected"
                          ? "bg-rose-500"
                          : "bg-amber-400"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {h.evidence_ids && h.evidence_ids.length > 0 && (
                  <div className="mt-2.5 flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
                    <span>SUPPORTING EVIDENCE:</span>
                    {h.evidence_ids.map((id) => (
                      <Badge
                        key={id}
                        variant="outline"
                        className="text-[9px] py-0 px-1 border-slate-700 text-slate-400"
                      >
                        #{id}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
