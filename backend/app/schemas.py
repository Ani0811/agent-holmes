"""Pydantic request and response schemas for Agent Holmes API."""

from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict


# ---------------------------------------------------------
# Evidence Schemas
# ---------------------------------------------------------
class EvidenceItemBase(BaseModel):
    file: str = Field(..., description="File path relative to repository root")
    line: Optional[int] = Field(None, description="Line number if relevant")
    type: str = Field("code_snippet", description="Evidence classification")
    claim: str = Field(..., description="Specific finding or factual assertion")
    description: str = Field(..., description="Detailed explanation of the evidence")
    confidence: float = Field(1.0, ge=0.0, le=1.0, description="Confidence level")
    code_snippet: Optional[str] = Field(None, description="Actual code snippet with context")


class EvidenceItemCreate(EvidenceItemBase):
    case_id: str


class EvidenceItemRead(EvidenceItemBase):
    id: int
    case_id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------
# Hypothesis Schemas
# ---------------------------------------------------------
class HypothesisBase(BaseModel):
    title: str = Field(..., description="Hypothesis summary")
    description: str = Field(..., description="Detailed failure rationale")
    status: str = Field("proposed", description="proposed, testing, confirmed, rejected")
    confidence: float = Field(0.5, ge=0.0, le=1.0)
    evidence_ids: List[int] = Field(default_factory=list, description="IDs of supporting evidence")


class HypothesisCreate(BaseModel):
    case_id: str
    title: str
    description: str
    confidence: float = 0.5
    evidence_ids: List[int] = Field(default_factory=list)


class HypothesisUpdate(BaseModel):
    status: Optional[str] = None
    confidence: Optional[float] = None
    evidence_ids: Optional[List[int]] = None
    description: Optional[str] = None


class HypothesisRead(BaseModel):
    id: int
    case_id: str
    title: str
    description: str
    status: str
    confidence: float
    evidence_ids: List[int] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------
# Patch Schemas
# ---------------------------------------------------------
class PatchBase(BaseModel):
    unified_diff: str = Field(..., description="Git unified diff string")
    file_paths: List[str] = Field(default_factory=list, description="List of modified files")
    status: str = Field("generated", description="generated, applied, verified, failed")
    attempt_number: int = Field(1, description="Patch iteration number")
    explanation: Optional[str] = Field(None, description="Why this patch fixes the bug")


class PatchCreate(PatchBase):
    case_id: str


class PatchRead(PatchBase):
    id: int
    case_id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------
# Test Result Schemas
# ---------------------------------------------------------
class TestResultBase(BaseModel):
    command: str = Field(..., description="Executed test command")
    stdout: str = Field("", description="Standard output")
    stderr: str = Field("", description="Standard error")
    exit_code: int = Field(..., description="Process exit code")
    passed: bool = Field(..., description="True if verification tests passed")
    test_type: str = Field("test", description="test, lint, build")
    duration_ms: Optional[int] = Field(None, description="Duration in ms")


class TestResultCreate(TestResultBase):
    case_id: str
    patch_id: Optional[int] = None


class TestResultRead(TestResultBase):
    id: int
    case_id: str
    patch_id: Optional[int]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------
# Investigation Event Schemas
# ---------------------------------------------------------
class InvestigationEventBase(BaseModel):
    event_type: str = Field(..., description="Event classification")
    message: str = Field(..., description="Human readable message")
    data: Optional[Dict[str, Any]] = Field(None, description="Additional structured payload")


class InvestigationEventCreate(BaseModel):
    case_id: str
    event_type: str
    message: str
    data: Optional[Dict[str, Any]] = None


class InvestigationEventRead(BaseModel):
    id: int
    case_id: str
    event_type: str
    message: str
    data: Optional[Dict[str, Any]] = None
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------
# Case Schemas
# ---------------------------------------------------------
class CaseCreate(BaseModel):
    repo_url: str = Field(..., description="Git clone URL or local repository path")
    bug_description: str = Field(..., description="Natural language description of the bug")
    stack_trace: Optional[str] = Field(None, description="Optional stack trace or error log")


class CaseRead(BaseModel):
    case_id: str
    repo_url: str
    bug_description: str
    stack_trace: Optional[str] = None
    status: str
    root_cause: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CaseDetail(CaseRead):
    evidence: List[EvidenceItemRead] = Field(default_factory=list)
    hypotheses: List[HypothesisRead] = Field(default_factory=list)
    patches: List[PatchRead] = Field(default_factory=list)
    test_results: List[TestResultRead] = Field(default_factory=list)
    events: List[InvestigationEventRead] = Field(default_factory=list)


class CaseReport(BaseModel):
    case_id: str
    status: str
    root_cause: Optional[str] = None
    repo_url: str
    bug_description: str
    key_evidence: List[EvidenceItemRead] = Field(default_factory=list)
    winning_hypothesis: Optional[HypothesisRead] = None
    patch: Optional[PatchRead] = None
    verification: Optional[TestResultRead] = None
    summary: str
    solved: bool
