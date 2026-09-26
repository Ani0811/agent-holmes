# Agent Holmes 🔍

> **"Every bug leaves evidence."**

Agent Holmes is an AI-powered software investigator that accepts a Git repository and a bug symptom, autonomously investigates the codebase using structured evidence, formulates and evaluates root cause hypotheses, generates a minimal unified patch, and verifies the fix with automated test execution before claiming **`CASE SOLVED`**.

Built for the **IBM Bob 2.0 Hackathon**.

---

## 🛠️ Architecture & Tech Stack

```
Next.js Console (Port 3000) ─── REST / WebSocket ───► FastAPI Orchestrator (Port 8000)
                                                              │
                              ┌───────────────────────────────┼─────────────────────────────┐
                              ▼                               ▼                             ▼
                       Repository Manager             Investigation Engine          Verification Engine
                     (Git, ripgrep, sandbox)        (Bob AI Agentic Tool Loop)      (Subprocess / Docker)
                                                              │
                                                        Evidence Store
                                                     (SQLite / SQLModel)
```

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, shadcn/ui, Lucide Icons
- **Backend:** Python 3.11+, FastAPI, SQLModel (SQLite), Pydantic v2, uvicorn
- **AI Engine:** IBM Bob Tool-Calling API (abstracted behind provider interface with deterministic local simulation failover)
- **Repository Analysis:** Git CLI, ripgrep with Python regex fallback, path traversal sandboxing
- **Verification:** Subprocess executor (Windows-native) with Docker container isolation fallback
- **Real-time Streaming:** WebSockets with automatic historical event replay for late-joining clients

---

## 🚀 Quickstart

### 1. Prerequisites
- **Node.js** v18+ (tested with v20+)
- **Python** 3.10+ (tested with v3.11 / v3.14)
- **Git** installed and available on `PATH`
- **Docker Desktop** (optional; subprocess verification fallback is enabled by default)

### 2. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv .venv
# On Windows PowerShell:
.\.venv\Scripts\Activate.ps1
# On Linux / macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI development server
uvicorn app.main:app --reload --port 8000
```
Backend will be live at `http://localhost:8000`. Interactive OpenAPI documentation available at `http://localhost:8000/docs`.

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start Next.js development server
npm run dev
```
Frontend will be live at `http://localhost:3000`.

---

## 🎬 Live Demo: "Session Logout Bug"

The repository includes a ready-to-run demo application at `test-repos/session-logout-demo/` modeling a real-world Flask session persistence bug:

1. **The Bug:** In `src/auth/token_refresh.py`, an access token is updated in-place inside `session['auth']`. Because Flask sessions track dirty state via object identity, modifying a nested mutable dict in-place does not trigger the `Set-Cookie` header unless `session.modified = True` is explicitly set. As a result, users get logged out on their next request.
2. **One-Click Demo:**
   - Open `http://localhost:3000` in your browser.
   - Click the **"Load Session Logout Demo"** button on the New Case form.
   - Click **"START INVESTIGATION"**.
3. **Investigation Workflow:**
   - **Phase 1: Discovery** — Clones and indexes the workspace.
   - **Phase 2: Search** — Searches codebase for auth, token refresh, and session routes.
   - **Phase 3: Evidence** — Extracts `token_refresh.py:15` as concrete evidence (in-place mutation).
   - **Phase 4: Hypothesis** — Formulates and confirms hypothesis: "Missing `session.modified = True`".
   - **Phase 5: Patch** — Generates a minimal unified diff adding `session.modified = True`.
   - **Phase 6: Verification** — Executes `pytest` in the sandbox (prior test failure resolved; **4 passed**).
   - **Phase 7: Resolution** — Case transitions to **`CASE SOLVED`** with verified diff and report.

---

## ⚙️ Environment Configuration

### Backend (`backend/.env`)
| Variable | Default | Description |
| :--- | :--- | :--- |
| `AI_PROVIDER` | `bob` | AI provider implementation (`bob`) |
| `BOB_API_BASE` | `http://localhost:11434` | IBM Bob / LLM endpoint base URL |
| `BOB_API_KEY` | `""` | Authentication key for Bob API |
| `BOB_MODEL` | `ibm-granite-code` | Model ID used for tool calling |
| `DATABASE_URL` | `sqlite:///./holmes.db` | SQLite database connection string |
| `WORKSPACES_DIR` | `./workspaces` | Directory for isolated case sandbox checkouts |
| `DEFAULT_TIMEOUT_SECONDS` | `30` | Subprocess command execution timeout |

### Frontend (`frontend/.env.local`)
| Variable | Default | Description |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000/api` | Backend REST API URL |
| `NEXT_PUBLIC_WS_URL` | `ws://localhost:8000/ws` | Backend WebSocket streaming URL |

---

## 🧪 Testing

```bash
# Run all backend unit, integration, and E2E tests
cd backend
.\.venv\Scripts\pytest

# Run frontend production build & TypeScript check
cd frontend
npm run build
```

---

## 📂 Project Structure

```
agent-holmes/
├── backend/
│   ├── app/
│   │   ├── api/             # REST endpoints (cases, health) & WebSocket stream
│   │   ├── ai/              # IBM Bob tool-calling provider & tool registry
│   │   ├── investigation/   # InvestigationEngine & transactional EvidenceStore
│   │   ├── models/          # SQLModel schemas (Case, Evidence, Hypothesis, Patch, TestResult, Event)
│   │   ├── patch/           # Unified diff generator & PatchApplicator
│   │   ├── repository/      # RepositoryManager (sandboxing, Git CLI, ripgrep)
│   │   ├── verification/    # SubprocessExecutor & DockerExecutor
│   │   ├── config.py        # Settings management
│   │   ├── database.py      # SQLite engine & session management
│   │   └── main.py          # FastAPI application entrypoint & CORS
│   ├── tests/               # 8 test suites (AI, API, Engine, Repo, Verification, E2E)
│   ├── Dockerfile
│   ├── pyproject.toml
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/             # Next.js App Router (New Case, Case View)
│   │   ├── components/      # UI Panels: InvestigationFeed, DiffViewer, VerificationPanel, CaseReport
│   │   └── lib/             # API client, WebSocket hooks, utils
│   ├── Dockerfile
│   └── package.json
├── test-repos/              # Demo repositories (e.g. session-logout-demo)
├── docker-compose.yml       # Monorepo container orchestration
└── README.md
```
