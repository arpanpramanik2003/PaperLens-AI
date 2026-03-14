from app.core.config import settings

doc_cache = {}
current_doc_id = None
_active = {
    "vector_index": None,
    "bm25_index": None,
    "chunks": []
}


def store_doc(doc_id, payload):

    max_cached = max(1, settings.MAX_CACHED_DOCS)

    if max_cached == 1:
        doc_cache.clear()
    else:
        while len(doc_cache) >= max_cached:
            oldest_doc_id = next(iter(doc_cache))
            doc_cache.pop(oldest_doc_id, None)

    doc_cache[doc_id] = payload


def set_active_doc(doc_id):

    global current_doc_id

    payload = doc_cache.get(doc_id)

    if not payload:
        return False

    _active["vector_index"] = payload["vector_index"]
    _active["bm25_index"] = payload["bm25_index"]
    _active["chunks"] = payload["chunks"]
    current_doc_id = doc_id

    return True


def get_active_indexes():

    return _active["vector_index"], _active["bm25_index"], _active["chunks"]


def get_current_doc_id():

    return current_doc_id


def has_doc(doc_id):

    return doc_id in doc_cache


def get_doc(doc_id):

    return doc_cache.get(doc_id)
