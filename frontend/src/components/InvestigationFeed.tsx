"use client";

import React, { useEffect, useRef, useState } from "react";
import { InvestigationEvent } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronDown, ChevronRight, Terminal, AlertCircle, CheckCircle2, Search, FileCode, Wrench } from "lucide-react";

interface Props {
  events: InvestigationEvent[];
  isConnected: boolean;
}

export function InvestigationFeed({ events, isConnected }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [expandedEvents, setExpandedEvents] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events]);

  const toggleExpand = (idx: number) => {
    setExpandedEvents((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const getEventBadge = (type: string) => {
    switch (type) {
      case "phase_change":
        return <Badge className="bg-sky-500/20 text-sky-400 border-sky-500/40">PHASE</Badge>;
      case "repo_scanned":
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40">INDEX</Badge>;
      case "command_executed":
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/40">EXEC</Badge>;
      case "patch_applied":
        return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/40">PATCH</Badge>;
      case "case_solved":
        return <Badge className="bg-emerald-500 text-slate-950 font-bold border-emerald-400">SOLVED</Badge>;
      case "case_failed":
        return <Badge className="bg-rose-500 text-white font-bold border-rose-400">FAILED</Badge>;
      default:
        return <Badge variant="outline" className="text-slate-400 border-slate-700">{type.toUpperCase()}</Badge>;
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case "phase_change":
        return <Search className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />;
      case "command_executed":
        return <Terminal className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />;
      case "patch_applied":
        return <Wrench className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />;
      case "case_solved":
        return <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />;
      case "case_failed":
      case "investigation_error":
        return <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />;
      default:
        return <FileCode className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0c1220] border border-slate-800 rounded-lg overflow-hidden">
      {/* Console Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#080d1a] border-b border-slate-800 text-xs font-mono">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-sky-400" />
          <span className="font-semibold text-slate-200 tracking-wider">INVESTIGATION EVENT FEED</span>
          <span className="text-slate-500">({events.length} events)</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              isConnected ? "bg-emerald-400 animate-pulse" : "bg-rose-500"
            }`}
          />
          <span className="text-slate-400">
            {isConnected ? "LIVE STREAM" : "DISCONNECTED"}
          </span>
        </div>
      </div>

      {/* Events Stream */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2 font-mono text-xs">
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-500 space-y-2">
            <div className="w-6 h-6 border-2 border-sky-400/30 border-t-sky-400 rounded-full animate-spin" />
            <p>Initializing sandbox workspace and starting investigation...</p>
          </div>
        ) : (
          events.map((ev, idx) => {
            const hasData = ev.data && Object.keys(ev.data).length > 0;
            const isExpanded = !!expandedEvents[idx];

            return (
              <div
                key={idx}
                className="group p-2.5 rounded bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 flex-1 min-w-0">
                    {getEventIcon(ev.event_type)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {getEventBadge(ev.event_type)}
                        <span className="text-slate-500 text-[10px]">
                          {new Date(ev.timestamp).toLocaleTimeString()}
                        </span>
                        {ev.is_replay && (
                          <span className="text-[10px] text-slate-500 italic">[replayed]</span>
                        )}
                      </div>
                      <p className="text-slate-200 text-xs leading-relaxed break-words font-sans">
                        {ev.message}
                      </p>
                    </div>
                  </div>

                  {hasData && (
                    <button
                      onClick={() => toggleExpand(idx)}
                      className="text-slate-500 hover:text-slate-300 p-1 rounded hover:bg-slate-800 transition-colors shrink-0"
                      title="Toggle Details"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>

                {hasData && isExpanded && (
                  <div className="mt-2.5 p-2 bg-[#060a12] border border-slate-800/60 rounded text-[11px] overflow-x-auto text-slate-300">
                    <pre>{JSON.stringify(ev.data, null, 2)}</pre>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
