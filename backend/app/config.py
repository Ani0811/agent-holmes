import json
from pathlib import Path
from typing import List, Optional, Union
from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Agent Holmes"
    VERSION: str = "0.1.0"
    API_PREFIX: str = "/api"
    ENVIRONMENT: str = "development"
    
    # CORS
    FRONTEND_URL: Optional[str] = None
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str], None]) -> List[str]:
        if not v:
            return ["http://localhost:3000", "http://127.0.0.1:3000"]
        if isinstance(v, str):
            trimmed = v.strip()
            if trimmed.startswith("["):
                try:
                    parsed = json.loads(trimmed)
                    if isinstance(parsed, list):
                        return [str(item).strip() for item in parsed if str(item).strip()]
                except Exception:
                    pass
            return [i.strip() for i in trimmed.split(",") if i.strip()]
        elif isinstance(v, list):
            return [str(i).strip() for i in v if str(i).strip()]
        return ["http://localhost:3000", "http://127.0.0.1:3000"]

    @model_validator(mode="after")
    def add_frontend_url_to_cors(self) -> "Settings":
        origins = list(self.CORS_ORIGINS) if isinstance(self.CORS_ORIGINS, list) else [str(self.CORS_ORIGINS)]
        if self.FRONTEND_URL:
            clean_url = self.FRONTEND_URL.strip().rstrip("/")
            if clean_url and clean_url not in origins:
                origins.append(clean_url)
        self.CORS_ORIGINS = origins
        return self
    
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
