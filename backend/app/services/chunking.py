import re

from app.core.config import settings


def sentence_split(text):

    cleaned = re.sub(r"\s+", " ", text).strip()

    if not cleaned:
        return []

    sentences = re.split(r"(?<=[.!?])\s+", cleaned)

    return [s.strip() for s in sentences if s.strip()]


def chunk_text_semantic(pages, chunk_size=None, overlap_size=None):

    chunk_size = chunk_size or settings.CHUNK_SIZE
    overlap_size = overlap_size if overlap_size is not None else settings.CHUNK_OVERLAP

    chunks = []
    chunk_id = 0

    for page in pages:

        sentences = sentence_split(page["text"])

        current_chunk = ""

        for sentence in sentences:

            if len(current_chunk) + len(sentence) + 1 <= chunk_size:
                current_chunk = f"{current_chunk} {sentence}".strip()
            else:

                if current_chunk:
                    chunks.append({
                        "chunk_id": chunk_id,
                        "page": page["page"],
                        "text": current_chunk.strip()
                    })

                    chunk_id += 1

                overlap = current_chunk[-overlap_size:] if overlap_size > 0 else ""

                current_chunk = f"{overlap} {sentence}".strip()

        if current_chunk:
            chunks.append({
                "chunk_id": chunk_id,
                "page": page["page"],
                "text": current_chunk.strip()
            })

            chunk_id += 1

    return chunks
