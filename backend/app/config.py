from pathlib import Path
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Agent Holmes"
    VERSION: str = "0.1.0"
    API_PREFIX: str = "/api"
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    
    # Database
    DATABASE_URL: str = "sqlite:///./holmes.db"
    
    # Workspaces
    WORKSPACES_DIR: Path = Path("./workspaces")
    
    # AI Configuration (Bob)
    AI_PROVIDER: str = "bob"
    BOB_API_BASE: str = "http://localhost:11434"
    BOB_API_KEY: str = ""
    BOB_MODEL: str = "ibm-granite-code"
    
    # Execution
    DEFAULT_TIMEOUT_SECONDS: int = 30
    MAX_INVESTIGATION_STEPS: int = 50
    MAX_PATCH_ATTEMPTS: int = 3

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
