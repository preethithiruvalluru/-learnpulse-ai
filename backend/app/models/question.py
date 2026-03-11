from sqlalchemy import Column, Integer, String, Text, JSON
from app.database import Base

class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    topic = Column(String(100), index=True, nullable=False)
    difficulty = Column(String(50), default="medium")
    content = Column(Text, nullable=False)
    options = Column(JSON, nullable=False)
    correct_option_index = Column(Integer, nullable=False)
