# Privacy Policy

**Effective Date:** September 26, 2026  
**Project:** Agent Holmes — Autonomous Cyber-Forensic Codebase Investigator & Audit Engine  
**Repository:** [https://github.com/Ani0811/agent-holmes](https://github.com/Ani0811/agent-holmes)

---

## 1. Executive Summary & Privacy Principles

Agent Holmes is built on a foundational engineering principle: **Your source code is your intellectual property, and privacy is non-negotiable.**

- **Zero Code Training:** Agent Holmes never uses your source code, bug descriptions, diffs, or evidence to train public or proprietary AI models.
- **Local Sovereignty:** By default, Agent Holmes runs entirely on your local machine or self-hosted infrastructure. All state is maintained in a local SQLite database (`holmes.db`) and local sandbox workspaces (`./workspaces`).
- **No Third-Party Analytics:** We do not embed marketing trackers, analytics SDKs, session replay trackers, or advertising pixels in our frontend or backend.
- **Transparent LLM Data Flow:** Code context and file snippets are sent only to the AI endpoint explicitly configured in your environment (`BOB_API_BASE`). If you use a local model via Ollama or a private proxy, your code never traverses the public internet.

---

## 2. Information We Process

When you run an investigation or codebase audit, Agent Holmes processes the following technical artifacts strictly to perform its diagnostic function:

### A. Repository & Codebase Data
- **Target Repository Paths / URLs:** The local path or remote Git URL provided in the case initiation form.
- **File System Structure & Content:** File names, directories, package manifests (`package.json`, `pyproject.toml`, `Cargo.toml`, etc.), and source code lines relevant to the bug or review scope.
- **Sandboxed Workspace Clones:** Ephemeral checkouts cloned into isolated directories under `./workspaces/case_<id>/`.

### B. Investigation Evidence & Hypotheses
- **Code Snippets & Line Numbers:** Specific lines logged via `record_evidence` to prove root causes or architectural observations.
- **Hypotheses & Explanations:** Diagnostic rationales and confidence scores generated during the investigation.
- **Generated Unified Diffs:** Surgical code patches formulated to resolve identified regressions.
- **Test Execution Logs:** Subprocess output (standard output, standard error, exit codes) from running native test suites (`pytest`, `npm test`, etc.).

### C. System & Environment Credentials
- **API Keys (`BOB_API_KEY`, etc.):** Kept strictly within your host environment or `.env` file. These keys are never transmitted to client browser sockets, never committed to version control (`.gitignore`), and only utilized to authorize outbound requests to your chosen AI provider.

---

## 3. How Data is Handled & Transmitted

1. **Local Sandbox Execution:**  
   Repositories are cloned into isolated workspace folders (`workspaces/case_<id>/repo/`). Subprocess test execution is restricted to these sandbox boundaries to prevent unauthorized host mutations.
2. **AI Provider Interaction:**  
   When using IBM Bob, Ollama, or an OpenAI-compatible endpoint, Agent Holmes transmits structured JSON payloads containing relevant code snippets, tool definitions, and system prompts to your configured `BOB_API_BASE`.
   - **Local Mode (Ollama / Local Bob):** All prompts and responses remain 100% on your local machine (`http://localhost:11434`).
   - **Remote Mode:** If you point `BOB_API_BASE` to an external hosted service, requests are governed by that provider’s data privacy policies.
3. **Real-Time WebSocket Streaming:**  
   Investigation events (phase transitions, evidence discoveries, patch applications) are broadcasted over local WebSockets (`ws://localhost:8000/ws/cases/<id>`) solely to render live feedback in your browser session.

---

## 4. Data Storage, Retention & Deletion

- **Local Persistence:** Case metadata, evidence items, hypotheses, patches, and event logs are stored in a local SQLite database (`holmes.db`).
- **Retention Control:** You maintain total ownership and control over data retention:
  - **Pruning Workspaces:** Deleting any folder inside `./workspaces/` removes all cloned repository artifacts.
  - **Pruning History:** Deleting `backend/holmes.db` instantly purges all historical cases, evidence, and event timelines.
- **Ephemeral Sandbox Workspaces:** Workspace files are designed for temporary execution and do not sync to external clouds unless you manually configure offsite backup.

---

## 5. Security & Safeguards

- **No Cross-Case Data Contamination:** Each investigation operates in an isolated directory with dedicated database identifiers.
- **Strict Git Inclusions:** `.env` and `holmes.db` are explicitly blocked in `.gitignore` to prevent inadvertent credential leakage.
- **Local Network Default:** The default backend service binds to `localhost` (`127.0.0.1`), ensuring investigation endpoints are not exposed to public networks without explicit reverse-proxy configuration.

---

## 6. Open Source Transparency & Inquiries

Agent Holmes is open-source software licensed under the **Apache License 2.0**. You can inspect every line of code that handles data, executes subprocesses, or calls external APIs directly in the [GitHub Repository](https://github.com/Ani0811/agent-holmes).

If you have questions or concerns regarding privacy practices or security boundaries, please open an issue or security advisory on our GitHub repository.
