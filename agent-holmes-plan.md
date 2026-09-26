# Agent Holmes — MVP Implementation Plan

## Overview

Agent Holmes is an AI-powered software investigator that takes a real Git repository and a bug report, investigates the codebase using structured evidence, identifies the most likely root cause, generates a targeted patch, and verifies the fix automatically.

**Tagline:** "Every bug leaves evidence."

**Core workflow:** INVESTIGATE → IDENTIFY → FIX → VERIFY

**Tech stack:**
- Frontend: Next.js + TypeScript + Tailwind CSS + shadcn/ui
- Backend: Python + FastAPI + Pydantic + SQLModel (SQLite)
- AI layer: Bob tool-calling API (discovered at runtime, abstracted behind a provider interface)
- Repo analysis: filesystem traversal + ripgrep + Git CLI
- Execution/verification: Docker (with subprocess fallback)
- Real-time streaming: WebSockets

**Out of scope for MVP:** GitHub issue integration, PR creation, Tree-sitter, vector databases, PostgreSQL, Redis, Kubernetes, multi-agent mode, report export (PDF/HTML).

---

## Architecture Diagram (reference)

```
Next.js UI  ──REST/WS──►  FastAPI Orchestrator
                               │
              ┌────────────────┼───────────────┐
              ▼                ▼               ▼
        Repository        Investigation    Verification
        Manager           Engine           Engine
              │                │               │
              ▼                ▼               ▼
        Git/ripgrep        Bob AI/Tools    Docker/subprocess
                                │
                          Evidence Store
                          (SQLite / SQLModel)
```

---

## Sub-Tasks

---

### Sub-Task 1 — Project Scaffold & Monorepo Layout

**Status:** [x] completed

**Intent:**
Establish the project structure so all subsequent sub-tasks have a clear home. Both the frontend and backend should be runnable independently from the start.

**Expected Outcomes:**
- `frontend/` — bootstrapped Next.js 14 app with TypeScript, Tailwind, shadcn/ui
- `backend/` — FastAPI app with Poetry or pip + pyproject.toml
- `test-repos/` — empty placeholder directory for demo repositories
- Root `README.md` with setup and run instructions
- Root `.gitignore` covering Node, Python, SQLite, Docker artefacts
- `docker-compose.yml` (optional dev convenience) defining frontend + backend services
- Both services start independently with a single command (`npm run dev` / `uvicorn`)

**Todo List:**
- [x] Create root `.gitignore`
- [x] Scaffold `frontend/` with `create-next-app` (TypeScript, Tailwind, App Router)
- [x] Install and configure shadcn/ui in the frontend
- [x] Scaffold `backend/` with FastAPI, Pydantic, SQLModel, uvicorn
- [x] Add `backend/pyproject.toml` with all dependencies declared
- [x] Create `test-repos/` placeholder directory with a `.gitkeep`
- [x] Write root `README.md` (setup, run, environment variables)
- [x] Add `docker-compose.yml` for local dev convenience

**Relevant Context:**
- All paths are relative to `c:\GitHub\agent-holmes`
- Frontend will live at `localhost:3000`, backend at `localhost:8000`
- No code beyond wiring is expected in this sub-task

---

### Sub-Task 2 — Data Models & SQLite Schema

**Status:** [x] completed

**Intent:**
Define the canonical data structures used throughout the system. All subsequent sub-tasks depend on these models. Getting them right early prevents breaking changes later.

**Expected Outcomes:**
- `backend/app/models/` package containing all SQLModel table definitions
- Tables: `Case`, `EvidenceItem`, `Hypothesis`, `Patch`, `TestResult`, `InvestigationEvent`
- Pydantic request/response schemas for the API layer
- SQLite database initialised on startup via SQLModel `create_all`
- A simple migration strategy note in comments (Alembic not required for MVP)

**Todo List:**
- [x] Create `backend/app/models/__init__.py`
- [x] Define `Case` model (case_id, repo_url/path, bug_description, stack_trace, status, created_at, updated_at)
- [x] Define `EvidenceItem` model (id, case_id, file, line, type, claim, description, confidence)
- [x] Define `Hypothesis` model (id, case_id, title, description, status, confidence, evidence_ids)
- [x] Define `Patch` model (id, case_id, unified_diff, file_paths, status, attempt_number)
- [x] Define `TestResult` model (id, case_id, patch_id, command, stdout, stderr, exit_code, passed)
- [x] Define `InvestigationEvent` model (id, case_id, event_type, message, timestamp) — used for streaming
- [x] Define Pydantic response schemas in `backend/app/schemas.py`
- [x] Wire SQLModel `create_all` into FastAPI startup event
- [x] Write a short `backend/app/database.py` providing a `get_session` dependency

**Relevant Context:**
- Use SQLModel for both ORM and Pydantic validation
- `status` values for Case: `pending | investigating | patching | verifying | solved | failed`
- `status` values for Hypothesis: `proposed | testing | confirmed | rejected`
- `status` values for Patch: `generated | applied | verified | failed`

---

### Sub-Task 3 — Repository Manager

**Status:** [x] completed

**Intent:**
Implement the controlled interface Holmes uses to access a repository. All repository reads go through this module — no direct filesystem access from the AI layer.

**Expected Outcomes:**
- `backend/app/repository/manager.py` with a `RepositoryManager` class
- Supports local path and Git clone URL as inputs
- Clones remote repos into a private isolated workspace directory
- Exposes the following tool methods:
  - `list_files(path, pattern)` — directory listing with optional glob
  - `read_file(path)` — safe bounded file read (max 500 lines configurable)
  - `search_code(query, file_pattern)` — ripgrep-backed text/regex search
  - `find_references(symbol)` — ripgrep symbol search across codebase
  - `get_git_history(path, n)` — recent commits for a file or repo
  - `get_git_diff(commit_a, commit_b, path)` — diff between commits
  - All paths are sandboxed — no path traversal outside the workspace
  - Returns structured results (typed Pydantic models), never raw strings

**Todo List:**
- [x] Create `backend/app/repository/` package
- [x] Implement `RepositoryManager.__init__` (accepts local path or remote URL, sets up workspace)
- [x] Implement `clone_if_remote` — uses `git clone` into `workspaces/<case_id>/repo/`
- [x] Implement `list_files` using `os.walk` / `pathlib` with glob filtering
- [x] Implement `read_file` with line-range support and max-line guard
- [x] Implement `search_code` using ripgrep subprocess (`rg --json`)
- [x] Implement `find_references` using ripgrep symbol search
- [x] Implement `get_git_history` using `git log` subprocess
- [x] Implement `get_git_diff` using `git diff` subprocess
- [x] Add path sandbox validation (resolve and check prefix)
- [x] Write unit tests in `backend/tests/test_repository_manager.py`

**Relevant Context:**
- Workspace root: `backend/workspaces/<case_id>/`
- ripgrep (`rg`) must be available on PATH; include a check at startup
- Git must be available on PATH
- All subprocess calls must have timeouts (default 30 s)

---

### Sub-Task 4 — AI Provider Abstraction & Bob Tool Integration

**Status:** [x] completed

**Intent:**
Define the provider abstraction that decouples the Investigation Engine from any specific AI model. Implement the Bob adapter as the first (and only MVP) provider. Register all agent tools so Bob can call them via tool-calling. The Bob API endpoint and model are discovered from the runtime environment rather than hardcoded.

**Expected Outcomes:**
- `backend/app/ai/` package with:
  - `base.py` — `AIProvider` abstract base class
  - `bob_provider.py` — Bob API adapter implementing `AIProvider`
  - `tools.py` — all tool definitions (schemas + handler functions)
- Tool definitions cover all seven tool groups from the spec:
  - Repository tools: `list_files`, `read_file`, `search_code`, `find_references`, `get_git_history`, `get_git_diff`
  - Investigation tools: `record_evidence`, `create_hypothesis`, `evaluate_hypothesis`
  - Execution tools: `run_command`, `run_tests`, `run_linter`
  - Modification tools: `apply_patch`, `revert_patch`
- Bob adapter discovers its endpoint and model ID from runtime environment variables (`BOB_API_BASE`, `BOB_MODEL`); falls back to sensible defaults if not set; `BOB_API_KEY` still sourced from env for authentication
- Provider can be swapped via an environment variable `AI_PROVIDER=bob`

**Todo List:**
- [x] Create `backend/app/ai/__init__.py`
- [x] Define `AIProvider` ABC in `base.py` with `investigate(state) -> InvestigationState` signature
- [x] Define tool schemas (JSON Schema / Pydantic) for all 13 tools in `tools.py`
- [x] Implement tool handler functions that delegate to `RepositoryManager`, `EvidenceStore`, `VerificationEngine`
- [x] Implement `BobProvider` in `bob_provider.py` — discover `BOB_API_BASE` and `BOB_MODEL` from env at init time, log resolved values on startup
- [x] Implement the agentic loop: send state + tools → receive tool call → execute → append result → repeat until done
- [x] Add `AI_PROVIDER`, `BOB_API_KEY`, `BOB_API_BASE`, `BOB_MODEL` to environment variable documentation
- [x] Write integration stub test in `backend/tests/test_ai_provider.py`

**Relevant Context:**
- The Bob tool-calling API is available within this Bob environment; endpoint is read from `BOB_API_BASE` env var
- Tool handlers must record all tool calls into `InvestigationEvent` for the audit trail
- The agentic loop must have a max-iteration guard (default 50 steps)
- `run_linter` tool handler should invoke the repo's linter (e.g. `ruff` for Python, `eslint` for JS) via `SubprocessExecutor` and return structured output

---

### Sub-Task 5 — Investigation Engine & Evidence Store

**Status:** [x] completed

**Intent:**
Implement the stateful investigation workflow that orchestrates the AI provider through all phases: discovery → search → evidence → hypotheses → root cause. This is the core of Agent Holmes.

**Expected Outcomes:**
- `backend/app/investigation/engine.py` with `InvestigationEngine` class
- `backend/app/investigation/evidence_store.py` managing evidence persistence
- Investigation phases represented as explicit state transitions
- `InvestigationState` dataclass mirroring the spec schema
- Evidence and hypotheses persisted to SQLite in real time
- Investigation events emitted to a queue consumed by the WebSocket layer
- Engine is async-compatible (runs in a background task)

**Todo List:**
- [x] Create `backend/app/investigation/` package
- [x] Implement `InvestigationState` dataclass (case_id, issue, repository, files_examined, evidence, hypotheses, commands_executed, patches, test_results, status)
- [x] Implement `EvidenceStore` with `add_evidence`, `add_hypothesis`, `update_hypothesis`, `get_evidence_for_case`
- [x] Implement `InvestigationEngine.__init__` (accepts case, repository manager, AI provider, evidence store, event queue)
- [x] Implement `run()` async method that drives the full workflow
- [x] Implement phase transitions with explicit status updates emitted to the event queue
- [x] Add guard: maximum 3 patch-and-verify retry cycles
- [x] Ensure all evidence recorded by the AI tool calls flows through `EvidenceStore` → SQLite
- [x] Write unit tests in `backend/tests/test_investigation_engine.py`

**Relevant Context:**
- Phase sequence: DISCOVERY → SEARCH → EVIDENCE → HYPOTHESIS → TESTING → ROOT_CAUSE → PATCH → VERIFY → REPORT
- `InvestigationEvent` rows are the source of truth for WebSocket streaming
- Evidence must never be fabricated — tool handlers must verify data before recording

---

### Sub-Task 6 — Patch Generator & Verification Engine

**Status:** [x] completed

**Intent:**
Implement patch generation (producing a minimal unified diff), patch application into the isolated workspace, and verification (running tests/linting) with Docker-first, subprocess-fallback execution.

**Expected Outcomes:**
- `backend/app/patch/generator.py` — produces unified diffs from AI output
- `backend/app/patch/applicator.py` — applies/reverts patches in the workspace
- `backend/app/verification/engine.py` — runs tests in Docker or subprocess
- Verification results persisted as `TestResult` rows
- Docker availability is detected at startup; subprocess used if unavailable
- Execution is sandboxed: timeouts, no network access in containers, read-only host mounts
- Verification status clearly distinguished: `NOT_VERIFIED | FAILED | VERIFIED`

**Todo List:**
- [x] Create `backend/app/patch/` package
- [x] Implement `PatchGenerator.generate(root_cause, evidence) -> Patch` (AI-assisted diff generation)
- [x] Implement `PatchApplicator.apply(patch, workspace_path)` using `patch` CLI or `python-patch`
- [x] Implement `PatchApplicator.revert(patch, workspace_path)`
- [x] Create `backend/app/verification/` package
- [x] Implement `DockerExecutor` — runs a container with the workspace mounted, executes a command, captures output
- [x] Implement `SubprocessExecutor` — restricted subprocess with timeout, no shell expansion
- [x] Implement `VerificationEngine.verify(case, patch, workspace_path) -> TestResult`
- [x] Add Docker detection logic at startup (`docker info` check)
- [x] Write unit tests in `backend/tests/test_verification_engine.py`

**Relevant Context:**
- Docker container should use a minimal image matching the repo's language (Python → `python:3.11-slim`, Node → `node:20-slim`)
- Max 3 automated fix attempts per case — the retry loop is owned by `InvestigationEngine` (ST5); `VerificationEngine` is stateless and just returns a `TestResult`; the engine decides whether to re-enter the patch cycle
- Unified diff format must be displayable directly in the UI
- `run_linter` delegated to `SubprocessExecutor`; results stored as a `TestResult` row with `type=lint`

---

### Sub-Task 7 — FastAPI API Layer & WebSocket Streaming

**Status:** [x] completed

**Intent:**
Expose all backend capabilities via a clean REST API consumed by the Next.js frontend, plus a WebSocket endpoint that streams investigation events in real time.

**Expected Outcomes:**
- `backend/app/api/` package with routers:
  - `POST /api/cases` — create a new case (repo + bug description)
  - `GET /api/cases` — list all cases
  - `GET /api/cases/{case_id}` — get full case detail
  - `GET /api/cases/{case_id}/evidence` — list evidence items
  - `GET /api/cases/{case_id}/hypotheses` — list hypotheses
  - `GET /api/cases/{case_id}/patches` — list patches and diffs
  - `GET /api/cases/{case_id}/results` — list test results
  - `GET /api/cases/{case_id}/report` — structured final case report JSON (feeds Resolution screen)
  - `GET /api/health` — system health check (verifies ripgrep, Git, Docker availability)
  - `WS /ws/cases/{case_id}` — real-time investigation event stream
- Investigation launched as a FastAPI `BackgroundTask` on case creation
- CORS configured to allow `localhost:3000`
- All responses typed with Pydantic response models

**Todo List:**
- [x] Create `backend/app/api/` package with `cases.py` and `websocket.py` routers
- [x] Implement `POST /api/cases` — validate input, create `Case` row, launch `InvestigationEngine.run()` as background task
- [x] Implement `GET /api/cases`, `GET /api/cases/{case_id}` with full response schemas
- [x] Implement sub-resource GET endpoints for evidence, hypotheses, patches, results
- [x] Implement `GET /api/cases/{case_id}/report` — assembles confirmed root cause, supporting evidence, patch diff, and test results into a single JSON structure
- [x] Implement `GET /api/health` — checks ripgrep, Git, and Docker availability; returns `{ status, tools: { rg, git, docker } }`
- [x] Implement `WS /ws/cases/{case_id}` — subscribe to the case's event queue, forward events as JSON messages
- [x] On WebSocket connect, replay all existing `InvestigationEvent` rows for that case (so late-joining clients catch up)
- [x] Add CORS middleware to `main.py`
- [x] Add WebSocket connection manager (fan-out to multiple clients)
- [x] Write API integration tests in `backend/tests/test_api.py`

**Relevant Context:**
- Event queue per case: use `asyncio.Queue` stored in an in-memory registry
- WebSocket messages: `{ event_type, message, timestamp, data? }`
- Investigation may already be in progress when a client connects — replay `InvestigationEvent` rows first, then stream live
- `/api/health` is called by the frontend on load to surface missing dependency warnings

---

### Sub-Task 8 — Next.js Frontend — Three Screens

**Status:** [x] completed

**Intent:**
Build the three primary screens described in the spec using a professional developer-tool aesthetic. The UI must communicate active investigation progress, not look like a chatbot.

**Expected Outcomes:**
- **Screen 1 — New Case:** form with repo input, bug description textarea, optional stack trace, "INVESTIGATE" button
- **Screen 2 — Investigation:** real-time feed of investigation events (file examined, evidence found, hypothesis status), collapsible sections for evidence and hypotheses, case status badge
- **Screen 3 — Resolution:** root cause summary, evidence list, unified diff viewer, verification result (VERIFIED / FAILED / NOT VERIFIED), "CASE SOLVED" / "CASE FAILED" status
- WebSocket client that subscribes to `/ws/cases/{case_id}` and updates state live
- REST client (fetch/axios) for case data retrieval
- Routing: `/` → New Case, `/cases/[id]` → Investigation / Resolution (same page, phase-dependent rendering)

**Todo List:**
- [x] Install shadcn/ui components needed: Button, Card, Badge, Textarea, Input, Tabs, ScrollArea, Separator
- [x] Create `frontend/lib/api.ts` — typed API client wrapping fetch calls
- [x] Create `frontend/lib/websocket.ts` — WebSocket hook (`useInvestigationStream`)
- [x] Build `frontend/app/page.tsx` — New Case screen (form, validation, submit handler)
- [x] Build `frontend/app/cases/[id]/page.tsx` — Investigation / Resolution screen
- [x] Build `frontend/components/InvestigationFeed.tsx` — scrolling live event feed
- [x] Build `frontend/components/EvidencePanel.tsx` — evidence items with file/line/description
- [x] Build `frontend/components/HypothesisPanel.tsx` — hypothesis cards with status
- [x] Build `frontend/components/DiffViewer.tsx` — unified diff display (syntax highlighted)
- [x] Build `frontend/components/VerificationPanel.tsx` — test results, pass/fail, VERIFIED badge
- [x] Build `frontend/components/CaseReport.tsx` — final resolution summary
- [x] Wire NEXT_PUBLIC_API_URL and NEXT_PUBLIC_WS_URL environment variables

**Relevant Context:**
- Use dark theme with a terminal/console aesthetic (Tailwind dark classes)
- shadcn/ui `Badge` for status indicators, `ScrollArea` for the live feed
- Diff viewer: use `react-diff-viewer-continued` or a simple pre-formatted block for MVP
- Do NOT build a chat interface — this is an investigation console

---

### Sub-Task 9 — Demo Repository: "Session Logout Bug"

**Status:** [x] completed

**Intent:**
Create a realistic but deliberately buggy Python/Flask mini-application inside `test-repos/session-logout-demo/` that Holmes can fully investigate. Using Python keeps the demo stack consistent with the backend, removes a Node.js toolchain dependency, and makes the verification step simpler. The bug must be deterministic and reliably discoverable.

**Expected Outcomes:**
- `test-repos/session-logout-demo/` — a small Flask + Python app (no frontend)
- Deliberate bug: after a token refresh, the session is updated in memory but the `modified` flag is not set, so Flask's session middleware does not re-issue the session cookie — causing users to be logged out on the next request
- App has enough structure to demonstrate: repo discovery, code search, evidence collection, hypothesis formation, root cause ID, patch generation, test execution, and successful verification
- pytest test suite included — at least one failing test that passes after the fix is applied
- A `README.md` describing the intended bug and the expected investigation path

**Todo List:**
- [x] Create `test-repos/session-logout-demo/` with `pyproject.toml` (or `requirements.txt`), `pytest.ini`
- [x] Implement `src/auth/session_manager.py` — session creation, read, and persistence logic
- [x] Implement `src/auth/token_refresh.py` — token refresh that updates the token in the session dict but omits `session.modified = True`
- [x] Implement `src/middleware/auth_middleware.py` — request authentication check using the session
- [x] Implement `src/app.py` — minimal Flask app wiring the routes and middleware
- [x] Write `tests/test_session.py` — tests covering session persistence across token refresh (one test fails due to the bug)
- [x] Write `tests/test_middleware.py` — middleware auth tests (pass with or without the bug)
- [x] Confirm `pytest` fails with the bug present
- [x] Confirm `pytest` passes after the intended fix (`session.modified = True`) is applied
- [x] Write `README.md` describing the repo, the bug, and the expected investigation path

**Relevant Context:**
- The bug: in `token_refresh.py`, after mutating the session dict, `session.modified = True` is never set; Flask's default session interface only re-serialises the session if `modified` is `True`
- Keep the app small: ~5–6 source files, ~2 test files
- No external services; use Flask's built-in client-side session (signed cookie) or a simple in-memory dict for testing
- Verification image in Docker: `python:3.11-slim`; run `pip install -r requirements.txt && pytest`

---

### Sub-Task 10 — Integration, End-to-End Validation & Documentation

**Status:** [x] completed

**Intent:**
Wire all components together, run the full end-to-end flow against the demo repository, verify the Definition of Done, and produce final documentation.

**Expected Outcomes:**
- Full E2E flow works: New Case → Investigation → Patch → Verification → Case Solved
- Environment setup documented (`.env.example` files for frontend and backend)
- Root `README.md` updated with complete setup, run, and demo instructions
- All existing unit/integration tests pass
- No fabricated evidence, no hardcoded results

**Todo List:**
- [x] Create `backend/.env.example` with all required variables (`AI_PROVIDER`, `BOB_API_KEY`, `DATABASE_URL`, etc.)
- [x] Create `frontend/.env.example` with `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL`
- [x] Run E2E flow manually using the session-logout demo repo
- [x] Verify that `CASE SOLVED` is only shown after real test verification
- [x] Fix any integration issues discovered during E2E
- [x] Update root `README.md` with full walkthrough
- [x] Confirm all backend tests pass (`pytest`)
- [x] Confirm frontend builds without errors (`next build`)

**Relevant Context:**
- E2E test should mirror the "Definition of Done" checklist in the spec (items 1–12)
- Any fabrication guard violations discovered must be treated as blocking bugs

---

## Definition of Done

The MVP is complete when a user can:

1. Open Agent Holmes in a browser
2. Select or enter a repository (local path or Git URL)
3. Enter a bug description
4. Click "INVESTIGATE"
5. Watch Holmes investigate the repository in real time
6. See concrete evidence being collected
7. See the supported root cause
8. Review the generated unified diff patch
9. Have the patch applied in an isolated Docker/subprocess environment
10. See actual tests execute with real output
11. See whether verification passed or failed
12. Receive a structured final case report

Holmes must never claim `CASE SOLVED` unless an actual verification step produced a passing result.
