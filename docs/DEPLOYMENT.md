# Agent Holmes — Production Deployment Guide

> **Tagline:** Every bug leaves evidence.  
> **Target Architecture:** Next.js (Vercel) → FastAPI (Render) → Bob AI Engine / Mock Fallback

This guide provides step-by-step instructions for deploying the Agent Holmes application to production using **Vercel** for the frontend and **Render** for the backend.

---

## 1. Architecture Overview

```
                      INTERNET (Public Users)
                                 │
             ┌───────────────────┴───────────────────┐
             ▼                                       ▼
    Next.js 16 Frontend                     FastAPI Backend
    (Hosted on Vercel)                      (Hosted on Render)
    https://agent-holmes.vercel.app         https://agent-holmes-backend.onrender.com
             │                                       │
             └─────────────── HTTPS / WSS ───────────┘
                                 │
                        PostgreSQL Database
                        (Render Postgres / Neon)
```

---

## 2. Google Cloud / Firebase / OAuth Audit Findings

During code inspection, the following was established:
- **Google Cloud APIs:** Not used. No GCP service account or billing project is needed.
- **Firebase Authentication / Firestore:** Not used. Holmes does not use Firebase dependencies.
- **Google OAuth:** Not required. The application runs open developer investigations without login barriers for hackathon evaluation.
- **AI Provider:** Holmes natively utilizes [BobProvider](file:///c:/GitHub/agent-holmes/backend/app/ai/bob_provider.py) (IBM Granite Code). If external API credentials are not provided, it falls back to an internal deterministic investigation engine for safe, 100% reliable hackathon judging.

---

## 3. Backend Deployment (Render)

### Option A: Using `render.yaml` Blueprint (Recommended)
1. Fork or push the Agent Holmes repository to GitHub.
2. In the [Render Dashboard](https://dashboard.render.com), click **New** → **Blueprint**.
3. Select your repository. Render will automatically detect `backend/render.yaml` and provision:
   - **`agent-holmes-backend`**: Python web service with Uvicorn ASGI server.
   - **`agent-holmes-db`**: Managed PostgreSQL database.
4. Set the `FRONTEND_URL` environment variable to your Vercel frontend URL (e.g. `https://agent-holmes.vercel.app`).
5. Click **Apply**.

### Option B: Manual Web Service Setup
1. In the Render Dashboard, click **New** → **Web Service**.
2. Connect your GitHub repository.
3. Configure the service settings:
   - **Name:** `agent-holmes-backend`
   - **Root Directory:** `backend`
   - **Environment:** `Python 3` (or Docker with `Dockerfile`)
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Health Check Path:** `/health`
4. Configure Environment Variables in Render:
   | Key | Example Value | Notes |
   |---|---|---|
   | `ENVIRONMENT` | `production` | Enables production mode |
   | `FRONTEND_URL` | `https://agent-holmes.vercel.app` | Added to CORS whitelist |
   | `CORS_ORIGINS` | `https://agent-holmes.vercel.app` | Comma-separated allowed origins |
   | `DATABASE_URL` | `postgresql://...` | Connection string to Postgres |
   | `BOB_API_KEY` | *(optional)* | IBM Bob / Granite API Key |
   | `BOB_API_BASE` | `http://localhost:11434` | Endpoint for Ollama / Bob API |
   | `BOB_MODEL` | `ibm-granite-code` | Model identifier |
   | `WORKSPACES_DIR` | `/tmp/workspaces` | Sandboxed execution workspace |

---

## 4. Frontend Deployment (Vercel)

1. In the [Vercel Dashboard](https://vercel.com/new), import your GitHub repository.
2. Configure project settings:
   - **Framework Preset:** `Next.js`
   - **Root Directory:** `frontend`
   - **Build Command:** `next build` (default)
   - **Output Directory:** `.next` (default)
3. Set Environment Variables:
   | Key | Production Value | Description |
   |---|---|---|
   | `NEXT_PUBLIC_API_URL` | `https://agent-holmes-backend.onrender.com/api` | Render backend API endpoint |
   | `NEXT_PUBLIC_WS_URL` | `wss://agent-holmes-backend.onrender.com/ws` | Render backend WebSocket endpoint (use `wss://`) |
4. Click **Deploy**.

---

## 5. Post-Deployment Verification & Testing

Once both services are deployed, perform the following verification checks:

### 1. Backend Health Check
```bash
curl -i https://<your-render-backend>.onrender.com/health
```
**Expected response:**
```json
{"status": "ok"}
```

### 2. Frontend Connectivity
Visit `https://<your-vercel-domain>.vercel.app`.
- The dashboard should load immediately without CORS errors in the browser console.
- The footer should contain working links to `/license`, `/privacy`, and `/terms`.

### 3. End-to-End Demo Case Investigation
1. On the homepage, select the **Demo: Session Logout Bug** or enter:
   - **Repository:** `test-repos/session-logout-demo`
   - **Bug Description:** `Users report getting logged out after token refresh`
2. Click **Start Investigation**.
3. Verify the investigation phases:
   - **Discovery:** Files scanned (`src/app.py`, `src/auth/token_refresh.py`).
   - **Evidence:** `session.modified = True` omitted in cookie handler.
   - **Hypothesis:** Formulated with confidence score.
   - **Patch:** Unified diff generated fixing token refresh.
   - **Verification:** Test runner executes `pytest` and confirms all 4 unit tests pass.
   - **Outcome:** Case status updates to **Solved**.
4. Open the **Evidence Board** tab to view the visual graph.
5. Click **View Patch / Export PR** to test the git patch export and copy command.

---

## 6. Security & Sandboxing Considerations

1. **Subprocess Isolation:** The backend verification engine strictly limits execution to approved commands (`pytest`, `npm test`, etc.) with a hard timeout of 30 seconds.
2. **Path Sandboxing:** Relative path traversal attempts (`../../`) are blocked by `_resolve_safe_path` in `RepositoryManager`.
3. **No Secret Leaks:** The public `/health` endpoint exposes no environment variables or filesystem structures.
4. **CORS:** Only the configured `FRONTEND_URL` and `CORS_ORIGINS` are allowed in production.
