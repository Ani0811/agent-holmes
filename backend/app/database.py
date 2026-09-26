"""Database connection and session management using SQLModel and SQLite.

Migration Strategy Note:
For the MVP, SQLite schema changes are handled via `SQLModel.metadata.create_all(engine)`
on startup. If models change during local development, deleting the local `holmes.db`
file safely recreates the schema with all current tables. For post-MVP production,
Alembic will be integrated to manage zero-downtime database migrations.
"""

from typing import Generator
from sqlmodel import SQLModel, Session, create_engine
from app.config import settings

# connect_args={"check_same_thread": False} is required for SQLite with multi-threaded FastAPI workers
engine = create_engine(
    settings.DATABASE_URL,
    echo=False,
    connect_args={"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {},
)


def create_db_and_tables() -> None:
    """Initialize database tables defined in SQLModel metadata."""
    SQLModel.metadata.create_all(engine)
    # Ensure backwards-compatible column additions for existing sqlite databases
    with engine.connect() as conn:
        try:
            from sqlalchemy import text
            columns = [row[1] for row in conn.execute(text("PRAGMA table_info(cases)")).fetchall()]
            if columns and "case_type" not in columns:
                conn.execute(text("ALTER TABLE cases ADD COLUMN case_type TEXT DEFAULT 'bug_fix'"))
                conn.commit()
        except Exception:
            pass


def get_session() -> Generator[Session, None, None]:
    """Dependency for providing a transactional database session."""
    with Session(engine) as session:
        yield session
