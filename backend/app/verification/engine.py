"""Verification Engine: Runs automated tests and linters to verify code patches."""

import logging
import subprocess
from enum import Enum
from pathlib import Path
from typing import Optional

from app.models.case import Case
from app.models.patch import Patch
from app.models.test_result import TestResult
from app.verification.executor import BaseExecutor, SubprocessExecutor, DockerExecutor

logger = logging.getLogger("holmes.verification.engine")


class VerificationStatus(str, Enum):
    NOT_VERIFIED = "not_verified"
    FAILED = "failed"
    VERIFIED = "verified"


def is_docker_available(timeout_seconds: int = 3) -> bool:
    """Check if Docker CLI is installed and the Docker daemon is responding."""
    try:
        proc = subprocess.run(
            ["docker", "info"],
            capture_output=True,
            text=True,
            timeout=timeout_seconds,
        )
        return proc.returncode == 0
    except (FileNotFoundError, subprocess.TimeoutExpired, Exception) as e:
        logger.debug(f"Docker detection check failed: {e}")
        return False


class VerificationEngine:
    """Orchestrates test and linter execution across Docker or Subprocess execution backends."""

    def __init__(
        self,
        preferred_backend: str = "auto",
        python_image: str = "python:3.11-slim",
    ):
        self.docker_active = is_docker_available()
        self.preferred_backend = preferred_backend.lower()

        if self.preferred_backend == "docker":
            if self.docker_active:
                logger.info("Using containerized DockerExecutor for verification.")
                self.executor: BaseExecutor = DockerExecutor(image=python_image)
            else:
                logger.warning("Docker requested but daemon unavailable. Falling back to SubprocessExecutor.")
                self.executor = SubprocessExecutor()
        elif self.preferred_backend == "subprocess":
            logger.info("Using SubprocessExecutor for verification.")
            self.executor = SubprocessExecutor()
        else:  # auto
            if self.docker_active:
                logger.info("Docker daemon detected. Selected DockerExecutor as primary backend.")
                self.executor = DockerExecutor(image=python_image)
            else:
                logger.info("Docker daemon not reachable. Selected SubprocessExecutor as primary backend.")
                self.executor = SubprocessExecutor()

    def verify(
        self,
        case: Case,
        workspace_path: Path,
        patch: Optional[Patch] = None,
        test_command: str = "pytest",
        timeout_seconds: int = 45,
        test_type: str = "test",
    ) -> TestResult:
        """Run verification test suite inside workspace and return populated TestResult record."""
        exec_res = self.executor.execute(
            command=test_command,
            cwd=workspace_path,
            timeout_seconds=timeout_seconds,
        )

        return TestResult(
            case_id=case.case_id,
            patch_id=patch.id if patch else None,
            command=test_command,
            stdout=exec_res.stdout[-6000:] if exec_res.stdout else "",
            stderr=exec_res.stderr[-3000:] if exec_res.stderr else "",
            exit_code=exec_res.exit_code,
            passed=exec_res.passed,
            test_type=test_type,
            duration_ms=exec_res.duration_ms,
        )

    def run_linter(
        self,
        case: Case,
        workspace_path: Path,
        patch: Optional[Patch] = None,
        linter_command: str = "ruff check .",
        timeout_seconds: int = 30,
    ) -> TestResult:
        """Run linter in the workspace sandbox and return TestResult record."""
        return self.verify(
            case=case,
            workspace_path=workspace_path,
            patch=patch,
            test_command=linter_command,
            timeout_seconds=timeout_seconds,
            test_type="lint",
        )
