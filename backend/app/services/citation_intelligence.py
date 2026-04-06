import json
import math
import re
import time
from datetime import datetime
from typing import Any

import httpx
from groq import Groq

from app.core.config import settings


REFERENCE_SECTION_HEADERS = [
    "references",
    "bibliography",
    "works cited",
    "reference list",
    "literatuur",
    "bibliographie",
]

REFERENCE_SECTION_END_HEADERS = [
    "appendix",
    "appendices",
    "acknowledgments",
    "acknowledgements",
    "supplementary material",
    "author contributions",
    "conflict of interest",
    "data availability",
    "funding",
    "abbreviations",
]

DOI_PATTERN = re.compile(
    r"(?:https?://(?:dx\.)?doi\.org/|doi:\s*)(10\.\d{4,9}/[-._;()/:A-Z0-9]+)",
    re.IGNORECASE,
)

# Regex patterns to extract title from a formatted reference string.
# Heuristic: title often follows author block (ends at year or colon).
_TITLE_AFTER_YEAR_PATTERN = re.compile(
    r"\b(?:19|20)\d{2}[a-z]?\b[\.\)]\s+(.+?)(?:\.|$)", re.IGNORECASE
)
_QUOTED_TITLE_PATTERN = re.compile(r'["\u201c\u201d]([^"]+)["\u201c\u201d]')
_TITLE_BEFORE_IN_PATTERN = re.compile(
    r"[.]\s+([A-Z][^.]{15,120})\.\s+(?:In:|Proceedings|Journal|IEEE|ACM|arXiv)",
    re.IGNORECASE,
)


def _extract_references_block(full_text: str) -> str:

    lines = full_text.splitlines()

    start_index = None
    for index, line in enumerate(lines):
        normalized = line.strip().lower().rstrip(":")
        if normalized in REFERENCE_SECTION_HEADERS:
            start_index = index + 1
            break

    if start_index is None:
        tail_lines = lines[max(len(lines) - 300, 0):]
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
    if len(stripped) < 30:
        return False

    word_count = len(stripped.split())
    if word_count < 5:
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


# ---------------------------------------------------------------------------
# Query building — multi-strategy
# ---------------------------------------------------------------------------

def _extract_doi(reference_text: str) -> str | None:

    match = DOI_PATTERN.search(reference_text)
    if not match:
        return None

    doi = match.group(1).rstrip(".,;)").strip()
    return doi.lower() if doi else None


def _extract_title_heuristic(reference_text: str) -> str:
    """
    Try multiple heuristics to extract just the paper title from a reference string.
    Returns the best candidate title, or empty string if none found.
    """
    # 1. Quoted title — most reliable
    m = _QUOTED_TITLE_PATTERN.search(reference_text)
    if m and len(m.group(1).split()) >= 4:
        return m.group(1).strip()

    # 2. Title between '. ' at start and '. In:' / '. Proceedings'
    m = _TITLE_BEFORE_IN_PATTERN.search(reference_text)
    if m and len(m.group(1).split()) >= 4:
        return m.group(1).strip()

    # 3. Text after year + period: "Smith et al. (2020). Title goes here. Journal"
    m = _TITLE_AFTER_YEAR_PATTERN.search(reference_text)
    if m:
        candidate = m.group(1).strip()
        # Trim at next sentence-ending punctuation
        candidate = re.split(r"\.\s+[A-Z]|,\s+vol\.|,\s+pp\.|,\s+no\.", candidate)[0].strip()
        if len(candidate.split()) >= 4:
            return candidate

    return ""


def _build_search_query(reference_text: str) -> str:
    """
    Build a clean search query string from a reference.
    Removes DOIs, URLs, volume/page info, and numbering artifacts.
    Returns a short text most likely to match on Semantic Scholar title search.
    """
    cleaned = reference_text
    cleaned = DOI_PATTERN.sub(" ", cleaned)
    cleaned = re.sub(r"\[[0-9]+\]|\([0-9]+\)", " ", cleaned)
    cleaned = re.sub(r"https?://\S+", " ", cleaned)
    # Remove volume, pages, issue markers
    cleaned = re.sub(
        r"\bvol\.\s*\d+|\bno\.\s*\d+|\bpp?\.\s*[\d–\-]+|\bISSN[:\s]\S+|\bISBN[:\s]\S+",
        " ", cleaned, flags=re.IGNORECASE
    )
    cleaned = re.sub(r"\s+", " ", cleaned).strip()

    # Strip numbering prefix like "[12]" or "12."
    cleaned = re.sub(r"^\s*(?:\[\d+\]|\d+\.)\s*", "", cleaned)

    # Cut at venue markers — keep author+title portion only
    cleaned = re.split(
        r"\b(In:|Proceedings|Journal of|IEEE |ACM |arXiv|Transactions on|vol\.|pp\.\s*\d)",
        cleaned, maxsplit=1, flags=re.IGNORECASE
    )[0].strip()

    return cleaned[:200]


def _build_title_only_query(reference_text: str) -> str:
    """Extracts just the title for a second-pass title-focused query."""
    title = _extract_title_heuristic(reference_text)
    if title:
        return title[:150]

    # Fallback: take the middle portion of the reference (often the title)
    words = reference_text.split()
    if len(words) > 10:
        mid_start = min(4, len(words) // 5)
        mid_end = max(mid_start + 8, len(words) // 2)
        return " ".join(words[mid_start:mid_end])

    return ""


DISCOVERY_STOPWORDS = {
    "a", "an", "and", "based", "by", "for", "from", "in", "into", "of", "on", "or",
    "the", "to", "using", "via", "with", "without", "toward", "towards", "through",
    "approach", "method", "methods", "model", "models", "system", "systems", "study",
    "framework", "frameworks", "analysis", "detection", "classification", "prediction",
}

DISCOVERY_METHOD_SYNONYMS: dict[str, list[str]] = {
    "gan": ["gan", "generative adversarial network", "generative adversarial networks"],
    "cgan": ["cgan", "conditional gan", "conditional generative adversarial network"],
    "cnn": ["cnn", "convolutional neural network", "convolutional neural networks"],
    "rnn": ["rnn", "recurrent neural network", "recurrent neural networks"],
    "lstm": ["lstm", "long short-term memory"],
    "transformer": ["transformer", "transformers", "vision transformer", "vit"],
    "vit": ["vision transformer", "vit", "transformer"],
    "diffusion": ["diffusion model", "diffusion models", "denoising diffusion"],
    "federated learning": ["federated learning", "privacy-preserving federated learning"],
    "graph neural network": ["graph neural network", "graph neural networks", "gnn"],
    "gnn": ["graph neural network", "graph neural networks", "gnn"],
    "explainable": ["explainable ai", "interpretable", "explainability"],
}

DISCOVERY_DOMAIN_SYNONYMS: dict[str, list[str]] = {
    "plant pathology": ["plant pathology", "crop disease", "plant disease", "agricultural disease"],
    "plant disease": ["plant pathology", "plant disease", "crop disease", "leaf disease"],
    "leaf blight": ["leaf blight", "leaf spot", "plant leaf disease", "foliar disease"],
    "crop disease": ["crop disease", "plant disease", "plant pathology"],
    "medical imaging": ["medical imaging", "radiology", "clinical imaging", "biomedical imaging"],
    "biomedical imaging": ["biomedical imaging", "medical imaging", "clinical imaging"],
    "mri": ["mri", "magnetic resonance imaging", "brain mri", "medical imaging"],
    "ct scan": ["ct scan", "computed tomography", "medical imaging"],
    "ultrasound": ["ultrasound", "sonography", "medical imaging"],
    "remote sensing": ["remote sensing", "satellite imagery", "earth observation", "aerial imagery"],
    "satellite imagery": ["satellite imagery", "remote sensing", "earth observation"],
    "earth observation": ["earth observation", "remote sensing", "satellite imagery"],
    "agriculture": ["agriculture", "agricultural", "crop", "farming"],
    "computer vision": ["computer vision", "image analysis", "visual recognition"],
}

DISCOVERY_TOPIC_PRESETS: dict[str, dict[str, list[str] | str]] = {
    "plant_pathology": {
        "trigger_terms": ["plant pathology", "plant disease", "crop disease", "leaf blight", "leaf disease"],
        "intent_suffix": "focused on plant pathology and crop disease analysis",
        "core_terms": ["plant pathology", "crop disease", "leaf disease", "agricultural imaging"],
        "domain_terms": ["plant pathology", "plant disease", "crop disease", "leaf blight", "foliar disease"],
        "task_terms": ["disease detection", "disease classification", "lesion segmentation", "stress detection"],
        "must_include_terms": ["plant pathology", "crop disease"],
        "search_queries": [
            "plant disease detection deep learning",
            "crop disease classification neural network",
            "leaf disease segmentation agricultural imaging",
            "plant pathology computer vision",
        ],
    },
    "agricultural_disease": {
        "trigger_terms": ["agricultural disease", "crop health", "plant disease", "crop disease", "disease monitoring"],
        "intent_suffix": "focused on agricultural disease monitoring and detection",
        "core_terms": ["agricultural disease", "crop health", "plant disease", "precision agriculture"],
        "domain_terms": ["agricultural disease", "crop disease", "plant disease", "plant pathology", "precision agriculture"],
        "task_terms": ["disease monitoring", "disease detection", "stress detection", "field diagnosis"],
        "must_include_terms": ["agricultural disease", "crop disease"],
        "search_queries": [
            "agricultural disease detection deep learning",
            "crop health monitoring computer vision",
            "plant disease monitoring neural network",
            "precision agriculture disease diagnosis",
        ],
    },
    "medical_imaging": {
        "trigger_terms": ["medical imaging", "biomedical imaging", "radiology", "mri", "ct scan", "ultrasound"],
        "intent_suffix": "focused on medical and biomedical image analysis",
        "core_terms": ["medical imaging", "biomedical imaging", "radiology", "image analysis"],
        "domain_terms": ["medical imaging", "biomedical imaging", "radiology", "clinical imaging", "diagnostic imaging"],
        "task_terms": ["segmentation", "classification", "detection", "lesion analysis"],
        "must_include_terms": ["medical imaging", "biomedical imaging"],
        "search_queries": [
            "medical image segmentation deep learning",
            "biomedical image classification neural network",
            "radiology image analysis transformer",
            "clinical imaging computer vision",
        ],
    },
    "medical_diagnosis": {
        "trigger_terms": ["medical diagnosis", "diagnosis support", "clinical diagnosis", "disease diagnosis", "diagnostic support"],
        "intent_suffix": "focused on medical diagnosis support and clinical decision systems",
        "core_terms": ["medical diagnosis", "clinical diagnosis", "diagnostic support", "decision support"],
        "domain_terms": ["medical diagnosis", "clinical diagnosis", "diagnostic support", "clinical decision support", "healthcare"],
        "task_terms": ["disease classification", "risk prediction", "diagnosis support", "symptom analysis"],
        "must_include_terms": ["medical diagnosis", "clinical diagnosis"],
        "search_queries": [
            "medical diagnosis deep learning",
            "clinical diagnosis support neural network",
            "disease classification healthcare ai",
            "medical decision support system",
        ],
    },
    "remote_sensing": {
        "trigger_terms": ["remote sensing", "satellite imagery", "earth observation", "aerial imagery"],
        "intent_suffix": "focused on remote sensing and earth observation analysis",
        "core_terms": ["remote sensing", "earth observation", "satellite imagery", "aerial imagery"],
        "domain_terms": ["remote sensing", "satellite imagery", "earth observation", "aerial imagery"],
        "task_terms": ["land cover classification", "object detection", "change detection", "segmentation"],
        "must_include_terms": ["remote sensing", "earth observation"],
        "search_queries": [
            "remote sensing image classification deep learning",
            "satellite imagery segmentation neural network",
            "earth observation object detection",
            "aerial imagery analysis transformer",
        ],
    },
    "climate_earth_observation": {
        "trigger_terms": ["climate", "earth observation", "environmental monitoring", "satellite imagery", "weather"],
        "intent_suffix": "focused on climate analysis and earth observation monitoring",
        "core_terms": ["climate analysis", "earth observation", "environmental monitoring", "satellite imagery"],
        "domain_terms": ["climate analysis", "earth observation", "environmental monitoring", "satellite imagery", "remote sensing"],
        "task_terms": ["change detection", "forecasting", "classification", "monitoring"],
        "must_include_terms": ["climate", "earth observation"],
        "search_queries": [
            "climate analysis satellite imagery deep learning",
            "earth observation environmental monitoring",
            "weather forecasting satellite data neural network",
            "remote sensing climate change detection",
        ],
    },
}


def _normalize_phrase(value: str) -> str:
    cleaned = value.lower().strip()
    cleaned = re.sub(r"[^a-z0-9\s-]", " ", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned


def _extract_keyphrases(text: str, max_terms: int = 10) -> list[str]:
    if not text:
        return []

    normalized = _normalize_phrase(text)
    pieces = re.split(r"[;:,/()\[\]\-]", normalized)
    phrases: list[str] = []

    for piece in pieces:
        tokens = [token for token in piece.split() if token and token not in DISCOVERY_STOPWORDS]
        if len(tokens) >= 2:
            phrase = " ".join(tokens[:5]).strip()
            if phrase and phrase not in phrases:
                phrases.append(phrase)

    if not phrases:
        tokens = [token for token in normalized.split() if token and token not in DISCOVERY_STOPWORDS]
        if tokens:
            phrases = [" ".join(tokens[:max_terms])]

    return phrases[:max_terms]


def _expand_method_terms(text: str) -> list[str]:
    normalized = _normalize_phrase(text)
    expansions: list[str] = []

    for key, values in DISCOVERY_METHOD_SYNONYMS.items():
        if key in normalized:
            for value in values:
                if value not in expansions:
                    expansions.append(value)

    return expansions


def _expand_domain_terms(text: str) -> list[str]:
    normalized = _normalize_phrase(text)
    expansions: list[str] = []

    for key, values in DISCOVERY_DOMAIN_SYNONYMS.items():
        if key in normalized:
            for value in values:
                if value not in expansions:
                    expansions.append(value)

    return expansions


def _infer_topic_preset(text: str) -> str | None:
    normalized = _normalize_phrase(text)
    for preset_key, preset in DISCOVERY_TOPIC_PRESETS.items():
        trigger_terms = preset.get("trigger_terms") or []
        if any(term in normalized for term in trigger_terms):
            return preset_key
    return None


def _unique_preserve_order(values: list[str]) -> list[str]:
    seen: set[str] = set()
    ordered: list[str] = []
    for value in values:
        candidate = value.strip()
        if not candidate:
            continue
        key = candidate.lower()
        if key in seen:
            continue
        seen.add(key)
        ordered.append(candidate)
    return ordered


def _split_topic_clauses(text: str) -> list[str]:
    if not text:
        return []

    normalized = re.sub(r"\s+", " ", text.strip())
    normalized = re.sub(r"(?<=\w)-(?=\w)", " ", normalized)
    fragments = re.split(r"\s*[:;–—]\s*|\s+via\s+|\s+using\s+|\s+based on\s+|\s+for\s+", normalized, flags=re.IGNORECASE)

    clauses: list[str] = []
    for fragment in fragments:
        fragment = fragment.strip(" ,.-")
        if len(fragment.split()) < 2:
            continue
        if fragment.lower() not in {item.lower() for item in clauses}:
            clauses.append(fragment)

    return clauses


def _build_heuristic_discovery_plan(
    project_title: str,
    basic_details: str = "",
    topic_preset: str | None = None,
) -> dict[str, Any]:
    normalized_title = (project_title or "").strip()
    normalized_details = (basic_details or "").strip()
    combined_text = f"{normalized_title} {normalized_details}".strip()
    forced_preset = (topic_preset or "").strip().lower()
    if forced_preset not in DISCOVERY_TOPIC_PRESETS:
        forced_preset = ""

    clauses = _split_topic_clauses(normalized_title)
    if normalized_details:
        clauses.extend(_extract_keyphrases(normalized_details, max_terms=4))

    keyphrases = _extract_keyphrases(combined_text, max_terms=12)
    method_terms = _expand_method_terms(combined_text)
    domain_expansions = _expand_domain_terms(combined_text)
    topic_preset = forced_preset or _infer_topic_preset(combined_text)

    preset = DISCOVERY_TOPIC_PRESETS.get(topic_preset or "", {})
    preset_core_terms = list(preset.get("core_terms") or [])
    preset_domain_terms = list(preset.get("domain_terms") or [])
    preset_task_terms = list(preset.get("task_terms") or [])
    preset_must_include_terms = list(preset.get("must_include_terms") or [])
    preset_search_queries = list(preset.get("search_queries") or [])

    domain_terms = _unique_preserve_order((clauses[:4] if clauses else keyphrases[:4]) + domain_expansions + preset_domain_terms)
    task_terms = []
    for phrase in keyphrases:
        if phrase not in domain_terms and phrase not in method_terms:
            task_terms.append(phrase)
    task_terms.extend(term for term in preset_task_terms if term not in task_terms)

    must_include_terms = _unique_preserve_order(method_terms[:4] + [term for term in clauses[:2] if term] + preset_must_include_terms)
    core_terms = _unique_preserve_order((clauses[:3] or keyphrases[:3]) + keyphrases[:5] + preset_core_terms)

    search_queries: list[str] = []
    if normalized_title:
        search_queries.append(normalized_title)
    if normalized_details:
        search_queries.append(f"{normalized_title} {normalized_details}".strip())

    for clause in clauses[:4]:
        search_queries.append(clause)

    if method_terms and keyphrases:
        search_queries.append(" ".join(_unique_preserve_order(method_terms[:2] + keyphrases[:4])))

    if method_terms and domain_terms:
        search_queries.append(" ".join(_unique_preserve_order(method_terms[:2] + domain_terms[:3])))

    if domain_expansions and method_terms:
        search_queries.append(" ".join(_unique_preserve_order(method_terms[:1] + domain_expansions[:3])))

    if domain_expansions:
        search_queries.append(" ".join(domain_expansions[:4]))

    if keyphrases:
        search_queries.append(" ".join(keyphrases[:6]))

    if normalized_details:
        search_queries.append(" ".join(_extract_keyphrases(normalized_details, max_terms=6)))

    search_queries.extend(preset_search_queries)

    search_queries = _unique_preserve_order([query for query in search_queries if len(query.split()) >= 2])

    intent_summary = " ".join(keyphrases[:2]) if keyphrases else normalized_title
    if method_terms:
        intent_summary = f"{intent_summary} with {method_terms[0]} focus".strip()

    return {
        "intent_summary": intent_summary[:220],
        "core_terms": core_terms,
        "method_terms": _unique_preserve_order(method_terms),
        "domain_terms": _unique_preserve_order(domain_terms),
        "task_terms": _unique_preserve_order(task_terms[:6]),
        "must_include_terms": must_include_terms,
        "search_queries": search_queries[:8],
        "negative_terms": [],
        "llm_used": False,
        "topic_preset": topic_preset,
    }
def _build_discovery_query_plan(
    project_title: str,
    basic_details: str = "",
    topic_preset: str | None = None,
) -> dict[str, Any]:
    base_plan = _build_heuristic_discovery_plan(project_title, basic_details, topic_preset=topic_preset)

    if not settings.GROQ_API_KEY:
        return base_plan

    try:
        llm_client = Groq(api_key=settings.GROQ_API_KEY)
        response = llm_client.chat.completions.create(
            model=settings.MODEL_NAME,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You turn a research project title into a smart literature-search plan. "
                        "Split compound titles, preserve explicit method acronyms like GAN/CNN/GNN, "
                        "and return only valid JSON."
                    ),
                },
                {
                    "role": "user",
                    "content": f"""
Project title:
{project_title}

Optional details:
{basic_details}

Return JSON with these keys:
{{
  "intent_summary": "1 short sentence summarizing the topic",
  "core_terms": ["core concept", "task", "domain"],
  "method_terms": ["GAN", "generative adversarial network"],
  "domain_terms": ["plant pathology", "leaf blight"],
  "task_terms": ["disease detection"],
  "must_include_terms": ["GAN", "leaf blight"],
  "search_queries": ["query 1", "query 2", "query 3", "query 4"],
  "negative_terms": ["optional exclusions"]
}}

Rules:
- Search queries should discover related work, not just exact-title matches.
- Include both narrow and broad variants.
- Keep search queries between 4 and 8 items.
- Make sure at least one query explicitly includes the method if the title mentions one.
- If the title is compound, split it into meaningful clauses.
""".strip(),
                },
            ],
            response_format={"type": "json_object"},
        )

        payload = json.loads(response.choices[0].message.content)
        search_queries = _unique_preserve_order([
            *(payload.get("search_queries") or []),
            *(base_plan.get("search_queries") or []),
        ])

        merged_plan = {
            **base_plan,
            "intent_summary": (payload.get("intent_summary") or base_plan["intent_summary"])[:220],
            "core_terms": _unique_preserve_order((payload.get("core_terms") or []) + base_plan.get("core_terms", [])),
            "method_terms": _unique_preserve_order((payload.get("method_terms") or []) + base_plan.get("method_terms", [])),
            "domain_terms": _unique_preserve_order((payload.get("domain_terms") or []) + base_plan.get("domain_terms", [])),
            "task_terms": _unique_preserve_order((payload.get("task_terms") or []) + base_plan.get("task_terms", [])),
            "must_include_terms": _unique_preserve_order((payload.get("must_include_terms") or []) + base_plan.get("must_include_terms", [])),
            "search_queries": search_queries[:8],
            "negative_terms": _unique_preserve_order((payload.get("negative_terms") or []) + base_plan.get("negative_terms", [])),
            "llm_used": True,
            "topic_preset": base_plan.get("topic_preset"),
        }

        if merged_plan["search_queries"]:
            return merged_plan
    except Exception:
        pass

    return base_plan


def _normalized_text(value: Any) -> str:
    return _normalize_phrase(str(value or ""))


def _phrase_hits(text: str, phrases: list[str]) -> int:
    if not text or not phrases:
        return 0

    hits = 0
    for phrase in phrases:
        normalized_phrase = _normalized_text(phrase)
        if not normalized_phrase:
            continue
        if normalized_phrase in text:
            hits += 1
    return hits


def _score_discovery_candidate(paper: dict[str, Any], plan: dict[str, Any], query_hit_count: int) -> float:
    title = _normalized_text(paper.get("title"))
    abstract = _normalized_text(paper.get("abstract"))
    venue = _normalized_text(paper.get("venue"))
    combined = f"{title} {abstract} {venue}".strip()

    core_terms = [_normalized_text(term) for term in (plan.get("core_terms") or [])]
    method_terms = [_normalized_text(term) for term in (plan.get("method_terms") or [])]
    domain_terms = [_normalized_text(term) for term in (plan.get("domain_terms") or [])]
    task_terms = [_normalized_text(term) for term in (plan.get("task_terms") or [])]
    must_include_terms = [_normalized_text(term) for term in (plan.get("must_include_terms") or [])]
    search_queries = [_normalized_text(term) for term in (plan.get("search_queries") or [])]

    score = 0.0

    if plan.get("intent_summary"):
        summary_terms = _extract_keyphrases(plan["intent_summary"], max_terms=4)
        score += 2.0 * _phrase_hits(title, summary_terms)

    score += 8.0 * _phrase_hits(title, must_include_terms)
    score += 4.0 * _phrase_hits(abstract, must_include_terms)
    score += 5.0 * _phrase_hits(title, method_terms)
    score += 2.5 * _phrase_hits(abstract, method_terms)
    score += 4.0 * _phrase_hits(title, domain_terms)
    score += 2.0 * _phrase_hits(abstract, domain_terms)
    score += 3.0 * _phrase_hits(title, task_terms)
    score += 1.5 * _phrase_hits(abstract, task_terms)
    score += 1.5 * _phrase_hits(title, core_terms)
    score += 0.75 * _phrase_hits(abstract, core_terms)

    for query in search_queries:
        if query and query in title:
            score += 10.0

    if must_include_terms:
        must_hit_count = _phrase_hits(combined, must_include_terms)
        score += 8.0 * (must_hit_count / max(len(must_include_terms), 1))
        if must_hit_count == 0:
            score -= 10.0

    if query_hit_count:
        score += min(query_hit_count, 5) * 2.5

    citation_count = paper.get("citationCount") or 0
    score += min(math.log1p(citation_count) * 1.6, 12.0)

    year = paper.get("year")
    if isinstance(year, int):
        score += max(0.0, (year - 2018) * 0.7)

    title_bonus_terms = _extract_keyphrases(paper.get("title") or "", max_terms=8)
    score += 0.6 * len(set(title_bonus_terms) & set(core_terms + method_terms + domain_terms + task_terms))

    return score


# ---------------------------------------------------------------------------
# Semantic Scholar client — with multi-strategy search
# ---------------------------------------------------------------------------

class SemanticScholarClient:

    def __init__(self, api_key: str, min_interval_seconds: float = 1.0):
        self.api_key = api_key
        self.min_interval_seconds = min_interval_seconds
        self._last_request_time = 0.0
        self._client = httpx.Client(timeout=25.0)

    def close(self):
        self._client.close()

    def _throttle(self):
        elapsed = time.monotonic() - self._last_request_time
        if elapsed < self.min_interval_seconds:
            time.sleep(self.min_interval_seconds - elapsed)

    def _get_headers(self) -> dict:
        headers = {}
        if self.api_key:
            headers["x-api-key"] = self.api_key
        return headers

    def _search_by_query(self, query: str, fields: str = "title,authors,year,citationCount,url,venue,paperId") -> dict | None:
        """Single search request, returns first result or None."""
        if not query or len(query.strip()) < 10:
            return None

        self._throttle()

        response = self._client.get(
            "https://api.semanticscholar.org/graph/v1/paper/search",
            params={"query": query, "limit": 3, "fields": fields},
            headers=self._get_headers(),
        )
        self._last_request_time = time.monotonic()

        if response.status_code in {429, 503}:
            time.sleep(3.0)
            return None

        if response.status_code in {401, 403}:
            raise RuntimeError("Semantic Scholar API authentication failed.")

        if response.status_code in {400, 404}:
            return None

        try:
            response.raise_for_status()
        except Exception:
            return None

        data = response.json().get("data") or []
        return data[0] if data else None

    def _search_results_by_query(
        self,
        query: str,
        limit: int = 12,
        fields: str = "title,authors,year,citationCount,url,venue,paperId,abstract",
    ) -> list[dict]:
        if not query or len(query.strip()) < 3:
            return []

        self._throttle()

        response = self._client.get(
            "https://api.semanticscholar.org/graph/v1/paper/search",
            params={"query": query, "limit": max(1, min(limit, 25)), "fields": fields},
            headers=self._get_headers(),
        )
        self._last_request_time = time.monotonic()

        if response.status_code in {429, 503}:
            time.sleep(2.0)
            return []

        if response.status_code in {401, 403}:
            raise RuntimeError("Semantic Scholar API authentication failed.")

        if response.status_code in {400, 404}:
            return []

        try:
            response.raise_for_status()
        except Exception:
            return []

        data = response.json().get("data") or []
        return [paper for paper in data if paper.get("paperId") or paper.get("title")]

    def _fetch_by_doi(self, doi: str) -> dict | None:

        self._throttle()

        response = self._client.get(
            f"https://api.semanticscholar.org/graph/v1/paper/DOI:{doi}",
            params={"fields": "title,authors,year,citationCount,url,venue,paperId"},
            headers=self._get_headers(),
        )
        self._last_request_time = time.monotonic()

        if response.status_code in {404, 400}:
            return None
        if response.status_code in {429, 503}:
            return None
        if response.status_code in {401, 403}:
            raise RuntimeError("Semantic Scholar API authentication failed.")

        try:
            response.raise_for_status()
        except Exception:
            return None

        payload = response.json()
        return payload if payload.get("paperId") else None

    def _fuzzy_title_match(
        self, candidate: dict, reference_text: str, title_query: str
    ) -> bool:
        """
        Validates that a Semantic Scholar result is likely the correct paper.
        Prevents false positives from generic queries.
        """
        if not candidate:
            return False

        ss_title = (candidate.get("title") or "").lower().strip()
        ref_lower = reference_text.lower()
        title_lower = title_query.lower()

        if not ss_title:
            return False

        # Accept if SS title words overlap strongly with query
        ss_words = set(re.findall(r"[a-z]{3,}", ss_title))
        query_words = set(re.findall(r"[a-z]{3,}", title_lower or ref_lower))

        if not ss_words or not query_words:
            return False

        overlap = len(ss_words & query_words)
        precision = overlap / len(ss_words) if ss_words else 0
        recall = overlap / len(query_words) if query_words else 0

        # Require at least 40% overlap in both directions, OR strong precision
        return (precision >= 0.40 and recall >= 0.30) or precision >= 0.60

    def search_paper(self, reference_text: str) -> dict | None:
        """
        Multi-strategy search:
        1. DOI lookup (most precise)
        2. Full-text query (author + title portion)
        3. Title-only query (heuristically extracted)
        4. Shorter fallback query (first ~100 chars of cleaned reference)

        Result is validated for relevance before returning.
        """
        # Strategy 1: DOI
        doi = _extract_doi(reference_text)
        if doi:
            paper = self._fetch_by_doi(doi)
            if paper:
                return paper

        # Strategy 2: Full cleaned query
        full_query = _build_search_query(reference_text)
        if full_query:
            paper = self._search_by_query(full_query)
            if paper and self._fuzzy_title_match(paper, reference_text, full_query):
                return paper

        # Strategy 3: Heuristic title-only query
        title_query = _build_title_only_query(reference_text)
        if title_query and title_query != full_query:
            paper = self._search_by_query(title_query)
            if paper and self._fuzzy_title_match(paper, reference_text, title_query):
                return paper

        # Strategy 4: Shortened query (sometimes long queries hurt precision)
        short_query = full_query[:100] if len(full_query) > 100 else ""
        if short_query and short_query != full_query:
            paper = self._search_by_query(short_query)
            if paper and self._fuzzy_title_match(paper, reference_text, short_query):
                return paper

        return None


# ---------------------------------------------------------------------------
# Main pipeline
# ---------------------------------------------------------------------------

def run_citation_intelligence(
    pages: list[dict[str, Any]],
    semantic_scholar_api_key: str,
    max_references: int = 35,
) -> dict[str, Any]:

    full_text = "\n".join(page.get("text", "") for page in pages if page.get("text"))
    references_block = _extract_references_block(full_text)
    extracted_references = _split_reference_entries(references_block)

    # Process all extracted references (respect max_references as a safety cap only)
    # Default is 35 but user can raise via CITATION_MAX_REFERENCES env var
    limited_references = (
        extracted_references[:max_references] if max_references > 0 else extracted_references
    )

    results = []
    matched_count = 0

    client = SemanticScholarClient(semantic_scholar_api_key, min_interval_seconds=1.0)

    try:
        for index, reference_text in enumerate(limited_references, start=1):
            try:
                paper = client.search_paper(reference_text)
            except RuntimeError:
                raise
            except Exception:
                paper = None

            if paper:
                matched_count += 1
                authors = [
                    author.get("name", "")
                    for author in (paper.get("authors") or [])
                    if author.get("name")
                ]
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
    top_cited = sorted(
        matched_references,
        key=lambda item: item.get("citation_count", 0),
        reverse=True,
    )

    return {
        "total_references_extracted": len(extracted_references),
        "references_processed": len(limited_references),
        "matched_count": matched_count,
        "missing_count": len(limited_references) - matched_count,
        "references": results,
        "top_cited": top_cited,
    }


# ---------------------------------------------------------------------------
# Discovery pipeline (existing — preserved unchanged)
# ---------------------------------------------------------------------------

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
    topic_preset: str | None = None,
) -> dict[str, Any]:

    normalized_title = (project_title or "").strip()
    normalized_details = (basic_details or "").strip()

    if not normalized_title:
        raise ValueError("Project title is required.")

    requested_limit = max(30, min(limit or 35, 60))
    current_year = datetime.utcnow().year
    recent_year_cutoff = current_year - 3
    query_plan = _build_discovery_query_plan(normalized_title, normalized_details, topic_preset=topic_preset)
    search_queries = query_plan.get("search_queries") or [normalized_title]
    fetch_limit_per_query = min(max(requested_limit, 10), 20)

    client = SemanticScholarClient(semantic_scholar_api_key)

    try:
        candidates: dict[str, dict[str, Any]] = {}

        for query in search_queries[:8]:
            try:
                papers = client._search_results_by_query(query, limit=fetch_limit_per_query)
            except RuntimeError:
                raise
            except Exception:
                papers = []

            for paper in papers:
                paper_id = (paper.get("paperId") or "").strip()
                title = (paper.get("title") or "").strip().lower()
                dedupe_key = paper_id or title
                if not dedupe_key:
                    continue

                candidate = candidates.get(dedupe_key)
                if candidate is None:
                    candidates[dedupe_key] = {
                        "paper": paper,
                        "query_hit_count": 1,
                        "query_examples": [query],
                    }
                    continue

                candidate["query_hit_count"] = candidate.get("query_hit_count", 0) + 1
                examples = candidate.setdefault("query_examples", [])
                if query not in examples:
                    examples.append(query)

                existing_paper = candidate["paper"]
                existing_citations = existing_paper.get("citationCount") or 0
                new_citations = paper.get("citationCount") or 0
                if new_citations > existing_citations or not existing_paper.get("abstract") and paper.get("abstract"):
                    candidate["paper"] = paper

        scored_candidates: list[dict[str, Any]] = []
        for candidate in candidates.values():
            paper = candidate["paper"]
            score = _score_discovery_candidate(paper, query_plan, candidate.get("query_hit_count", 0))
            scored_candidates.append(
                {
                    "paper": paper,
                    "score": score,
                    "query_hit_count": candidate.get("query_hit_count", 0),
                    "query_examples": candidate.get("query_examples", []),
                }
            )

        if not scored_candidates:
            return {
                "total_references_extracted": 0,
                "references_processed": 0,
                "matched_count": 0,
                "missing_count": 0,
                "recent_year_cutoff": recent_year_cutoff,
                "recent_candidates_found": 0,
                "older_candidates_found": 0,
                "selected_year_distribution": {},
                "references": [],
                "top_cited": [],
                "project_title": normalized_title,
                "basic_details": normalized_details,
                "discovery_profile": query_plan,
                "search_queries_used": search_queries[:8],
            }

        scored_candidates.sort(
            key=lambda item: (
                item["score"],
                item["paper"].get("citationCount") or 0,
                item["paper"].get("year") or 0,
            ),
            reverse=True,
        )

        unique_papers = [item["paper"] for item in scored_candidates]
        recent_candidates_found = sum(1 for paper in unique_papers if isinstance(paper.get("year"), int) and paper.get("year") >= recent_year_cutoff)
        older_candidates_found = len(unique_papers) - recent_candidates_found

        papers_to_use = unique_papers[:requested_limit]

        references = []
        for index, paper in enumerate(papers_to_use, start=1):
            authors = [
                author.get("name", "")
                for author in (paper.get("authors") or [])
                if author.get("name")
            ]

            query_examples = []
            for candidate in scored_candidates:
                if candidate["paper"].get("paperId") == paper.get("paperId") or candidate["paper"].get("title") == paper.get("title"):
                    query_examples = candidate.get("query_examples", [])
                    break

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
                    "query_examples": query_examples[:3],
                }
            )

        selected_year_distribution: dict[str, int] = {}
        for item in references:
            year = item.get("year")
            year_key = str(year) if isinstance(year, int) else "unknown"
            selected_year_distribution[year_key] = selected_year_distribution.get(year_key, 0) + 1

        top_cited = sorted(
            references,
            key=lambda item: (item.get("year") or 0, item.get("citation_count", 0)),
            reverse=True,
        )

        return {
            "total_references_extracted": len(references),
            "references_processed": len(references),
            "matched_count": len(references),
            "missing_count": 0,
            "recent_year_cutoff": recent_year_cutoff,
            "recent_candidates_found": recent_candidates_found,
            "older_candidates_found": older_candidates_found,
            "selected_year_distribution": selected_year_distribution,
            "references": references,
            "top_cited": top_cited,
            "project_title": normalized_title,
            "basic_details": normalized_details,
            "discovery_profile": query_plan,
            "search_queries_used": search_queries[:8],
        }
    finally:
        client.close()