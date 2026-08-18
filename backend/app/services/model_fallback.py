from __future__ import annotations

import logging
from typing import Any

from app.core.config import settings


logger = logging.getLogger(__name__)


DEFAULT_PRIMARY_MODEL = "openai/gpt-oss-120b"
DEFAULT_FALLBACK_MODELS = "openai/gpt-oss-20b,qwen/qwen3.6-27b,openai/gpt-oss-120b"

FAST_ROUTER_MODEL = "openai/gpt-oss-20b"
HEAVY_ANALYTICAL_MODEL = "openai/gpt-oss-120b"


def _split_model_list(raw: str | None) -> list[str]:
    if not raw:
        return []
    return [item.strip() for item in str(raw).split(",") if item.strip()]


def _extract_retry_delay(exc: Exception) -> float | None:
    """Extract recommended retry delay from Groq rate limit exception, if present."""
    import re
    exc_str = str(exc)
    if "429" in exc_str or "rate_limit_exceeded" in exc_str or "rate limit" in exc_str.lower():
        match = re.search(r"try again in (\d+(?:\.\d+)?)s", exc_str, re.IGNORECASE)
        if match:
            try:
                val = float(match.group(1))
                return min(max(val, 1.5), 8.0)
            except ValueError:
                pass
        return 2.5
    return None


def build_model_chain(
    primary_model: str,
    fallback_models: str | None = None,
    *,
    allow_default_fallback: bool = False,
) -> list[str]:
    candidates = []
    candidates.extend(_split_model_list(primary_model))
    candidates.extend(_split_model_list(fallback_models))

    if allow_default_fallback:
        candidates.extend(_split_model_list(settings.MODEL_NAME))

    # Preserve order and remove duplicates.
    deduped = []
    seen = set()
    for model_name in candidates:
        key = model_name.lower()
        if key in seen:
            continue
        seen.add(key)
        deduped.append(model_name)

    return deduped


def create_completion_with_fallback(
    *,
    llm_client: Any,
    task_name: str,
    primary_model: str,
    fallback_models: str | None,
    messages: list[dict[str, Any]],
    allow_default_fallback: bool = False,
    **kwargs: Any,
) -> Any:
    import time

    model_chain = build_model_chain(
        primary_model=primary_model,
        fallback_models=fallback_models,
        allow_default_fallback=allow_default_fallback,
    )

    if not model_chain:
        raise RuntimeError(f"No models configured for task '{task_name}'.")

    attempt_errors = []

    for model_name in model_chain:
        attempt_index = model_chain.index(model_name)
        route_type = "primary" if attempt_index == 0 else "fallback"

        # Allow up to 2 retries on rate limit (429) for each model in chain
        max_retries_per_model = 2
        for retry_attempt in range(max_retries_per_model):
            try:
                logger.info(
                    "LLM task '%s' trying %s model '%s' (attempt %d/%d)",
                    task_name,
                    route_type,
                    model_name,
                    attempt_index + 1,
                    len(model_chain),
                )
                print(
                    f"[MODEL-TRY] task={task_name} route={route_type} model={model_name} "
                    f"chain_step={attempt_index + 1}/{len(model_chain)}"
                )

                response = llm_client.chat.completions.create(
                    model=model_name,
                    messages=messages,
                    **kwargs,
                )

                print(f"[MODEL-SUCCESS] task={task_name} route={route_type} model={model_name}")
                logger.info("LLM task '%s' succeeded with model '%s'", task_name, model_name)
                return response
            except Exception as exc:
                delay = _extract_retry_delay(exc)
                if delay is not None and retry_attempt < max_retries_per_model - 1:
                    logger.warning(
                        "LLM task '%s' model '%s' hit rate limit (429). Retrying in %.2fs... (Retry %d/%d)",
                        task_name,
                        model_name,
                        delay,
                        retry_attempt + 1,
                        max_retries_per_model - 1,
                    )
                    print(f"[MODEL-RATELIMIT-BACKOFF] task={task_name} model={model_name} sleep={delay}s")
                    time.sleep(delay)
                    continue

                logger.warning(
                    "LLM task '%s' model '%s' failed: %s",
                    task_name,
                    model_name,
                    exc,
                )
                print(f"[MODEL-FALLBACK] task={task_name} failed_model={model_name} reason={exc}")
                attempt_errors.append(f"{model_name}: {exc.__class__.__name__}: {exc}")
                break

    error_summary = " | ".join(attempt_errors)
    raise RuntimeError(
        f"All model attempts failed for task '{task_name}'. Tried: {', '.join(model_chain)}. Errors: {error_summary}"
    )

