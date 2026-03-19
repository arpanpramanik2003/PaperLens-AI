import re

import faiss
import numpy as np
from rank_bm25 import BM25Okapi

from app.core.config import settings
from app.services.cache import get_active_indexes

embedding_model = None
reranker_model = None


def get_embedding_model():

    global embedding_model

    if not settings.ENABLE_VECTOR_RETRIEVAL:
        return None

    if embedding_model is None:
        from sentence_transformers import SentenceTransformer
        embedding_model = SentenceTransformer(settings.EMBEDDING_MODEL)

    return embedding_model


def get_reranker_model():

    global reranker_model

    if not settings.ENABLE_RERANKER:
        return None

    if reranker_model is None:
        from sentence_transformers import CrossEncoder
        reranker_model = CrossEncoder(settings.RERANKER_MODEL)

    return reranker_model


def tokenize_text(text):

    return re.findall(r"[A-Za-z0-9']+", text.lower())


def create_embeddings(chunks):

    texts = [c["text"] for c in chunks]

    model = get_embedding_model()

    if model is None:
        return None

    embeddings = model.encode(
        texts,
        normalize_embeddings=True,
        batch_size=settings.EMBEDDING_BATCH_SIZE,
        show_progress_bar=False
    )

    return np.array(embeddings)


def build_vector_store(chunks):
    index = None

    if settings.ENABLE_VECTOR_RETRIEVAL:
        embeddings = create_embeddings(chunks)

        if embeddings is not None and len(embeddings) > 0:
            dimension = embeddings.shape[1]
            index = faiss.IndexFlatIP(dimension)
            index.add(embeddings)

    tokenized_corpus = [tokenize_text(c["text"]) for c in chunks]
    bm25 = BM25Okapi(tokenized_corpus)

    return index, bm25


def search_chunks(query, top_k=None):

    top_k = top_k or settings.TOP_K

    vector_index, bm25_index, paper_chunks = get_active_indexes()

    if bm25_index is None or not paper_chunks:
        return []

    dense_hits = {}

    if settings.ENABLE_VECTOR_RETRIEVAL and vector_index is not None:
        model = get_embedding_model()

        if model is not None:
            query_embedding = model.encode(
                [query],
                normalize_embeddings=True,
                batch_size=1,
                show_progress_bar=False
            )

            dense_scores, dense_indices = vector_index.search(
                np.array(query_embedding), min(12, len(paper_chunks))
            )

            dense_hits = {
                int(idx): float(score)
                for idx, score in zip(dense_indices[0], dense_scores[0])
                if idx != -1
            }

    bm25_scores = bm25_index.get_scores(tokenize_text(query))

    max_bm25 = float(np.max(bm25_scores)) if len(bm25_scores) else 1.0
    if max_bm25 == 0:
        max_bm25 = 1.0

    combined = {}

    for idx, score in enumerate(bm25_scores):
        dense_score = dense_hits.get(idx, 0.0)
        bm25_score = float(score) / max_bm25
        if settings.ENABLE_VECTOR_RETRIEVAL and vector_index is not None:
            combined[idx] = (0.6 * dense_score) + (0.4 * bm25_score)
        else:
            combined[idx] = bm25_score

    ranked = sorted(combined.items(), key=lambda item: item[1], reverse=True)

    candidates = [paper_chunks[idx] for idx, _ in ranked[: max(top_k * 3, 8)]]

    reranker = get_reranker_model()

    if reranker is None:
        return candidates[:top_k]

    rerank_pairs = [(query, c["text"]) for c in candidates]
    rerank_scores = reranker.predict(rerank_pairs)

    reranked = sorted(
        zip(candidates, rerank_scores),
        key=lambda item: item[1],
        reverse=True
    )

    results = [chunk for chunk, _ in reranked[:top_k]]

    return results
