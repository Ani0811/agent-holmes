from datetime import datetime, timezone
from typing import Optional
from sqlmodel import SQLModel, Field


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class TestResult(SQLModel, table=True):
    __tablename__ = "test_results"
    __test__ = False  # Prevent pytest from treating this model as a test suite

    id: Optional[int] = Field(default=None, primary_key=True)
    case_id: str = Field(foreign_key="cases.case_id", index=True)
    patch_id: Optional[int] = Field(default=None, foreign_key="patches.id", index=True)
    command: str = Field(description="Test execution command executed")
    stdout: str = Field(default="", description="Standard output from process")
    stderr: str = Field(default="", description="Standard error from process")
    exit_code: int = Field(description="Return code from test execution")
    passed: bool = Field(description="Whether tests passed cleanly")
    test_type: str = Field(default="test", description="Type: test, lint, build")
    duration_ms: Optional[int] = Field(default=None, description="Execution duration in milliseconds")
    created_at: datetime = Field(default_factory=utc_now)
