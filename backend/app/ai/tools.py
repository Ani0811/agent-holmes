"""Tool declarations and execution dispatcher for Agent Holmes."""

import json
import subprocess
import sys
from dataclasses import dataclass
from typing import List, Dict, Any, Optional, Callable, Awaitable
from sqlmodel import Session

from app.repository.manager import RepositoryManager
from app.models import EvidenceItem, Hypothesis, InvestigationEvent, Patch, TestResult
from app.patch.applicator import PatchApplicator
from app.verification.executor import SubprocessExecutor


@dataclass
class ToolExecutionContext:
    """Execution context injected into tool handlers."""
    case_id: str
    repo_manager: RepositoryManager
    db_session: Optional[Session] = None
    emit_event: Optional[Callable[[str, str, Optional[Dict[str, Any]]], Awaitable[None]]] = None


TOOL_DEFINITIONS: List[Dict[str, Any]] = [
    # ---------------- Repository Tools ----------------
    {
        "type": "function",
        "function": {
            "name": "list_files",
            "description": "List files and directories in the repository, optionally filtered by glob pattern.",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {"type": "string", "description": "Relative directory path (e.g. '', 'src', 'tests')", "default": ""},
                    "pattern": {"type": "string", "description": "Optional glob pattern (e.g. '*.py')"},
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "read_file",
            "description": "Read contents of a file in the repository with optional 1-indexed line range.",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {"type": "string", "description": "Relative file path to read"},
                    "start_line": {"type": "integer", "description": "Starting line number (1-indexed)", "default": 1},
                    "end_line": {"type": "integer", "description": "Ending line number (inclusive)"},
                },
                "required": ["path"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "search_code",
            "description": "Search for text or regex patterns across files in the repository using ripgrep.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Text or regex query to search for"},
                    "file_pattern": {"type": "string", "description": "Optional file pattern to narrow search (e.g. '*.py')"},
                },
                "required": ["query"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "find_references",
            "description": "Find exact references or occurrences of a symbol across the repository.",
            "parameters": {
                "type": "object",
                "properties": {
                    "symbol": {"type": "string", "description": "Exact symbol name to locate"},
                },
                "required": ["symbol"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_git_history",
            "description": "Retrieve recent Git commit history for the repository or a specific file.",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {"type": "string", "description": "Optional file path to filter commit history"},
                    "n": {"type": "integer", "description": "Number of recent commits to return (default 10)", "default": 10},
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_git_diff",
            "description": "Get git diff between commits or against current working tree.",
            "parameters": {
                "type": "object",
                "properties": {
                    "commit_a": {"type": "string", "description": "Base commit hash"},
                    "commit_b": {"type": "string", "description": "Target commit hash"},
                    "path": {"type": "string", "description": "Optional file path to limit diff"},
                },
            },
        },
    },
    # ---------------- Investigation Tools ----------------
    {
        "type": "function",
        "function": {
            "name": "record_evidence",
            "description": "Record a factual, verifiable piece of evidence discovered during investigation. Never fabricate evidence.",
            "parameters": {
                "type": "object",
                "properties": {
                    "file": {"type": "string", "description": "Relative file path containing the evidence"},
                    "line": {"type": "integer", "description": "Specific line number if applicable"},
                    "type": {"type": "string", "description": "Type of evidence: code_snippet, log, git_diff", "default": "code_snippet"},
                    "claim": {"type": "string", "description": "Concise factual finding"},
                    "description": {"type": "string", "description": "Detailed explanation of why this evidence matters"},
                    "confidence": {"type": "number", "description": "Confidence score from 0.0 to 1.0", "default": 1.0},
                    "code_snippet": {"type": "string", "description": "Actual code snippet with surrounding context"},
                },
                "required": ["file", "claim", "description"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "create_hypothesis",
            "description": "Propose a hypothesis explaining the root cause of the bug, linking to supporting evidence IDs.",
            "parameters": {
                "type": "object",
                "properties": {
                    "title": {"type": "string", "description": "Short hypothesis title"},
                    "description": {"type": "string", "description": "Detailed hypothesis explanation and failure mechanism"},
                    "confidence": {"type": "number", "description": "Confidence score from 0.0 to 1.0", "default": 0.5},
                    "evidence_ids": {"type": "array", "items": {"type": "integer"}, "description": "List of supporting EvidenceItem IDs"},
                },
                "required": ["title", "description"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "evaluate_hypothesis",
            "description": "Update the status of an existing hypothesis (e.g. testing, confirmed, rejected).",
            "parameters": {
                "type": "object",
                "properties": {
                    "hypothesis_id": {"type": "integer", "description": "ID of the hypothesis to update"},
                    "status": {"type": "string", "enum": ["proposed", "testing", "confirmed", "rejected"], "description": "New hypothesis status"},
                    "confidence": {"type": "number", "description": "Updated confidence score"},
                    "rationale": {"type": "string", "description": "Reason for confirming or rejecting this hypothesis"},
                },
                "required": ["hypothesis_id", "status"],
            },
        },
    },
    # ---------------- Execution Tools ----------------
    {
        "type": "function",
        "function": {
            "name": "run_command",
            "description": "Execute a safe shell command inside the repository workspace (restricted subprocess).",
            "parameters": {
                "type": "object",
                "properties": {
                    "command": {"type": "string", "description": "Command line string to execute"},
                    "timeout_seconds": {"type": "integer", "description": "Execution timeout in seconds", "default": 30},
                },
                "required": ["command"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "run_tests",
            "description": "Run the test suite (e.g. pytest or npm test) to observe failures or verify fixes.",
            "parameters": {
                "type": "object",
                "properties": {
                    "test_command": {"type": "string", "description": "Command to run tests (default: 'pytest')", "default": "pytest"},
                    "timeout_seconds": {"type": "integer", "description": "Execution timeout in seconds", "default": 30},
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "run_linter",
            "description": "Run a code linter or syntax checker in the workspace.",
            "parameters": {
                "type": "object",
                "properties": {
                    "linter_command": {"type": "string", "description": "Linter command (e.g. 'ruff check .' or 'flake8')", "default": "ruff check ."},
                    "timeout_seconds": {"type": "integer", "description": "Execution timeout in seconds", "default": 30},
                },
            },
        },
    },
    # ---------------- Modification Tools ----------------
    {
        "type": "function",
        "function": {
            "name": "apply_patch",
            "description": "Apply a unified git diff patch to the repository to fix the identified bug.",
            "parameters": {
                "type": "object",
                "properties": {
                    "unified_diff": {"type": "string", "description": "Unified git diff starting with --- and +++"},
                    "explanation": {"type": "string", "description": "Detailed explanation of what the patch changes and why"},
                },
                "required": ["unified_diff", "explanation"],
            },
        },
    },
]


async def execute_tool(
    name: str,
    arguments: Dict[str, Any],
    context: ToolExecutionContext,
) -> Dict[str, Any]:
    """Dispatch a tool call to its corresponding handler with auditing and event logging."""
    repo = context.repo_manager
    session = context.db_session
    case_id = context.case_id

    try:
        # 1. Repository Tools
        if name == "list_files":
            res = repo.list_files(
                path=arguments.get("path", ""),
                pattern=arguments.get("pattern"),
            )
            return res.model_dump()

        elif name == "read_file":
            res = repo.read_file(
                path=arguments["path"],
                start_line=arguments.get("start_line", 1),
                end_line=arguments.get("end_line"),
            )
            return res.model_dump()

        elif name == "search_code":
            res = repo.search_code(
                query=arguments["query"],
                file_pattern=arguments.get("file_pattern"),
            )
            return res.model_dump()

        elif name == "find_references":
            res = repo.find_references(
                symbol=arguments["symbol"],
            )
            return res.model_dump()

        elif name == "get_git_history":
            res = repo.get_git_history(
                path=arguments.get("path"),
                n=arguments.get("n", 10),
            )
            return res.model_dump()

        elif name == "get_git_diff":
            res = repo.get_git_diff(
                commit_a=arguments.get("commit_a"),
                commit_b=arguments.get("commit_b"),
                path=arguments.get("path"),
            )
            return res.model_dump()

        # 2. Investigation Tools
        elif name == "record_evidence":
            evidence = EvidenceItem(
                case_id=case_id,
                file=arguments["file"],
                line=arguments.get("line"),
                type=arguments.get("type", "code_snippet"),
                claim=arguments["claim"],
                description=arguments["description"],
                confidence=arguments.get("confidence", 1.0),
                code_snippet=arguments.get("code_snippet"),
            )
            if session:
                session.add(evidence)
                session.commit()
                session.refresh(evidence)
                ev_id = evidence.id
            else:
                ev_id = 1

            if context.emit_event:
                await context.emit_event(
                    "evidence_recorded",
                    f"Evidence recorded in {evidence.file}:{evidence.line or ''} — {evidence.claim}",
                    {"evidence_id": ev_id, "file": evidence.file, "claim": evidence.claim},
                )

            return {
                "status": "success",
                "evidence_id": ev_id,
                "message": f"Evidence recorded successfully for {arguments['file']}",
            }

        elif name == "create_hypothesis":
            ev_ids = arguments.get("evidence_ids", [])
            hypothesis = Hypothesis(
                case_id=case_id,
                title=arguments["title"],
                description=arguments["description"],
                confidence=arguments.get("confidence", 0.5),
                evidence_ids=json.dumps(ev_ids),
                status="proposed",
            )
            if session:
                session.add(hypothesis)
                session.commit()
                session.refresh(hypothesis)
                hypo_id = hypothesis.id
            else:
                hypo_id = 1

            if context.emit_event:
                await context.emit_event(
                    "hypothesis_created",
                    f"Hypothesis formed: {hypothesis.title}",
                    {"hypothesis_id": hypo_id, "title": hypothesis.title},
                )

            return {
                "status": "success",
                "hypothesis_id": hypo_id,
                "message": f"Hypothesis '{hypothesis.title}' created with ID {hypo_id}",
            }

        elif name == "evaluate_hypothesis":
            hypo_id = arguments["hypothesis_id"]
            new_status = arguments["status"]
            confidence = arguments.get("confidence")
            rationale = arguments.get("rationale", "")

            if session:
                hypo = session.get(Hypothesis, hypo_id)
                if hypo:
                    hypo.status = new_status
                    if confidence is not None:
                        hypo.confidence = confidence
                    session.add(hypo)
                    session.commit()

            if context.emit_event:
                await context.emit_event(
                    "hypothesis_evaluated",
                    f"Hypothesis #{hypo_id} marked as {new_status.upper()}: {rationale}",
                    {"hypothesis_id": hypo_id, "status": new_status, "rationale": rationale},
                )

            return {
                "status": "success",
                "hypothesis_id": hypo_id,
                "status_updated_to": new_status,
                "rationale": rationale,
            }

        # 3. Execution Tools
        elif name in ("run_command", "run_tests", "run_linter"):
            if name == "run_tests":
                cmd = arguments.get("test_command", "pytest")
                test_type = "test"
            elif name == "run_linter":
                cmd = arguments.get("linter_command", "ruff check .")
                test_type = "lint"
            else:
                cmd = arguments["command"]
                test_type = "command"

            timeout = arguments.get("timeout_seconds", 30)

            executor = SubprocessExecutor()
            exec_res = executor.execute(
                command=cmd,
                cwd=repo.repo_dir,
                timeout_seconds=timeout,
            )

            result_payload = {
                "command": cmd,
                "exit_code": exec_res.exit_code,
                "stdout": exec_res.stdout[-4000:] if exec_res.stdout else "",
                "stderr": exec_res.stderr[-2000:] if exec_res.stderr else "",
                "passed": exec_res.passed,
                "duration_ms": exec_res.duration_ms,
            }

            if session and name in ("run_tests", "run_linter"):
                tr = TestResult(
                    case_id=case_id,
                    command=cmd,
                    exit_code=exec_res.exit_code,
                    passed=exec_res.passed,
                    stdout=result_payload["stdout"],
                    stderr=result_payload["stderr"],
                    test_type=test_type,
                    duration_ms=exec_res.duration_ms,
                )
                session.add(tr)
                session.commit()

            if context.emit_event:
                await context.emit_event(
                    "command_executed",
                    f"Executed `{cmd}` -> Exit {exec_res.exit_code} ({'PASSED' if exec_res.passed else 'FAILED'})",
                    result_payload,
                )

            return result_payload

        # 4. Modification Tools
        elif name == "apply_patch":
            diff = arguments["unified_diff"]
            explanation = arguments["explanation"]

            apply_res = PatchApplicator.apply(diff, repo.repo_dir)

            if apply_res.success:
                msg = f"Patch applied successfully: {explanation}"
                if session:
                    p = Patch(
                        case_id=case_id,
                        unified_diff=diff,
                        explanation=explanation,
                        status="applied",
                    )
                    session.add(p)
                    session.commit()
            else:
                msg = f"Failed to apply patch: {apply_res.stderr or apply_res.message}"

            if context.emit_event:
                await context.emit_event(
                    "patch_applied" if apply_res.success else "patch_failed",
                    msg,
                    {"applied": apply_res.success, "error": apply_res.stderr if not apply_res.success else None},
                )

            return {
                "applied": apply_res.success,
                "message": msg,
                "stderr": apply_res.stderr if not apply_res.success else "",
            }

        else:
            return {"error": f"Unknown tool: '{name}'"}

    except Exception as e:
        return {"error": f"Tool execution failed for '{name}': {str(e)}"}
