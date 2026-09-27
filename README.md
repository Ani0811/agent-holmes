# Agent Holmes 🔍

> **"Every bug leaves evidence."**

Agent Holmes is an autonomous AI software investigator. A user provides a software repository and a bug report or error trace. Holmes investigates the codebase, gathers concrete evidence, formulates and evaluates root cause hypotheses, generates a targeted minimal patch, and verifies the fix through automated test execution.

Core workflow: **INVESTIGATE → IDENTIFY → FIX → VERIFY**

Built for the **IBM Bob 2.0 Hackathon**.

---

## 💡 What is Agent Holmes?

Agent Holmes is not a generic chatbot or simple code-completion tool. It acts as an autonomous detective for software engineering issues. When an issue occurs, Holmes opens a forensic investigation case, indexes repository source code and commit history, collects line-level code evidence, isolates the root failure mechanism, writes a unified git patch, and verifies the resolution in a sandbox environment before reporting **`CASE SOLVED`**.

---

## ❓ The Problem

Software debugging remains one of the largest time-sinks in development:
1. **Flaky & Elusive Bugs:** Bugs like session desynchronization, token expiration leaks, and state mutations leave confusing symptoms across distributed layers.
2. **Context Fragmentation:** Developers spend hours jumping between stack traces, Git blame logs, and code references to isolate why a line behaves unexpectedly.
3. **Unverified Suggestions:** Generic LLMs often propose speculative, unverified code fixes that fail to run, break surrounding tests, or introduce new regressions.

---

## ✨ The Solution

Agent Holmes introduces a verifiable, evidence-first debugging pipeline:
- **Evidence-Driven Investigation:** Every hypothesis must be grounded in indexed source files, line references, or git history.
- **Autonomous Tool-Calling Loop:** Holmes utilizes 13 specialized engineering tools (ripgrep search, AST reference finding, git diffing, file slicing, evidence recording).
- **Test-Verified Patches:** Patches are applied to an isolated workspace and verified against the test suite (`pytest`, `npm test`) before being presented to the developer.
- **Interactive Detective Evidence Board:** Live visual dashboard displaying timeline feeds, hypothesis confidence meters, and interactive dependency graphs.

---

## ⚙️ How It Works

```
  1. INGEST               2. INVESTIGATE             3. HYPOTHESIZE            4. VERIFY & SOLVE
┌──────────────┐        ┌─────────────────┐        ┌─────────────────┐        ┌─────────────────┐
│ User submits │───────►│ Holmes searches │───────►│ Generates &     │───────►│ Runs test suite │
│ repo & bug   │        │ files & gathers │        │ tests root-cause│        │ in sandbox;     │
│ description  │        │ evidence items  │        │ unified patch   │        │ marks SOLVED    │
└──────────────┘        └─────────────────┘        └─────────────────┘        └─────────────────┘
```

1. **Ingest & Sandbox:** Clones or mounts the repository into an isolated, safe workspace directory.
2. **Forensic Discovery:** Employs ripgrep and Git CLI tools to locate files related to the bug report.
3. **Evidence Collection:** Records line-by-line evidence artifacts with confidence scores and rationale.
4. **Hypothesis Evaluation:** Formulates root-cause theories and confirms them through code analysis.
5. **Patch Synthesis:** Synthesizes a unified diff addressing the verified root cause without extraneous refactoring.
6. **Execution & Verification:** Executes the repository's test runner. If all tests pass, the case is marked **Solved** and a ready-to-merge git patch is produced.

---

## 🛠️ Architecture

```
                    INTERNET (Public Users)
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
   Next.js Frontend                      FastAPI Backend
   (Deployed on Vercel)                  (Deployed on Render)
   URL: https://agent-holmes.vercel.app  URL: https://agent-holmes-backend.onrender.com
            │                                     │
            └─────────────── HTTPS / WSS ─────────┘
                               │
                      PostgreSQL Database
                      (Render Postgres / Neon)
```

### Component Breakdown
- **Frontend Console (Next.js 16 / React 19):** Real-time WebSocket streaming feed, interactive Detective Evidence Board, side-by-side Diff Viewer, and one-click Git Patch export modal.
- **FastAPI Orchestrator:** Asynchronous lifecycle manager coordinating the investigation pipeline, WebSocket broadcasting, and REST endpoints.
- **Repository Manager:** Path-sandboxed interface for file inspection, ripgrep code queries, and git history inspection.
- **Verification Engine:** Subprocess and Docker execution engine with strict timeout controls and command whitelisting.

---

## 💻 Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, shadcn/ui, Lucide Icons |
| **Backend** | Python 3.11+, FastAPI, SQLModel (SQLite / PostgreSQL), Pydantic v2, Uvicorn |
| **AI Engine** | IBM Bob Provider (IBM Granite Code tool-calling model with local simulation fallback) |
| **Search & Git** | ripgrep, Git CLI, AstGrep regex engine |
| **Verification** | Subprocess sandbox (Windows/Linux) with Docker container isolation |
| **Real-time** | Native WebSockets with chronological replay for late-joining clients |

---

## 🏃 Running Locally

### 1. Prerequisites
- **Node.js** v18+ (tested on v20+)
- **Python** 3.10+ (tested on v3.11 / v3.14)
- **Git** installed on `PATH`
- **Docker Desktop** (optional; subprocess verification is enabled by default)

### 2. Backend Setup
```bash
cd backend

# Create and activate virtual environment
python -m venv .venv
# Windows PowerShell:
.\.venv\Scripts\Activate.ps1
# Linux / macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI development server
uvicorn app.main:app --reload --port 8000
```
Backend will be live at `http://localhost:8000`. OpenAPI Swagger documentation is available at `http://localhost:8000/docs`.

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start Next.js development server
npm run dev
```
Frontend will be live at `http://localhost:3000`.

### 4. 🐳 1-Command Full Stack via Docker Compose
```bash
docker compose up --build
```
- **Web Console:** `http://localhost:3000`
- **FastAPI Backend:** `http://localhost:8000/docs`

---

## 🔑 Environment Variables

See [.env.example](.env.example) for the complete reference.

### Backend (`backend/.env` or Render Dashboard)
| Variable | Default | Description |
|---|---|---|
| `ENVIRONMENT` | `development` | Runtime environment (`development` / `production`) |
| `FRONTEND_URL` | `http://localhost:3000` | Allowed frontend origin for CORS |
| `CORS_ORIGINS` | `http://localhost:3000,http://127.0.0.1:3000` | Comma-separated allowed CORS origins |
| `DATABASE_URL` | `sqlite:///./holmes.db` | Database connection string (PostgreSQL in production) |
| `WORKSPACES_DIR` | `./workspaces` | Directory for isolated case sandbox checkouts |
| `AI_PROVIDER` | `bob` | AI provider implementation (`bob`) |
| `BOB_API_BASE` | `http://localhost:11434` | IBM Bob / Granite endpoint base URL |
| `BOB_API_KEY` | `""` | Authentication key for Bob API (optional) |
| `BOB_MODEL` | `ibm-granite-code` | Model ID used for tool calling |
| `DEFAULT_TIMEOUT_SECONDS` | `30` | Subprocess command execution timeout |

### Frontend (`frontend/.env.local` or Vercel Dashboard)
| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000/api` | Backend REST API URL |
| `NEXT_PUBLIC_WS_URL` | `ws://localhost:8000/ws` | Backend WebSocket streaming URL |

---

## 🎬 Live Demo: "Session Logout Bug"

The repository includes a deterministic demo repository at `test-repos/session-logout-demo/` modeling a real-world Flask session persistence bug:

1. **The Bug:** In `src/auth/token_refresh.py`, an access token is updated in-place inside `session['auth']`. Because Flask sessions track dirty state via object identity, modifying a nested mutable dict in-place does not trigger the `Set-Cookie` header unless `session.modified = True` is explicitly set. As a result, users get logged out on their next request.
2. **Running the Demo:**
   - Open `http://localhost:3000` (or the deployed Vercel URL).
   - Click the **"Load Session Logout Demo"** button on the New Case form.
   - Click **"START INVESTIGATION"**.
3. **Deterministic Investigation Steps:**
   - **Phase 1: Discovery** — Indexes workspace files (`src/app.py`, `src/auth/token_refresh.py`).
   - **Phase 2: Search** — Searches codebase for token refresh and session handlers.
   - **Phase 3: Evidence** — Pinpoints `token_refresh.py:15` as concrete evidence (in-place mutation).
   - **Phase 4: Hypothesis** — Formulates and confirms hypothesis: "Missing `session.modified = True`".
   - **Phase 5: Patch** — Generates a minimal unified diff adding `session.modified = True`.
   - **Phase 6: Verification** — Executes `pytest` in the sandbox (prior test failure resolved; **4 passed**).
   - **Phase 7: Resolution** — Case transitions to **`CASE SOLVED`** with verified diff and report.

---

## 🤖 IBM Bob Usage

Agent Holmes integrates with **IBM Bob** through the [BobProvider](backend/app/ai/bob_provider.py) interface:
- **Autonomous Tool-Calling:** Bob is invoked using 13 function calling definitions covering file inspection, ripgrep searches, git operations, and test verification.
- **Granite Code Integration:** Configured to invoke `ibm-granite-code` models via standard OpenAI-compatible API schemas.
- **Failover / Offline Demo Mode:** When Bob API credentials are not provided or an endpoint is unreachable, BobProvider transparently activates an internal deterministic simulation engine. This guarantees zero-downtime judging and rock-solid hackathon demonstrations.

---

## 🚀 Deployment

Complete step-by-step instructions for deploying to Vercel and Render are documented in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md):
- **Frontend (Vercel):** Zero-configuration Next.js deployment.
- **Backend (Render):** Deployable via [backend/render.yaml](backend/render.yaml) blueprint or Dockerfile.
- **Database:** Automatic fallback from local SQLite to managed PostgreSQL.

---

## 🔒 Security Considerations

- **Path Sandboxing:** `RepositoryManager` strictly validates all file access through `_resolve_safe_path`, throwing explicit security violations if path traversal (`../../`) is attempted.
- **Subprocess Isolation:** Subprocess execution is restricted to safe commands (`pytest`, `npm test`) with hard timeouts (30s) and blacklists against dangerous system calls.
- **CORS Restrictions:** Production configurations disallow wildcard (`*`) origins and require explicit whitelisting of frontend domains.
- **Secret Hygiene:** All API keys and connection strings remain strictly server-side. Public `/health` endpoints expose no internal system topologies.
- **Legal & Compliance:** Accompanied by [Apache 2.0 LICENSE](LICENSE), [PRIVACY.md](PRIVACY.md), [TERMS.md](TERMS.md), and [SECURITY.md](SECURITY.md).
