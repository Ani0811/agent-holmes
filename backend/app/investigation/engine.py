"""Investigation Engine orchestrating the multi-phase bug investigation workflow."""

import asyncio
import logging
from typing import Optional, Dict, Any

from app.models import Case, CaseStatus
from app.repository.manager import RepositoryManager
from app.ai.base import AIProvider
from app.ai.tools import ToolExecutionContext
from app.investigation.state import InvestigationState, InvestigationPhase
from app.investigation.evidence_store import EvidenceStore

logger = logging.getLogger("holmes.investigation.engine")


class InvestigationEngine:
    """Stateful orchestrator driving Agent Holmes through all investigation phases."""

    def __init__(
        self,
        case: Case,
        repo_manager: RepositoryManager,
        ai_provider: AIProvider,
        evidence_store: EvidenceStore,
        event_queue: Optional[asyncio.Queue] = None,
        max_patch_attempts: int = 3,
        max_steps: int = 30,
    ):
        self.case = case
        self.repo_manager = repo_manager
        self.ai_provider = ai_provider
        self.evidence_store = evidence_store
        self.event_queue = event_queue
        self.max_patch_attempts = max_patch_attempts
        self.max_steps = max_steps

        case_type = getattr(case, "case_type", "bug_fix") or "bug_fix"
        self.state = InvestigationState(
            case_id=case.case_id,
            repo_url=case.repo_url,
            bug_description=case.bug_description,
            stack_trace=case.stack_trace,
            case_type=case_type,
            phase=InvestigationPhase.DISCOVERY,
            status=CaseStatus.PENDING.value,
            max_steps=max_steps,
            max_patch_attempts=max_patch_attempts,
        )

    async def emit_event(
        self,
        event_type: str,
        message: str,
        data: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Persist investigation event to database and broadcast to real-time event queue."""
        event = self.evidence_store.record_event(
            case_id=self.case.case_id,
            event_type=event_type,
            message=message,
            data=data,
        )

        if self.event_queue:
            payload = {
                "id": event.id,
                "case_id": self.case.case_id,
                "event_type": event_type,
                "message": message,
                "data": data,
                "timestamp": event.timestamp.isoformat(),
            }
            await self.event_queue.put(payload)

    async def transition_phase(
        self,
        new_phase: InvestigationPhase,
        message: str,
    ) -> None:
        """Transition workflow to a new phase and emit notification."""
        self.state.phase = new_phase
        logger.info(f"[{self.case.case_id}] Phase transition -> {new_phase.value.upper()}: {message}")
        await self.emit_event(
            event_type="phase_change",
            message=f"[{new_phase.value.upper()}] {message}",
            data={"phase": new_phase.value},
        )

    async def run(self) -> InvestigationState:
        """Execute the complete stateful investigation pipeline."""
        case_id = self.case.case_id
        logger.info(f"Starting investigation for case {case_id}")

        # Update case status to investigating
        self.evidence_store.update_case_status(case_id, CaseStatus.INVESTIGATING.value)
        self.state.status = CaseStatus.INVESTIGATING.value

        try:
            # 1. DISCOVERY PHASE
            await self.transition_phase(
                InvestigationPhase.DISCOVERY,
                "Cloning and isolating repository in secure workspace sandbox.",
            )
            self.repo_manager.setup_workspace()
            file_list = self.repo_manager.list_files()
            await self.emit_event(
                "repo_scanned",
                f"Workspace ready. Indexed {file_list.total_count} files in repository.",
                {"total_files": file_list.total_count},
            )

            # 2. SEARCH & INVESTIGATION PHASES
            is_review = (self.state.case_type == "repo_review")
            search_msg = (
                "Auditing codebase structure, architecture, and code quality."
                if is_review
                else "Searching codebase for symbols, routes, and logic related to bug report."
            )
            await self.transition_phase(
                InvestigationPhase.SEARCH,
                search_msg,
            )

            tool_ctx = ToolExecutionContext(
                case_id=case_id,
                repo_manager=self.repo_manager,
                db_session=self.evidence_store.session,
                emit_event=self.emit_event,
            )

            # Drive the agentic loop through Bob AI Provider
            agent_result = await self.ai_provider.run_agentic_loop(
                context=tool_ctx,
                bug_description=self.case.bug_description,
                stack_trace=self.case.stack_trace,
                case_type=self.state.case_type,
                max_steps=self.max_steps,
            )

            # Sync state with persisted data
            self.state.evidence = self.evidence_store.get_evidence_for_case(case_id)
            self.state.hypotheses = self.evidence_store.get_hypotheses_for_case(case_id)
            self.state.patches = self.evidence_store.get_patches_for_case(case_id)
            self.state.test_results = self.evidence_store.get_test_results_for_case(case_id)
            self.state.current_step = agent_result.get("steps_taken", 0)

            # 3. VERIFICATION & RESOLUTION
            tests_passed = agent_result.get("tests_passed", False)
            if not tests_passed:
                # Double-check database test results
                tests_passed = any(tr.passed for tr in self.state.test_results)

            if is_review or tests_passed:
                # Determine winning root cause summary
                winning_hypo = next(
                    (h for h in self.state.hypotheses if h.status == "confirmed"),
                    self.state.hypotheses[-1] if self.state.hypotheses else None,
                )
                default_summary = (
                    "Repository review complete: architecture analyzed, findings recorded, and recommendations compiled."
                    if is_review
                    else "Root cause identified and successfully verified by automated tests."
                )
                root_cause = winning_hypo.description if winning_hypo else default_summary
                self.state.root_cause_summary = root_cause
                self.state.is_solved = True
                self.state.status = CaseStatus.SOLVED.value

                self.evidence_store.update_case_status(
                    case_id=case_id,
                    status=CaseStatus.SOLVED.value,
                    root_cause=root_cause,
                )

                conclusion_msg = (
                    "Repository review completed. Findings and recommendations compiled."
                    if is_review
                    else "Automated tests passed! Fix verified. Case solved."
                )
                await self.transition_phase(
                    InvestigationPhase.REPORT,
                    conclusion_msg,
                )
                await self.emit_event(
                    "case_solved",
                    f"{'AUDIT COMPLETE' if is_review else 'CASE SOLVED'}: {root_cause}",
                    {
                        "case_id": case_id,
                        "status": "solved",
                        "case_type": self.state.case_type,
                        "root_cause": root_cause,
                        "total_evidence": len(self.state.evidence),
                        "total_hypotheses": len(self.state.hypotheses),
                    },
                )

            else:
                self.state.is_solved = False
                self.state.status = CaseStatus.FAILED.value
                self.evidence_store.update_case_status(
                    case_id=case_id,
                    status=CaseStatus.FAILED.value,
                )

                await self.transition_phase(
                    InvestigationPhase.REPORT,
                    "Investigation concluded without passing verification tests.",
                )
                await self.emit_event(
                    "case_failed",
                    "CASE FAILED: Fix could not be automatically verified by passing tests.",
                    {"case_id": case_id, "status": "failed"},
                )

        except Exception as e:
            logger.exception(f"Unhandled error in investigation engine for case {case_id}: {e}")
            self.state.status = CaseStatus.FAILED.value
            error_reason = f"Investigation aborted: {str(e)}"
            self.state.root_cause_summary = error_reason
            self.evidence_store.update_case_status(
                case_id=case_id,
                status=CaseStatus.FAILED.value,
                root_cause=error_reason,
            )
            await self.emit_event(
                "investigation_error",
                f"Error during investigation: {str(e)}",
                {"error": str(e)},
            )

        return self.state
