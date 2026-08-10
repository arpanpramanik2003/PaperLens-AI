import logging
import re
from typing import List, Optional
from pydantic import BaseModel, Field

from app.services.model_fallback import (
    DEFAULT_FALLBACK_MODELS,
    DEFAULT_PRIMARY_MODEL,
    create_completion_with_fallback,
)
from app.services.retrieval import search_chunks

from .analysis import get_first_page_chunks, get_total_pages
from .client import client


logger = logging.getLogger(__name__)

# Dedicated models for conversation QA (kept separate from summary model).
QA_PRIMARY_MODEL = DEFAULT_PRIMARY_MODEL
QA_FALLBACK_MODELS = DEFAULT_FALLBACK_MODELS
QA_MAX_TOKENS = 900


class QAResponse(BaseModel):
    answer: str = Field(description="Structured answer text formatted in clean Markdown (use bullet points for lists, strictly no tables)")
    citations: List[str] = Field(default_factory=list, description="List of page citations referenced, e.g. ['Page 1', 'Page 3']")


def _sanitize_no_table_output(text: str) -> str:
    if not text:
        return text

    # Extract clean answer content if structured XML tag is present
    answer_match = re.search(r"<answer>(.*?)</answer>", text, flags=re.DOTALL | re.IGNORECASE)
    if answer_match:
        text = answer_match.group(1).strip()

    lines = text.splitlines()
    table_row_pattern = re.compile(r"^\s*\|.*\|\s*$")
    table_sep_pattern = re.compile(r"^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$")

    if not any(table_row_pattern.match(line) for line in lines):
        return text

    sanitized_lines = []
    headers = None

    for line in lines:
        if not table_row_pattern.match(line):
            sanitized_lines.append(line)
            continue

        if table_sep_pattern.match(line):
            continue

        cells = [cell.strip() for cell in line.strip().strip("|").split("|")]
        if not cells or all(not cell for cell in cells):
            continue

        if headers is None:
            headers = cells
            continue

        pairs = []
        for idx, value in enumerate(cells):
            key = headers[idx] if idx < len(headers) and headers[idx] else f"Field {idx + 1}"
            if value:
                pairs.append(f"{key}: {value}")

        if pairs:
            sanitized_lines.append("- " + "; ".join(pairs))

    output = "\n".join(sanitized_lines).strip()
    return output or "Not mentioned in the paper."


def _create_chat_with_fallback(messages: list[dict]):

    return create_completion_with_fallback(
        llm_client=client,
        task_name="qa_conversation",
        primary_model=QA_PRIMARY_MODEL,
        fallback_models=QA_FALLBACK_MODELS,
        max_tokens=QA_MAX_TOKENS,
        messages=messages,
    )


def _stream_chat_with_fallback(messages: list[dict]):

    response = create_completion_with_fallback(
        llm_client=client,
        task_name="qa_conversation_stream",
        primary_model=QA_PRIMARY_MODEL,
        fallback_models=QA_FALLBACK_MODELS,
        max_tokens=QA_MAX_TOKENS,
        messages=messages,
        stream=True,
    )

    for chunk in response:
        delta = chunk.choices[0].delta
        if delta and delta.content:
            yield delta.content


def _normalize_history(history, max_turns=8):

    if not history:
        return []

    normalized = []

    for turn in history:
        if not isinstance(turn, dict):
            continue

        role = (turn.get("role") or "").strip().lower()
        text = (turn.get("text") or turn.get("content") or "").strip()

        if not text:
            continue

        if role == "ai":
            role = "assistant"
        if role not in ["user", "assistant"]:
            continue

        normalized.append({"role": role, "text": text})

    return normalized[-max_turns:]


def _is_follow_up_question(question):

    q = question.strip().lower()

    follow_up_phrases = [
        "are you sure",
        "why",
        "how so",
        "what about",
        "can you verify",
        "can you confirm",
        "explain that",
        "what do you mean",
        "really",
        "is that correct",
    ]

    if len(q) <= 40:
        return True

    return any(phrase in q for phrase in follow_up_phrases)


def _is_metadata_question(question: str) -> bool:
    q = question.lower().strip()
    metadata_terms = [
        "title",
        "paper name",
        "name of paper",
        "name of the paper",
        "name of this paper",
        "what is the paper",
        "what paper is this",
        "author",
        "authors",
        "who wrote",
        "who are the authors",
        "affiliation",
        "affiliations",
        "header",
    ]
    return any(term in q for term in metadata_terms)


def _build_retrieval_query(question, history):

    if not history:
        return question

    if not _is_follow_up_question(question):
        return question

    last_user_question = None
    for turn in reversed(history):
        if turn["role"] == "user" and turn["text"].strip().lower() != question.strip().lower():
            last_user_question = turn["text"]
            break

    if not last_user_question:
        return question

    return f"{last_user_question}\nFollow-up: {question}"


def _format_history_for_prompt(history):

    if not history:
        return ""

    lines = []
    for turn in history:
        speaker = "User" if turn["role"] == "user" else "Assistant"
        lines.append(f"{speaker}: {turn['text']}")

    return "\n".join(lines)


def _get_last_qa_pair(history):

    if not history:
        return ("", "")

    last_user = ""
    last_assistant = ""

    for turn in reversed(history):
        if not last_assistant and turn["role"] == "assistant":
            last_assistant = turn["text"]
        elif not last_user and turn["role"] == "user":
            last_user = turn["text"]

        if last_user and last_assistant:
            break

    return (last_user, last_assistant)


def _build_qa_prompt(question: str, history_turns: list[dict], relevant_chunks: list[dict]) -> str:
    context = "\n\n".join([f"[Page {c['page']}]\n{c['text']}" for c in relevant_chunks])
    conversation_history = _format_history_for_prompt(history_turns)

    return f"""
You are an expert research assistant.

Answer the user's question using the provided conversation history and research paper context.

Rules:
- Wrap your final answer inside explicit <answer>...</answer> XML tags.
- When asked for the paper title, paper name, authors, or affiliations, analyze the Page 1 context carefully, extract the exact Title and Author names (including affiliations if present), and state them clearly in well-structured markdown.
- Do NOT say "Inferred:" or claim context is missing if the title or author details appear anywhere in the provided context.
- Cite page numbers like [Page 1] for explicit claims.
- Be concise, academic, and conversationally aware.
- Strictly DO NOT use markdown tables or ASCII tables. Present comparisons as bullet points or numbered lists only.
- If the latest question is a follow-up (e.g., "are you sure?"), use prior turns from Conversation History to resolve references.

Conversation history:
{conversation_history or "(No prior turns)"}

Context:
{context}

Latest question:
{question}
"""


def answer_question(question, history=None):
    history_turns = _normalize_history(history)
    q_lower = question.lower()

    acknowledgement_phrases = {
        "ok", "okay", "ok good", "great", "nice", "cool", "got it", "understood",
        "thanks", "thank you", "perfect", "alright", "all right"
    }
    if q_lower.strip().rstrip(".! ") in acknowledgement_phrases:
        return "Great - let me know if you want a summary, key findings, or deeper verification from the paper."

    if any(
        phrase in q_lower
        for phrase in [
            "how many pages",
            "total pages",
            "page count",
            "number of pages",
            "pages in the paper",
            "pages does the paper",
        ]
    ):
        total_pages = get_total_pages()
        if total_pages is not None:
            return f"The document has {total_pages} pages based on the extracted file."
        return "Page count not available from the extracted file."

    retrieval_query = _build_retrieval_query(question, history_turns)
    
    if _is_metadata_question(question):
        first_page = get_first_page_chunks(max_chunks=4)
        search_results = search_chunks(retrieval_query)
        seen = set()
        relevant_chunks = []
        for c in first_page + search_results:
            key = c.get("text", "").strip()[:120]
            if key not in seen:
                seen.add(key)
                relevant_chunks.append(c)
    else:
        relevant_chunks = search_chunks(retrieval_query)

    if "limitation" in question.lower() or "limitations" in question.lower():
        if not any("limitation" in c["text"].lower() for c in relevant_chunks):
            return "Inferred: The paper does not explicitly list limitations; likely constraints include reliance on specific datasets and performance sensitivity to sensor noise."

    if not relevant_chunks:
        return "Not mentioned in the paper."

    prompt = _build_qa_prompt(question, history_turns, relevant_chunks)

    response = _create_chat_with_fallback(
        [
            {
                "role": "system",
                "content": "You are a contextual research assistant. Extract exact paper metadata and resolve follow-up questions from context accurately.",
            },
            {"role": "user", "content": prompt},
        ]
    )

    return _sanitize_no_table_output(response.choices[0].message.content)


def stream_answer(question, history=None):
    history_turns = _normalize_history(history)
    q_lower = question.lower()

    acknowledgement_phrases = {
        "ok", "okay", "ok good", "great", "nice", "cool", "got it", "understood",
        "thanks", "thank you", "perfect", "alright", "all right"
    }
    if q_lower.strip().rstrip(".! ") in acknowledgement_phrases:
        yield "Great - let me know if you want a summary, key findings, or deeper verification from the paper."
        return

    if any(
        phrase in q_lower
        for phrase in [
            "how many pages",
            "total pages",
            "page count",
            "number of pages",
            "pages in the paper",
            "pages does the paper",
        ]
    ):
        total_pages = get_total_pages()
        if total_pages is not None:
            yield f"The document has {total_pages} pages based on the extracted file."
        else:
            yield "Page count not available from the extracted file."
        return

    retrieval_query = _build_retrieval_query(question, history_turns)
    
    if _is_metadata_question(question):
        first_page = get_first_page_chunks(max_chunks=4)
        search_results = search_chunks(retrieval_query)
        seen = set()
        relevant_chunks = []
        for c in first_page + search_results:
            key = c.get("text", "").strip()[:120]
            if key not in seen:
                seen.add(key)
                relevant_chunks.append(c)
    else:
        relevant_chunks = search_chunks(retrieval_query)

    if "limitation" in question.lower() or "limitations" in question.lower():
        if not any("limitation" in c["text"].lower() for c in relevant_chunks):
            yield "Inferred: The paper does not explicitly list limitations; likely constraints include reliance on specific datasets and performance sensitivity to sensor noise."
            return

    if not relevant_chunks:
        yield "Not mentioned in the paper."
        return

    prompt = _build_qa_prompt(question, history_turns, relevant_chunks)

    stream_messages = [
        {
            "role": "system",
            "content": "You are a contextual research assistant. Extract exact paper metadata and resolve follow-up questions from context accurately.",
        },
        {"role": "user", "content": prompt},
    ]

    buffered_tokens = []
    for token in _stream_chat_with_fallback(stream_messages):
        buffered_tokens.append(token)

    sanitized = _sanitize_no_table_output("".join(buffered_tokens))
    yield sanitized


def answer_question_with_pgvector(
    question: str,
    paper_id: str,
    history: list | None = None,
) -> str:
    """
    RAG-based question answering using Supabase pgvector for chunk retrieval.
    Retrieves top-k semantically similar chunks for the given paper_id,
    then passes them as context to Groq LLaMA 3.
    """
    from app.services.retrieval import search_pgvector_chunks

    history_turns = _normalize_history(history)
    q_lower = question.lower()

    acknowledgement_phrases = {
        "ok", "okay", "ok good", "great", "nice", "cool", "got it", "understood",
        "thanks", "thank you", "perfect", "alright", "all right"
    }
    if q_lower.strip().rstrip(".! ") in acknowledgement_phrases:
        return "Great - let me know if you have any questions about the paper."

    retrieval_query = _build_retrieval_query(question, history_turns)

    if _is_metadata_question(question):
        from app.services.embedding import fetch_all_chunks_from_pgvector
        all_chunks = fetch_all_chunks_from_pgvector(paper_id)
        first_page = [c for c in all_chunks if c.get("page") in (0, 1)] or all_chunks[:3]
        search_results = search_pgvector_chunks(paper_id, retrieval_query, top_k=5)
        seen = set()
        relevant_chunks = []
        for c in first_page + search_results:
            key = c.get("text", "").strip()[:120]
            if key not in seen:
                seen.add(key)
                relevant_chunks.append(c)
    else:
        relevant_chunks = search_pgvector_chunks(paper_id, retrieval_query, top_k=5)

    if not relevant_chunks:
        return "The relevant content was not found in this paper."

    prompt = _build_qa_prompt(question, history_turns, relevant_chunks)

    response = _create_chat_with_fallback(
        [
            {
                "role": "system",
                "content": "You are a precise research assistant that extracts metadata and answers questions strictly based on provided paper context.",
            },
            {"role": "user", "content": prompt},
        ]
    )

    return _sanitize_no_table_output(response.choices[0].message.content)

