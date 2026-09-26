"""Structured models for Repository Manager operations."""

from typing import List, Optional
from pydantic import BaseModel, Field


class FileInfo(BaseModel):
    path: str = Field(..., description="Relative path from workspace root")
    name: str = Field(..., description="Filename or directory name")
    is_dir: bool = Field(..., description="True if entry is a directory")
    size_bytes: int = Field(0, description="Size of file in bytes")


class FileListResult(BaseModel):
    root: str = Field(..., description="Relative root searched")
    pattern: Optional[str] = Field(None, description="Glob pattern applied")
    files: List[FileInfo] = Field(default_factory=list, description="List of matched files and directories")
    total_count: int = Field(0, description="Total number of items returned")
    truncated: bool = Field(False, description="True if list exceeded max limits")


class FileContentResult(BaseModel):
    path: str = Field(..., description="Relative path of the read file")
    content: str = Field(..., description="File content or slice")
    total_lines: int = Field(..., description="Total line count of the file")
    start_line: int = Field(1, description="First line included (1-indexed)")
    end_line: int = Field(..., description="Last line included (1-indexed)")
    truncated: bool = Field(False, description="True if file content was truncated by limits")


class SearchMatch(BaseModel):
    file: str = Field(..., description="Relative file path where match was found")
    line_number: int = Field(..., description="1-indexed line number")
    line_content: str = Field(..., description="Full text of the matching line")


class SearchResult(BaseModel):
    query: str = Field(..., description="Search query or regex")
    matches: List[SearchMatch] = Field(default_factory=list, description="Found code occurrences")
    total_matches: int = Field(0, description="Number of matches returned")
    truncated: bool = Field(False, description="True if search hit result limits")


class GitCommitInfo(BaseModel):
    commit_hash: str = Field(..., description="Full or abbreviated commit hash")
    author: str = Field(..., description="Commit author name")
    date: str = Field(..., description="Commit date")
    message: str = Field(..., description="Commit subject message")


class GitHistoryResult(BaseModel):
    path: Optional[str] = Field(None, description="File path filtered, or None for whole repo")
    commits: List[GitCommitInfo] = Field(default_factory=list, description="List of commits")
    total_commits: int = Field(0, description="Number of commits returned")


class GitDiffResult(BaseModel):
    commit_a: Optional[str] = None
    commit_b: Optional[str] = None
    file_path: Optional[str] = None
    diff: str = Field("", description="Unified diff text")
