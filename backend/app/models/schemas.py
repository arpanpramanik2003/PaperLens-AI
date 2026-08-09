from typing import Optional

from pydantic import BaseModel


class AskRequest(BaseModel):

    question: str
    doc_id: Optional[str] = None
    paper_id: Optional[str] = None   # NEW: for pgvector-based RAG
    history: Optional[list[dict]] = None


class ExperimentPlanRequest(BaseModel):

    topic: str
    difficulty: str


class ProblemGeneratorRequest(BaseModel):

    domain: str
    subdomain: str
    complexity: str


class ProblemDetailRequest(BaseModel):

    domain: str
    subdomain: str
    complexity: str
    idea: dict


class GapDetectionRequest(BaseModel):

    doc_id: str


class DatasetBenchmarkFinderRequest(BaseModel):

    project_title: Optional[str] = None
    project_plan: Optional[str] = None


class CitationRecommendationRequest(BaseModel):

    paper_context: Optional[str] = None
    top_cited: list[dict] = []
    missing_references: list[str] = []
    recommendation_mode: Optional[str] = "upload"
    project_title: Optional[str] = None
    basic_details: Optional[str] = None


class CitationDiscoveryRequest(BaseModel):

    project_title: str
    basic_details: Optional[str] = None
    limit: Optional[int] = 35
    topic_preset: Optional[str] = None


class SaveItemRequest(BaseModel):

    section: str
    title: str
    summary: Optional[str] = None
    payload: dict


class ActivityMetadataSchema(BaseModel):
    filename: Optional[str] = None
    topic: Optional[str] = None
    domain: Optional[str] = None
    subdomain: Optional[str] = None
    difficulty: Optional[str] = None
    project_title: Optional[str] = None
    has_project_plan: Optional[bool] = None
    method: Optional[str] = None
    references_processed: Optional[int] = None
    matched_count: Optional[int] = None
    missing_count: Optional[int] = None


class SavedItemPayloadSchema(BaseModel):
    projectTitle: Optional[str] = None
    projectPlan: Optional[str] = None
    domainSummary: Optional[str] = None
    datasets: Optional[list[dict]] = None
    benchmarks: Optional[list[dict]] = None
    technologies: Optional[list[dict]] = None
    details: Optional[dict] = None


class SavedItemResponse(BaseModel):

    id: int
    section: str
    title: str
    summary: Optional[str] = None
    payload: dict
    created_at: str


# ---------------------------------------------------------------------------
# New schemas for pgvector pipeline
# ---------------------------------------------------------------------------

class UploadPaperResponse(BaseModel):
    paper_id: str
    page_count: int
    chunk_count: int
    status: str
    message: str


class SummarizeResponse(BaseModel):
    paper_id: str
    summary: str
    chunk_count: int
