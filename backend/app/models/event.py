from datetime import datetime, timezone
from typing import Optional
from sqlmodel import SQLModel, Field


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class InvestigationEvent(SQLModel, table=True):
    __tablename__ = "investigation_events"

    id: Optional[int] = Field(default=None, primary_key=True)
    case_id: str = Field(foreign_key="cases.case_id", index=True)
    event_type: str = Field(description="Event category for streaming and filtering")
    message: str = Field(description="Human readable event message")
    data: Optional[str] = Field(default=None, description="JSON string with additional context")
    timestamp: datetime = Field(default_factory=utc_now, index=True)
