# Security Policy

**Project:** Agent Holmes — Autonomous Cyber-Forensic Codebase Investigator & Audit Engine  
**Repository:** [https://github.com/Ani0811/agent-holmes](https://github.com/Ani0811/agent-holmes)

---

## 1. Security Architecture & Threat Model

Agent Holmes is designed to inspect, analyze, and verify software codebases while maintaining rigorous security boundaries:

### A. Sandbox Isolation
- **Per-Case Workspaces:** Every investigation runs within a dedicated, isolated workspace directory (`workspaces/case_<id>/`).
- **Path Traversal Prevention:** The `RepositoryManager` strictly enforces path boundary verification (`_resolve_safe_path`). Any attempt to access files outside the sandbox checkout raises a security exception.
- **Controlled Subprocess Execution:** Code modifications flow through formal patch application steps, and test execution runs in dedicated subprocesses with strict timeouts (`DEFAULT_TIMEOUT_SECONDS = 30`).

### B. Secret & Credential Protection
- **No Inadvertent Commits:** Sensitive configuration files (`.env`, `.env.local`, SQLite databases `holmes.db`) are strictly guarded in `.gitignore`.
- **WebSocket Masking:** Real-time event streams delivered to client browsers never serialize raw API tokens, system keys, or master authentication secrets.
- **Local Network Boundary:** By default, all API and WebSocket services bind strictly to `127.0.0.1` / `localhost`.

---

## 2. Reporting a Vulnerability

We take the security of Agent Holmes and the codebases it inspects very seriously. If you discover a security vulnerability or sandbox escape vector:

1. **Do Not File a Public GitHub Issue:**  
   Please avoid disclosing the vulnerability publicly until it has been acknowledged and addressed.
2. **Private Reporting:**  
   Please submit a private report via **GitHub Security Advisories** on our repository:  
   [https://github.com/Ani0811/agent-holmes/security/advisories](https://github.com/Ani0811/agent-holmes/security/advisories)  
   Or contact the maintainer directly via GitHub profile messaging.
3. **What to Include:**
   - A detailed description of the vulnerability.
   - Proof of concept (PoC) or step-by-step instructions to reproduce.
   - Potential impact (e.g., path traversal, command injection, credential exposure).
   - Any suggested remediation or patch.

---

## 3. Response & Remediation Commitment

- **Acknowledgment:** We strive to acknowledge vulnerability reports within **48 hours**.
- **Assessment:** We will confirm the severity and scope with you and provide regular updates during remediation.
- **Public Disclosure:** Once a fix has been developed, tested, and published in a new release, an advisory will be published crediting the reporter (unless anonymity is requested).

---

## 4. Best Practices for Users

When running Agent Holmes on proprietary or third-party code:
- **Always Vet Third-Party Repos:** Running automated test suites executes arbitrary code defined in the target repo's tests. Only run investigations on code you trust, or run Agent Holmes inside Docker containers.
- **Keep Secrets Out of Test Code:** Avoid hardcoding sensitive API keys or credentials directly into test fixtures or tracked repository files.
- **Rotate Compromised Keys:** If an API key is accidentally exposed in an active session, rotate it immediately in your AI provider dashboard.
