"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createCase, getCases, getHealth, Case, HealthResponse } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Sparkles,
  GitBranch,
  Terminal,
  Clock,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  FolderGit2,
  Cpu,
  Layers,
  CheckCircle2,
  FileCode,
  Flame,
  Zap,
  Filter,
  Activity,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function NewCasePage() {
  const router = useRouter();

  const [repoUrl, setRepoUrl] = useState("");
  const [bugDescription, setBugDescription] = useState("");
  const [stackTrace, setStackTrace] = useState("");
  const [showStackTrace, setShowStackTrace] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [recentCases, setRecentCases] = useState<Case[]>([]);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    getCases()
      .then(setRecentCases)
      .catch((err) => console.warn("Could not load past cases:", err));

    getHealth()
      .then(setHealth)
      .catch((err) => console.warn("Could not load health status:", err));
  }, []);

  const handleLoadDemo = () => {
    setRepoUrl("c:/GitHub/agent-holmes/test-repos/session-logout-demo");
    setBugDescription(
      "Users report getting logged out after token refresh. In Flask, updating session['auth'] in-place does not trigger Set-Cookie without session.modified = True."
    );
    setStackTrace("401 Unauthorized: Session cookie missing or stale on GET /api/user/profile");
    setShowStackTrace(true);
    setError(null);
  };

  const handleLaunchDemoDirectly = async () => {
    setLoading(true);
    setError(null);
    try {
      const newCase = await createCase({
        repo_url: "c:/GitHub/agent-holmes/test-repos/session-logout-demo",
        bug_description:
          "Users report getting logged out after token refresh. In Flask, updating session['auth'] in-place does not trigger Set-Cookie without session.modified = True.",
        stack_trace: "401 Unauthorized on GET /api/user/profile",
      });
      router.push(`/cases/${newCase.case_id}`);
    } catch (err: any) {
      setError(err?.message || "Failed to launch demo investigation");
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl.trim() || !bugDescription.trim()) {
      setError("Target repository and bug description are required to begin investigation.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const newCase = await createCase({
        repo_url: repoUrl.trim(),
        bug_description: bugDescription.trim(),
        stack_trace: stackTrace.trim() || undefined,
      });

      router.push(`/cases/${newCase.case_id}`);
    } catch (err: any) {
      setError(err?.message || "Failed to start investigation");
      setLoading(false);
    }
  };

  // Metrics
  const solvedCount = recentCases.filter((c) => c.status === "solved").length;
  const investigatingCount = recentCases.filter((c) => c.status === "investigating").length;

  // Filtered cases
  const filteredCases = useMemo(() => {
    return recentCases.filter((c) => {
      const matchesStatus =
        filterStatus === "all" ? true : c.status === filterStatus;
      const matchesSearch =
        searchQuery === ""
          ? true
          : c.case_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.bug_description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.repo_url.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [recentCases, filterStatus, searchQuery]);

  return (
    <div className="min-h-screen bg-cyber-grid bg-[#080c16] text-slate-100 flex flex-col selection:bg-sky-500 selection:text-slate-950">
      {/* Top Cyber Navigation Bar */}
      <header className="border-b border-slate-800/80 bg-[#080c16]/90 backdrop-blur-md sticky top-0 z-50 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 via-indigo-600 to-cyan-400 p-[1px] shadow-[0_0_20px_rgba(56,189,248,0.35)]">
              <div className="w-full h-full bg-[#080c16] rounded-xl flex items-center justify-center font-black text-sky-400 text-sm">
                AH
              </div>
            </div>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-wider text-slate-100 text-sm">AGENT HOLMES</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-sky-950/80 text-sky-400 border border-sky-800/60 font-semibold">
                BOB 2.0 PROTOCOL
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
              <span>Autonomous Software Forensic Engine</span>
              <span className="text-slate-600">•</span>
              <span className="text-sky-300 italic">"Every bug leaves evidence."</span>
            </p>
          </div>
        </div>

        {/* Live Diagnostics Pill */}
        <div className="hidden md:flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-800 rounded-full px-3.5 py-1.5 shadow-inner">
            <div className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Git Sandboxing</span>
            </div>
            <span className="text-slate-700">|</span>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${health?.tools.ripgrep.available ? "bg-emerald-400" : "bg-amber-400"}`} />
              <span className="text-slate-300">{health?.tools.ripgrep.available ? "Ripgrep Engine" : "Py-Regex"}</span>
            </div>
            <span className="text-slate-700">|</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-400" />
              <span className="text-slate-300">Pytest Verifier</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 space-y-12">
        {/* Hero Section */}
        <div className="relative pt-4 pb-2 text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-sky-500/10 via-indigo-500/10 to-cyan-500/10 border border-sky-500/30 text-sky-400 text-xs font-mono shadow-[0_0_20px_rgba(56,189,248,0.15)]">
            <Zap className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
            <span>AGENTIC INVESTIGATION • HYPOTHESIS LAB • TEST-VERIFIED PATCHES</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white leading-tight">
            Stop Guessing. <br />
            <span className="bg-gradient-to-r from-sky-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
              Trace the Evidence.
            </span>
          </h1>

          <p className="text-slate-400 text-sm md:text-base leading-relaxed font-sans">
            Give Agent Holmes a repository and a failure report. It clones into an isolated sandbox, gathers concrete code citations, tests hypotheses, synthesizes a targeted unified diff, and executes real automated tests before marking the case <span className="text-emerald-400 font-semibold">SOLVED</span>.
          </p>
        </div>

        {/* Two-Column Command Center */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Launch Form (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="glass-panel rounded-2xl p-6 md:p-8 space-y-6 relative overflow-hidden border border-slate-800/80">
              {/* Corner tech crosshairs */}
              <div className="absolute top-2 left-2 text-[10px] font-mono text-slate-700 select-none">[ + ]</div>
              <div className="absolute top-2 right-2 text-[10px] font-mono text-slate-700 select-none">[ + ]</div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
                <div>
                  <h2 className="text-base font-bold tracking-wide text-slate-100 flex items-center gap-2 font-mono">
                    <Terminal className="w-4 h-4 text-sky-400" />
                    DISPATCH INVESTIGATOR
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Configure repository sandbox and bug symptoms.
                  </p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleLoadDemo}
                  className="bg-sky-500/10 hover:bg-sky-500/20 border-sky-500/40 text-sky-300 text-xs font-mono h-8 flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <FolderGit2 className="w-3.5 h-3.5 text-sky-400" />
                  Pre-fill Demo Bug
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2.5 font-mono">
                    <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Target Repo */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-200 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <GitBranch className="w-3.5 h-3.5 text-sky-400" />
                      Target Repository (Local Sandbox or Git Clone URL)
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">ISOLATED SANDBOX</span>
                  </label>
                  <Input
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    placeholder="c:/GitHub/agent-holmes/test-repos/session-logout-demo or https://github.com/..."
                    className="bg-[#050914] border-slate-800 text-slate-100 placeholder:text-slate-600 font-mono text-xs h-11 focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition-all rounded-lg"
                  />
                </div>

                {/* Bug Description */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-200 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Search className="w-3.5 h-3.5 text-amber-400" />
                      Observed Symptom / Issue Description
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">NATURAL LANGUAGE</span>
                  </label>
                  <Textarea
                    value={bugDescription}
                    onChange={(e) => setBugDescription(e.target.value)}
                    rows={4}
                    placeholder="Describe how the bug manifests, what users report, unexpected 401s, failing tests, or invalid responses..."
                    className="bg-[#050914] border-slate-800 text-slate-100 placeholder:text-slate-600 text-xs leading-relaxed focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition-all rounded-lg"
                  />
                </div>

                {/* Collapsible Stack Trace */}
                <div className="border border-slate-800/80 rounded-xl overflow-hidden bg-[#050914]/50">
                  <button
                    type="button"
                    onClick={() => setShowStackTrace(!showStackTrace)}
                    className="w-full px-4 py-2.5 flex items-center justify-between text-xs text-slate-400 hover:text-slate-200 font-mono bg-slate-900/40 hover:bg-slate-900 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <FileCode className="w-3.5 h-3.5 text-purple-400" />
                      Stack Trace / Console Error Log
                      {stackTrace && <span className="text-[10px] text-purple-400 font-bold">(Attached)</span>}
                    </span>
                    {showStackTrace ? (
                      <ChevronUp className="w-4 h-4 text-slate-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    )}
                  </button>

                  {showStackTrace && (
                    <div className="p-3 border-t border-slate-800/80">
                      <Textarea
                        value={stackTrace}
                        onChange={(e) => setStackTrace(e.target.value)}
                        rows={3}
                        placeholder="Paste traceback, 500 error logs, or pytest crash report..."
                        className="bg-[#03060d] border-slate-800 text-slate-200 placeholder:text-slate-700 font-mono text-[11px] leading-relaxed focus:border-purple-400 rounded-lg"
                      />
                    </div>
                  )}
                </div>

                {/* Submit Action */}
                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-sky-500 via-indigo-500 to-cyan-400 hover:from-sky-400 hover:to-cyan-300 text-slate-950 font-black text-xs h-12 tracking-wider shadow-[0_0_30px_rgba(56,189,248,0.35)] flex items-center justify-center gap-2 rounded-xl transition-all hover:scale-[1.01]"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                        <span>ISOLATING WORKSPACE & COMMENCING INVESTIGATION...</span>
                      </>
                    ) : (
                      <>
                        <span>COMMENCE AUTONOMOUS INVESTIGATION</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>

          {/* Right Column: Featured Demo + Protocol Visualizer (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Featured Demo Showcase Card */}
            <div className="glass-card rounded-2xl p-6 border-slate-800/90 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center justify-between mb-3">
                <Badge className="bg-sky-500/20 text-sky-400 border-sky-500/40 font-mono text-[10px] tracking-wider font-bold">
                  FEATURED CASE STUDY
                </Badge>
                <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> VERIFIED DEMO
                </span>
              </div>

              <h3 className="text-base font-bold text-white mb-2 group-hover:text-sky-300 transition-colors">
                The Phantom Session Logout Bug
              </h3>

              <p className="text-xs text-slate-300 leading-relaxed font-sans mb-4">
                Users spontaneously get logged out immediately after automatic token refresh. Flask omits the <code className="text-sky-300 font-mono bg-slate-900 px-1 py-0.5 rounded">Set-Cookie</code> header on in-place dictionary mutations unless <code className="text-emerald-300 font-mono bg-slate-900 px-1 py-0.5 rounded">session.modified = True</code> is flagged.
              </p>

              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-[11px] font-mono space-y-1.5 mb-4 text-slate-400">
                <div className="flex justify-between">
                  <span className="text-slate-500">TARGET:</span>
                  <span className="text-slate-200">session-logout-demo/</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">TEST STATUS:</span>
                  <span className="text-amber-400">1 Failed, 3 Passed (Pre-Fix)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">POST-FIX GOAL:</span>
                  <span className="text-emerald-400 font-bold">4 Passed (Verified)</span>
                </div>
              </div>

              <Button
                onClick={handleLaunchDemoDirectly}
                disabled={loading}
                className="w-full bg-slate-900 hover:bg-slate-800 border border-sky-500/40 text-sky-300 hover:text-white font-mono text-xs h-10 flex items-center justify-center gap-2 rounded-xl transition-all shadow-[0_0_15px_rgba(56,189,248,0.1)]"
              >
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>1-Click Launch Demo Case Study</span>
              </Button>
            </div>

            {/* Forensic Workflow Visualizer */}
            <div className="glass-panel rounded-2xl p-5 border-slate-800/80 space-y-3 font-mono text-xs">
              <div className="flex items-center gap-2 text-slate-300 font-bold tracking-wider text-[11px] border-b border-slate-800/80 pb-2">
                <Layers className="w-3.5 h-3.5 text-sky-400" />
                THE 5-STEP FORENSIC PIPELINE
              </div>

              <div className="space-y-2.5 text-[11px]">
                <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-900/60 border border-slate-800/60">
                  <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-[10px]">1</span>
                  <div>
                    <span className="text-slate-200 font-semibold">Sandbox Discovery:</span>
                    <span className="text-slate-400 ml-1">Clones target & builds safe workspace directory</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-900/60 border border-slate-800/60">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-[10px]">2</span>
                  <div>
                    <span className="text-slate-200 font-semibold">Code Evidence Search:</span>
                    <span className="text-slate-400 ml-1">Ripgrep locates offending routes & handlers</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-900/60 border border-slate-800/60">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-[10px]">3</span>
                  <div>
                    <span className="text-slate-200 font-semibold">Hypothesis Testing:</span>
                    <span className="text-slate-400 ml-1">Ranks probabilistic failure rationales</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-900/60 border border-slate-800/60">
                  <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-[10px]">4</span>
                  <div>
                    <span className="text-slate-200 font-semibold">Surgical Patching:</span>
                    <span className="text-slate-400 ml-1">Generates minimal unified git diff</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-900/60 border border-slate-800/60">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">5</span>
                  <div>
                    <span className="text-slate-200 font-semibold">Automated Verification:</span>
                    <span className="text-emerald-400 ml-1">Pytest confirms fix before claiming SOLVED</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Cases Section */}
        {recentCases.length > 0 && (
          <div className="space-y-5 pt-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
              <div>
                <h3 className="text-sm font-bold tracking-wider text-slate-100 flex items-center gap-2 font-mono">
                  <Activity className="w-4 h-4 text-sky-400" />
                  CASE ARCHIVES ({recentCases.length})
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Historical bug investigations and verification records.
                </p>
              </div>

              {/* Status Filters and Search */}
              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter by ID or symptom..."
                    className="bg-[#050914] border border-slate-800 rounded-lg pl-8 pr-3 py-1 text-xs font-mono text-slate-200 placeholder:text-slate-600 h-8 w-44 focus:w-56 transition-all focus:border-sky-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center bg-slate-900/80 border border-slate-800 rounded-lg p-0.5 text-xs font-mono">
                  <button
                    onClick={() => setFilterStatus("all")}
                    className={`px-2.5 py-1 rounded transition-colors ${
                      filterStatus === "all" ? "bg-slate-800 text-sky-300 font-bold" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    All ({recentCases.length})
                  </button>
                  <button
                    onClick={() => setFilterStatus("solved")}
                    className={`px-2.5 py-1 rounded transition-colors ${
                      filterStatus === "solved" ? "bg-emerald-950 text-emerald-300 font-bold" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Solved ({solvedCount})
                  </button>
                  {investigatingCount > 0 && (
                    <button
                      onClick={() => setFilterStatus("investigating")}
                      className={`px-2.5 py-1 rounded transition-colors ${
                        filterStatus === "investigating" ? "bg-amber-950 text-amber-300 font-bold" : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      Active ({investigatingCount})
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Case Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCases.map((c) => {
                const isSolved = c.status === "solved";
                const isInvestigating = c.status === "investigating";

                return (
                  <Link key={c.case_id} href={`/cases/${c.case_id}`}>
                    <div className="glass-card rounded-xl p-4.5 border-slate-800/80 hover:border-slate-700 transition-all hover:translate-y-[-2px] group space-y-3 h-full flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs text-sky-400 font-bold group-hover:text-sky-300">
                            {c.case_id}
                          </span>
                          <Badge
                            className={
                              isSolved
                                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 text-[10px]"
                                : isInvestigating
                                ? "bg-amber-500/20 text-amber-400 border-amber-500/40 animate-pulse text-[10px]"
                                : "bg-slate-800 text-slate-400 border-slate-700 text-[10px]"
                            }
                          >
                            {c.status.toUpperCase()}
                          </Badge>
                        </div>

                        <p className="text-xs text-slate-200 line-clamp-2 leading-relaxed font-sans">
                          {c.bug_description}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] font-mono text-slate-500">
                        <span className="truncate max-w-[160px] text-slate-400">
                          {c.repo_url.split("/").pop() || c.repo_url}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-600" />
                          {new Date(c.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
