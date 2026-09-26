from datetime import datetime, timezone
from typing import Optional
from enum import Enum
from sqlmodel import SQLModel, Field


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class HypothesisStatus(str, Enum):
    PROPOSED = "proposed"
    TESTING = "testing"
    CONFIRMED = "confirmed"
    REJECTED = "rejected"


class Hypothesis(SQLModel, table=True):
    __tablename__ = "hypotheses"

    id: Optional[int] = Field(default=None, primary_key=True)
    case_id: str = Field(foreign_key="cases.case_id", index=True)
    title: str = Field(description="Short summary of the bug hypothesis")
    description: str = Field(description="Detailed rationale and mechanism of the hypothesized failure")
    status: str = Field(default=HypothesisStatus.PROPOSED.value, index=True)
    confidence: float = Field(default=0.5, description="Confidence score from 0.0 to 1.0")
    evidence_ids: str = Field(default="[]", description="JSON list of related EvidenceItem IDs")
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)
