"""Repository interface and management package."""

from app.repository.manager import RepositoryManager
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

__all__ = [
    "RepositoryManager",
    "FileInfo",
    "FileListResult",
    "FileContentResult",
    "SearchMatch",
    "SearchResult",
    "GitCommitInfo",
    "GitHistoryResult",
    "GitDiffResult",
]
