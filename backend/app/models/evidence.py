from datetime import datetime, timezone
from typing import Optional
from sqlmodel import SQLModel, Field


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class EvidenceItem(SQLModel, table=True):
    __tablename__ = "evidence_items"

    id: Optional[int] = Field(default=None, primary_key=True)
    case_id: str = Field(foreign_key="cases.case_id", index=True)
    file: str = Field(description="Relative path of the examined file")
    line: Optional[int] = Field(default=None, description="Line number where evidence is found")
    type: str = Field(default="code_snippet", description="Evidence type: code_snippet, log, git_diff")
    claim: str = Field(description="Specific finding or factual assertion")
    description: str = Field(description="Detailed explanation of what the evidence indicates")
    confidence: float = Field(default=1.0, description="Confidence score from 0.0 to 1.0")
    code_snippet: Optional[str] = Field(default=None, description="Actual code snippet with context")
    created_at: datetime = Field(default_factory=utc_now)
