from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.models.user import Role

# User Schemas
class UserBase(BaseModel):
    username: str
    email: str
    role: Role

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int

    class Config:
        from_attributes = True

# Auth Schemas
class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[Role] = None

# Question Schemas
class QuestionResponse(BaseModel):
    id: int
    topic: str
    difficulty: str
    content: str
    options: List[str]
    correct_option_index: int

    class Config:
        from_attributes = True

# Attempt Schemas
class AttemptCreate(BaseModel):
    question_id: int
    correct: bool
    time_taken: float
    retry_count: int
    topic: str

class AttemptResponse(AttemptCreate):
    id: int
    student_id: int
    timestamp: datetime

    class Config:
        from_attributes = True

class DriftReportResponse(BaseModel):
    id: int
    student_id: int
    drift_score: float
    recent_accuracy_drop: float
    time_change_factor: float
    retry_increase_factor: float
    anomaly_score: float
    guess_probability: Optional[float] = 0.0
    consistency_score: Optional[float] = 0.0
    learning_velocity: Optional[float] = 0.0
    behavior_classification: str
    risk_level: str
    ai_insight: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True

# Student Analytics (extended)
class TopicStat(BaseModel):
    topic: str
    total: int
    correct: int
    wrong: int
    accuracy: float
    avg_time: float

class StudentAnalytics(BaseModel):
    student_id: int
    total_attempts: int
    overall_accuracy: float
    avg_time: float
    total_retries: int
    topic_stats: List[TopicStat]
    latest_drift_score: Optional[float] = None
    latest_risk_level: Optional[str] = None

# Alert Schemas
class AlertResponse(BaseModel):
    student_id: int
    student_name: str
    drift_score: float
    risk_level: str
    behavior_classification: str
    ai_insight: str
    timestamp: datetime

    class Config:
        from_attributes = True

# Instructor Student Detail
class StudentDetailResponse(BaseModel):
    student: UserResponse
    latest_report: Optional[DriftReportResponse] = None
    total_attempts: int
    overall_accuracy: float
    topic_stats: Dict[str, Any] = {}

# Poll Schemas
class PollBase(BaseModel):
    question: str
    topic: str
    status: Optional[str] = "Active"

class PollCreate(PollBase):
    pass

class PollResponse(PollBase):
    id: int
    instructor_id: int
    responses: int
    drift_analysis: str
    timestamp: datetime

    class Config:
        from_attributes = True

class PollVoteCreate(BaseModel):
    response: str

class PollClientResponse(PollBase):
    id: int
    timestamp: datetime
    
    class Config:
        from_attributes = True


