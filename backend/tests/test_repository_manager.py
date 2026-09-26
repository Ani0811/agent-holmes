import pytest
from pathlib import Path
from app.repository import RepositoryManager


@pytest.fixture(scope="module")
def repo_manager(tmp_path_factory):
    # Use temporary directory for isolated workspace
    workspaces_dir = tmp_path_factory.mktemp("test_workspaces")
    demo_repo_path = Path("c:/GitHub/agent-holmes/test-repos/session-logout-demo")
    
    manager = RepositoryManager(
        case_id="case-repo-test-001",
        repo_url_or_path=str(demo_repo_path),
        workspaces_dir=workspaces_dir,
    )
    manager.setup_workspace()
    return manager


def test_setup_workspace(repo_manager):
    assert repo_manager.repo_dir.exists()
    assert (repo_manager.repo_dir / ".git").is_dir()
    assert (repo_manager.repo_dir / "src" / "app.py").is_file()


def test_path_sandboxing(repo_manager):
    # Valid relative paths should succeed
    safe_path = repo_manager._resolve_safe_path("src/app.py")
    assert safe_path.exists()

    # Path traversal attempts must raise ValueError
    with pytest.raises(ValueError, match="Security Violation"):
        repo_manager._resolve_safe_path("../../secret.txt")

    with pytest.raises(ValueError, match="Security Violation"):
        repo_manager._resolve_safe_path("../../../Windows/System32")


def test_list_files(repo_manager):
    result = repo_manager.list_files()
    assert result.total_count > 0
    file_paths = [f.path for f in result.files]

    # Verify standard source files are present
    assert any("src/app.py" in p for p in file_paths)
    assert any("src/auth/token_refresh.py" in p for p in file_paths)

    # Verify .git directory is ignored
    assert not any(p == ".git" or p.startswith(".git/") for p in file_paths)

    # Test glob filtering
    py_result = repo_manager.list_files(pattern="*.ini")
    assert any(f.name == "pytest.ini" for f in py_result.files)


def test_read_file(repo_manager):
    # 1. Full read
    result = repo_manager.read_file("src/auth/token_refresh.py")
    assert "def refresh_user_token" in result.content
    assert result.start_line == 1
    assert result.total_lines > 0

    # 2. Slice read
    slice_res = repo_manager.read_file("src/auth/token_refresh.py", start_line=3, end_line=6)
    assert slice_res.start_line == 3
    assert slice_res.end_line == 6
    assert len(slice_res.content.splitlines()) == 4

    # 3. File not found error
    with pytest.raises(FileNotFoundError):
        repo_manager.read_file("non_existent_file.py")


def test_search_code(repo_manager):
    result = repo_manager.search_code("refresh_user_token")
    assert result.total_matches > 0
    matched_files = [m.file for m in result.matches]
    assert any("token_refresh.py" in f for f in matched_files)


def test_find_references(repo_manager):
    result = repo_manager.find_references("ACTIVE_TOKENS")
    assert result.total_matches > 0
    matched_files = [m.file for m in result.matches]
    assert any("auth_middleware.py" in f for f in matched_files)


def test_git_history(repo_manager):
    history = repo_manager.get_git_history(n=5)
    assert history.total_commits > 0
    assert len(history.commits) >= 1
    assert history.commits[0].commit_hash != ""
    assert history.commits[0].author != ""


def test_git_diff(repo_manager):
    # Working tree is clean, so git diff should return empty string
    diff_res = repo_manager.get_git_diff()
    assert isinstance(diff_res.diff, str)
