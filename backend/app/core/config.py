import os
from pathlib import Path

from dotenv import load_dotenv

backend_root = Path(__file__).resolve().parents[2]
load_dotenv(dotenv_path=backend_root / ".env")


def _as_bool(value, default=False):

    if value is None:
        return default

    return str(value).strip().lower() in {"1", "true", "yes", "on"}


def _as_int(value, default):

    try:
        return int(value)
    except (TypeError, ValueError):
        return default


class Settings:

    # --- LLM ---
    GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
    SEMANTIC_SCHOLAR_API_KEY = os.getenv("SEMANTIC_SCHOLAR_API_KEY", "")
    MODEL_NAME = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")

    # --- Embeddings & Retrieval ---
    EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
    RERANKER_MODEL = os.getenv("RERANKER_MODEL", "cross-encoder/ms-marco-MiniLM-L-6-v2")
    EMBEDDING_DIM = _as_int(os.getenv("EMBEDDING_DIM", "384"), 384)

    # --- Supabase (pgvector) ---
    SUPABASE_URL = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")

    # --- Upload & Parsing Limits ---
    UPLOAD_FOLDER = os.getenv("UPLOAD_FOLDER", "uploads")
    MAX_UPLOAD_MB = _as_int(os.getenv("MAX_UPLOAD_MB", "20"), 20)
    MAX_PAGES = _as_int(os.getenv("MAX_PAGES", "60"), 60)
    MAX_TOTAL_CHARS = _as_int(os.getenv("MAX_TOTAL_CHARS", "300000"), 300000)

    # --- Chunking ---
    CHUNK_SIZE = int(os.getenv("CHUNK_SIZE", "1200"))
    CHUNK_OVERLAP = int(os.getenv("CHUNK_OVERLAP", "220"))
    # Token-based chunk settings (for new pipeline)
    TOKEN_CHUNK_SIZE = _as_int(os.getenv("TOKEN_CHUNK_SIZE", "700"), 700)
    TOKEN_CHUNK_OVERLAP = _as_int(os.getenv("TOKEN_CHUNK_OVERLAP", "100"), 100)
    MAX_CHUNKS = _as_int(os.getenv("MAX_CHUNKS", "300"), 300)

    # --- Vector Store ---
    EMBEDDING_BATCH_SIZE = _as_int(os.getenv("EMBEDDING_BATCH_SIZE", "16"), 16)
    ENABLE_VECTOR_RETRIEVAL = _as_bool(os.getenv("ENABLE_VECTOR_RETRIEVAL", "false"), False)
    ENABLE_RERANKER = _as_bool(os.getenv("ENABLE_RERANKER", "false"), False)
    TOP_K = int(os.getenv("TOP_K", "5"))

    # --- Summarization ---
    SUMMARIZE_MAP_CHUNK_LIMIT = _as_int(os.getenv("SUMMARIZE_MAP_CHUNK_LIMIT", "30"), 30)

    # --- Misc ---
    MAX_CACHED_DOCS = _as_int(os.getenv("MAX_CACHED_DOCS", "1"), 1)
    CITATION_MAX_REFERENCES = _as_int(os.getenv("CITATION_MAX_REFERENCES", "60"), 60)


settings = Settings()
