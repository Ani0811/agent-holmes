"""Integration tests for FastAPI REST API and WebSocket streaming."""

import json
import uuid
from unittest.mock import patch, AsyncMock
import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, select

from app.main import app
from app.database import engine
from app.models import (
    Case,
    CaseStatus,
    EvidenceItem,
    Hypothesis,
    Patch,
    TestResult,
    InvestigationEvent,
)
from app.api.connection_manager import manager


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


def test_api_health(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "tools" in data
    assert "git" in data["tools"]
    assert "ripgrep" in data["tools"]
    assert "docker" in data["tools"]


def test_create_and_get_case(client):
    with patch("app.api.cases.run_investigation_background", new_callable=AsyncMock) as mock_task:
        # 1. Create Case
        payload = {
            "repo_url": "test-repos/session-logout-demo",
            "bug_description": "Users get logged out after token refresh",
            "stack_trace": "401 Unauthorized at /api/user/profile",
        }
        res = client.post("/api/cases", json=payload)
        assert res.status_code == 201
        data = res.json()
        assert "case_id" in data
        assert data["status"] == CaseStatus.PENDING.value
        assert data["repo_url"] == payload["repo_url"]
        case_id = data["case_id"]

        # 2. List Cases
        list_res = client.get("/api/cases")
        assert list_res.status_code == 200
        cases = list_res.json()
        assert any(c["case_id"] == case_id for c in cases)

        # 3. Get Case Detail
        detail_res = client.get(f"/api/cases/{case_id}")
        assert detail_res.status_code == 200
        detail = detail_res.json()
        assert detail["case_id"] == case_id
        assert "evidence" in detail
        assert "hypotheses" in detail
        assert "patches" in detail
        assert "test_results" in detail
        assert "events" in detail


def test_case_subresources_and_report(client):
    case_id = f"test-subres-{uuid.uuid4().hex[:8]}"
    with Session(engine) as session:
        # Create Case
        c = Case(
            case_id=case_id,
            repo_url="https://github.com/example/repo",
            bug_description="Sample bug report",
            status=CaseStatus.SOLVED.value,
            root_cause="Missing session.modified = True flag in refresh handler",
        )
        session.add(c)

        # Create Evidence
        ev = EvidenceItem(
            case_id=case_id,
            file="src/auth/token_refresh.py",
            line=15,
            claim="In-place dict mutation",
            description="Mutates dict without session.modified",
        )
        session.add(ev)

        # Create Hypothesis
        hypo = Hypothesis(
            case_id=case_id,
            title="Session cookie lost",
            description="Flask skips Set-Cookie header on in-place dict modification",
            status="confirmed",
            confidence=0.95,
            evidence_ids=json.dumps([1]),
        )
        session.add(hypo)

        # Create Patch
        patch = Patch(
            case_id=case_id,
            unified_diff="--- a/file.py\n+++ b/file.py\n@@ -1 +1 @@\n-old\n+new\n",
            file_paths=json.dumps(["src/auth/token_refresh.py"]),
            status="applied",
            explanation="Added session.modified = True",
        )
        session.add(patch)

        # Create TestResult
        tr = TestResult(
            case_id=case_id,
            command="pytest",
            exit_code=0,
            passed=True,
            stdout="4 passed in 0.05s",
        )
        session.add(tr)
        session.commit()

    # 1. Test /evidence
    res_ev = client.get(f"/api/cases/{case_id}/evidence")
    assert res_ev.status_code == 200
    assert len(res_ev.json()) >= 1
    assert res_ev.json()[0]["file"] == "src/auth/token_refresh.py"

    # 2. Test /hypotheses
    res_hypo = client.get(f"/api/cases/{case_id}/hypotheses")
    assert res_hypo.status_code == 200
    assert len(res_hypo.json()) >= 1
    assert res_hypo.json()[0]["status"] == "confirmed"

    # 3. Test /patches
    res_patch = client.get(f"/api/cases/{case_id}/patches")
    assert res_patch.status_code == 200
    assert len(res_patch.json()) >= 1
    assert "--- a/file.py" in res_patch.json()[0]["unified_diff"]

    # 4. Test /results
    res_tr = client.get(f"/api/cases/{case_id}/results")
    assert res_tr.status_code == 200
    assert len(res_tr.json()) >= 1
    assert res_tr.json()[0]["passed"] is True

    # 5. Test /report
    res_rep = client.get(f"/api/cases/{case_id}/report")
    assert res_rep.status_code == 200
    report = res_rep.json()
    assert report["case_id"] == case_id
    assert report["solved"] is True
    assert report["status"] == "solved"
    assert report["winning_hypothesis"] is not None
    assert report["patch"] is not None
    assert report["verification"] is not None
    assert "session.modified" in report["root_cause"]


def test_get_nonexistent_case(client):
    res = client.get("/api/cases/nonexistent_case_999")
    assert res.status_code == 404


def test_websocket_stream_replay_and_ping(client):
    case_id = f"test-ws-{uuid.uuid4().hex[:8]}"
    with Session(engine) as session:
        # Prepopulate an event to test replay
        ev = InvestigationEvent(
            case_id=case_id,
            event_type="test_event",
            message="Initial test event for replay",
            data=json.dumps({"step": 1}),
        )
        session.add(ev)
        session.commit()

    with client.websocket_connect(f"/ws/cases/{case_id}") as ws:
        # 1. Verify historic replay event was delivered
        msg = ws.receive_json()
        assert msg["case_id"] == case_id
        assert msg["event_type"] == "test_event"
        assert msg.get("is_replay") is True
        assert msg["data"]["step"] == 1

        # 2. Verify ping / pong
        ws.send_text(json.dumps({"type": "ping"}))
        pong_msg = ws.receive_json()
        assert pong_msg["type"] == "pong"


def test_create_repo_review_case(client):
    with patch("app.api.cases.run_investigation_background", new_callable=AsyncMock) as mock_task:
        payload = {
            "repo_url": "test-repos/session-logout-demo",
            "case_type": "repo_review",
        }
        res = client.post("/api/cases", json=payload)
        assert res.status_code == 201
        data = res.json()
        assert data["case_type"] == "repo_review"
        assert "repository review" in data["bug_description"].lower()
        mock_task.assert_called_once_with(data["case_id"])

