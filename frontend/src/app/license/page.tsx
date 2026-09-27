import React from "react";
import Link from "next/link";
import { Scale, ArrowLeft, Check, AlertCircle, Info, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "Apache 2.0 License — Agent Holmes",
  description: "Official Apache License Version 2.0 for the Agent Holmes open source project.",
};

export default function LicensePage() {
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
            <Badge variant="outline" className="border-violet-500/40 text-violet-400 font-mono text-[10px]">
              APACHE 2.0
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-950/40 border border-violet-500/30 text-violet-400 text-xs font-mono">
            <Scale className="w-3.5 h-3.5" />
            <span>Open Source License</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            Apache License, Version 2.0
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-2xl leading-relaxed">
            Agent Holmes is released as free and open-source software under the Apache License 2.0. This permissive license provides explicit patent rights and permits commercial use, modification, and distribution.
          </p>
          <div className="text-xs font-mono text-slate-500 pt-2">
            Copyright © {new Date().getFullYear()} Agent Holmes Contributors
          </div>
        </div>

        {/* Quick Summary Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-[#0b1222] border-slate-800 text-slate-200">
            <CardHeader className="p-4 pb-2 flex flex-row items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <CardTitle className="text-sm font-semibold text-emerald-400">Permissions</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1 text-xs text-slate-400 space-y-1.5">
              <p>✔ Commercial use</p>
              <p>✔ Modification</p>
              <p>✔ Distribution</p>
              <p>✔ Patent grant</p>
              <p>✔ Private use</p>
            </CardContent>
          </Card>

          <Card className="bg-[#0b1222] border-slate-800 text-slate-200">
            <CardHeader className="p-4 pb-2 flex flex-row items-center gap-2">
              <Info className="w-4 h-4 text-sky-400" />
              <CardTitle className="text-sm font-semibold text-sky-400">Conditions</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1 text-xs text-slate-400 space-y-1.5">
              <p>ℹ License & copyright notice</p>
              <p>ℹ State changes to code</p>
              <p>ℹ Include NOTICE file</p>
            </CardContent>
          </Card>

          <Card className="bg-[#0b1222] border-slate-800 text-slate-200">
            <CardHeader className="p-4 pb-2 flex flex-row items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <CardTitle className="text-sm font-semibold text-amber-400">Limitations</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1 text-xs text-slate-400 space-y-1.5">
              <p>✖ No liability</p>
              <p>✖ No warranty</p>
              <p>✖ No trademark rights</p>
            </CardContent>
          </Card>
        </div>

        {/* Full Text */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white">Full License Text</h2>
          <pre className="p-6 rounded-xl bg-[#050811] border border-slate-800 font-mono text-xs text-slate-400 overflow-x-auto leading-relaxed whitespace-pre-wrap">
{`                                 Apache License
                           Version 2.0, January 2004
                        http://www.apache.org/licenses/

   TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION

   1. Definitions.
      "License" shall mean the terms and conditions for use, reproduction,
      and distribution as defined by Sections 1 through 9 of this document.

      "Licensor" shall mean the copyright owner or entity authorized by
      the copyright owner that is granting the License.

      "Legal Entity" shall mean the union of the acting entity and all
      other entities that control, are controlled by, or are under common
      control with that entity.

      "You" (or "Your") shall mean an individual or Legal Entity
      exercising permissions granted by this License.

      "Source" form shall mean the preferred form for making modifications.
      "Object" form shall mean any form resulting from mechanical transformation.
      "Work" shall mean the work of authorship made available under the License.
      "Derivative Works" shall mean any work that is based on the Work.
      "Contribution" shall mean any work intentionally submitted for inclusion.
      "Contributor" shall mean Licensor and any individual or Legal Entity.

   2. Grant of Copyright License.
      Subject to the terms and conditions of this License, each Contributor
      hereby grants to You a perpetual, worldwide, non-exclusive, no-charge,
      royalty-free, irrevocable copyright license to reproduce, prepare
      Derivative Works of, publicly display, publicly perform, sublicense,
      and distribute the Work and such Derivative Works in Source or Object form.

   3. Grant of Patent License.
      Subject to the terms and conditions of this License, each Contributor
      hereby grants to You a perpetual, worldwide, non-exclusive, no-charge,
      royalty-free, irrevocable patent license to make, have made, use,
      offer to sell, sell, import, and otherwise transfer the Work.

   4. Redistribution.
      You may reproduce and distribute copies of the Work or Derivative Works
      thereof in any medium, with or without modifications, provided that You:
      (a) Give other recipients a copy of this License; and
      (b) Cause modified files to carry prominent notices stating changes; and
      (c) Retain all copyright, patent, trademark, and attribution notices; and
      (d) Include NOTICE text if the Work includes a NOTICE file.

   5. Submission of Contributions.
      Unless You explicitly state otherwise, any Contribution submitted shall
      be under the terms and conditions of this License.

   6. Trademarks.
      This License does not grant permission to use trade names, trademarks,
      service marks, or product names of the Licensor.

   7. Disclaimer of Warranty.
      Unless required by applicable law, Licensor provides the Work on an
      "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND.

   8. Limitation of Liability.
      In no event shall any Contributor be liable to You for damages,
      including direct, indirect, special, incidental, or consequential damages.

   END OF TERMS AND CONDITIONS

   Copyright 2026 Agent Holmes Contributors
   Licensed under the Apache License, Version 2.0.`}
          </pre>
        </div>
      </main>
    </div>
  );
}
