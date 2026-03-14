from typing import Optional

from pydantic import BaseModel


class AskRequest(BaseModel):

    question: str
    doc_id: Optional[str] = None
