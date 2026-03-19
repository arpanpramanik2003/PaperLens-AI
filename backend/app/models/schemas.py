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


class GapDetectionRequest(BaseModel):

    doc_id: str
