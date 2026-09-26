"""Health and diagnostic endpoint verifying core tool dependencies."""

import shutil
from fastapi import APIRouter
from app.verification.engine import is_docker_available

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check():
    """System health check verifying availability of Git, Ripgrep, and Docker CLI/daemon."""
    git_path = shutil.which("git")
    rg_path = shutil.which("rg")
    docker_path = shutil.which("docker")
    docker_active = is_docker_available()

    return {
        "status": "healthy",
        "tools": {
            "git": {
                "available": git_path is not None,
                "path": git_path,
            },
            "ripgrep": {
                "available": rg_path is not None,
                "path": rg_path,
            },
            "docker": {
                "available": docker_active,
                "path": docker_path,
            },
        },
    }
