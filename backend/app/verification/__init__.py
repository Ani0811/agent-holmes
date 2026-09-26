"""Verification package for Agent Holmes.

Provides execution backends (Docker and Subprocess) and the VerificationEngine
for validating patches against automated test suites and linters.
"""

from app.verification.executor import (
    BaseExecutor,
    SubprocessExecutor,
    DockerExecutor,
    ExecutionResult,
)
from app.verification.engine import (
    VerificationEngine,
    VerificationStatus,
    is_docker_available,
)

__all__ = [
    "BaseExecutor",
    "SubprocessExecutor",
    "DockerExecutor",
    "ExecutionResult",
    "VerificationEngine",
    "VerificationStatus",
    "is_docker_available",
]
