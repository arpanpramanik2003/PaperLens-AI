import re
import time
from datetime import datetime
from typing import Any

import httpx


REFERENCE_SECTION_HEADERS = [
    "references",
    "bibliography",
    "works cited",
]

REFERENCE_SECTION_END_HEADERS = [
    "appendix",
    "appendices",
    "acknowledgments",
    "acknowledgements",
    "supplementary material",
    "author contributions",
]

DOI_PATTERN = re.compile(r"(?:https?://(?:dx\.)?doi\.org/|doi:\s*)(10\.\d{4,9}/[-._;()/:A-Z0-9]+)", re.IGNORECASE)


def _extract_references_block(full_text: str) -> str:

    lines = full_text.splitlines()

    start_index = None
    for index, line in enumerate(lines):
        normalized = line.strip().lower().rstrip(":")
        if normalized in REFERENCE_SECTION_HEADERS:
            start_index = index + 1
            break

    if start_index is None:
        tail_lines = lines[max(len(lines) - 220, 0):]
        return "\n".join(tail_lines)

    end_index = len(lines)
    for index in range(start_index, len(lines)):
        normalized = lines[index].strip().lower().rstrip(":")
        if normalized in REFERENCE_SECTION_END_HEADERS:
            end_index = index
            break

    return "\n".join(lines[start_index:end_index])


def _normalize_text_for_dedupe(value: str) -> str:

    cleaned = value.lower()
    cleaned = re.sub(r"[^a-z0-9\s]", " ", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned


def _is_valid_reference_text(value: str) -> bool:

    stripped = value.strip()
    if len(stripped) < 40:
        return False

    word_count = len(stripped.split())
    if word_count < 6:
        return False

    if not re.search(r"\b(19|20)\d{2}[a-z]?\b", stripped):
        return False

    return True


def _split_numbered_references(lines: list[str]) -> list[str]:

    numbered_pattern = re.compile(r"^\s*(?:\[(\d{1,3})\]|(\d{1,3})[\.)])\s*(.*)$")

    parsed: list[tuple[int, str]] = []
    current_number: int | None = None
    current_text_parts: list[str] = []

    def flush_current():
        nonlocal current_number, current_text_parts
        if current_number is None:
            return
        text = " ".join(part for part in current_text_parts if part).strip()
        text = re.sub(r"\s+", " ", text)
        if _is_valid_reference_text(text):
            parsed.append((current_number, text))
        current_number = None
        current_text_parts = []

    for raw_line in lines:
        line = raw_line.strip()
        if not line:
            continue

        match = numbered_pattern.match(line)
        if match:
            number_text = match.group(1) or match.group(2)
            number = int(number_text)
            body = (match.group(3) or "").strip()

            if current_number is not None:
                flush_current()

            current_number = number
            current_text_parts = [body] if body else []
            continue

        if current_number is not None:
            current_text_parts.append(line)

    flush_current()

    if len(parsed) < 5:
        return []

    best_by_number: dict[int, str] = {}
    for number, text in parsed:
        existing = best_by_number.get(number)
        if existing is None or len(text) > len(existing):
            best_by_number[number] = text

    ordered_numbers = sorted(best_by_number.keys())
    return [best_by_number[number] for number in ordered_numbers]


def _looks_like_reference_start(line: str) -> bool:

    stripped = line.strip()
    if not stripped:
        return False

    start_patterns = [
        r"^\[\d+\]",
        r"^\d+\.\s",
        r"^\(\d+\)",
        r"^•\s",
        r"^-\s",
    ]

    for pattern in start_patterns:
        if re.match(pattern, stripped):
            return True

    return bool(re.search(r"\b(19|20)\d{2}\b", stripped) and len(stripped) > 35)


def _split_reference_entries(references_block: str) -> list[str]:

    raw_lines = [line for line in references_block.splitlines() if line.strip()]

    numbered_entries = _split_numbered_references(raw_lines)
    if numbered_entries:
        deduped_numbered = []
        seen_numbered = set()
        for entry in numbered_entries:
            key = _normalize_text_for_dedupe(entry)
            if key and key not in seen_numbered:
                seen_numbered.add(key)
                deduped_numbered.append(entry)
        return deduped_numbered

    entries: list[str] = []
    current: list[str] = []

    for raw_line in raw_lines:
        line = raw_line.strip()

        if _looks_like_reference_start(line) and current:
            entry = " ".join(current).strip()
            entry = re.sub(r"\s+", " ", entry)
            if _is_valid_reference_text(entry):
                entries.append(entry)
            current = [line]
        else:
            current.append(line)

    if current:
        entry = " ".join(current).strip()
        entry = re.sub(r"\s+", " ", entry)
        if _is_valid_reference_text(entry):
            entries.append(entry)

    deduped = []
    seen = set()
    for entry in entries:
        key = _normalize_text_for_dedupe(entry)
        if key and key not in seen:
            seen.add(key)
            deduped.append(entry)

    return deduped


def _build_search_query(reference_text: str) -> str:

    cleaned = reference_text
    cleaned = DOI_PATTERN.sub(" ", cleaned)
    cleaned = re.sub(r"\[[0-9]+\]|\([0-9]+\)", " ", cleaned)
    cleaned = re.sub(r"https?://\S+", " ", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()

    if ":" in cleaned:
        cleaned = cleaned.split(":", 1)[1].strip()

    cleaned = re.split(r"\b(In:|Proceedings|Journal|Transactions|arXiv|vol\.|pp\.|doi)\b", cleaned, maxsplit=1, flags=re.IGNORECASE)[0].strip()

    return cleaned[:180]


def _extract_doi(reference_text: str) -> str | None:

    match = DOI_PATTERN.search(reference_text)
    if not match:
        return None

    doi = match.group(1).rstrip(".,;)").strip()
    return doi.lower() if doi else None


class SemanticScholarClient:

    def __init__(self, api_key: str, min_interval_seconds: float = 1.0):
        self.api_key = api_key
        self.min_interval_seconds = min_interval_seconds
        self._last_request_time = 0.0
        self._client = httpx.Client(timeout=20.0)

    def close(self):
        self._client.close()

    def _throttle(self):
        elapsed = time.monotonic() - self._last_request_time
        if elapsed < self.min_interval_seconds:
            time.sleep(self.min_interval_seconds - elapsed)

    def search_paper(self, reference_text: str) -> dict[str, Any] | None:

        doi = _extract_doi(reference_text)
        if doi:
            paper = self._fetch_by_doi(doi)
            if paper:
                return paper

        query = _build_search_query(reference_text)
        if not query:
            return None

        self._throttle()

        headers = {}
        if self.api_key:
            headers["x-api-key"] = self.api_key

        response = self._client.get(
            "https://api.semanticscholar.org/graph/v1/paper/search",
            params={
                "query": query,
                "limit": 1,
                "fields": "title,authors,year,citationCount,url,venue,paperId",
            },
            headers=headers,
        )

        self._last_request_time = time.monotonic()

        if response.status_code in {429, 503}:
            self._throttle()
            retry = self._client.get(
                "https://api.semanticscholar.org/graph/v1/paper/search",
                params={
                    "query": query,
                    "limit": 1,
                    "fields": "title,authors,year,citationCount,url,venue,paperId",
                },
                headers=headers,
            )
            self._last_request_time = time.monotonic()
            if retry.status_code in {429, 503}:
                return None
            if retry.status_code in {401, 403}:
                raise RuntimeError("Semantic Scholar API authentication failed.")
            retry.raise_for_status()
            retry_payload = retry.json()
            retry_data = retry_payload.get("data") or []
            return retry_data[0] if retry_data else None

        if response.status_code in {401, 403}:
            raise RuntimeError("Semantic Scholar API authentication failed.")

        if response.status_code == 400:
            return None

        response.raise_for_status()
        payload = response.json()
        data = payload.get("data") or []
        if not data:
            return None

        return data[0]

    def _fetch_by_doi(self, doi: str) -> dict[str, Any] | None:

        self._throttle()

        headers = {}
        if self.api_key:
            headers["x-api-key"] = self.api_key

        response = self._client.get(
            f"https://api.semanticscholar.org/graph/v1/paper/DOI:{doi}",
            params={"fields": "title,authors,year,citationCount,url,venue,paperId"},
            headers=headers,
        )

        self._last_request_time = time.monotonic()

        if response.status_code == 404:
            return None

        if response.status_code in {429, 503}:
            return None

        if response.status_code in {401, 403}:
            raise RuntimeError("Semantic Scholar API authentication failed.")

        if response.status_code == 400:
            return None

        response.raise_for_status()
        payload = response.json()
        if payload.get("paperId"):
            return payload
        return None


def run_citation_intelligence(
    pages: list[dict[str, Any]],
    semantic_scholar_api_key: str,
    max_references: int = 35,
) -> dict[str, Any]:

    full_text = "\n".join(page.get("text", "") for page in pages if page.get("text"))
    references_block = _extract_references_block(full_text)
    extracted_references = _split_reference_entries(references_block)

    limited_references = extracted_references[:max_references] if max_references > 0 else extracted_references

    results = []
    matched_count = 0

    client = SemanticScholarClient(semantic_scholar_api_key)

    try:
        for index, reference_text in enumerate(limited_references, start=1):
            try:
                paper = client.search_paper(reference_text)
            except Exception:
                paper = None

            if paper:
                matched_count += 1
                authors = [author.get("name", "") for author in (paper.get("authors") or []) if author.get("name")]
                results.append(
                    {
                        "reference_index": index,
                        "reference_text": reference_text,
                        "matched": True,
                        "paper_id": paper.get("paperId"),
                        "title": paper.get("title"),
                        "year": paper.get("year"),
                        "citation_count": paper.get("citationCount") or 0,
                        "url": paper.get("url"),
                        "venue": paper.get("venue"),
                        "authors": authors,
                    }
                )
            else:
                results.append(
                    {
                        "reference_index": index,
                        "reference_text": reference_text,
                        "matched": False,
                        "paper_id": None,
                        "title": None,
                        "year": None,
                        "citation_count": 0,
                        "url": None,
                        "venue": None,
                        "authors": [],
                    }
                )
    finally:
        client.close()

    matched_references = [entry for entry in results if entry["matched"]]
    top_cited = sorted(matched_references, key=lambda item: item.get("citation_count", 0), reverse=True)

    return {
        "total_references_extracted": len(extracted_references),
        "references_processed": len(limited_references),
        "matched_count": matched_count,
        "missing_count": len(limited_references) - matched_count,
        "references": results,
        "top_cited": top_cited,
    }


def _build_reference_text_from_paper(paper: dict[str, Any]) -> str:

    authors = [author.get("name", "") for author in (paper.get("authors") or []) if author.get("name")]
    authors_text = ", ".join(authors[:6]) if authors else "Unknown authors"
    title = paper.get("title") or "Untitled"
    venue = paper.get("venue") or "Unknown venue"
    year = paper.get("year")

    if year:
        return f"{authors_text}: {title}. {venue} ({year})"

    return f"{authors_text}: {title}. {venue}"


def discover_citations_by_topic(
    semantic_scholar_api_key: str,
    project_title: str,
    basic_details: str = "",
    limit: int = 35,
) -> dict[str, Any]:

    normalized_title = (project_title or "").strip()
    normalized_details = (basic_details or "").strip()

    if not normalized_title:
        raise ValueError("Project title is required.")

    requested_limit = max(30, min(limit or 35, 60))
    fetch_limit = min(max(requested_limit * 3, requested_limit), 100)
    query = f"{normalized_title} {normalized_details}".strip()
    current_year = datetime.utcnow().year
    recent_year_cutoff = current_year - 3

    client = SemanticScholarClient(semantic_scholar_api_key)

    try:
        client._throttle()

        headers = {}
        if semantic_scholar_api_key:
            headers["x-api-key"] = semantic_scholar_api_key

        response = client._client.get(
            "https://api.semanticscholar.org/graph/v1/paper/search",
            params={
                "query": query,
                "limit": fetch_limit,
                "fields": "title,authors,year,citationCount,url,venue,paperId,abstract",
            },
            headers=headers,
        )

        client._last_request_time = time.monotonic()

        if response.status_code in {401, 403}:
            raise RuntimeError("Semantic Scholar API authentication failed.")

        if response.status_code in {429, 503}:
            raise RuntimeError("Semantic Scholar API rate limit reached. Please try again in a moment.")

        response.raise_for_status()
        payload = response.json()
        papers = payload.get("data") or []

        unique_papers: list[dict[str, Any]] = []
        seen_keys: set[str] = set()
        for paper in papers:
            paper_id = (paper.get("paperId") or "").strip()
            title = (paper.get("title") or "").strip().lower()
            dedupe_key = paper_id or title
            if not dedupe_key or dedupe_key in seen_keys:
                continue
            seen_keys.add(dedupe_key)
            unique_papers.append(paper)

        recent_papers = []
        older_papers = []
        for paper in unique_papers:
            year = paper.get("year")
            if isinstance(year, int) and year >= recent_year_cutoff:
                recent_papers.append(paper)
            else:
                older_papers.append(paper)

        ranked_recent_papers = sorted(
            recent_papers,
            key=lambda item: (
                item.get("year") or 0,
                item.get("citationCount") or 0,
            ),
            reverse=True,
        )

        ranked_older_papers = sorted(
            older_papers,
            key=lambda item: (
                1 if isinstance(item.get("year"), int) else 0,
                item.get("year") or 0,
                item.get("citationCount") or 0,
            ),
            reverse=True,
        )

        papers_to_use = (ranked_recent_papers + ranked_older_papers)[:requested_limit]

        references = []
        for index, paper in enumerate(papers_to_use, start=1):
            authors = [author.get("name", "") for author in (paper.get("authors") or []) if author.get("name")]
            references.append(
                {
                    "reference_index": index,
                    "reference_text": _build_reference_text_from_paper(paper),
                    "matched": True,
                    "paper_id": paper.get("paperId"),
                    "title": paper.get("title"),
                    "year": paper.get("year"),
                    "citation_count": paper.get("citationCount") or 0,
                    "url": paper.get("url"),
                    "venue": paper.get("venue"),
                    "authors": authors,
                    "abstract": paper.get("abstract"),
                }
            )

        selected_year_distribution: dict[str, int] = {}
        for item in references:
            year = item.get("year")
            year_key = str(year) if isinstance(year, int) else "unknown"
            selected_year_distribution[year_key] = selected_year_distribution.get(year_key, 0) + 1

        top_cited = sorted(
            references,
            key=lambda item: (
                item.get("year") or 0,
                item.get("citation_count", 0),
            ),
            reverse=True,
        )

        return {
            "total_references_extracted": len(references),
            "references_processed": len(references),
            "matched_count": len(references),
            "missing_count": 0,
            "recent_year_cutoff": recent_year_cutoff,
            "recent_candidates_found": len(ranked_recent_papers),
            "older_candidates_found": len(ranked_older_papers),
            "selected_year_distribution": selected_year_distribution,
            "references": references,
            "top_cited": top_cited,
        }
    finally:
        client.close()
