from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.attempt import Attempt
from app.models.question import Question
from app.models.drift_report import DriftReport
from app.models.poll import Poll
from app.models.poll_vote import PollVote
from app.schemas.all import AttemptCreate, AttemptResponse, QuestionResponse, PollClientResponse, PollVoteCreate
from app.utils.security import get_current_active_student, User
from collections import defaultdict
import random

router = APIRouter(prefix="/student", tags=["Student"])

@router.get("/questions", response_model=list[QuestionResponse])
def get_questions(
    topic: str = None,
    limit: int = 5,
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_active_student)
):
    query = db.query(Question)
    if topic:
        query = query.filter(Question.topic == topic)
    questions = query.all()
    if len(questions) > limit:
        questions = random.sample(questions, limit)
    return questions

@router.post("/submit-attempt", response_model=AttemptResponse)
def submit_attempt(
    attempt: AttemptCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_active_student)
):
    new_attempt = Attempt(
        student_id=current_user.id,
        question_id=attempt.question_id,
        correct=attempt.correct,
        time_taken=attempt.time_taken,
        retry_count=attempt.retry_count,
        topic=attempt.topic
    )
    db.add(new_attempt)
    db.commit()
    db.refresh(new_attempt)
    return new_attempt

@router.get("/performance", response_model=list[AttemptResponse])
def get_performance(
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_active_student)
):
    attempts = db.query(Attempt).filter(
        Attempt.student_id == current_user.id
    ).order_by(Attempt.timestamp.asc()).all()
    return attempts

@router.get("/analytics")
def get_student_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_student)
):
    """Get comprehensive analytics for the logged-in student."""
    attempts = db.query(Attempt).filter(
        Attempt.student_id == current_user.id
    ).order_by(Attempt.timestamp.asc()).all()
    
    latest_report = db.query(DriftReport).filter(
        DriftReport.student_id == current_user.id
    ).order_by(DriftReport.timestamp.desc()).first()
    
    # Topic breakdown
    topic_stats = defaultdict(lambda: {"total": 0, "correct": 0, "wrong": 0, "total_time": 0.0, "retries": 0})
    for a in attempts:
        topic_stats[a.topic]["total"] += 1
        topic_stats[a.topic]["total_time"] += a.time_taken
        topic_stats[a.topic]["retries"] += a.retry_count
        if a.correct:
            topic_stats[a.topic]["correct"] += 1
        else:
            topic_stats[a.topic]["wrong"] += 1

    topic_breakdown = []
    for topic, stats in topic_stats.items():
        t = stats["total"]
        topic_breakdown.append({
            "topic": topic,
            "total": t,
            "correct": stats["correct"],
            "wrong": stats["wrong"],
            "accuracy": round(stats["correct"] / t, 3) if t > 0 else 0.0,
            "avg_time": round(stats["total_time"] / t, 1) if t > 0 else 0.0,
            "avg_retries": round(stats["retries"] / t, 2) if t > 0 else 0.0,
        })

    # Time series: accuracy in rolling windows (every 5 attempts)
    accuracy_timeline = []
    for i in range(0, len(attempts), 5):
        window = attempts[i:i+5]
        if window:
            acc = sum(1 for a in window if a.correct) / len(window)
            avg_t = sum(a.time_taken for a in window) / len(window)
            accuracy_timeline.append({
                "batch": i // 5 + 1,
                "accuracy": round(acc * 100, 1),
                "avg_time": round(avg_t, 1),
                "label": f"Batch {i // 5 + 1}"
            })

    total = len(attempts)
    overall_accuracy = sum(1 for a in attempts if a.correct) / total * 100 if total > 0 else 0.0
    avg_time = sum(a.time_taken for a in attempts) / total if total > 0 else 0.0
    total_retries = sum(a.retry_count for a in attempts)

    return {
        "student_id": current_user.id,
        "total_attempts": total,
        "overall_accuracy": round(overall_accuracy, 1),
        "avg_time": round(avg_time, 1),
        "total_retries": total_retries,
        "topic_breakdown": topic_breakdown,
        "accuracy_timeline": accuracy_timeline,
        "latest_report": latest_report,
    }

@router.get("/drift-history")
def get_drift_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_student)
):
    """Get the student's drift score history over time."""
    reports = db.query(DriftReport).filter(
        DriftReport.student_id == current_user.id
    ).order_by(DriftReport.timestamp.asc()).all()
    
    return [
        {
            "id": r.id,
            "drift_score": r.drift_score,
            "risk_level": r.risk_level,
            "behavior_classification": r.behavior_classification,
            "timestamp": r.timestamp.isoformat() if r.timestamp else None
        }
        for r in reports
    ]

@router.get("/polls", response_model=list[PollClientResponse])
def get_active_polls(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_student)
):
    """Get active polls that the student has not voted on yet."""
    # Find active polls
    active_polls = db.query(Poll).filter(Poll.status == "Active").all()
    
    # Check which polls this student has already voted on
    unvoted_polls = []
    for poll in active_polls:
        existing_vote = db.query(PollVote).filter(
            PollVote.poll_id == poll.id,
            PollVote.student_id == current_user.id
        ).first()
        if not existing_vote:
            unvoted_polls.append(poll)
            
    return unvoted_polls

@router.post("/polls/{poll_id}/vote")
def submit_poll_vote(
    poll_id: int,
    vote: PollVoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_student)
):
    """Submit a vote for an active poll."""
    poll = db.query(Poll).filter(Poll.id == poll_id, Poll.status == "Active").first()
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found or already closed")
        
    # Check if already voted
    existing_vote = db.query(PollVote).filter(
        PollVote.poll_id == poll_id,
        PollVote.student_id == current_user.id
    ).first()
    if existing_vote:
        raise HTTPException(status_code=400, detail="Already voted on this poll")
        
    # Record the vote
    new_vote = PollVote(
        poll_id=poll_id,
        student_id=current_user.id,
        response=vote.response
    )
    db.add(new_vote)
    
    # Simple drift analysis logic for demo purposes based on votes
    poll.responses += 1
    
    votes = db.query(PollVote).filter(PollVote.poll_id == poll_id).all()
    negative_votes = sum(1 for v in votes if v.response in ["No", "Difficult", "Not Sure", "Needs Help", "False", "No idea"])
    
    if poll.responses > 0:
        drift_pct = negative_votes / poll.responses
        if drift_pct >= 0.6:
            poll.drift_analysis = "High Drift - Urgent intervention required (many students are struggling)"
        elif drift_pct >= 0.3:
            poll.drift_analysis = "Moderate Drift - Some students need help"
        else:
            poll.drift_analysis = "No Drift - Students are understanding well"
    
    db.commit()
    return {"status": "success", "message": "Vote recorded"}
