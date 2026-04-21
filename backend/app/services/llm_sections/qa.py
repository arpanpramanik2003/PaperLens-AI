import logging
import re

from app.services.retrieval import search_chunks

from .analysis import get_first_page_chunks, get_total_pages
from .client import client


logger = logging.getLogger(__name__)

# Dedicated models for conversation QA (kept separate from summary model).
QA_PRIMARY_MODEL = "openai/gpt-oss-120b"
QA_FALLBACK_MODEL = "llama-3.3-70b-versatile"
QA_MAX_TOKENS = 900


def _log_model_event(event: str, model: str, extra: str = "") -> None:

    message = f"[QA_MODEL] event={event} model={model}"
    if extra:
        message += f" {extra}"
    print(message)
    logger.info(message)


def _sanitize_no_table_output(text: str) -> str:

    if not text:
        return text

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

    try:
        response = client.chat.completions.create(
            model=QA_PRIMARY_MODEL,
            max_tokens=QA_MAX_TOKENS,
            messages=messages,
        )
        _log_model_event("primary_success", QA_PRIMARY_MODEL)
        return response
    except Exception as primary_error:
        _log_model_event("primary_failed", QA_PRIMARY_MODEL, f"error={primary_error}")

        response = client.chat.completions.create(
            model=QA_FALLBACK_MODEL,
            max_tokens=QA_MAX_TOKENS,
            messages=messages,
        )
        _log_model_event("fallback_success", QA_FALLBACK_MODEL)
        return response


def _stream_chat_with_fallback(messages: list[dict]):

    try:
        response = client.chat.completions.create(
            model=QA_PRIMARY_MODEL,
            max_tokens=QA_MAX_TOKENS,
            messages=messages,
            stream=True,
        )
        _log_model_event("stream_primary_success", QA_PRIMARY_MODEL)
    except Exception as primary_error:
        _log_model_event("stream_primary_failed", QA_PRIMARY_MODEL, f"error={primary_error}")
        response = client.chat.completions.create(
            model=QA_FALLBACK_MODEL,
            max_tokens=QA_MAX_TOKENS,
            messages=messages,
            stream=True,
        )
        _log_model_event("stream_fallback_success", QA_FALLBACK_MODEL)

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


def answer_question(question, history=None):
    history_turns = _normalize_history(history)
    is_follow_up = _is_follow_up_question(question)
    prev_user_q, prev_assistant_a = _get_last_qa_pair(history_turns)
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

    if "author" in q_lower or "authors" in q_lower:
        first_page = get_first_page_chunks()
        if first_page:
            snippets = []
            for c in first_page:
                snippet = c["text"][:220].strip()
                snippets.append(f"[Page {c['page']}] {snippet}")
            return "Possible author lines from the first page:\n" + "\n".join(snippets)
        else:
            return "Author names not found in the extracted first page."

    retrieval_query = _build_retrieval_query(question, history_turns)
    relevant_chunks = search_chunks(retrieval_query)

    if "limitation" in question.lower() or "limitations" in question.lower():
        if not any("limitation" in c["text"].lower() for c in relevant_chunks):
            return "Inferred: The paper does not explicitly list limitations; likely constraints include reliance on specific datasets and performance sensitivity to sensor noise."

    if not relevant_chunks:
        return "Not mentioned in the paper."

    context = ""

    for c in relevant_chunks:
        context += f"[Page {c['page']}]\n{c['text']}\n\n"

    conversation_history = _format_history_for_prompt(history_turns)
    follow_up_reference = ""

    if is_follow_up and (prev_user_q or prev_assistant_a):
        follow_up_reference = f"""
Follow-up reference:
- Previous user question: {prev_user_q or "(not available)"}
- Previous assistant answer: {prev_assistant_a or "(not available)"}
"""

    prompt = f"""
You are a research assistant.

Answer the latest user question using both conversation history and research paper context.

Rules:
- If the answer is not present, provide a brief inferred answer and label it as "Inferred:".
- Cite page numbers like [Page 5] for any explicit claims.
- Be concise, academic, and conversationally aware.
- Strictly DO NOT use markdown tables or ASCII tables.
- Present comparisons as bullet points or numbered lists only.
- If the latest question is a follow-up (e.g., "are you sure?"), use prior turns to resolve what "that" refers to.
- Do NOT say that prior context is missing when conversation history exists.
- For confirmations like "are you sure?", explicitly confirm or correct the previous answer using the document context.

Conversation history:
{conversation_history or "(No prior turns)"}

{follow_up_reference}

Context:
{context}

Latest question:
{question}
"""

    response = _create_chat_with_fallback(
        [
            {
                "role": "system",
                "content": "You are a contextual research assistant. Resolve follow-up questions from prior turns, do not ask for clarification when enough history is present.",
            },
            {"role": "user", "content": prompt},
        ]
    )

    return _sanitize_no_table_output(response.choices[0].message.content)


def stream_answer(question, history=None):
    history_turns = _normalize_history(history)
    is_follow_up = _is_follow_up_question(question)
    prev_user_q, prev_assistant_a = _get_last_qa_pair(history_turns)
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

    if "author" in q_lower or "authors" in q_lower:
        first_page = get_first_page_chunks()
        if first_page:
            snippets = []
            for c in first_page:
                snippet = c["text"][:220].strip()
                snippets.append(f"[Page {c['page']}] {snippet}")
            yield "Possible author lines from the first page:\n" + "\n".join(snippets)
        else:
            yield "Author names not found in the extracted first page."
        return

    retrieval_query = _build_retrieval_query(question, history_turns)
    relevant_chunks = search_chunks(retrieval_query)

    if "limitation" in question.lower() or "limitations" in question.lower():
        if not any("limitation" in c["text"].lower() for c in relevant_chunks):
            yield "Inferred: The paper does not explicitly list limitations; likely constraints include reliance on specific datasets and performance sensitivity to sensor noise."
            return

    if not relevant_chunks:
        yield "Not mentioned in the paper."
        return

    context = ""

    for c in relevant_chunks:
        context += f"[Page {c['page']}]\n{c['text']}\n\n"

    conversation_history = _format_history_for_prompt(history_turns)
    follow_up_reference = ""

    if is_follow_up and (prev_user_q or prev_assistant_a):
        follow_up_reference = f"""
Follow-up reference:
- Previous user question: {prev_user_q or "(not available)"}
- Previous assistant answer: {prev_assistant_a or "(not available)"}
"""

    prompt = f"""
You are a research assistant.

Answer the latest user question using both conversation history and research paper context.

Rules:
- If the answer is not present, provide a brief inferred answer and label it as "Inferred:".
- Cite page numbers like [Page 5] for any explicit claims.
- Be concise, academic, and conversationally aware.
- Strictly DO NOT use markdown tables or ASCII tables.
- Present comparisons as bullet points or numbered lists only.
- If the latest question is a follow-up (e.g., "are you sure?"), use prior turns to resolve what "that" refers to.
- Do NOT say that prior context is missing when conversation history exists.
- For confirmations like "are you sure?", explicitly confirm or correct the previous answer using the document context.

Conversation history:
{conversation_history or "(No prior turns)"}

{follow_up_reference}

Context:
{context}

Latest question:
{question}
"""

    stream_messages = [
        {
            "role": "system",
            "content": "You are a contextual research assistant. Resolve follow-up questions from prior turns, do not ask for clarification when enough history is present.",
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

    Reuses all existing conversation history helpers from answer_question().
    """
    from app.services.retrieval import search_pgvector_chunks

    history_turns = _normalize_history(history)
    is_follow_up = _is_follow_up_question(question)
    prev_user_q, prev_assistant_a = _get_last_qa_pair(history_turns)
    q_lower = question.lower()

    # Handle acknowledgements
    acknowledgement_phrases = {
        "ok", "okay", "ok good", "great", "nice", "cool", "got it", "understood",
        "thanks", "thank you", "perfect", "alright", "all right"
    }
    if q_lower.strip().rstrip(".! ") in acknowledgement_phrases:
        return "Great - let me know if you have any questions about the paper."

    # Build retrieval query (handles follow-up questions context)
    retrieval_query = _build_retrieval_query(question, history_turns)

    # Retrieve top-k chunks from pgvector
    relevant_chunks = search_pgvector_chunks(paper_id, retrieval_query, top_k=5)

    if not relevant_chunks:
        return "The relevant content was not found in this paper."

    # Format context
    context = "\n\n".join(
        [f"[Page {c['page']}]\n{c['text']}" for c in relevant_chunks]
    )

    conversation_history = _format_history_for_prompt(history_turns)
    follow_up_reference = ""

    if is_follow_up and (prev_user_q or prev_assistant_a):
        follow_up_reference = f"""
Follow-up reference:
- Previous user question: {prev_user_q or "(not available)"}
- Previous assistant answer: {prev_assistant_a or "(not available)"}
"""

    prompt = f"""You are a research assistant.

Answer the latest question strictly using the provided research paper context.

Rules:
- If the answer is not explicitly in the context, say "Not explicitly mentioned in this paper."
- Cite page numbers like [Page 5] for any explicit claims.
- Be concise, academic, and conversationally aware.
- Strictly DO NOT use markdown tables or ASCII tables.
- Present comparisons as bullet points or numbered lists only.
- If the question is a follow-up, use conversation history to resolve references.

Conversation history:
{conversation_history or "(No prior turns)"}

{follow_up_reference}

Context from paper:
{context}

Latest question:
{question}
"""

    response = _create_chat_with_fallback(
        [
            {
                "role": "system",
                "content": "You are a precise research assistant that answers questions strictly based on provided paper context.",
            },
            {"role": "user", "content": prompt},
        ]
    )

    return _sanitize_no_table_output(response.choices[0].message.content)
