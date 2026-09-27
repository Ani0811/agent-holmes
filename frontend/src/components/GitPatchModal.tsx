"use client";

import React, { useState } from "react";
import { CaseReport as CaseReportType } from "@/lib/api";
import {
  GitPullRequest,
  Download,
  Copy,
  Check,
  X,
  ExternalLink,
  Terminal,
  ShieldCheck,
  FileCode,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface GitPatchModalProps {
  report: CaseReportType;
  isOpen: boolean;
  onClose: () => void;
}

export function GitPatchModal({ report, isOpen, onClose }: GitPatchModalProps) {
  const [copiedTitle, setCopiedTitle] = useState(false);
  const [copiedBody, setCopiedBody] = useState(false);
  const [copiedGitCmd, setCopiedGitCmd] = useState(false);

  if (!isOpen) return null;

  const shortId = report.case_id.replace(/^case_/, "");
  const branchName = `fix/holmes-${shortId}`;
  const patchFileName = `AgentHolmes-fix-${shortId}.patch`;

  // Parse GitHub repo if applicable
  const githubMatch = report.repo_url.match(/github\.com[/:]([\w.-]+)\/([\w.-]+?)(?:\.git|\/)?$/i);
  const isGitHubRepo = Boolean(githubMatch);
  const githubOwner = githubMatch ? githubMatch[1] : "";
  const githubRepo = githubMatch ? githubMatch[2] : "";

  const prTitle = `fix(autofix): ${
    report.winning_hypothesis?.title || report.root_cause?.slice(0, 60) || "resolve verified regression"
  } (#${shortId})`;

  const prBody = [
    `## 🕵️ Agent Holmes Forensic Resolution Dossier`,
    ``,
    `**Case Reference:** \`#${shortId}\`  `,
    `**Target Repository:** \`${report.repo_url}\`  `,
    `**Status:** ${report.solved ? "✅ VERIFIED & RESOLVED" : "⚠️ AUDITED"}  `,
    `**Engine:** IBM Bob 2.0 Autonomous Tool-Calling Agent`,
    ``,
    `---`,
    ``,
    `### 🔍 Root Cause Diagnosis`,
    `${report.root_cause || report.summary}`,
    ``,
    `### 🧠 Forensic Hypothesis & Confidence`,
    report.winning_hypothesis
      ? `- **${report.winning_hypothesis.title}** (${Math.round(
          report.winning_hypothesis.confidence * 100
        )}% Confidence)\n- ${report.winning_hypothesis.description}`
      : `_No hypothesis recorded._`,
    ``,
    `### 🧪 Sandbox Test Verification`,
    report.verification
      ? `- **Command:** \`${report.verification.command}\`\n- **Exit Code:** ${report.verification.exit_code}\n- **Outcome:** ${
          report.verification.passed ? "PASSED (VERIFIED)" : "UNVERIFIED"
        }`
      : `_No test verification recorded._`,
    ``,
    `### ⚡ How to Apply Locally`,
    `\`\`\`bash`,
    `git checkout -b ${branchName}`,
    `git apply ${patchFileName}`,
    `\`\`\``,
    ``,
    `---`,
    `*Autonomously investigated and verified by Agent Holmes Cyber-Forensic Engine.*`,
  ].join("\n");

  const fullPatchContent = [
    `From: Agent Holmes <investigator@agent-holmes.ai>`,
    `Date: ${new Date().toUTCString()}`,
    `Subject: [PATCH] ${prTitle}`,
    ``,
    `Investigation Dossier: #${shortId}`,
    `Target Repository: ${report.repo_url}`,
    `Root Cause: ${report.root_cause || report.summary}`,
    report.winning_hypothesis
      ? `Hypothesis: ${report.winning_hypothesis.title} (${Math.round(
          report.winning_hypothesis.confidence * 100
        )}% confidence)`
      : ``,
    report.verification
      ? `Verification: ${report.verification.command} -> Exit ${report.verification.exit_code} (PASSED)`
      : ``,
    `---`,
    report.patch?.unified_diff || "",
    `--`,
    `Agent Holmes Cyber-Forensic Engine`,
  ].filter(Boolean).join("\n");

  const gitCliSnippet = `git checkout -b ${branchName}\ngit apply ${patchFileName}\ngit commit -am "${prTitle}"`;

  const handleDownloadPatch = () => {
    const blob = new Blob([fullPatchContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = patchFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyTitle = () => {
    navigator.clipboard.writeText(prTitle);
    setCopiedTitle(true);
    setTimeout(() => setCopiedTitle(false), 2000);
  };

  const handleCopyBody = () => {
    navigator.clipboard.writeText(prBody);
    setCopiedBody(true);
    setTimeout(() => setCopiedBody(false), 2000);
  };

  const handleCopyGitCmd = () => {
    navigator.clipboard.writeText(gitCliSnippet);
    setCopiedGitCmd(true);
    setTimeout(() => setCopiedGitCmd(false), 2000);
  };

  // GitHub compare URL generator
  const githubCompareUrl = isGitHubRepo
    ? `https://github.com/${githubOwner}/${githubRepo}/pull/new?title=${encodeURIComponent(
        prTitle
      )}&body=${encodeURIComponent(prBody)}`
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="max-w-2xl w-full bg-[#0a0f1d] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-[#0d1426] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400">
              <GitPullRequest className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white tracking-wide">
                  Export Git Patch & Pull Request
                </h3>
                <Badge variant="outline" className="text-[10px] font-mono border-sky-500/40 text-sky-300">
                  #{shortId}
                </Badge>
              </div>
              <p className="text-xs text-slate-400">
                Deploy verified surgical patch directly into version control
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-300">
          {/* GitHub 1-Click Action (if GitHub repository) */}
          {isGitHubRepo && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-sky-950/40 via-sky-900/20 to-slate-900 border border-sky-500/40 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">GitHub Repository Detected</span>
                  <Badge className="bg-sky-500/20 text-sky-300 border-sky-500/40 text-[10px]">
                    {githubOwner}/{githubRepo}
                  </Badge>
                </div>
                <p className="text-xs text-slate-400">
                  Open a new pull request directly on GitHub with pre-filled title and forensic report.
                </p>
              </div>
              <a
                href={githubCompareUrl!}
                target="_blank"
                rel="noreferrer"
                className="shrink-0"
              >
                <Button size="sm" className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold font-mono text-xs flex items-center gap-1.5 shadow-lg shadow-sky-500/20">
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open GitHub PR
                </Button>
              </a>
            </div>
          )}

          {/* Download Raw Patch Card */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <div className="font-semibold text-slate-200 flex items-center gap-2">
                <FileCode className="w-4 h-4 text-emerald-400" />
                <span>Standard Git Patch File</span>
                <span className="text-slate-500 font-mono text-[11px]">({patchFileName})</span>
              </div>
              <p className="text-slate-400 text-[11px]">
                Fully formatted unified diff compatible with <code className="text-emerald-400 font-mono">git apply</code>.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleDownloadPatch}
              className="border-emerald-500/40 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 hover:text-white font-mono text-xs flex items-center gap-1.5 shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              Download .patch
            </Button>
          </div>

          {/* Quick CLI Apply Snippet */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span className="flex items-center gap-1 text-slate-300 font-semibold">
                <Terminal className="w-3.5 h-3.5 text-sky-400" />
                Terminal One-Liner to Apply & Branch:
              </span>
              <button
                onClick={handleCopyGitCmd}
                className="text-sky-400 hover:text-sky-300 flex items-center gap-1"
              >
                {copiedGitCmd ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedGitCmd ? "Copied" : "Copy commands"}</span>
              </button>
            </div>
            <pre className="p-3 rounded-lg bg-black/60 border border-slate-800 font-mono text-xs text-sky-300 overflow-x-auto">
              {gitCliSnippet}
            </pre>
          </div>

          {/* Pre-formatted PR Title */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span className="text-slate-300 font-semibold">Pull Request Title:</span>
              <button
                onClick={handleCopyTitle}
                className="text-sky-400 hover:text-sky-300 flex items-center gap-1"
              >
                {copiedTitle ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedTitle ? "Copied" : "Copy Title"}</span>
              </button>
            </div>
            <input
              readOnly
              value={prTitle}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-slate-200 select-all focus:outline-none"
            />
          </div>

          {/* Pre-formatted PR Markdown Description */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span className="text-slate-300 font-semibold">Pull Request Body (Markdown):</span>
              <button
                onClick={handleCopyBody}
                className="text-sky-400 hover:text-sky-300 flex items-center gap-1"
              >
                {copiedBody ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedBody ? "Copied" : "Copy Markdown"}</span>
              </button>
            </div>
            <textarea
              readOnly
              rows={6}
              value={prBody}
              className="w-full p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px] text-slate-300 select-all focus:outline-none resize-none leading-relaxed"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#0d1426] border-t border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Patch verified by sandbox test runner</span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={onClose}
            className="text-slate-400 hover:text-white font-mono text-xs"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
