from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, Role
from app.models.attempt import Attempt
from app.models.drift_report import DriftReport
from app.schemas.all import DriftReportResponse
from app.utils.security import get_current_user
from app.ml_models.engine import engine_instance

router = APIRouter(prefix="/ml", tags=["Machine Learning"])

@router.post("/analyze-student/{student_id}", response_model=DriftReportResponse)
def analyze_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Run full ML analysis on a student and store a drift report."""
    if current_user.role != Role.INSTRUCTOR and current_user.id != student_id:
        raise HTTPException(status_code=403, detail="Not authorized to analyze this student")

    attempts = db.query(Attempt).filter(
        Attempt.student_id == student_id
    ).order_by(Attempt.timestamp.asc()).all()
    
    if len(attempts) < 5:
        raise HTTPException(
            status_code=400, 
            detail="Not enough data (minimum 5 attempts) to analyze drift."
        )

    attempts_data = [
        {
            "correct": a.correct,
            "time_taken": a.time_taken,
            "retry_count": a.retry_count,
            "topic": a.topic
        }
        for a in attempts
    ]

    result = engine_instance.process_student_sequence(student_id, attempts_data)
    
    if not result:
        raise HTTPException(status_code=500, detail="ML processing failed")

    # Store report in DB
    report = DriftReport(
        student_id=student_id,
        drift_score=result["drift_score"],
        recent_accuracy_drop=result["recent_accuracy_drop"],
        time_change_factor=result["time_change_factor"],
        retry_increase_factor=result["retry_increase_factor"],
        anomaly_score=result["anomaly_score"],
        guess_probability=result.get("guess_probability", 0.0),
        consistency_score=result.get("consistency_score", 0.5),
        learning_velocity=result.get("learning_velocity", 0.0),
        behavior_classification=result["behavior_classification"],
        risk_level=result["risk_level"],
        ai_insight=result["ai_insight"]
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    
    return report

@router.get("/drift-score/{student_id}")
def get_drift_score(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get the latest drift score summary for a student."""
    if current_user.role != Role.INSTRUCTOR and current_user.id != student_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    latest = db.query(DriftReport).filter(
        DriftReport.student_id == student_id
    ).order_by(DriftReport.timestamp.desc()).first()
    
    if not latest:
        return {
            "student_id": student_id,
            "drift_score": None,
            "risk_level": "Unknown",
            "behavior_classification": None,
            "message": "No analysis has been run yet."
        }
    
    return {
        "student_id": student_id,
        "drift_score": latest.drift_score,
        "risk_level": latest.risk_level,
        "behavior_classification": latest.behavior_classification,
        "ai_insight": latest.ai_insight,
        "guess_probability": latest.guess_probability,
        "consistency_score": latest.consistency_score,
        "learning_velocity": latest.learning_velocity,
        "timestamp": latest.timestamp.isoformat()
    }

@router.get("/class-overview")
def get_class_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get overview of drift status for all students (instructor only)."""
    if current_user.role != Role.INSTRUCTOR:
        raise HTTPException(status_code=403, detail="Instructors only")
    
    students = db.query(User).filter(User.role == Role.STUDENT).all()
    
    overview = []
    for s in students:
        latest = db.query(DriftReport).filter(
            DriftReport.student_id == s.id
        ).order_by(DriftReport.timestamp.desc()).first()
        
        attempt_count = db.query(Attempt).filter(Attempt.student_id == s.id).count()
        
        overview.append({
            "student_id": s.id,
            "student_name": s.username,
            "email": s.email,
            "attempt_count": attempt_count,
            "drift_score": latest.drift_score if latest else None,
            "risk_level": latest.risk_level if latest else "Not Analyzed",
            "behavior_classification": latest.behavior_classification if latest else None,
            "last_analyzed": latest.timestamp.isoformat() if latest else None,
        })
    
    return overview
