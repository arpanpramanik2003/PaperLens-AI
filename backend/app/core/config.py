import os
from pathlib import Path

from dotenv import load_dotenv

backend_root = Path(__file__).resolve().parents[2]
load_dotenv(dotenv_path=backend_root / ".env")


class Settings:

    GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
    MODEL_NAME = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
    EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
    RERANKER_MODEL = os.getenv("RERANKER_MODEL", "cross-encoder/ms-marco-MiniLM-L-6-v2")
    UPLOAD_FOLDER = os.getenv("UPLOAD_FOLDER", "uploads")
    CHUNK_SIZE = int(os.getenv("CHUNK_SIZE", "1200"))
    CHUNK_OVERLAP = int(os.getenv("CHUNK_OVERLAP", "220"))
    TOP_K = int(os.getenv("TOP_K", "5"))


settings = Settings()
