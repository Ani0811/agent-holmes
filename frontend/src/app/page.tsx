"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createCase, getCases, getHealth, Case, HealthResponse } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
  Search,
  Sparkles,
  GitBranch,
  Terminal,
  Clock,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  FolderGit2,
} from "lucide-react";

export default function NewCasePage() {
  const router = useRouter();

  const [repoUrl, setRepoUrl] = useState("");
  const [bugDescription, setBugDescription] = useState("");
  const [stackTrace, setStackTrace] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [recentCases, setRecentCases] = useState<Case[]>([]);
  const [health, setHealth] = useState<HealthResponse | null>(null);

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
      "Users report that after their session access token refreshes automatically, their subsequent API requests fail with 401 Unauthorized, dropping their login state."
    );
    setStackTrace(
      "401 Unauthorized: Session cookie missing or stale token on GET /api/user/profile"
    );
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl.trim() || !bugDescription.trim()) {
      setError("Please provide both a repository target and a bug description.");
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "solved":
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40">SOLVED</Badge>;
      case "investigating":
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/40 animate-pulse">INVESTIGATING</Badge>;
      case "failed":
        return <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/40">FAILED</Badge>;
      default:
        return <Badge variant="outline" className="text-slate-400 border-slate-700">PENDING</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-[#080d1a]/80 backdrop-blur sticky top-0 z-50 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-400 to-indigo-600 flex items-center justify-center font-black text-slate-950 text-base shadow-[0_0_15px_rgba(56,189,248,0.3)]">
            H
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-slate-100 text-sm">AGENT HOLMES</span>
              <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-sky-500/30 text-sky-400">
                v0.1.0 MVP
              </Badge>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">Every bug leaves evidence.</p>
          </div>
        </div>

        {/* Health status indicator */}
        <div className="flex items-center gap-3 text-xs font-mono">
          {health && (
            <div className="hidden sm:flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-full px-3 py-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-slate-300">Git</span>
              <span className="text-slate-600">|</span>
              <span className={health.tools.ripgrep.available ? "text-slate-300" : "text-amber-400"}>
                {health.tools.ripgrep.available ? "ripgrep" : "py-regex"}
              </span>
              <span className="text-slate-600">|</span>
              <span className={health.tools.docker.available ? "text-slate-300" : "text-slate-400"}>
                {health.tools.docker.available ? "Docker" : "Subprocess"}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 md:p-10 space-y-10">
        {/* Hero Banner */}
        <div className="text-center space-y-3 pt-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-mono mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Autonomous Software Investigation Engine
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-slate-100">
            Inspect, Diagnose, and Verify.
          </h1>
          <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            Provide a Git repository and a bug symptom. Agent Holmes traverses the code, collects structured evidence, formulates testable hypotheses, generates minimal unified patches, and guarantees verification via automated tests.
          </p>
        </div>

        {/* Case Creation Card */}
        <Card className="bg-[#0c1220] border-slate-800 shadow-2xl text-slate-100 overflow-hidden">
          <CardHeader className="bg-[#080d1a] border-b border-slate-800 p-6 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Search className="w-4 h-4 text-sky-400" /> INITIATE NEW CASE
              </CardTitle>
              <CardDescription className="text-xs text-slate-400 mt-1">
                Configure target repository and failure description for autonomous investigation.
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleLoadDemo}
              className="border-sky-500/40 text-sky-300 hover:bg-sky-500/10 text-xs flex items-center gap-1.5"
            >
              <FolderGit2 className="w-3.5 h-3.5 text-sky-400" />
              Load Session Logout Demo
            </Button>
          </CardHeader>

          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{error}</span>
                </div>
              )}

              {/* Target Repository */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <GitBranch className="w-3.5 h-3.5 text-slate-400" />
                  Target Repository Path or Git URL
                </label>
                <Input
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="e.g. c:/GitHub/agent-holmes/test-repos/session-logout-demo or https://github.com/org/repo.git"
                  className="bg-[#060a14] border-slate-800 text-slate-100 placeholder:text-slate-600 font-mono text-xs h-10 focus:border-sky-500"
                />
                <p className="text-[11px] text-slate-500">
                  Local folder paths or Git clone URLs are cloned and isolated into a dedicated sandboxed workspace.
                </p>
              </div>

              {/* Bug Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-slate-400" />
                  Bug Description / Issue Report
                </label>
                <Textarea
                  value={bugDescription}
                  onChange={(e) => setBugDescription(e.target.value)}
                  rows={4}
                  placeholder="Describe the bug behavior, reproduction steps, or unexpected system failure..."
                  className="bg-[#060a14] border-slate-800 text-slate-100 placeholder:text-slate-600 text-xs leading-relaxed focus:border-sky-500"
                />
              </div>

              {/* Optional Stack Trace */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-slate-500" />
                    Stack Trace / Console Error Log
                  </span>
                  <span className="text-[10px] text-slate-500 uppercase font-mono">Optional</span>
                </label>
                <Textarea
                  value={stackTrace}
                  onChange={(e) => setStackTrace(e.target.value)}
                  rows={3}
                  placeholder="Paste error logs, HTTP 500/401 traces, or failure outputs..."
                  className="bg-[#060a14] border-slate-800 text-slate-100 placeholder:text-slate-600 font-mono text-[11px] leading-relaxed focus:border-sky-500"
                />
              </div>

              {/* Submit CTA */}
              <div className="pt-2 flex justify-end">
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold px-6 h-11 text-xs tracking-wider shadow-[0_0_20px_rgba(56,189,248,0.25)] flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>STARTING AGENT HOLMES...</span>
                    </>
                  ) : (
                    <>
                      <span>START INVESTIGATION</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Past Cases List */}
        {recentCases.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono font-semibold tracking-wider text-slate-400">
                RECENT INVESTIGATIONS ({recentCases.length})
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {recentCases.map((c) => (
                <Link key={c.case_id} href={`/cases/${c.case_id}`}>
                  <div className="p-4 rounded-lg bg-[#0c1220] border border-slate-800 hover:border-slate-700 transition-all hover:translate-y-[-1px] group space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-sky-400 font-semibold group-hover:text-sky-300">
                        {c.case_id}
                      </span>
                      {getStatusBadge(c.status)}
                    </div>
                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                      {c.bug_description}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1 border-t border-slate-800/60">
                      <span className="truncate max-w-[200px]">{c.repo_url}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(c.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
