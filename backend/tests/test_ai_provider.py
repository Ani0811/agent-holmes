import pytest
from pathlib import Path
from sqlmodel import SQLModel, create_engine, Session

from app.ai import BobProvider, TOOL_DEFINITIONS, ToolExecutionContext, execute_tool
from app.repository import RepositoryManager


@pytest.fixture
def test_context(tmp_path):
    workspaces_dir = tmp_path / "workspaces"
    project_root = Path(__file__).resolve().parent.parent.parent
    demo_repo = project_root / "test-repos" / "session-logout-demo"
    
    repo_manager = RepositoryManager(
        case_id="case-ai-test",
        repo_url_or_path=str(demo_repo),
        workspaces_dir=workspaces_dir,
    )
    repo_manager.setup_workspace()

    engine = create_engine("sqlite:///:memory:")
    SQLModel.metadata.create_all(engine)
    session = Session(engine)

    events = []

    async def emit_event(event_type: str, message: str, data=None):
        events.append((event_type, message, data))

    ctx = ToolExecutionContext(
        case_id="case-ai-test",
        repo_manager=repo_manager,
        db_session=session,
        emit_event=emit_event,
    )
    yield ctx, events
    session.close()


def test_tool_definitions_completeness():
    assert len(TOOL_DEFINITIONS) == 13
    tool_names = [t["function"]["name"] for t in TOOL_DEFINITIONS]

    expected = [
        "list_files",
        "read_file",
        "search_code",
        "find_references",
        "get_git_history",
        "get_git_diff",
        "record_evidence",
        "create_hypothesis",
        "evaluate_hypothesis",
        "run_command",
        "run_tests",
        "run_linter",
        "apply_patch",
    ]
    for exp in expected:
        assert exp in tool_names


def test_bob_provider_config_discovery(monkeypatch):
    monkeypatch.setenv("BOB_API_BASE", "http://bob-custom.internal:8080")
    monkeypatch.setenv("BOB_MODEL", "granite-3-8b-instruct")
    monkeypatch.setenv("BOB_API_KEY", "test-secret-bob-token")

    provider = BobProvider()
    assert provider.api_base == "http://bob-custom.internal:8080"
    assert provider.model == "granite-3-8b-instruct"
    assert provider.api_key == "test-secret-bob-token"


@pytest.mark.asyncio
async def test_tool_execution_handlers(test_context):
    ctx, events = test_context

    # 1. Test search_code tool
    search_res = await execute_tool("search_code", {"query": "refresh_user_token"}, ctx)
    assert search_res["total_matches"] > 0

    # 2. Test record_evidence tool
    ev_res = await execute_tool(
        "record_evidence",
        {
            "file": "src/auth/token_refresh.py",
            "line": 15,
            "claim": "Missing session.modified = True",
            "description": "Cookie omitted",
            "confidence": 0.95,
        },
        ctx,
    )
    assert ev_res["status"] == "success"
    assert ev_res["evidence_id"] is not None

    # 3. Test create_hypothesis tool
    hypo_res = await execute_tool(
        "create_hypothesis",
        {
            "title": "Stale cookie on refresh",
            "description": "Session flag missing",
            "confidence": 0.9,
            "evidence_ids": [ev_res["evidence_id"]],
        },
        ctx,
    )
    assert hypo_res["status"] == "success"
    assert hypo_res["hypothesis_id"] is not None

    # 4. Test evaluate_hypothesis tool
    eval_res = await execute_tool(
        "evaluate_hypothesis",
        {
            "hypothesis_id": hypo_res["hypothesis_id"],
            "status": "confirmed",
            "rationale": "Verified through code analysis",
        },
        ctx,
    )
    assert eval_res["status"] == "success"
    assert eval_res["status_updated_to"] == "confirmed"

    # Verify event logs occurred
    assert len(events) >= 3


@pytest.mark.asyncio
async def test_agentic_loop_e2e(test_context):
    ctx, events = test_context
    provider = BobProvider()

    result = await provider.run_agentic_loop(
        context=ctx,
        bug_description="Users report getting logged out after token refresh",
        stack_trace="401 Unauthorized on /api/user/profile",
        max_steps=10,
    )

    assert result["steps_taken"] > 0
    assert result["tests_passed"] is True
    assert "Investigation complete" in result["final_message"]


@pytest.mark.asyncio
async def test_agentic_loop_repo_review(test_context):
    ctx, events = test_context
    provider = BobProvider()

    result = await provider.run_agentic_loop(
        context=ctx,
        bug_description="Repository review: architecture audit and code quality review",
        case_type="repo_review",
        max_steps=10,
    )

    assert result["steps_taken"] > 0
    assert "audit complete" in result["final_message"]

