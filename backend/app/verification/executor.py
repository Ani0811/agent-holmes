"""Execution backends for test execution and verification (Subprocess and Docker)."""

import abc
import logging
import os
import shlex
import subprocess
import sys
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Optional, Dict

logger = logging.getLogger("holmes.verification.executor")


@dataclass
class ExecutionResult:
    """Outcome of running a command within an execution sandbox."""

    command: str
    exit_code: int
    stdout: str
    stderr: str
    passed: bool
    duration_ms: int


class BaseExecutor(abc.ABC):
    """Abstract execution backend."""

    @abc.abstractmethod
    def execute(
        self,
        command: str,
        cwd: Path,
        timeout_seconds: int = 30,
        env: Optional[Dict[str, str]] = None,
    ) -> ExecutionResult:
        """Run a command inside the designated environment."""
        pass


class SubprocessExecutor(BaseExecutor):
    """Restricted subprocess executor running directly on the host system."""

    BLOCKED_PATTERNS = ["rm -rf /", "mkfs", "format", ":(){ :|:& };:"]

    def execute(
        self,
        command: str,
        cwd: Path,
        timeout_seconds: int = 30,
        env: Optional[Dict[str, str]] = None,
    ) -> ExecutionResult:
        start_time = time.monotonic()

        # Sanity check for prohibited commands
        for blocked in self.BLOCKED_PATTERNS:
            if blocked in command:
                return ExecutionResult(
                    command=command,
                    exit_code=126,
                    stdout="",
                    stderr=f"Security Guard: Prohibited command pattern '{blocked}' blocked.",
                    passed=False,
                    duration_ms=0,
                )

        # Windows / Virtualenv compatibility: ensure python & pytest use current interpreter
        cmd_str = command
        if cmd_str == "pytest" or cmd_str.startswith("pytest "):
            cmd_str = f'"{sys.executable}" -m ' + cmd_str
        elif cmd_str.startswith("python "):
            cmd_str = f'"{sys.executable}" ' + cmd_str[7:]

        exec_env = os.environ.copy()
        if env:
            exec_env.update(env)

        try:
            proc = subprocess.run(
                cmd_str,
                shell=True,
                cwd=str(cwd),
                capture_output=True,
                text=True,
                env=exec_env,
                timeout=timeout_seconds,
            )
            duration_ms = int((time.monotonic() - start_time) * 1000)
            passed = (proc.returncode == 0)

            return ExecutionResult(
                command=command,
                exit_code=proc.returncode,
                stdout=proc.stdout or "",
                stderr=proc.stderr or "",
                passed=passed,
                duration_ms=duration_ms,
            )

        except subprocess.TimeoutExpired as te:
            duration_ms = int((time.monotonic() - start_time) * 1000)
            stdout_text = te.stdout.decode("utf-8", errors="replace") if isinstance(te.stdout, bytes) else (te.stdout or "")
            stderr_text = te.stderr.decode("utf-8", errors="replace") if isinstance(te.stderr, bytes) else (te.stderr or "")

            return ExecutionResult(
                command=command,
                exit_code=124,
                stdout=stdout_text,
                stderr=(stderr_text + f"\nCommand timed out after {timeout_seconds}s").strip(),
                passed=False,
                duration_ms=duration_ms,
            )
        except Exception as e:
            duration_ms = int((time.monotonic() - start_time) * 1000)
            logger.exception(f"SubprocessExecutor failed to run '{command}': {e}")
            return ExecutionResult(
                command=command,
                exit_code=1,
                stdout="",
                stderr=str(e),
                passed=False,
                duration_ms=duration_ms,
            )


class DockerExecutor(BaseExecutor):
    """Containerized sandbox executor mounting the workspace volume with resource limits."""

    def __init__(self, image: str = "python:3.11-slim", network: str = "none"):
        self.image = image
        self.network = network

    def execute(
        self,
        command: str,
        cwd: Path,
        timeout_seconds: int = 45,
        env: Optional[Dict[str, str]] = None,
    ) -> ExecutionResult:
        start_time = time.monotonic()
        workspace_abs = str(cwd.resolve())

        # Construct safe docker run invocation
        docker_args = [
            "docker",
            "run",
            "--rm",
            "-v",
            f"{workspace_abs}:/workspace:rw",
            "-w",
            "/workspace",
            "--memory",
            "512m",
            "--cpus",
            "1.5",
        ]

        if self.network:
            docker_args.extend(["--network", self.network])

        if env:
            for k, v in env.items():
                docker_args.extend(["-e", f"{k}={v}"])

        docker_args.append(self.image)
        docker_args.extend(["sh", "-c", command])

        try:
            proc = subprocess.run(
                docker_args,
                capture_output=True,
                text=True,
                timeout=timeout_seconds,
            )
            duration_ms = int((time.monotonic() - start_time) * 1000)
            passed = (proc.returncode == 0)

            return ExecutionResult(
                command=command,
                exit_code=proc.returncode,
                stdout=proc.stdout or "",
                stderr=proc.stderr or "",
                passed=passed,
                duration_ms=duration_ms,
            )

        except subprocess.TimeoutExpired as te:
            duration_ms = int((time.monotonic() - start_time) * 1000)
            stdout_text = te.stdout.decode("utf-8", errors="replace") if isinstance(te.stdout, bytes) else (te.stdout or "")
            stderr_text = te.stderr.decode("utf-8", errors="replace") if isinstance(te.stderr, bytes) else (te.stderr or "")

            return ExecutionResult(
                command=command,
                exit_code=124,
                stdout=stdout_text,
                stderr=(stderr_text + f"\nDocker execution timed out after {timeout_seconds}s").strip(),
                passed=False,
                duration_ms=duration_ms,
            )
        except Exception as e:
            duration_ms = int((time.monotonic() - start_time) * 1000)
            logger.exception(f"DockerExecutor failed to run '{command}': {e}")
            return ExecutionResult(
                command=command,
                exit_code=1,
                stdout="",
                stderr=f"Docker execution error: {str(e)}",
                passed=False,
                duration_ms=duration_ms,
            )
