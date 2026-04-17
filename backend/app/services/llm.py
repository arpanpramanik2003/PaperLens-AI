"""
Compatibility layer for legacy imports.

All LLM logic has been split into focused modules under app.services.llm_sections.
This file re-exports the same public functions so existing imports continue to work.
"""

from app.services.llm_sections import (
    analyze_paper,
    answer_question,
    answer_question_with_pgvector,
    build_analysis_prompt,
    detect_research_gaps,
    enforce_strict_analysis_format,
    expand_problem_details,
    extract_metrics,
    format_context,
    generate_citation_recommendations,
    generate_dataset_benchmark_finder,
    generate_experiment_plan,
    generate_research_problems,
    get_first_page_chunks,
    get_total_pages,
    pick_chunks_by_keywords,
    sample_chunks_evenly,
    stream_answer,
    stream_completion,
    summarize_chunks,
)


__all__ = [
    "analyze_paper",
    "answer_question",
    "answer_question_with_pgvector",
    "build_analysis_prompt",
    "detect_research_gaps",
    "enforce_strict_analysis_format",
    "expand_problem_details",
    "extract_metrics",
    "format_context",
    "generate_citation_recommendations",
    "generate_dataset_benchmark_finder",
    "generate_experiment_plan",
    "generate_research_problems",
    "get_first_page_chunks",
    "pick_chunks_by_keywords",
    "sample_chunks_evenly",
    "stream_answer",
    "stream_completion",
    "summarize_chunks",
    "get_total_pages",
]
