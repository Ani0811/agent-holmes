"""Patch management package for Agent Holmes.

Provides AI-assisted diff generation, diff normalization, file path extraction,
and robust git-apply and revert capabilities.
"""

from app.patch.generator import PatchGenerator, extract_touched_files, normalize_diff
from app.patch.applicator import PatchApplicator, PatchApplyResult

__all__ = [
    "PatchGenerator",
    "extract_touched_files",
    "normalize_diff",
    "PatchApplicator",
    "PatchApplyResult",
]
