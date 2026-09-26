import json
from sqlmodel import Session, select
from app.database import engine, create_db_and_tables
from app.models import (
    Case,
    CaseStatus,
    EvidenceItem,
    Hypothesis,
    HypothesisStatus,
    Patch,
    PatchStatus,
    TestResult,
    InvestigationEvent,
)
from app.schemas import CaseReport, CaseDetail, EvidenceItemRead, HypothesisRead


def test_database_and_models():
    from sqlmodel import SQLModel, create_engine
    test_engine = create_engine("sqlite:///:memory:")
    SQLModel.metadata.create_all(test_engine)

    case_id = "test-case-001"

    with Session(test_engine) as session:

        # 2. Create Case
        case = Case(
            case_id=case_id,
            repo_url="https://github.com/example/repo.git",
            bug_description="User gets logged out after token refresh",
            stack_trace="Traceback (most recent call last):\n  File 'app.py'...",
            status=CaseStatus.INVESTIGATING.value,
        )
        session.add(case)
        session.commit()
        session.refresh(case)

        assert case.case_id == case_id
        assert case.status == "investigating"

        # 3. Create EvidenceItem
        evidence = EvidenceItem(
            case_id=case_id,
            file="src/auth/token_refresh.py",
            line=42,
            type="code_snippet",
            claim="session.modified flag is never set to True",
            description="When session dictionary is modified without setting modified flag, cookie is not re-issued",
            confidence=0.95,
            code_snippet="session['token'] = new_token",
        )
        session.add(evidence)
        session.commit()
        session.refresh(evidence)

        assert evidence.id is not None
        assert evidence.file == "src/auth/token_refresh.py"

        # 4. Create Hypothesis
        hypothesis = Hypothesis(
            case_id=case_id,
            title="Missing session.modified update on refresh",
            description="Flask session requires session.modified = True for in-place mutations",
            status=HypothesisStatus.CONFIRMED.value,
            confidence=0.98,
            evidence_ids=json.dumps([evidence.id]),
        )
        session.add(hypothesis)
        session.commit()
        session.refresh(hypothesis)

        assert hypothesis.id is not None
        assert hypothesis.status == "confirmed"

        # 5. Create Patch
        diff_str = (
            "--- a/src/auth/token_refresh.py\n"
            "+++ b/src/auth/token_refresh.py\n"
            "@@ -42,1 +42,2 @@\n"
            " session['token'] = new_token\n"
            "+session.modified = True\n"
        )
        patch = Patch(
            case_id=case_id,
            unified_diff=diff_str,
            file_paths=json.dumps(["src/auth/token_refresh.py"]),
            status=PatchStatus.VERIFIED.value,
            attempt_number=1,
            explanation="Explicitly set session.modified = True so Flask sends updated Set-Cookie header.",
        )
        session.add(patch)
        session.commit()
        session.refresh(patch)

        assert patch.id is not None
        assert patch.status == "verified"

        # 6. Create TestResult
        test_result = TestResult(
            case_id=case_id,
            patch_id=patch.id,
            command="pytest tests/test_session.py",
            stdout="tests/test_session.py::test_session_refresh PASSED [100%]\n1 passed in 0.04s",
            stderr="",
            exit_code=0,
            passed=True,
            test_type="test",
            duration_ms=42,
        )
        session.add(test_result)
        session.commit()
        session.refresh(test_result)

        assert test_result.passed is True
        assert test_result.exit_code == 0

        # 7. Create InvestigationEvent
        event = InvestigationEvent(
            case_id=case_id,
            event_type="evidence_found",
            message="Found unflagged session mutation in token_refresh.py:42",
            data=json.dumps({"file": evidence.file, "line": evidence.line}),
        )
        session.add(event)
        session.commit()
        session.refresh(event)

        assert event.id is not None
        assert event.event_type == "evidence_found"

        # 8. Query and verify relations
        evidences = session.exec(select(EvidenceItem).where(EvidenceItem.case_id == case_id)).all()
        assert len(evidences) == 1

        hypotheses = session.exec(select(Hypothesis).where(Hypothesis.case_id == case_id)).all()
        assert len(hypotheses) == 1

        patches = session.exec(select(Patch).where(Patch.case_id == case_id)).all()
        assert len(patches) == 1

        # 9. Verify Pydantic schema mapping
        ev_read = EvidenceItemRead.model_validate(evidence)
        assert ev_read.file == "src/auth/token_refresh.py"

        hypo_read = HypothesisRead(
            id=hypothesis.id,
            case_id=hypothesis.case_id,
            title=hypothesis.title,
            description=hypothesis.description,
            status=hypothesis.status,
            confidence=hypothesis.confidence,
            evidence_ids=json.loads(hypothesis.evidence_ids),
            created_at=hypothesis.created_at,
            updated_at=hypothesis.updated_at,
        )
        assert hypo_read.evidence_ids == [evidence.id]
