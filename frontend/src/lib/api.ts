/**
 * Agent Holmes API Client
 */

export interface Case {
  case_id: string;
  repo_url: string;
  bug_description: string;
  case_type?: "bug_fix" | "repo_review";
  stack_trace?: string | null;
  status: "pending" | "investigating" | "solved" | "failed";
  root_cause?: string | null;
  created_at: string;
  updated_at: string;
}

export interface EvidenceItem {
  id: number;
  case_id: string;
  file: string;
  line?: number | null;
  type: string;
  claim: string;
  description: string;
  confidence: number;
  code_snippet?: string | null;
  created_at: string;
}

export interface Hypothesis {
  id: number;
  case_id: string;
  title: string;
  description: string;
  status: "proposed" | "testing" | "confirmed" | "rejected";
  confidence: number;
  evidence_ids: number[];
  created_at: string;
  updated_at: string;
}

export interface Patch {
  id: number;
  case_id: string;
  unified_diff: string;
  file_paths: string[];
  status: "generated" | "applied" | "verified" | "failed";
  attempt_number: number;
  explanation?: string | null;
  created_at: string;
}

export interface TestResult {
  id: number;
  case_id: string;
  patch_id?: number | null;
  command: string;
  stdout: string;
  stderr: string;
  exit_code: number;
  passed: boolean;
  test_type: "test" | "lint" | "build";
  duration_ms?: number | null;
  created_at: string;
}

export interface InvestigationEvent {
  id?: number;
  case_id: string;
  event_type: string;
  message: string;
  data?: Record<string, any> | null;
  timestamp: string;
  is_replay?: boolean;
}

export interface CaseDetail extends Case {
  evidence: EvidenceItem[];
  hypotheses: Hypothesis[];
  patches: Patch[];
  test_results: TestResult[];
  events: InvestigationEvent[];
}

export interface CaseReport {
  case_id: string;
  status: string;
  case_type?: "bug_fix" | "repo_review";
  root_cause?: string | null;
  repo_url: string;
  bug_description: string;
  key_evidence: EvidenceItem[];
  winning_hypothesis?: Hypothesis | null;
  patch?: Patch | null;
  verification?: TestResult | null;
  summary: string;
  solved: boolean;
}

export interface HealthResponse {
  status: string;
  tools: {
    git: { available: boolean; path: string | null };
    ripgrep: { available: boolean; path: string | null };
    docker: { available: boolean; path: string | null };
  };
}

export interface CaseCreatePayload {
  repo_url: string;
  bug_description?: string;
  case_type?: "bug_fix" | "repo_review";
  stack_trace?: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export async function createCase(payload: CaseCreatePayload): Promise<Case> {
  const res = await fetch(`${API_BASE}/cases`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Failed to create case: ${res.statusText}`);
  }
  return res.json();
}

export async function getCases(): Promise<Case[]> {
  const res = await fetch(`${API_BASE}/cases`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to fetch cases: ${res.statusText}`);
  }
  return res.json();
}

export async function getCase(caseId: string): Promise<CaseDetail> {
  const res = await fetch(`${API_BASE}/cases/${caseId}`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to fetch case ${caseId}: ${res.statusText}`);
  }
  return res.json();
}

export async function getCaseReport(caseId: string): Promise<CaseReport> {
  const res = await fetch(`${API_BASE}/cases/${caseId}/report`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to fetch report for ${caseId}: ${res.statusText}`);
  }
  return res.json();
}

export async function getHealth(): Promise<HealthResponse> {
  const res = await fetch(`${API_BASE}/health`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to fetch health status: ${res.statusText}`);
  }
  return res.json();
}
