from sqlalchemy import Column, Integer, Float, String, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class DriftReport(Base):
    __tablename__ = "drift_reports"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    
    # Core calculated metrics
    drift_score = Column(Float, nullable=False)  # 0 to 1
    recent_accuracy_drop = Column(Float, default=0.0)
    time_change_factor = Column(Float, default=0.0)
    retry_increase_factor = Column(Float, default=0.0)
    anomaly_score = Column(Float, default=0.0)

    # Advanced behavioral metrics
    guess_probability = Column(Float, default=0.0)
    consistency_score = Column(Float, default=0.5)
    learning_velocity = Column(Float, default=0.0)

    # Classifications
    behavior_classification = Column(String(100))  # e.g. "Conceptual Learner", "Guessing Behavior"
    risk_level = Column(String(50))  # "Normal", "Warning", "High Risk"
    
    # Generated Insight
    ai_insight = Column(Text)

    timestamp = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")
