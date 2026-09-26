"""Unit and integration tests for Patch Generator, Applicator, and Verification Engine."""

import shutil
import subprocess
from pathlib import Path
import pytest
from sqlmodel import SQLModel, create_engine, Session

from app.models import Case, CaseStatus, Patch
from app.patch import (
    PatchGenerator,
    PatchApplicator,
    extract_touched_files,
    normalize_diff,
)
from app.verification import (
    SubprocessExecutor,
    VerificationEngine,
    is_docker_available,
)


@pytest.fixture
def temp_git_repo(tmp_path):
    """Create a temporary initialized Git repository with an initial commit."""
    repo_dir = tmp_path / "sample_repo"
    repo_dir.mkdir()

    # Initialize git repo
    subprocess.run(["git", "init"], cwd=str(repo_dir), check=True, capture_output=True)
    subprocess.run(["git", "config", "user.name", "Holmes Tester"], cwd=str(repo_dir), check=True)
    subprocess.run(["git", "config", "user.email", "holmes@example.com"], cwd=str(repo_dir), check=True)

    # Initial file
    hello_file = repo_dir / "greeting.py"
    hello_file.write_text("def greet():\n    return 'Hello World'\n", encoding="utf-8")

    subprocess.run(["git", "add", "greeting.py"], cwd=str(repo_dir), check=True)
    subprocess.run(["git", "commit", "-m", "Initial commit"], cwd=str(repo_dir), check=True)

    return repo_dir


def test_patch_generator_normalization():
    # Diff wrapped in markdown fence with CRLF
    fenced_diff = "```diff\r\n--- a/file.py\r\n+++ b/file.py\r\n@@ -1 +1 @@\r\n-old\r\n+new\r\n```"
    normalized = normalize_diff(fenced_diff)
    assert not normalized.startswith("```")
    assert "\r" not in normalized
    assert normalized.endswith("\n")

    files = extract_touched_files(normalized)
    assert files == ["file.py"]


def test_patch_generator_from_texts():
    orig = "line 1\nline 2\nline 3\n"
    modified = "line 1\nline 2 fixed\nline 3\n"
    patch = PatchGenerator.generate_from_texts(
        file_path="src/utils.py",
        original_content=orig,
        modified_content=modified,
        case_id="case-123",
        explanation="Fixed line 2 typo",
    )

    assert patch.case_id == "case-123"
    assert "--- a/src/utils.py" in patch.unified_diff
    assert "+++ b/src/utils.py" in patch.unified_diff
    assert "+line 2 fixed" in patch.unified_diff
    assert "src/utils.py" in patch.file_paths


def test_patch_applicator_apply_and_revert(temp_git_repo):
    file_path = temp_git_repo / "greeting.py"
    orig_content = file_path.read_text(encoding="utf-8")

    diff = (
        "--- a/greeting.py\n"
        "+++ b/greeting.py\n"
        "@@ -1,2 +1,2 @@\n"
        " def greet():\n"
        "-    return 'Hello World'\n"
        "+    return 'Hello Agent Holmes'\n"
    )

    # 1. Check applicability
    assert PatchApplicator.can_apply(diff, temp_git_repo) is True

    # 2. Apply patch
    res = PatchApplicator.apply(diff, temp_git_repo)
    assert res.success is True
    assert "Hello Agent Holmes" in file_path.read_text(encoding="utf-8")

    # 3. Revert patch
    revert_res = PatchApplicator.revert(diff, temp_git_repo)
    assert revert_res.success is True
    assert file_path.read_text(encoding="utf-8") == orig_content


def test_subprocess_executor_safety_and_execution(tmp_path):
    executor = SubprocessExecutor()

    # Normal execution
    res = executor.execute("python -c \"print('execution_success')\"", cwd=tmp_path)
    assert res.passed is True
    assert res.exit_code == 0
    assert "execution_success" in res.stdout
    assert res.duration_ms >= 0

    # Failing execution
    res_fail = executor.execute("python -c \"import sys; sys.exit(3)\"", cwd=tmp_path)
    assert res_fail.passed is False
    assert res_fail.exit_code == 3

    # Blocked dangerous command
    res_blocked = executor.execute("rm -rf / --no-preserve-root", cwd=tmp_path)
    assert res_blocked.passed is False
    assert res_blocked.exit_code == 126
    assert "Security Guard" in res_blocked.stderr


def test_docker_detection_and_fallback():
    # Detect docker daemon status on host without throwing
    active = is_docker_available()
    assert isinstance(active, bool)

    # VerificationEngine should initialize gracefully with SubprocessExecutor fallback
    engine = VerificationEngine(preferred_backend="auto")
    assert engine.executor is not None
    assert isinstance(engine.executor, SubprocessExecutor) or active is True


def test_verification_engine_with_session_logout_demo(tmp_path):
    project_root = Path(__file__).resolve().parent.parent.parent
    demo_src = project_root / "test-repos" / "session-logout-demo"
    workspace = tmp_path / "demo_workspace"
    shutil.copytree(demo_src, workspace)

    case = Case(
        case_id="case-demo-verify-001",
        repo_url=str(demo_src),
        bug_description="Session drops after token refresh",
    )

    engine = VerificationEngine(preferred_backend="subprocess")

    # 1. Before fix: pytest should fail (1 failure, 3 passing)
    result_before = engine.verify(
        case=case,
        workspace_path=workspace,
        test_command="pytest",
    )
    assert result_before.passed is False
    assert result_before.exit_code != 0
    assert "FAILED" in result_before.stdout or "failed" in result_before.stdout

    # 2. Apply fix
    patch_diff = (
        "--- a/src/auth/token_refresh.py\n"
        "+++ b/src/auth/token_refresh.py\n"
        "@@ -14,5 +14,6 @@\n"
        "     # Mutating nested dictionary inside Flask session\n"
        "     auth_data[\"token\"] = new_token\n"
        "     auth_data[\"refreshed_at\"] = time.time()\n"
        "+    session.modified = True\n"
        " \n"
        "     # NOTE: In Flask, modifying a mutable object (such as a nested dict)\n"
    )
    apply_res = PatchApplicator.apply(patch_diff, workspace)
    assert apply_res.success is True

    # 3. After fix: pytest should pass (4 passed)
    patch_record = Patch(case_id=case.case_id, unified_diff=patch_diff, status="applied")
    result_after = engine.verify(
        case=case,
        workspace_path=workspace,
        patch=patch_record,
        test_command="pytest",
    )
    assert result_after.passed is True
    assert result_after.exit_code == 0
    assert "4 passed" in result_after.stdout
