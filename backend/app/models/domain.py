from sqlalchemy import Column, Integer, String, DateTime, JSON
from datetime import datetime
from app.core.database import Base

class Document(Base):
    __tablename__ = "documents"
    
    id = Column(String, primary_key=True)
    user_id = Column(String, index=True, nullable=False)
    filename = Column(String, nullable=False)
    title = Column(String)
    status = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class Activity(Base):
    __tablename__ = "activities"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(String, index=True, nullable=False)
    action_type = Column(String, nullable=False)
    metadata_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class SavedItem(Base):
    __tablename__ = "saved_items"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(String, index=True, nullable=False)
    section = Column(String, index=True, nullable=False)
    title = Column(String, nullable=False)
    summary = Column(String, nullable=True)
    payload_json = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
