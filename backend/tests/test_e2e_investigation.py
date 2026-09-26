"""End-to-End integration test validating the entire Agent Holmes lifecycle."""

import asyncio
import json
import uuid
import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, select

from app.main import app
from app.database import engine
from app.models import Case, CaseStatus, TestResult
from app.api.cases import run_investigation_background


@pytest.mark.asyncio
async def test_full_e2e_investigation_flow():
    """Run full E2E flow on the demo repository and verify all 12 DoD criteria."""
    case_id = f"case_e2e_{uuid.uuid4().hex[:8]}"
    demo_repo = "c:/GitHub/agent-holmes/test-repos/session-logout-demo"

    # 1. Direct DB creation of initial case
    with Session(engine) as session:
        case = Case(
            case_id=case_id,
            repo_url=demo_repo,
            bug_description="Users report getting logged out after token refresh",
            stack_trace="401 Unauthorized at /api/user/profile",
            status=CaseStatus.PENDING.value,
        )
        session.add(case)
        session.commit()

    # 2. Run the investigation background pipeline directly
    await run_investigation_background(case_id)

    # 3. Verify Database state & outcomes
    with Session(engine) as session:
        final_case = session.get(Case, case_id)
        assert final_case is not None
        assert final_case.status == CaseStatus.SOLVED.value
        assert final_case.root_cause is not None

        # Confirm verified passing test exists
        test_results = session.exec(
            select(TestResult).where(TestResult.case_id == case_id)
        ).all()
        assert len(test_results) > 0
        assert any(tr.passed for tr in test_results)

    # 4. Verify REST API outputs through TestClient
    with TestClient(app) as client:
        # Case detail
        detail_res = client.get(f"/api/cases/{case_id}")
        assert detail_res.status_code == 200
        detail = detail_res.json()
        assert detail["status"] == "solved"
        assert len(detail["evidence"]) >= 1
        assert len(detail["hypotheses"]) >= 1
        assert len(detail["patches"]) >= 1

        # Case report
        rep_res = client.get(f"/api/cases/{case_id}/report")
        assert rep_res.status_code == 200
        report = rep_res.json()
        assert report["solved"] is True
        assert report["patch"] is not None
        assert "session.modified" in report["patch"]["unified_diff"]
        assert report["verification"]["passed"] is True
        assert "4 passed" in report["verification"]["stdout"]

        # WebSocket historical replay
        with client.websocket_connect(f"/ws/cases/{case_id}") as ws:
            first_msg = ws.receive_json()
            assert first_msg["case_id"] == case_id
            assert first_msg.get("is_replay") is True
