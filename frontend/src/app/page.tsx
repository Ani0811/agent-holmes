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
  GitBranch,
  Terminal,
  Clock,
  ArrowRight,
  ShieldAlert,
  FolderGit2,
  CheckCircle2,
  FileCode,
  Activity,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Bug,
  Layers,
  Sparkles,
} from "lucide-react";

export default function NewCasePage() {
  const router = useRouter();

  const [investigationType, setInvestigationType] = useState<"bug_fix" | "repo_review">("bug_fix");
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
    if (investigationType === "repo_review") {
      setBugDescription(
        "Comprehensive architecture audit: review authentication, session persistence, code smells, and test suite health."
      );
      setStackTrace("Key areas: src/auth/, tests/test_session.py");
    } else {
      setBugDescription(
        "Users report being logged out immediately after token refresh. Flask does not re-issue the session cookie when a nested dict is mutated in-place without setting session.modified = True."
      );
      setStackTrace("401 Unauthorized: session cookie missing or stale on GET /api/user/profile");
    }
    setShowStackTrace(true);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl.trim()) {
      setError("Repository path is required.");
      return;
    }
    if (investigationType === "bug_fix" && !bugDescription.trim()) {
      setError("Bug description is required for targeted bug investigations.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const newCase = await createCase({
        repo_url: repoUrl.trim(),
        bug_description: bugDescription.trim() || undefined,
        case_type: investigationType,
        stack_trace: stackTrace.trim() || undefined,
      });
      router.push(`/cases/${newCase.case_id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to start investigation");
      setLoading(false);
    }
  };

  const solvedCount = recentCases.filter((c) => c.status === "solved").length;
  const activeCount = recentCases.filter(
    (c) => c.status === "investigating" || c.status === "pending"
  ).length;

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
    <div className="min-h-screen bg-cyber-grid bg-[#080c16] text-slate-100 flex flex-col">
      {/* Navigation */}
      <header className="border-b border-slate-800/80 bg-[#080c16]/95 backdrop-blur-md sticky top-0 z-50 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center font-black text-sky-400 text-xs font-mono">
            AH
          </div>
          <div>
            <span className="font-bold tracking-wider text-slate-100 text-sm font-mono">AGENT HOLMES</span>
            <p className="text-[11px] text-slate-500 font-mono hidden sm:block">
              "Every bug leaves evidence."
            </p>
          </div>
        </div>

        {/* Tool status indicators */}
        <div className="hidden md:flex items-center gap-3 text-[11px] font-mono text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${health?.tools.ripgrep.available ? "bg-emerald-400" : "bg-slate-600"}`} />
            <span>{health?.tools.ripgrep.available ? "ripgrep" : "py-regex"}</span>
          </div>
          <span className="text-slate-700">·</span>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>git</span>
          </div>
          <span className="text-slate-700">·</span>
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${health?.tools.docker.available ? "bg-emerald-400" : "bg-slate-600"}`} />
            <span>{health?.tools.docker.available ? "docker" : "subprocess"}</span>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8 space-y-10">

        {/* Two-column layout: form left, info right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left — Dispatch form */}
          <div className="lg:col-span-7">
            <div className="border border-slate-800 rounded-xl bg-slate-900/30 overflow-hidden">
              {/* Form header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-900/60">
                <div className="flex items-center gap-2">
                  {investigationType === "repo_review" ? (
                    <Layers className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Terminal className="w-3.5 h-3.5 text-sky-400" />
                  )}
                  <span className="text-xs font-mono font-semibold text-slate-200 tracking-wider">
                    {investigationType === "repo_review" ? "REPOSITORY CODE REVIEW & AUDIT" : "NEW BUG INVESTIGATION"}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleLoadDemo}
                  className="border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-mono h-7 flex items-center gap-1.5"
                >
                  <FolderGit2 className="w-3.5 h-3.5" />
                  Load Demo
                </Button>
              </div>

              {/* Mode Switcher */}
              <div className="p-3 bg-slate-900/80 border-b border-slate-800">
                <div className="grid grid-cols-2 p-1 bg-[#050914] border border-slate-800 rounded-lg text-xs font-mono">
                  <button
                    type="button"
                    onClick={() => {
                      setInvestigationType("bug_fix");
                      setError(null);
                    }}
                    className={`py-2 px-3 rounded-md flex items-center justify-center gap-2 transition-all font-semibold ${
                      investigationType === "bug_fix"
                        ? "bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Bug className="w-3.5 h-3.5 text-sky-400" />
                    <span>Bug Investigation</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setInvestigationType("repo_review");
                      setError(null);
                    }}
                    className={`py-2 px-3 rounded-md flex items-center justify-center gap-2 transition-all font-semibold ${
                      investigationType === "repo_review"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Repository Review</span>
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                {error && (
                  <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2 font-mono">
                    <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Repository */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 font-mono">
                    <GitBranch className={`w-3 h-3 ${investigationType === "repo_review" ? "text-emerald-400" : "text-sky-400"}`} />
                    Repository
                  </label>
                  <Input
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    placeholder="/local/path/to/repo  or  https://github.com/org/repo"
                    className="bg-[#050914] border-slate-800 text-slate-100 placeholder:text-slate-600 font-mono text-xs h-10 focus:border-sky-500 rounded-lg"
                  />
                </div>

                {/* Bug Description / Audit Focus */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 font-mono">
                      {investigationType === "repo_review" ? (
                        <>
                          <Sparkles className="w-3 h-3 text-emerald-400" />
                          Audit Focus & Scope
                          <span className="text-slate-500 text-[10px] font-normal">(Optional)</span>
                        </>
                      ) : (
                        <>
                          <Search className="w-3 h-3 text-sky-400" />
                          Bug Description
                        </>
                      )}
                    </label>
                  </div>
                  <Textarea
                    value={bugDescription}
                    onChange={(e) => setBugDescription(e.target.value)}
                    rows={4}
                    placeholder={
                      investigationType === "repo_review"
                        ? "e.g., General code health, security vulnerabilities, test coverage, session management anti-patterns... (Leave blank for full repository audit)"
                        : "Describe the observed failure — what users report, unexpected responses, or test failures..."
                    }
                    className="bg-[#050914] border-slate-800 text-slate-100 placeholder:text-slate-600 text-xs leading-relaxed focus:border-sky-500 rounded-lg"
                  />
                </div>

                {/* Stack Trace / Focus notes — collapsible */}
                <div className="border border-slate-800 rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowStackTrace(!showStackTrace)}
                    className="w-full px-4 py-2 flex items-center justify-between text-xs text-slate-400 hover:text-slate-200 font-mono bg-slate-900/60 hover:bg-slate-900 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <FileCode className="w-3 h-3 text-slate-500" />
                      {investigationType === "repo_review" ? "Focus files / specific notes" : "Stack trace / logs"}
                      {stackTrace && <span className={investigationType === "repo_review" ? "text-emerald-400 text-[10px]" : "text-sky-400 text-[10px]"}>(attached)</span>}
                    </span>
                    {showStackTrace ? (
                      <ChevronUp className="w-3.5 h-3.5 text-slate-600" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-600" />
                    )}
                  </button>

                  {showStackTrace && (
                    <div className="p-3 border-t border-slate-800">
                      <Textarea
                        value={stackTrace}
                        onChange={(e) => setStackTrace(e.target.value)}
                        rows={3}
                        placeholder={
                          investigationType === "repo_review"
                            ? "List specific directories, files, or questions to emphasize during review..."
                            : "Paste traceback, 500 error logs, or failing pytest output..."
                        }
                        className="bg-[#03060d] border-slate-800 text-slate-200 placeholder:text-slate-700 font-mono text-[11px] leading-relaxed focus:border-sky-500 rounded-lg"
                      />
                    </div>
                  )}
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={loading}
                  className={`w-full font-bold text-xs h-11 tracking-wider flex items-center justify-center gap-2 rounded-lg transition-colors ${
                    investigationType === "repo_review"
                      ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.25)]"
                      : "bg-sky-600 hover:bg-sky-500 text-slate-950"
                  }`}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>{investigationType === "repo_review" ? "STARTING AUDIT…" : "STARTING INVESTIGATION…"}</span>
                    </>
                  ) : (
                    <>
                      <span>{investigationType === "repo_review" ? "START REPOSITORY REVIEW" : "START INVESTIGATION"}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </form>
            </div>
          </div>

          {/* Right — workflow + demo */}
          <div className="lg:col-span-5 space-y-5">
            {/* Demo case card */}
            <div className="border border-slate-800 rounded-xl bg-slate-900/30 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-400 tracking-wider">
                  {investigationType === "repo_review" ? "SAMPLE AUDIT TARGET" : "DEMO BUG CASE"}
                </span>
                <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px] font-mono">
                  <CheckCircle2 className="w-2.5 h-2.5 mr-1" />
                  VERIFIED
                </Badge>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-100 mb-1">
                  {investigationType === "repo_review"
                    ? "Full Codebase Quality & Architecture Review"
                    : "The Phantom Session Logout Bug"}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {investigationType === "repo_review"
                    ? "Audit code structure, state persistence, exception handling, and baseline test suite health without requiring a prior bug report."
                    : "Users are logged out after token refresh. Flask silently skips re-issuing the Set-Cookie header when session.modified is never set."}
                </p>
              </div>

              <div className="text-[11px] font-mono border border-slate-800 rounded-lg divide-y divide-slate-800">
                <div className="flex justify-between px-3 py-1.5">
                  <span className="text-slate-500">Repo</span>
                  <span className="text-slate-300">session-logout-demo/</span>
                </div>
                <div className="flex justify-between px-3 py-1.5">
                  <span className="text-slate-500">Mode</span>
                  <span className={investigationType === "repo_review" ? "text-emerald-400" : "text-sky-400"}>
                    {investigationType === "repo_review" ? "Repository Review" : "Bug Investigation"}
                  </span>
                </div>
                <div className="flex justify-between px-3 py-1.5">
                  <span className="text-slate-500">Output</span>
                  <span className="text-slate-300">
                    {investigationType === "repo_review" ? "Quality & Architecture Report" : "Verified Patch & Diff"}
                  </span>
                </div>
              </div>

              <Button
                onClick={handleLoadDemo}
                disabled={loading}
                variant="outline"
                className="w-full border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 font-mono text-xs h-9"
              >
                Pre-fill Demo Fields
              </Button>
            </div>

            {/* Pipeline steps */}
            <div className="border border-slate-800 rounded-xl bg-slate-900/30 p-5">
              <span className="text-[10px] font-mono text-slate-500 tracking-wider block mb-3">
                {investigationType === "repo_review" ? "REVIEW PIPELINE" : "INVESTIGATION PIPELINE"}
              </span>
              <ol className="space-y-2">
                {(investigationType === "repo_review"
                  ? [
                      ["1", "Sandbox Discovery", "Catalog workspace & project structure"],
                      ["2", "Code Scan", "Locate entrypoints & core logic"],
                      ["3", "Findings Lab", "Audit architecture & code smells"],
                      ["4", "Recommendations", "Formulate refactoring opportunities"],
                      ["5", "Test Suite Health", "Execute baseline automated tests"],
                    ]
                  : [
                      ["1", "Sandbox Discovery", "Clone & isolate in workspace"],
                      ["2", "Evidence Search", "ripgrep symbol scan"],
                      ["3", "Hypothesis Lab", "Rank root causes by evidence"],
                      ["4", "Patch Synthesis", "Minimal unified diff"],
                      ["5", "Verified Fix", "pytest must pass"],
                    ]
                ).map(([num, title, desc]) => (
                  <li key={num} className="flex items-start gap-2.5 text-xs">
                    <span className="w-4 h-4 rounded-full bg-slate-800 border border-slate-700 text-slate-400 flex items-center justify-center font-mono text-[10px] shrink-0 mt-0.5">
                      {num}
                    </span>
                    <div>
                      <span className="text-slate-200 font-semibold">{title}</span>
                      <span className="text-slate-500 ml-2">{desc}</span>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>

        {/* Case Archives */}
        {recentCases.length > 0 && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-sky-400" />
                <span className="text-xs font-mono font-semibold text-slate-200 tracking-wider">
                  CASE ARCHIVES
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  {recentCases.length} total · {solvedCount} solved · {activeCount} active
                </span>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3 h-3 text-slate-600 absolute left-2.5 top-2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search cases…"
                    className="bg-[#050914] border border-slate-800 rounded-lg pl-7 pr-3 py-1.5 text-xs font-mono text-slate-200 placeholder:text-slate-600 w-40 focus:w-52 transition-all focus:border-sky-600 focus:outline-none"
                  />
                </div>

                <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs font-mono">
                  {(["all", "solved", "failed"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setFilterStatus(s)}
                      className={`px-2.5 py-1 rounded transition-colors capitalize ${
                        filterStatus === s
                          ? s === "solved"
                            ? "bg-emerald-950 text-emerald-300 font-semibold"
                            : s === "failed"
                            ? "bg-rose-950 text-rose-300 font-semibold"
                            : "bg-slate-800 text-sky-300 font-semibold"
                          : "text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredCases.map((c) => {
                const isSolved = c.status === "solved";
                const isFailed = c.status === "failed";
                const isCaseReview = c.case_type === "repo_review";
                const repoName =
                  c.repo_url
                    .replace(/\\+/g, "/")
                    .replace(/\/+$/, "")
                    .replace(/\.git$/, "")
                    .split("/")
                    .pop() || "Repository";
                const shortId = c.case_id.replace(/^case_/, "");

                return (
                  <Link key={c.case_id} href={`/cases/${c.case_id}`}>
                    <div className="border border-slate-800 hover:border-slate-700 rounded-xl p-4 bg-slate-900/30 hover:bg-slate-900/60 transition-colors group space-y-3 h-full flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-baseline gap-1.5 truncate max-w-[65%]">
                            <span className="font-semibold text-sm text-slate-200 group-hover:text-sky-300 truncate font-sans">
                              {repoName}
                            </span>
                            <span className="font-mono text-[10px] text-slate-500 shrink-0">
                              #{shortId}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {isCaseReview && (
                              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[9px] font-mono px-1.5 py-0">
                                REVIEW
                              </Badge>
                            )}
                            <Badge
                              className={
                                isSolved
                                  ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px] font-mono"
                                  : isFailed
                                  ? "bg-rose-500/15 text-rose-400 border-rose-500/30 text-[10px] font-mono"
                                  : "bg-sky-500/15 text-sky-400 border-sky-500/30 text-[10px] font-mono"
                              }
                            >
                              {c.status.toUpperCase()}
                            </Badge>
                          </div>
                        </div>

                        <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed font-sans">
                          {c.bug_description}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] font-mono text-slate-500">
                        <span className="truncate max-w-[65%] text-slate-400" title={c.repo_url}>
                          {c.repo_url}
                        </span>
                        <span className="flex items-center gap-1 shrink-0">
                          <Clock className="w-3 h-3" />
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

        {/* Empty state */}
        {recentCases.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-slate-600 space-y-2 text-sm">
            <AlertCircle className="w-7 h-7 text-slate-700" />
            <p className="font-mono">No investigations yet.</p>
            <p className="text-xs text-slate-700">Submit the form above to start your first case.</p>
          </div>
        )}
      </main>
    </div>
  );
}
