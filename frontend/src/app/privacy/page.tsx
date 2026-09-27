import React from "react";
import Link from "next/link";
import { Shield, ArrowLeft, Lock, Database, EyeOff, Server, Terminal, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "Privacy Policy — Agent Holmes",
  description: "Privacy commitments, data sovereignty, and security policies for Agent Holmes.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#070b14] text-slate-200">
      {/* Top Header Bar */}
      <header className="border-b border-slate-800 bg-[#090e1c]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 font-mono font-bold text-slate-100 hover:text-white">
              <Terminal className="w-5 h-5 text-emerald-400" />
              <span>AGENT HOLMES</span>
            </Link>
            <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 font-mono text-[10px]">
              DATA SOVEREIGNTY
            </Badge>
          </div>
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white font-mono text-xs">
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Console
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
        {/* Hero Section */}
        <div className="space-y-3 border-b border-slate-800 pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
            <Shield className="w-3.5 h-3.5" />
            <span>Privacy Policy & Data Principles</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            Your Code. Your Machine. Absolute Sovereignty.
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-2xl leading-relaxed">
            Agent Holmes operates on a fundamental principle: software source code is sensitive intellectual property. We do not retain, harvest, or train AI models on your code.
          </p>
          <div className="text-xs font-mono text-slate-500 pt-2">
            Last Updated: September 2026 · License: Apache 2.0
          </div>
        </div>

        {/* Core Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-[#0b1222] border-slate-800 text-slate-200">
            <CardHeader className="p-4 pb-2 flex flex-row items-center gap-2">
              <EyeOff className="w-4 h-4 text-emerald-400" />
              <CardTitle className="text-sm font-semibold">Zero Training</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1 text-xs text-slate-400 leading-relaxed">
              Your source code, stack traces, and evidence are never used to train public or proprietary AI models.
            </CardContent>
          </Card>

          <Card className="bg-[#0b1222] border-slate-800 text-slate-200">
            <CardHeader className="p-4 pb-2 flex flex-row items-center gap-2">
              <Database className="w-4 h-4 text-sky-400" />
              <CardTitle className="text-sm font-semibold">Local Storage</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1 text-xs text-slate-400 leading-relaxed">
              All investigation telemetry, hypotheses, and diffs reside strictly inside your local SQLite database (<code className="text-slate-300 font-mono">holmes.db</code>).
            </CardContent>
          </Card>

          <Card className="bg-[#0b1222] border-slate-800 text-slate-200">
            <CardHeader className="p-4 pb-2 flex flex-row items-center gap-2">
              <Lock className="w-4 h-4 text-violet-400" />
              <CardTitle className="text-sm font-semibold">Sandboxed Workspaces</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1 text-xs text-slate-400 leading-relaxed">
              Git repositories are cloned into isolated sandbox folders (<code className="text-slate-300 font-mono">./workspaces/</code>), protecting your host environment.
            </CardContent>
          </Card>
        </div>

        {/* Detailed Sections */}
        <div className="space-y-8 text-sm leading-relaxed text-slate-300">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-emerald-400" />
              1. Information Processed During Investigations
            </h2>
            <p className="text-slate-400">
              When an investigation or codebase audit is initiated, Agent Holmes accesses only the specific artifacts necessary to discover the root cause and formulate surgical patches:
            </p>
            <ul className="space-y-2 list-disc pl-5 text-slate-300">
              <li><strong className="text-white">Repository Files:</strong> File trees, package manifests (<code className="text-xs font-mono bg-slate-900 px-1 py-0.5 rounded text-emerald-300">package.json</code>, <code className="text-xs font-mono bg-slate-900 px-1 py-0.5 rounded text-emerald-300">pyproject.toml</code>), and source files within the targeted project.</li>
              <li><strong className="text-white">Bug Descriptions & Stack Traces:</strong> User-supplied logs and diagnostic hints used to direct symbol searches.</li>
              <li><strong className="text-white">Subprocess Test Outputs:</strong> Standard output, standard error, and exit codes from running automated test suites (<code className="text-xs font-mono bg-slate-900 px-1 py-0.5 rounded text-emerald-300">npm test</code>, <code className="text-xs font-mono bg-slate-900 px-1 py-0.5 rounded text-emerald-300">pytest</code>).</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-sky-400" />
              2. AI Provider Communication & API Keys
            </h2>
            <p className="text-slate-400">
              Agent Holmes communicates with the AI Provider configured in your environment (<code className="text-xs font-mono bg-slate-900 px-1 py-0.5 rounded text-sky-300">BOB_API_BASE</code>).
            </p>
            <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Local Mode with Ollama or IBM Bob Local:</span>
              </div>
              <p className="text-slate-400 pl-6">
                When using a local inference server (<code className="text-slate-300 font-mono">http://localhost:11434</code>), 100% of your source code and reasoning prompts remain on your own machine. Zero network packets leave your computer.
              </p>
              <div className="flex items-center gap-2 text-sky-400 font-semibold pt-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Hosted Cloud Provider Mode:</span>
              </div>
              <p className="text-slate-400 pl-6">
                If you configure an external hosted API (OpenAI, IBM watsonx), prompts containing code snippets are transmitted under HTTPS directly to that provider using your authenticated API key. Your keys are never broadcast over WebSockets or stored in client-side code.
              </p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-violet-400" />
              3. Data Retention & One-Click Deletion
            </h2>
            <p className="text-slate-400">
              You retain total control over your local filesystem. Because all data is stored in the project directory, removing data requires no account closures or remote requests:
            </p>
            <ul className="space-y-1 list-disc pl-5 text-slate-300 text-xs">
              <li>To wipe all cloned repositories: delete the <code className="font-mono text-slate-300">backend/workspaces/</code> directory.</li>
              <li>To wipe all investigation cases, evidence, and diff history: delete <code className="font-mono text-slate-300">backend/holmes.db</code>.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              4. Open Source Verification
            </h2>
            <p className="text-slate-400">
              Agent Holmes is open source under the Apache License 2.0. You are welcome and encouraged to audit our codebase, tool executors, and networking layer at:{" "}
              <a
                href="https://github.com/Ani0811/agent-holmes"
                target="_blank"
                rel="noreferrer"
                className="text-emerald-400 hover:underline font-mono"
              >
                github.com/Ani0811/agent-holmes
              </a>.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
