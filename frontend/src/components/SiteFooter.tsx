"use client";

import React from "react";
import Link from "next/link";
import { Shield, FileText, Scale, Sparkles } from "lucide-react";
import { DetectiveIcon } from "@/components/DetectiveIcon";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-slate-800/80 bg-[#060a12]/90 backdrop-blur-md text-xs text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Left: Branding & Hackathon Tag */}
          <div className="flex flex-wrap items-center gap-3 text-center md:text-left">
            <Link href="/" className="flex items-center gap-2 text-slate-200 hover:text-white font-mono font-bold tracking-wider transition-colors">
              <DetectiveIcon size={18} variant="minimal" />
              <span>AGENT HOLMES</span>
            </Link>
            <span className="text-slate-600 hidden sm:inline">|</span>
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 text-[11px] font-mono">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>IBM Bob 2.0 Hackathon</span>
            </div>
            <span className="text-slate-500 hidden lg:inline">
              Every bug leaves evidence.
            </span>
          </div>

          {/* Right: Legal & Open Source Links */}
          <div className="flex flex-wrap items-center justify-center gap-5 font-sans">
            <Link
              href="/privacy"
              className="flex items-center gap-1.5 hover:text-emerald-400 transition-colors"
            >
              <Shield className="w-3.5 h-3.5 text-slate-500 hover:text-emerald-400" />
              <span>Privacy Policy</span>
            </Link>

            <Link
              href="/terms"
              className="flex items-center gap-1.5 hover:text-emerald-400 transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-slate-500 hover:text-emerald-400" />
              <span>Terms of Service</span>
            </Link>

            <Link
              href="/license"
              className="flex items-center gap-1.5 hover:text-emerald-400 transition-colors"
            >
              <Scale className="w-3.5 h-3.5 text-slate-500 hover:text-emerald-400" />
              <span>Apache 2.0 License</span>
            </Link>

            <a
              href="https://github.com/Ani0811/agent-holmes"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 hover:text-slate-200 transition-colors"
            >
              <svg className="w-3.5 h-3.5 fill-current text-slate-500" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              <span>GitHub</span>
            </a>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-800/40 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
          <p>© {new Date().getFullYear()} Agent Holmes Contributors. Licensed under the Apache License 2.0.</p>
          <p className="font-mono text-slate-600">Local Sovereignty · Zero Code Retention · Sandboxed Verification</p>
        </div>
      </div>
    </footer>
  );
}
