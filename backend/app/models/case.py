from datetime import datetime, timezone
from typing import Optional
from enum import Enum
from sqlmodel import SQLModel, Field


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class CaseStatus(str, Enum):
    PENDING = "pending"
    INVESTIGATING = "investigating"
    PATCHING = "patching"
    VERIFYING = "verifying"
    SOLVED = "solved"
    FAILED = "failed"


class Case(SQLModel, table=True):
    __tablename__ = "cases"

    case_id: str = Field(default=None, primary_key=True, index=True)
    repo_url: str = Field(description="Remote Git URL or local directory path")
    bug_description: str = Field(description="Description of the bug reported")
    stack_trace: Optional[str] = Field(default=None, description="Optional stack trace or error log")
    status: str = Field(default=CaseStatus.PENDING.value, index=True)
    root_cause: Optional[str] = Field(default=None, description="Identified root cause summary")
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)
