from __future__ import annotations

import logging
from typing import Any

from app.core.config import settings


logger = logging.getLogger(__name__)


def _split_model_list(raw: str | None) -> list[str]:
    if not raw:
        return []
    return [item.strip() for item in str(raw).split(",") if item.strip()]


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
    model_chain = build_model_chain(
        primary_model=primary_model,
        fallback_models=fallback_models,
        allow_default_fallback=allow_default_fallback,
    )

    if not model_chain:
        raise RuntimeError(f"No models configured for task '{task_name}'.")

    attempt_errors = []

    for model_name in model_chain:
        try:
            logger.info("LLM task '%s' using model '%s'", task_name, model_name)
            print(f"[MODEL] task={task_name} model={model_name}")
            return llm_client.chat.completions.create(
                model=model_name,
                messages=messages,
                **kwargs,
            )
        except Exception as exc:
            logger.warning(
                "LLM task '%s' model '%s' failed: %s",
                task_name,
                model_name,
                exc,
            )
            print(f"[MODEL-FALLBACK] task={task_name} failed_model={model_name} reason={exc}")
            attempt_errors.append(f"{model_name}: {exc.__class__.__name__}: {exc}")
            continue

    error_summary = " | ".join(attempt_errors)
    raise RuntimeError(
        f"All model attempts failed for task '{task_name}'. Tried: {', '.join(model_chain)}. Errors: {error_summary}"
    )
