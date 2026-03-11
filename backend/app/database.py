import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Use environment variable for database URL or fallback to a local SQLite database for ease of testing
# For MySQL: mysql+pymysql://root:password@localhost/learnpulse
DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./learnpulse.db")

# Ensure the database URL handles thread safety if SQLite is used
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
