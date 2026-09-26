"""Evidence Store managing persistence and queries for investigation findings."""

import json
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from sqlmodel import Session, select

from app.models import (
    Case,
    EvidenceItem,
    Hypothesis,
    Patch,
    TestResult,
    InvestigationEvent,
)


class EvidenceStore:
    """Manages transactional persistence for evidence, hypotheses, patches, and events."""

    def __init__(self, session: Session):
        self.session = session

    def get_case(self, case_id: str) -> Optional[Case]:
        return self.session.get(Case, case_id)

    def update_case_status(
        self,
        case_id: str,
        status: str,
        root_cause: Optional[str] = None,
    ) -> Optional[Case]:
        case = self.get_case(case_id)
        if case:
            case.status = status
            if root_cause is not None:
                case.root_cause = root_cause
            case.updated_at = datetime.now(timezone.utc)
            self.session.add(case)
            self.session.commit()
            self.session.refresh(case)
        return case

    def add_evidence(
        self,
        case_id: str,
        file: str,
        claim: str,
        description: str,
        line: Optional[int] = None,
        type: str = "code_snippet",
        confidence: float = 1.0,
        code_snippet: Optional[str] = None,
    ) -> EvidenceItem:
        evidence = EvidenceItem(
            case_id=case_id,
            file=file,
            line=line,
            type=type,
            claim=claim,
            description=description,
            confidence=confidence,
            code_snippet=code_snippet,
        )
        self.session.add(evidence)
        self.session.commit()
        self.session.refresh(evidence)
        return evidence

    def get_evidence_for_case(self, case_id: str) -> List[EvidenceItem]:
        query = select(EvidenceItem).where(EvidenceItem.case_id == case_id).order_by(EvidenceItem.id)
        return list(self.session.exec(query).all())

    def add_hypothesis(
        self,
        case_id: str,
        title: str,
        description: str,
        confidence: float = 0.5,
        evidence_ids: Optional[List[int]] = None,
        status: str = "proposed",
    ) -> Hypothesis:
        hypothesis = Hypothesis(
            case_id=case_id,
            title=title,
            description=description,
            confidence=confidence,
            evidence_ids=json.dumps(evidence_ids or []),
            status=status,
        )
        self.session.add(hypothesis)
        self.session.commit()
        self.session.refresh(hypothesis)
        return hypothesis

    def update_hypothesis(
        self,
        hypothesis_id: int,
        status: Optional[str] = None,
        confidence: Optional[float] = None,
        description: Optional[str] = None,
    ) -> Optional[Hypothesis]:
        hypothesis = self.session.get(Hypothesis, hypothesis_id)
        if hypothesis:
            if status is not None:
                hypothesis.status = status
            if confidence is not None:
                hypothesis.confidence = confidence
            if description is not None:
                hypothesis.description = description
            hypothesis.updated_at = datetime.now(timezone.utc)
            self.session.add(hypothesis)
            self.session.commit()
            self.session.refresh(hypothesis)
        return hypothesis

    def get_hypotheses_for_case(self, case_id: str) -> List[Hypothesis]:
        query = select(Hypothesis).where(Hypothesis.case_id == case_id).order_by(Hypothesis.id)
        return list(self.session.exec(query).all())

    def record_patch(
        self,
        case_id: str,
        unified_diff: str,
        file_paths: Optional[List[str]] = None,
        status: str = "generated",
        attempt_number: int = 1,
        explanation: Optional[str] = None,
    ) -> Patch:
        patch = Patch(
            case_id=case_id,
            unified_diff=unified_diff,
            file_paths=json.dumps(file_paths or []),
            status=status,
            attempt_number=attempt_number,
            explanation=explanation,
        )
        self.session.add(patch)
        self.session.commit()
        self.session.refresh(patch)
        return patch

    def get_patches_for_case(self, case_id: str) -> List[Patch]:
        query = select(Patch).where(Patch.case_id == case_id).order_by(Patch.id)
        return list(self.session.exec(query).all())

    def record_test_result(
        self,
        case_id: str,
        command: str,
        exit_code: int,
        passed: bool,
        stdout: str = "",
        stderr: str = "",
        patch_id: Optional[int] = None,
        test_type: str = "test",
        duration_ms: Optional[int] = None,
    ) -> TestResult:
        result = TestResult(
            case_id=case_id,
            patch_id=patch_id,
            command=command,
            stdout=stdout,
            stderr=stderr,
            exit_code=exit_code,
            passed=passed,
            test_type=test_type,
            duration_ms=duration_ms,
        )
        self.session.add(result)
        self.session.commit()
        self.session.refresh(result)
        return result

    def get_test_results_for_case(self, case_id: str) -> List[TestResult]:
        query = select(TestResult).where(TestResult.case_id == case_id).order_by(TestResult.id)
        return list(self.session.exec(query).all())

    def record_event(
        self,
        case_id: str,
        event_type: str,
        message: str,
        data: Optional[Dict[str, Any]] = None,
    ) -> InvestigationEvent:
        event = InvestigationEvent(
            case_id=case_id,
            event_type=event_type,
            message=message,
            data=json.dumps(data) if data is not None else None,
        )
        self.session.add(event)
        self.session.commit()
        self.session.refresh(event)
        return event

    def get_events_for_case(self, case_id: str) -> List[InvestigationEvent]:
        query = select(InvestigationEvent).where(InvestigationEvent.case_id == case_id).order_by(InvestigationEvent.id)
        return list(self.session.exec(query).all())
