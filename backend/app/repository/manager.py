"""Repository Manager for Agent Holmes.

Provides controlled, sandboxed, and structured repository exploration tools.
All repository reads flow through this interface—the AI agent never receives
direct filesystem access.
"""

import fnmatch
import json
import os
import re
import shutil
import subprocess
from pathlib import Path
from typing import List, Optional, Set

from app.config import settings
from app.repository.models import (
    FileInfo,
    FileListResult,
    FileContentResult,
    SearchMatch,
    SearchResult,
    GitCommitInfo,
    GitHistoryResult,
    GitDiffResult,
)

# Directories and files to automatically exclude from repository listings and searches
IGNORED_DIRS: Set[str] = {
    ".git",
    "__pycache__",
    "node_modules",
    ".venv",
    "venv",
    "env",
    ".next",
    "dist",
    "build",
    ".pytest_cache",
    ".mypy_cache",
    ".tox",
    ".coverage",
    ".idea",
    ".vscode",
}

IGNORED_EXTENSIONS: Set[str] = {
    ".pyc",
    ".pyo",
    ".pyd",
    ".so",
    ".dll",
    ".exe",
    ".bin",
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".ico",
    ".svg",
    ".woff",
    ".woff2",
    ".ttf",
    ".eot",
    ".zip",
    ".tar",
    ".gz",
}


class RepositoryManager:
    """Controlled, sandboxed interface for inspecting a Git repository."""

    def __init__(
        self,
        case_id: str,
        repo_url_or_path: str,
        workspaces_dir: Optional[Path] = None,
        timeout: int = 30,
    ):
        self.case_id = case_id
        self.repo_url_or_path = repo_url_or_path.strip()
        self.timeout = timeout
        base_dir = workspaces_dir or settings.WORKSPACES_DIR
        self.case_dir = (base_dir / case_id).resolve()
        self.repo_dir = (self.case_dir / "repo").resolve()

    def setup_workspace(self) -> Path:
        """Clone or copy the target repository into an isolated workspace directory."""
        if (self.repo_dir / ".git").is_dir():
            return self.repo_dir

        self.case_dir.mkdir(parents=True, exist_ok=True)
        if self.repo_dir.exists():
            shutil.rmtree(self.repo_dir, ignore_errors=True)

        local_path = Path(self.repo_url_or_path)
        is_local = local_path.exists() and local_path.is_dir()

        if is_local:
            # If local directory is a Git repository, clone it locally to isolate work
            if (local_path / ".git").is_dir():
                subprocess.run(
                    ["git", "clone", str(local_path.resolve()), str(self.repo_dir)],
                    check=True,
                    capture_output=True,
                    text=True,
                    timeout=self.timeout,
                )
            else:
                # Copy tree and initialize a git repo
                shutil.copytree(local_path, self.repo_dir)
                subprocess.run(
                    ["git", "init"],
                    cwd=str(self.repo_dir),
                    check=True,
                    capture_output=True,
                    timeout=self.timeout,
                )
        else:
            # Remote Git URL clone
            subprocess.run(
                ["git", "clone", "--depth", "50", self.repo_url_or_path, str(self.repo_dir)],
                check=True,
                capture_output=True,
                text=True,
                timeout=self.timeout,
            )

        return self.repo_dir

    def _resolve_safe_path(self, relative_path: str) -> Path:
        """Resolve path and enforce that it remains strictly inside the workspace sandbox."""
        clean_rel = relative_path.strip().lstrip("/\\")
        target_path = (self.repo_dir / clean_rel).resolve()
        
        try:
            target_path.relative_to(self.repo_dir)
        except ValueError:
            raise ValueError(
                f"Security Violation: Path '{relative_path}' traverses outside the workspace sandbox."
            )
        return target_path

    def list_files(
        self,
        path: str = "",
        pattern: Optional[str] = None,
        max_results: int = 300,
    ) -> FileListResult:
        """List files and subdirectories with optional glob filtering."""
        target_dir = self._resolve_safe_path(path)
        if not target_dir.exists() or not target_dir.is_dir():
            return FileListResult(root=path, pattern=pattern, files=[], total_count=0)

        results: List[FileInfo] = []
        truncated = False

        for root, dirs, files in os.walk(target_dir):
            # Prune ignored directories in-place so os.walk doesn't descend into them
            dirs[:] = [d for d in dirs if d not in IGNORED_DIRS and not d.startswith(".")]

            rel_root = Path(root).relative_to(self.repo_dir)

            for d in sorted(dirs):
                rel_path = (rel_root / d).as_posix()
                if pattern and not fnmatch.fnmatch(d, pattern):
                    continue
                results.append(
                    FileInfo(path=rel_path, name=d, is_dir=True, size_bytes=0)
                )
                if len(results) >= max_results:
                    truncated = True
                    break

            if truncated:
                break

            for f in sorted(files):
                if any(f.endswith(ext) for ext in IGNORED_EXTENSIONS):
                    continue
                if pattern and not fnmatch.fnmatch(f, pattern):
                    continue

                full_file_path = Path(root) / f
                try:
                    size = full_file_path.stat().st_size
                except OSError:
                    size = 0

                rel_path = (rel_root / f).as_posix()
                results.append(
                    FileInfo(path=rel_path, name=f, is_dir=False, size_bytes=size)
                )
                if len(results) >= max_results:
                    truncated = True
                    break

            if truncated:
                break

        return FileListResult(
            root=path or ".",
            pattern=pattern,
            files=results,
            total_count=len(results),
            truncated=truncated,
        )

    def read_file(
        self,
        path: str,
        start_line: int = 1,
        end_line: Optional[int] = None,
        max_lines: int = 500,
    ) -> FileContentResult:
        """Read lines from a file with boundary validation and line truncation limits."""
        target_file = self._resolve_safe_path(path)
        if not target_file.exists() or not target_file.is_file():
            raise FileNotFoundError(f"File '{path}' does not exist in repository.")

        # Read with utf-8, fallback to latin-1
        try:
            content = target_file.read_text(encoding="utf-8", errors="replace")
        except Exception as e:
            raise IOError(f"Could not read file '{path}': {e}")

        lines = content.splitlines()
        total_lines = len(lines)

        start = max(1, start_line)
        if end_line is None:
            end = min(total_lines, start + max_lines - 1)
        else:
            end = min(total_lines, max(start, end_line))

        # Check line limit truncation
        truncated = False
        if (end - start + 1) > max_lines:
            end = start + max_lines - 1
            truncated = True

        selected_lines = lines[start - 1 : end]
        output_content = "\n".join(selected_lines)

        return FileContentResult(
            path=path,
            content=output_content,
            total_lines=total_lines,
            start_line=start,
            end_line=end,
            truncated=truncated,
        )

    def search_code(
        self,
        query: str,
        file_pattern: Optional[str] = None,
        max_results: int = 50,
    ) -> SearchResult:
        """Search code using ripgrep if available, with automatic Python regex fallback."""
        rg_path = shutil.which("rg")
        if rg_path:
            try:
                return self._search_with_ripgrep(query, file_pattern, max_results)
            except Exception:
                # If ripgrep fails for any reason, gracefully use Python fallback
                pass

        return self._search_with_python(query, file_pattern, max_results)

    def _search_with_ripgrep(
        self,
        query: str,
        file_pattern: Optional[str],
        max_results: int,
    ) -> SearchResult:
        """Execute search using ripgrep subprocess with --json output."""
        cmd = ["rg", "--json", "-i", "-e", query]
        if file_pattern:
            cmd.extend(["-g", file_pattern])

        for ignored in IGNORED_DIRS:
            cmd.extend(["-g", f"!{ignored}/*"])

        res = subprocess.run(
            cmd,
            cwd=str(self.repo_dir),
            capture_output=True,
            text=True,
            timeout=self.timeout,
        )

        matches: List[SearchMatch] = []
        truncated = False

        for line in res.stdout.splitlines():
            try:
                data = json.loads(line)
            except Exception:
                continue

            if data.get("type") == "match":
                match_data = data.get("data", {})
                rel_path = match_data.get("path", {}).get("text", "")
                line_number = match_data.get("line_number", 0)
                line_content = match_data.get("lines", {}).get("text", "").rstrip("\r\n")

                matches.append(
                    SearchMatch(
                        file=rel_path,
                        line_number=line_number,
                        line_content=line_content,
                    )
                )
                if len(matches) >= max_results:
                    truncated = True
                    break

        return SearchResult(
            query=query,
            matches=matches,
            total_matches=len(matches),
            truncated=truncated,
        )

    def _search_with_python(
        self,
        query: str,
        file_pattern: Optional[str],
        max_results: int,
    ) -> SearchResult:
        """Fallback in-process regex code search for environments lacking ripgrep."""
        try:
            pattern = re.compile(query, re.IGNORECASE)
        except re.error:
            pattern = re.compile(re.escape(query), re.IGNORECASE)

        matches: List[SearchMatch] = []
        truncated = False

        for root, dirs, files in os.walk(self.repo_dir):
            dirs[:] = [d for d in dirs if d not in IGNORED_DIRS and not d.startswith(".")]

            for file in sorted(files):
                if any(file.endswith(ext) for ext in IGNORED_EXTENSIONS):
                    continue
                if file_pattern and not fnmatch.fnmatch(file, file_pattern):
                    continue

                full_path = Path(root) / file
                rel_path = full_path.relative_to(self.repo_dir).as_posix()

                try:
                    content = full_path.read_text(encoding="utf-8", errors="replace")
                except Exception:
                    continue

                for line_idx, line in enumerate(content.splitlines(), start=1):
                    if pattern.search(line):
                        matches.append(
                            SearchMatch(
                                file=rel_path,
                                line_number=line_idx,
                                line_content=line.strip(),
                            )
                        )
                        if len(matches) >= max_results:
                            truncated = True
                            break

                if truncated:
                    break
            if truncated:
                break

        return SearchResult(
            query=query,
            matches=matches,
            total_matches=len(matches),
            truncated=truncated,
        )

    def find_references(
        self,
        symbol: str,
        max_results: int = 50,
    ) -> SearchResult:
        """Find symbol references matching exact word boundaries."""
        query = rf"\b{re.escape(symbol.strip())}\b"
        return self.search_code(query=query, max_results=max_results)

    def get_git_history(
        self,
        path: Optional[str] = None,
        n: int = 10,
    ) -> GitHistoryResult:
        """Get recent Git commit history for the entire repo or a specific file."""
        cmd = ["git", "log", f"-n{n}", '--pretty=format:%H|%an|%ad|%s', "--date=short"]
        if path:
            safe_path = self._resolve_safe_path(path)
            cmd.extend(["--", str(safe_path)])

        res = subprocess.run(
            cmd,
            cwd=str(self.repo_dir),
            capture_output=True,
            text=True,
            timeout=self.timeout,
        )

        commits: List[GitCommitInfo] = []
        if res.returncode == 0:
            for line in res.stdout.splitlines():
                parts = line.strip().split("|", 3)
                if len(parts) == 4:
                    commits.append(
                        GitCommitInfo(
                            commit_hash=parts[0],
                            author=parts[1],
                            date=parts[2],
                            message=parts[3],
                        )
                    )

        return GitHistoryResult(
            path=path,
            commits=commits,
            total_commits=len(commits),
        )

    def get_git_diff(
        self,
        commit_a: Optional[str] = None,
        commit_b: Optional[str] = None,
        path: Optional[str] = None,
    ) -> GitDiffResult:
        """Get unified Git diff between commits or against the working tree."""
        cmd = ["git", "diff"]
        if commit_a and commit_b:
            cmd.extend([commit_a, commit_b])
        elif commit_a:
            cmd.append(commit_a)
        else:
            cmd.append("HEAD")

        if path:
            safe_path = self._resolve_safe_path(path)
            cmd.extend(["--", str(safe_path)])

        res = subprocess.run(
            cmd,
            cwd=str(self.repo_dir),
            capture_output=True,
            text=True,
            timeout=self.timeout,
        )

        diff_output = res.stdout if res.returncode == 0 else ""
        return GitDiffResult(
            commit_a=commit_a,
            commit_b=commit_b,
            file_path=path,
            diff=diff_output,
        )
