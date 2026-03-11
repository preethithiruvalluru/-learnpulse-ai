# LearnPulse AI – Concept Drift Detection System

## Overview
LearnPulse AI is a comprehensive Concept Drift Detection System designed to identify behavioral changes in student learning patterns using machine learning and concept drift detection techniques.

## Features
- **Student Learning Behavior Monitoring**: Track student interactions, quiz attempts, and learning metrics.
- **Concept Drift Detection**: Utilize machine learning to detect when a student experiences concept drift (a fundamental change in their understanding).
- **Instructor Insights Dashboard**: Provide educators with real-time analytics and actionable insights to intervene when students struggle.
- **Real-Time Analytics**: Visualizations of performance and drift reports.
- **Secure Authentication**: Robust user authentication and authorization.
- **REST API Backend**: Scalable FastAPI implementation.

## Tech Stack
- **Frontend**: React, Vite, Tailwind CSS, Axios, Recharts
- **Backend**: Python, FastAPI, SQLAlchemy
- **Machine Learning**: Scikit-learn, River (concept drift detection), TensorFlow
- **Database**: SQLite (Development) / MySQL / PostgreSQL (Production ready)
- **Tools**: Git, GitHub

## System Architecture
The application flow consists of a structured data pipeline:
`Frontend (React)` $\to$ `FastAPI Backend` $\to$ `Machine Learning Models` $\to$ `Database` $\to$ `Dashboard Visualizations`

## Installation Guide

### Backend Setup
```bash
cd backend
python -m venv venv

# Windows
.\venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## API Endpoints Overview
- `POST /auth/login`: Authenticate users (Instructors/Students).
- `POST /auth/register`: Register new users.
- `GET /instructor/analytics`: Retrieve aggregate student analytics.
- `GET /student/performance`: Retrieve student's attempt records.
- `POST /ml/detect-drift`: Perform concept drift detection.

## Future Improvements
- Real-time data streaming and WebSockets for live monitoring.
- Advanced deep learning models for drift prediction.
- Mobile instructor application.
- Automated AI-driven intervention recommendations.

## Author
B.Tech Computer Science Student Project
