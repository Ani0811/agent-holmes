import React from "react";
import Link from "next/link";
import { FileText, ArrowLeft, AlertTriangle, ShieldCheck, Cpu, Scale, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "Terms of Service — Agent Holmes",
  description: "Terms and conditions of use for Agent Holmes autonomous codebase investigator.",
};

export default function TermsPage() {
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
            <Badge variant="outline" className="border-sky-500/40 text-sky-400 font-mono text-[10px]">
              TERMS & CONDITIONS
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-950/40 border border-sky-500/30 text-sky-400 text-xs font-mono">
            <FileText className="w-3.5 h-3.5" />
            <span>Operational Guidelines & Legal Terms</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            Terms of Service & Usage Conditions
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-2xl leading-relaxed">
            By running or interacting with Agent Holmes, you agree to these Terms governing autonomous code analysis, sandboxed execution, and patch verification.
          </p>
          <div className="text-xs font-mono text-slate-500 pt-2">
            Last Updated: September 2026 · License: Apache 2.0
          </div>
        </div>

        {/* Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-[#0b1222] border-slate-800 text-slate-200">
            <CardHeader className="p-4 pb-2 flex flex-row items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-400" />
              <CardTitle className="text-sm font-semibold">AI Advisory Output</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1 text-xs text-slate-400 leading-relaxed">
              Synthesized diffs and root-cause diagnoses are advisory. Developers retain final responsibility for reviewing code before merging.
            </CardContent>
          </Card>

          <Card className="bg-[#0b1222] border-slate-800 text-slate-200">
            <CardHeader className="p-4 pb-2 flex flex-row items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <CardTitle className="text-sm font-semibold">Untrusted Code Warning</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1 text-xs text-slate-400 leading-relaxed">
              Automated tests execute repository code. Exercise caution when targeting unvetted third-party repositories.
            </CardContent>
          </Card>

          <Card className="bg-[#0b1222] border-slate-800 text-slate-200">
            <CardHeader className="p-4 pb-2 flex flex-row items-center gap-2">
              <Scale className="w-4 h-4 text-sky-400" />
              <CardTitle className="text-sm font-semibold">Apache 2.0 Open Source</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1 text-xs text-slate-400 leading-relaxed">
              Provided AS-IS without warranty. Free to inspect, fork, modify, and redistribute under Apache 2.0.
            </CardContent>
          </Card>
        </div>

        {/* Sections */}
        <div className="space-y-8 text-sm leading-relaxed text-slate-300">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              1. Permitted & Prohibited Uses
            </h2>
            <p className="text-slate-400">
              Agent Holmes is engineered for software debugging, quality assurance, architecture reviews, and educational research.
            </p>
            <ul className="space-y-2 list-disc pl-5 text-slate-300">
              <li><strong className="text-white">Permitted:</strong> Automated root-cause triage, regression patch synthesis, local test suite validation, and repository architectural audits.</li>
              <li><strong className="text-white">Prohibited:</strong> Attempting to deploy malicious payloads, exploiting unauthenticated services, or intentionally targeting unauthorized infrastructure.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-sky-400" />
              2. Developer Responsibility & Human Review
            </h2>
            <p className="text-slate-400">
              Agent Holmes combines autonomous LLM reasoning with sandbox test execution. However, automated green test suites do not guarantee complete security or functional perfection:
            </p>
            <div className="p-4 rounded-lg bg-amber-950/20 border border-amber-500/30 text-xs text-amber-200 space-y-1">
              <strong className="block text-amber-400 font-bold uppercase tracking-wider">Mandatory Code Review:</strong>
              <p>
                All patches synthesized by Agent Holmes must be thoroughly reviewed by human software engineers before being deployed to staging or production environments. You maintain ultimate responsibility for any code merged into your production pipelines.
              </p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Scale className="w-4 h-4 text-violet-400" />
              3. Disclaimer of Warranty & Limitation of Liability
            </h2>
            <p className="text-slate-400 text-xs">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, AGENT HOLMES IS PROVIDED &quot;AS IS&quot;, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
            </p>
            <p className="text-slate-400 text-xs">
              IN NO EVENT SHALL THE AUTHORS, CONTRIBUTORS, OR AFFILIATED ORGANIZATIONS BE LIABLE FOR ANY CLAIM, DAMAGES, LOSS OF DATA, BUILD OUTAGES, OR COMMERCIAL LOSSES ARISING FROM THE USE OF THE SOFTWARE OR GENERATED CODE PATCHES.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              4. Complete Open Source License
            </h2>
            <p className="text-slate-400">
              For complete legal terms regarding redistribution, patent grants, and modification, view the{" "}
              <Link href="/license" className="text-emerald-400 hover:underline font-mono">
                Apache 2.0 License
              </Link>{" "}
              included with this repository.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
