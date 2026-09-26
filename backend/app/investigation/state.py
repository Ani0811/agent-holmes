"""Investigation state and phase tracking definitions."""

from dataclasses import dataclass, field
from enum import Enum
from typing import List, Dict, Any, Optional
from app.models import EvidenceItem, Hypothesis, Patch, TestResult


class InvestigationPhase(str, Enum):
    DISCOVERY = "discovery"
    SEARCH = "search"
    EVIDENCE = "evidence"
    HYPOTHESIS = "hypothesis"
    TESTING = "testing"
    ROOT_CAUSE = "root_cause"
    PATCH = "patch"
    VERIFY = "verify"
    REPORT = "report"


@dataclass
class InvestigationState:
    """Stateful tracking container for a live bug investigation."""

    case_id: str
    repo_url: str
    bug_description: str
    stack_trace: Optional[str] = None
    phase: InvestigationPhase = InvestigationPhase.DISCOVERY
    status: str = "pending"

    # Accumulated knowledge & artifacts
    files_examined: List[str] = field(default_factory=list)
    evidence: List[EvidenceItem] = field(default_factory=list)
    hypotheses: List[Hypothesis] = field(default_factory=list)
    commands_executed: List[Dict[str, Any]] = field(default_factory=list)
    patches: List[Patch] = field(default_factory=list)
    test_results: List[TestResult] = field(default_factory=list)

    # Resolution
    root_cause_summary: Optional[str] = None
    winning_hypothesis_id: Optional[int] = None
    current_step: int = 0
    max_steps: int = 50
    patch_attempt: int = 0
    max_patch_attempts: int = 3
    is_solved: bool = False
