"""Patch applicator: Applies, tests applicability, and reverts unified diff patches in workspaces."""

import logging
import subprocess
import uuid
from dataclasses import dataclass
from pathlib import Path
from typing import Union
from app.models.patch import Patch
from app.patch.generator import normalize_diff

logger = logging.getLogger("holmes.patch.applicator")


@dataclass
class PatchApplyResult:
    """Outcome of a patch application or reversal operation."""

    success: bool
    message: str
    applied_diff: str = ""
    stdout: str = ""
    stderr: str = ""


class PatchApplicator:
    """Manages applying and reverting unified diffs against a workspace sandbox."""

    @staticmethod
    def _extract_diff_string(patch: Union[Patch, str]) -> str:
        if isinstance(patch, Patch):
            return patch.unified_diff
        return str(patch)

    @classmethod
    def can_apply(cls, patch: Union[Patch, str], workspace_path: Path) -> bool:
        """Check if a patch can be applied cleanly using git apply --check."""
        raw_diff = cls._extract_diff_string(patch)
        clean_diff = normalize_diff(raw_diff)
        if not clean_diff.strip():
            return False

        temp_name = f"_check_{uuid.uuid4().hex[:8]}.diff"
        patch_file = workspace_path / temp_name
        try:
            patch_file.write_bytes(clean_diff.encode("utf-8"))
            proc = subprocess.run(
                ["git", "apply", "--check", "--ignore-whitespace", "--recount", "--whitespace=fix", str(patch_file)],
                cwd=str(workspace_path),
                capture_output=True,
                text=True,
                timeout=15,
            )
            return proc.returncode == 0
        except Exception as e:
            logger.warning(f"Error checking patch applicability: {e}")
            return False
        finally:
            if patch_file.exists():
                patch_file.unlink()

    @classmethod
    def apply(cls, patch: Union[Patch, str], workspace_path: Path) -> PatchApplyResult:
        """Apply unified diff into the workspace."""
        raw_diff = cls._extract_diff_string(patch)
        clean_diff = normalize_diff(raw_diff)

        if not clean_diff.strip():
            return PatchApplyResult(
                success=False,
                message="Cannot apply empty diff.",
            )

        temp_name = f"_holmes_patch_{uuid.uuid4().hex[:8]}.diff"
        patch_file = workspace_path / temp_name
        try:
            patch_file.write_bytes(clean_diff.encode("utf-8"))
            proc = subprocess.run(
                ["git", "apply", "--ignore-whitespace", "--recount", "--whitespace=fix", str(patch_file)],
                cwd=str(workspace_path),
                capture_output=True,
                text=True,
                timeout=20,
            )

            success = (proc.returncode == 0)
            if success:
                msg = "Patch applied successfully."
            else:
                msg = f"Failed to apply patch: {proc.stderr or proc.stdout}"

            return PatchApplyResult(
                success=success,
                message=msg,
                applied_diff=clean_diff,
                stdout=proc.stdout or "",
                stderr=proc.stderr or "",
            )
        except subprocess.TimeoutExpired:
            return PatchApplyResult(
                success=False,
                message="Patch application timed out after 20 seconds.",
            )
        except Exception as e:
            logger.exception(f"Unexpected error applying patch: {e}")
            return PatchApplyResult(
                success=False,
                message=f"Error applying patch: {str(e)}",
            )
        finally:
            if patch_file.exists():
                patch_file.unlink()

    @classmethod
    def revert(cls, patch: Union[Patch, str], workspace_path: Path) -> PatchApplyResult:
        """Revert an applied patch using git apply --reverse, falling back to git checkout if needed."""
        raw_diff = cls._extract_diff_string(patch)
        clean_diff = normalize_diff(raw_diff)

        if not clean_diff.strip():
            # If no diff, restore tracked files
            reset_proc = subprocess.run(
                ["git", "checkout", "--", "."],
                cwd=str(workspace_path),
                capture_output=True,
                text=True,
                timeout=15,
            )
            return PatchApplyResult(
                success=(reset_proc.returncode == 0),
                message="Workspace reset to HEAD.",
                stdout=reset_proc.stdout,
                stderr=reset_proc.stderr,
            )

        temp_name = f"_revert_{uuid.uuid4().hex[:8]}.diff"
        patch_file = workspace_path / temp_name
        try:
            patch_file.write_bytes(clean_diff.encode("utf-8"))
            proc = subprocess.run(
                ["git", "apply", "--reverse", "--ignore-whitespace", "--recount", "--whitespace=fix", str(patch_file)],
                cwd=str(workspace_path),
                capture_output=True,
                text=True,
                timeout=20,
            )

            success = (proc.returncode == 0)
            if not success:
                # Fallback to git checkout -- . to ensure workspace stays clean
                logger.info(f"git apply --reverse failed ({proc.stderr}); resetting tracked files via git checkout")
                reset_proc = subprocess.run(
                    ["git", "checkout", "--", "."],
                    cwd=str(workspace_path),
                    capture_output=True,
                    text=True,
                    timeout=15,
                )
                success = (reset_proc.returncode == 0)

            return PatchApplyResult(
                success=success,
                message="Patch reverted successfully." if success else "Failed to revert patch.",
                applied_diff=clean_diff,
                stdout=proc.stdout or "",
                stderr=proc.stderr or "",
            )
        except Exception as e:
            logger.exception(f"Error reverting patch: {e}")
            return PatchApplyResult(
                success=False,
                message=f"Error reverting patch: {str(e)}",
            )
        finally:
            if patch_file.exists():
                patch_file.unlink()
