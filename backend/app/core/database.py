import os
from functools import lru_cache

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.environ.get("DATABASE_URL")

# SQLAlchemy engine for existing documents/activities tables
engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@lru_cache(maxsize=1)
def get_supabase_client():
    """
    Returns a Supabase client for pgvector operations.
    Cached so only one client instance is created per process.
    Falls back gracefully if SUPABASE_URL/KEY are not set.
    """
    from app.core.config import settings

    url = settings.SUPABASE_URL
    key = settings.SUPABASE_KEY

    if not url or not key:
        return None

    try:
        from supabase import create_client
        return create_client(url, key)
    except Exception:
        return None
