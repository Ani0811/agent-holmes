from datetime import datetime, timezone
from typing import Optional
from enum import Enum
from sqlmodel import SQLModel, Field


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class PatchStatus(str, Enum):
    GENERATED = "generated"
    APPLIED = "applied"
    VERIFIED = "verified"
    FAILED = "failed"


class Patch(SQLModel, table=True):
    __tablename__ = "patches"

    id: Optional[int] = Field(default=None, primary_key=True)
    case_id: str = Field(foreign_key="cases.case_id", index=True)
    unified_diff: str = Field(description="Unified git diff patch")
    file_paths: str = Field(default="[]", description="JSON list of touched file paths")
    status: str = Field(default=PatchStatus.GENERATED.value, index=True)
    attempt_number: int = Field(default=1, description="Attempt count (max 3)")
    explanation: Optional[str] = Field(default=None, description="Rationale for the fix")
    created_at: datetime = Field(default_factory=utc_now)
