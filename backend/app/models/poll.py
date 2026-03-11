from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from datetime import datetime
from app.database import Base

class Poll(Base):
    __tablename__ = "polls"

    id = Column(Integer, primary_key=True, index=True)
    instructor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    question = Column(String(500), nullable=False)
    topic = Column(String(100), nullable=False)
    status = Column(String(20), default="Active") # Active or Closed
    responses = Column(Integer, default=0)
    drift_analysis = Column(String(500), default="Awaiting data...")
    timestamp = Column(DateTime, default=datetime.utcnow)
