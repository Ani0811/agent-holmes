import asyncio
from pathlib import Path
import pytest
from sqlmodel import SQLModel, create_engine, Session

from app.models import Case, CaseStatus
from app.repository import RepositoryManager
from app.ai import BobProvider
from app.investigation import InvestigationEngine, EvidenceStore, InvestigationPhase


@pytest.fixture
def investigation_setup(tmp_path):
    workspaces_dir = tmp_path / "workspaces"
    project_root = Path(__file__).resolve().parent.parent.parent
    demo_repo = project_root / "test-repos" / "session-logout-demo"
    case_id = "test-case-engine-001"

    # In-memory SQLite database
    engine = create_engine("sqlite:///:memory:")
    SQLModel.metadata.create_all(engine)
    session = Session(engine)

    # Initial Case row
    case = Case(
        case_id=case_id,
        repo_url=str(demo_repo),
        bug_description="Users report getting logged out after token refresh",
        stack_trace="401 Unauthorized on /api/user/profile",
        status=CaseStatus.PENDING.value,
    )
    session.add(case)
    session.commit()
    session.refresh(case)

    repo_manager = RepositoryManager(
        case_id=case_id,
        repo_url_or_path=str(demo_repo),
        workspaces_dir=workspaces_dir,
    )

    evidence_store = EvidenceStore(session=session)
    event_queue = asyncio.Queue()
    ai_provider = BobProvider()

    yield {
        "case": case,
        "repo_manager": repo_manager,
        "evidence_store": evidence_store,
        "event_queue": event_queue,
        "ai_provider": ai_provider,
        "session": session,
    }

    session.close()


def test_evidence_store_crud(investigation_setup):
    store = investigation_setup["evidence_store"]
    case_id = investigation_setup["case"].case_id

    # 1. Add evidence
    ev = store.add_evidence(
        case_id=case_id,
        file="src/auth/token_refresh.py",
        line=15,
        claim="Missing session.modified",
        description="Cookie omitted on refresh",
    )
    assert ev.id is not None

    items = store.get_evidence_for_case(case_id)
    assert len(items) == 1
    assert items[0].file == "src/auth/token_refresh.py"

    # 2. Add hypothesis
    hypo = store.add_hypothesis(
        case_id=case_id,
        title="Session cookie bug",
        description="Missing modified flag",
        evidence_ids=[ev.id],
    )
    assert hypo.id is not None
    assert hypo.status == "proposed"

    # 3. Update hypothesis
    updated = store.update_hypothesis(hypo.id, status="confirmed", confidence=0.99)
    assert updated.status == "confirmed"
    assert updated.confidence == 0.99

    # 4. Record event
    event = store.record_event(case_id, "test_event", "Test message")
    assert event.id is not None
    events = store.get_events_for_case(case_id)
    assert len(events) == 1


@pytest.mark.asyncio
async def test_investigation_engine_full_run(investigation_setup):
    case = investigation_setup["case"]
    repo_manager = investigation_setup["repo_manager"]
    ai_provider = investigation_setup["ai_provider"]
    evidence_store = investigation_setup["evidence_store"]
    event_queue = investigation_setup["event_queue"]

    engine = InvestigationEngine(
        case=case,
        repo_manager=repo_manager,
        ai_provider=ai_provider,
        evidence_store=evidence_store,
        event_queue=event_queue,
        max_steps=15,
    )

    final_state = await engine.run()

    # 1. Verification of final state
    assert final_state.is_solved is True
    assert final_state.status == CaseStatus.SOLVED.value
    assert final_state.phase == InvestigationPhase.REPORT
    assert final_state.root_cause_summary is not None

    # 2. Verification of database updates
    updated_case = evidence_store.get_case(case.case_id)
    assert updated_case.status == CaseStatus.SOLVED.value
    assert updated_case.root_cause is not None

    # 3. Verification of event stream
    events = evidence_store.get_events_for_case(case.case_id)
    assert len(events) >= 5
    event_types = [e.event_type for e in events]
    assert "phase_change" in event_types
    assert "case_solved" in event_types

    # 4. Verification that event_queue received items for WebSockets
    queued_events = []
    while not event_queue.empty():
        queued_events.append(await event_queue.get())

    assert len(queued_events) >= 5
    assert any(qe["event_type"] == "case_solved" for qe in queued_events)
