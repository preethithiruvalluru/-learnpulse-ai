from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.models.user import User
from app.models.question import Question
from app.models.attempt import Attempt
from app.models.drift_report import DriftReport
from app.models.poll import Poll
from app.models.poll_vote import PollVote
from app.routers import auth, student, instructor, ml

# Create tables if they don't exist
# In production, we would use Alembic for migrations
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="LearnPulse AI",
    description="Concept Drift Detection System for Student Learning Behavior",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For research, allow all
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(student.router)
app.include_router(instructor.router)
app.include_router(ml.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to LearnPulse AI API"}

@app.get("/health")
def health_check():
    return {"status": "ok"}
