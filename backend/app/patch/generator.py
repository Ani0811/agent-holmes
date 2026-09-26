"""Patch generator: Produces clean unified diffs and handles diff normalization."""

import difflib
import json
import re
from typing import List, Optional, Any
from app.models.patch import Patch, PatchStatus


def normalize_diff(diff: str) -> str:
    """Strip markdown formatting, trim whitespace, and normalize CRLF to LF."""
    clean = diff.strip()

    # Remove markdown code fences if present (e.g. ```diff ... ``` or ``` ...)
    fence_pattern = re.compile(r"^```(?:diff)?\s*\n(.*?)\n```$", re.DOTALL | re.IGNORECASE)
    match = fence_pattern.match(clean)
    if match:
        clean = match.group(1).strip()

    # Standardize line endings to Unix LF
    clean = clean.replace("\r\n", "\n").replace("\r", "\n")

    # Ensure ending newline
    if clean and not clean.endswith("\n"):
        clean += "\n"

    return clean


def extract_touched_files(diff: str) -> List[str]:
    """Parse unified diff headers to extract relative file paths modified by the patch."""
    files = set()
    for line in diff.splitlines():
        # Match "--- a/path/to/file" or "+++ b/path/to/file"
        match_plus = re.match(r"^\+\+\+\s+(?:[ab]/)?([^\s\t]+)", line)
        if match_plus:
            path = match_plus.group(1).strip()
            if path and path != "/dev/null":
                files.add(path)
            continue

        match_minus = re.match(r"^---\s+(?:[ab]/)?([^\s\t]+)", line)
        if match_minus:
            path = match_minus.group(1).strip()
            if path and path != "/dev/null":
                files.add(path)

    return sorted(list(files))


class PatchGenerator:
    """Generates and normalizes unified diff patches for code fixes."""

    @staticmethod
    def generate_from_texts(
        file_path: str,
        original_content: str,
        modified_content: str,
        explanation: Optional[str] = None,
        case_id: str = "case-local",
        attempt_number: int = 1,
    ) -> Patch:
        """Create a standard unified diff Patch from original and modified text strings."""
        orig_lines = original_content.splitlines(keepends=True)
        mod_lines = modified_content.splitlines(keepends=True)

        norm_path = file_path.replace("\\", "/")
        diff_lines = list(
            difflib.unified_diff(
                orig_lines,
                mod_lines,
                fromfile=f"a/{norm_path}",
                tofile=f"b/{norm_path}",
                lineterm="\n",
            )
        )
        unified_diff = "".join(diff_lines)
        if not unified_diff.endswith("\n"):
            unified_diff += "\n"

        return Patch(
            case_id=case_id,
            unified_diff=unified_diff,
            file_paths=json.dumps([norm_path]),
            status=PatchStatus.GENERATED.value,
            attempt_number=attempt_number,
            explanation=explanation or f"Fix for {norm_path}",
        )

    @staticmethod
    def create_patch(
        case_id: str,
        unified_diff: str,
        explanation: Optional[str] = None,
        attempt_number: int = 1,
    ) -> Patch:
        """Construct a validated Patch instance from a raw unified diff string."""
        clean_diff = normalize_diff(unified_diff)
        touched_files = extract_touched_files(clean_diff)

        return Patch(
            case_id=case_id,
            unified_diff=clean_diff,
            file_paths=json.dumps(touched_files),
            status=PatchStatus.GENERATED.value,
            attempt_number=attempt_number,
            explanation=explanation,
        )

    @staticmethod
    def generate(
        root_cause: str,
        evidence: Optional[List[Any]] = None,
        case_id: str = "case-local",
        target_file: Optional[str] = None,
        original_content: Optional[str] = None,
        fixed_content: Optional[str] = None,
        explanation: Optional[str] = None,
        attempt_number: int = 1,
    ) -> Patch:
        """High-level generator entry point for creating or framing a patch."""
        if target_file and original_content is not None and fixed_content is not None:
            return PatchGenerator.generate_from_texts(
                file_path=target_file,
                original_content=original_content,
                modified_content=fixed_content,
                explanation=explanation or f"Addressed root cause: {root_cause}",
                case_id=case_id,
                attempt_number=attempt_number,
            )

        # Fallback template representation
        evidence_summary = (
            f"Evidence items cited: {len(evidence)}" if evidence else "No direct evidence items attached"
        )
        exp = explanation or f"Root cause fix: {root_cause}. ({evidence_summary})"

        return Patch(
            case_id=case_id,
            unified_diff="",
            file_paths="[]",
            status=PatchStatus.GENERATED.value,
            attempt_number=attempt_number,
            explanation=exp,
        )
