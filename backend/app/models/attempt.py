from sqlalchemy import Column, Integer, Float, Boolean, ForeignKey, DateTime, String
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Attempt(Base):
    __tablename__ = "attempts"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id"), index=True, nullable=False)
    
    # Required data points for Drift Detection
    correct = Column(Boolean, nullable=False)
    time_taken = Column(Float, nullable=False)  # in seconds
    retry_count = Column(Integer, default=0)
    timestamp = Column(DateTime, default=datetime.utcnow)

    # Derived or additional info
    topic = Column(String(100), index=True)

    user = relationship("User")
    question = relationship("Question")
