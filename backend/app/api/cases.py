"""Cases router providing REST endpoints for case lifecycle, artifacts, and reports."""

import json
import logging
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from sqlmodel import Session, select

from app.config import settings
from app.database import get_session, engine
from app.models import (
    Case,
    CaseStatus,
    EvidenceItem,
    Hypothesis,
    Patch,
    TestResult,
    InvestigationEvent,
)
from app.schemas import (
    CaseCreate,
    CaseRead,
    CaseDetail,
    CaseReport,
    EvidenceItemRead,
    HypothesisRead,
    PatchRead,
    TestResultRead,
    InvestigationEventRead,
)
from app.repository.manager import RepositoryManager
from app.ai.bob_provider import BobProvider
from app.investigation.engine import InvestigationEngine
from app.investigation.evidence_store import EvidenceStore
from app.api.connection_manager import manager

logger = logging.getLogger("holmes.api.cases")

router = APIRouter(prefix="/cases", tags=["cases"])


# ---------------------------------------------------------
# Serialization Helpers
# ---------------------------------------------------------
def to_hypothesis_read(h: Hypothesis) -> HypothesisRead:
    evidence_ids = json.loads(h.evidence_ids) if isinstance(h.evidence_ids, str) else (h.evidence_ids or [])
    return HypothesisRead(
        id=h.id,  # type: ignore
        case_id=h.case_id,
        title=h.title,
        description=h.description,
        status=h.status,
        confidence=h.confidence,
        evidence_ids=evidence_ids,
        created_at=h.created_at,
        updated_at=h.updated_at,
    )


def to_patch_read(p: Patch) -> PatchRead:
    file_paths = json.loads(p.file_paths) if isinstance(p.file_paths, str) else (p.file_paths or [])
    return PatchRead(
        id=p.id,  # type: ignore
        case_id=p.case_id,
        unified_diff=p.unified_diff,
        file_paths=file_paths,
        status=p.status,
        attempt_number=p.attempt_number,
        explanation=p.explanation,
        created_at=p.created_at,
    )


def to_event_read(ev: InvestigationEvent) -> InvestigationEventRead:
    parsed_data = json.loads(ev.data) if isinstance(ev.data, str) else (ev.data or None)
    return InvestigationEventRead(
        id=ev.id,  # type: ignore
        case_id=ev.case_id,
        event_type=ev.event_type,
        message=ev.message,
        data=parsed_data,
        timestamp=ev.timestamp,
    )


async def run_investigation_background(case_id: str):
    """Background task driving the autonomous investigation loop for a case."""
    logger.info(f"Launching background investigation task for case {case_id}")
    try:
        with Session(engine) as session:
            case = session.get(Case, case_id)
            if not case:
                logger.error(f"Cannot run investigation: Case {case_id} not found in database.")
                return

            repo_manager = RepositoryManager(
                case_id=case_id,
                repo_url_or_path=case.repo_url,
                workspaces_dir=settings.WORKSPACES_DIR,
            )
            ai_provider = BobProvider()
            evidence_store = EvidenceStore(session=session)
            queue = manager.get_or_create_queue(case_id)

            investigation_engine = InvestigationEngine(
                case=case,
                repo_manager=repo_manager,
                ai_provider=ai_provider,
                evidence_store=evidence_store,
                event_queue=queue,
            )

            await investigation_engine.run()
            logger.info(f"Background investigation task completed for case {case_id}")
    except Exception as e:
        logger.exception(f"Fatal error in background investigation for case {case_id}: {e}")


# ---------------------------------------------------------
# REST Endpoints
# ---------------------------------------------------------
@router.post("", response_model=CaseRead, status_code=status.HTTP_201_CREATED)
async def create_case(
    payload: CaseCreate,
    background_tasks: BackgroundTasks,
    session: Session = Depends(get_session),
):
    """Create a new bug investigation or repo review case and trigger background investigation."""
    case_id = f"case_{uuid.uuid4().hex[:10]}"
    case_type = payload.case_type or "bug_fix"
    bug_description = (payload.bug_description or "").strip()
    if not bug_description:
        if case_type == "repo_review":
            bug_description = "Full repository review: architecture, code quality, security audit, and test suite verification."
        else:
            bug_description = "Unspecified issue investigation"

    case = Case(
        case_id=case_id,
        repo_url=payload.repo_url,
        bug_description=bug_description,
        case_type=case_type,
        stack_trace=payload.stack_trace,
        status=CaseStatus.PENDING.value,
    )
    session.add(case)
    session.commit()
    session.refresh(case)

    # Launch autonomous investigation pipeline in background
    background_tasks.add_task(run_investigation_background, case_id)

    return case


@router.get("", response_model=List[CaseRead])
def list_cases(session: Session = Depends(get_session)):
    """List all registered cases ordered by creation date descending."""
    query = select(Case).order_by(Case.created_at.desc())  # type: ignore
    return list(session.exec(query).all())


@router.get("/{case_id}", response_model=CaseDetail)
def get_case(case_id: str, session: Session = Depends(get_session)):
    """Get full case details including all evidence, hypotheses, patches, and events."""
    case = session.get(Case, case_id)
    if not case:
        raise HTTPException(status_code=404, detail=f"Case '{case_id}' not found")

    evidence = session.exec(select(EvidenceItem).where(EvidenceItem.case_id == case_id).order_by(EvidenceItem.id)).all()
    hypotheses = session.exec(select(Hypothesis).where(Hypothesis.case_id == case_id).order_by(Hypothesis.id)).all()
    patches = session.exec(select(Patch).where(Patch.case_id == case_id).order_by(Patch.id)).all()
    test_results = session.exec(select(TestResult).where(TestResult.case_id == case_id).order_by(TestResult.id)).all()
    events = session.exec(select(InvestigationEvent).where(InvestigationEvent.case_id == case_id).order_by(InvestigationEvent.id)).all()

    return CaseDetail(
        case_id=case.case_id,
        repo_url=case.repo_url,
        bug_description=case.bug_description,
        stack_trace=case.stack_trace,
        status=case.status,
        root_cause=case.root_cause,
        created_at=case.created_at,
        updated_at=case.updated_at,
        evidence=[EvidenceItemRead.model_validate(e) for e in evidence],
        hypotheses=[to_hypothesis_read(h) for h in hypotheses],
        patches=[to_patch_read(p) for p in patches],
        test_results=[TestResultRead.model_validate(tr) for tr in test_results],
        events=[to_event_read(ev) for ev in events],
    )


@router.get("/{case_id}/evidence", response_model=List[EvidenceItemRead])
def get_case_evidence(case_id: str, session: Session = Depends(get_session)):
    """List all evidence collected for a case."""
    case = session.get(Case, case_id)
    if not case:
        raise HTTPException(status_code=404, detail=f"Case '{case_id}' not found")
    items = session.exec(select(EvidenceItem).where(EvidenceItem.case_id == case_id).order_by(EvidenceItem.id)).all()
    return [EvidenceItemRead.model_validate(e) for e in items]


@router.get("/{case_id}/hypotheses", response_model=List[HypothesisRead])
def get_case_hypotheses(case_id: str, session: Session = Depends(get_session)):
    """List all hypotheses evaluated for a case."""
    case = session.get(Case, case_id)
    if not case:
        raise HTTPException(status_code=404, detail=f"Case '{case_id}' not found")
    items = session.exec(select(Hypothesis).where(Hypothesis.case_id == case_id).order_by(Hypothesis.id)).all()
    return [to_hypothesis_read(h) for h in items]


@router.get("/{case_id}/patches", response_model=List[PatchRead])
def get_case_patches(case_id: str, session: Session = Depends(get_session)):
    """List all code patches generated for a case."""
    case = session.get(Case, case_id)
    if not case:
        raise HTTPException(status_code=404, detail=f"Case '{case_id}' not found")
    items = session.exec(select(Patch).where(Patch.case_id == case_id).order_by(Patch.id)).all()
    return [to_patch_read(p) for p in items]


@router.get("/{case_id}/results", response_model=List[TestResultRead])
def get_case_test_results(case_id: str, session: Session = Depends(get_session)):
    """List all test execution outcomes for a case."""
    case = session.get(Case, case_id)
    if not case:
        raise HTTPException(status_code=404, detail=f"Case '{case_id}' not found")
    items = session.exec(select(TestResult).where(TestResult.case_id == case_id).order_by(TestResult.id)).all()
    return [TestResultRead.model_validate(tr) for tr in items]


@router.get("/{case_id}/report", response_model=CaseReport)
def get_case_report(case_id: str, session: Session = Depends(get_session)):
    """Assemble final resolution report for the Resolution screen."""
    case = session.get(Case, case_id)
    if not case:
        raise HTTPException(status_code=404, detail=f"Case '{case_id}' not found")

    evidence = list(session.exec(select(EvidenceItem).where(EvidenceItem.case_id == case_id).order_by(EvidenceItem.id)).all())
    hypotheses = list(session.exec(select(Hypothesis).where(Hypothesis.case_id == case_id).order_by(Hypothesis.id)).all())
    patches = list(session.exec(select(Patch).where(Patch.case_id == case_id).order_by(Patch.id)).all())
    test_results = list(session.exec(select(TestResult).where(TestResult.case_id == case_id).order_by(TestResult.id)).all())

    # Find confirmed hypothesis or highest confidence
    winning_hypo = next(
        (h for h in hypotheses if h.status == "confirmed"),
        hypotheses[-1] if hypotheses else None,
    )

    # Latest applied patch
    latest_patch = next(
        (p for p in reversed(patches) if p.status in ("applied", "verified")),
        patches[-1] if patches else None,
    )

    # Verification result with passed test
    latest_test = next(
        (tr for tr in reversed(test_results) if tr.passed),
        test_results[-1] if test_results else None,
    )

    is_solved = (case.status == CaseStatus.SOLVED.value)
    if getattr(case, "case_type", "bug_fix") != "repo_review":
        is_solved = is_solved and (latest_test is not None and latest_test.passed)

    summary_text = (
        case.root_cause
        or (winning_hypo.description if winning_hypo else ("Repository review completed successfully." if getattr(case, "case_type", "bug_fix") == "repo_review" else "Investigation concluded."))
    )

    return CaseReport(
        case_id=case.case_id,
        status=case.status,
        case_type=getattr(case, "case_type", "bug_fix") or "bug_fix",
        root_cause=case.root_cause,
        repo_url=case.repo_url,
        bug_description=case.bug_description,
        key_evidence=[EvidenceItemRead.model_validate(e) for e in evidence],
        winning_hypothesis=to_hypothesis_read(winning_hypo) if winning_hypo else None,
        patch=to_patch_read(latest_patch) if latest_patch else None,
        verification=TestResultRead.model_validate(latest_test) if latest_test else None,
        summary=summary_text,
        solved=is_solved,
    )
