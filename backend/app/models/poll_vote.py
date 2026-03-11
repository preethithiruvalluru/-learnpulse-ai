from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from datetime import datetime
from app.database import Base

class PollVote(Base):
    __tablename__ = "poll_votes"

    id = Column(Integer, primary_key=True, index=True)
    poll_id = Column(Integer, ForeignKey("polls.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    response = Column(String(50), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
