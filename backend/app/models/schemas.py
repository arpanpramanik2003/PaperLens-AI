from typing import Optional

from pydantic import BaseModel


class AskRequest(BaseModel):

    question: str
    doc_id: Optional[str] = None


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
