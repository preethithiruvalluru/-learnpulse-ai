from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, Role
from app.models.drift_report import DriftReport
from app.models.attempt import Attempt
from app.schemas.all import UserResponse, DriftReportResponse, AlertResponse, StudentDetailResponse, PollCreate, PollResponse
from app.utils.security import get_current_active_instructor
from app.models.poll import Poll
from typing import List, Dict, Any
from collections import defaultdict
from datetime import datetime, timedelta

router = APIRouter(prefix="/instructor", tags=["Instructor"])

@router.get("/students", response_model=List[UserResponse])
def get_students(
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_active_instructor)
):
    students = db.query(User).filter(User.role == Role.STUDENT).all()
    return students

@router.get("/drift-reports", response_model=List[DriftReportResponse])
def get_drift_reports(
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_active_instructor)
):
    reports = db.query(DriftReport).order_by(DriftReport.timestamp.desc()).all()
    return reports

@router.get("/drift-report/{student_id}", response_model=List[DriftReportResponse])
def get_student_drift_reports(
    student_id: int,
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_active_instructor)
):
    reports = db.query(DriftReport).filter(
        DriftReport.student_id == student_id
    ).order_by(DriftReport.timestamp.asc()).all()
    return reports

@router.get("/alerts", response_model=List[AlertResponse])
def get_alerts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_instructor)
):
    """Get all high-risk and warning alerts for instructor."""
    # Get latest report per student
    subquery = (
        db.query(DriftReport.student_id, DriftReport.id)
        .order_by(DriftReport.student_id, DriftReport.timestamp.desc())
        .all()
    )
    
    # Deduplicate to get latest per student
    seen = set()
    latest_ids = []
    for sid, rid in subquery:
        if sid not in seen:
            seen.add(sid)
            latest_ids.append(rid)
    
    reports = db.query(DriftReport).filter(
        DriftReport.id.in_(latest_ids),
        DriftReport.risk_level.in_(["High Risk", "Warning"])
    ).order_by(DriftReport.drift_score.desc()).all()
    
    alerts = []
    for r in reports:
        student = db.query(User).filter(User.id == r.student_id).first()
        if student:
            alerts.append({
                "student_id": r.student_id,
                "student_name": student.username,
                "drift_score": r.drift_score,
                "risk_level": r.risk_level,
                "behavior_classification": r.behavior_classification,
                "ai_insight": r.ai_insight or "",
                "timestamp": r.timestamp
            })
    return alerts

@router.get("/student-detail/{student_id}")
def get_student_detail(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_instructor)
):
    """Get detailed metrics for a specific student."""
    student = db.query(User).filter(User.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    attempts = db.query(Attempt).filter(
        Attempt.student_id == student_id
    ).order_by(Attempt.timestamp.asc()).all()
    
    latest_report = db.query(DriftReport).filter(
        DriftReport.student_id == student_id
    ).order_by(DriftReport.timestamp.desc()).first()
    
    # Compute topic stats
    topic_stats = defaultdict(lambda: {"total": 0, "correct": 0, "wrong": 0, "total_time": 0.0})
    for a in attempts:
        topic_stats[a.topic]["total"] += 1
        topic_stats[a.topic]["total_time"] += a.time_taken
        if a.correct:
            topic_stats[a.topic]["correct"] += 1
        else:
            topic_stats[a.topic]["wrong"] += 1
    
    topic_stats_summary = {}
    for topic, stats in topic_stats.items():
        t = stats["total"]
        topic_stats_summary[topic] = {
            "total": t,
            "correct": stats["correct"],
            "wrong": stats["wrong"],
            "accuracy": round(stats["correct"] / t, 3) if t > 0 else 0.0,
            "avg_time": round(stats["total_time"] / t, 1) if t > 0 else 0.0
        }
    
    total_attempts = len(attempts)
    overall_accuracy = sum(1 for a in attempts if a.correct) / total_attempts if total_attempts > 0 else 0.0
    avg_time = sum(a.time_taken for a in attempts) / total_attempts if total_attempts > 0 else 0.0
    
    return {
        "student": {"id": student.id, "username": student.username, "email": student.email, "role": student.role},
        "latest_report": latest_report,
        "total_attempts": total_attempts,
        "overall_accuracy": round(overall_accuracy, 3),
        "avg_time": round(avg_time, 1),
        "topic_stats": topic_stats_summary
    }

@router.get("/topic-heatmap")
def get_topic_heatmap(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_instructor)
):
    """Get topic-wise error rates across all students for heatmap visualization."""
    attempts = db.query(Attempt).all()
    students = db.query(User).filter(User.role == Role.STUDENT).all()
    
    # Structure: {student_id: {topic: {correct, total}}}
    data = defaultdict(lambda: defaultdict(lambda: {"correct": 0, "total": 0}))
    topics = set()
    
    for a in attempts:
        data[a.student_id][a.topic]["total"] += 1
        topics.add(a.topic)
        if a.correct:
            data[a.student_id][a.topic]["correct"] += 1
    
    heatmap = []
    for student in students:
        row = {"student_id": student.id, "student_name": student.username}
        for topic in sorted(topics):
            stats = data[student.id].get(topic, {"correct": 0, "total": 0})
            t = stats["total"]
            error_rate = round(1.0 - (stats["correct"] / t), 3) if t > 0 else None
            row[topic] = error_rate
        heatmap.append(row)
    
    return {"topics": sorted(list(topics)), "data": heatmap}

@router.post("/polls", response_model=PollResponse)
def create_poll(
    poll: PollCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_instructor)
):
    """Create a new drift poll."""
    new_poll = Poll(
        instructor_id=current_user.id,
        question=poll.question,
        topic=poll.topic,
        status="Active",
        responses=0,
        drift_analysis="Awaiting data..."
    )
    db.add(new_poll)
    db.commit()
    db.refresh(new_poll)
    return new_poll

@router.get("/polls", response_model=List[PollResponse])
def get_polls(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_instructor)
):
    """Get all polls created by the current instructor."""
    polls = db.query(Poll).filter(Poll.instructor_id == current_user.id).order_by(Poll.timestamp.desc()).all()
    return polls

@router.put("/polls/{poll_id}/close", response_model=PollResponse)
def close_poll(
    poll_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_instructor)
):
    """Close an active poll."""
    poll = db.query(Poll).filter(Poll.id == poll_id, Poll.instructor_id == current_user.id).first()
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found")
    
    poll.status = "Closed"
    db.commit()
    db.refresh(poll)
    return poll
