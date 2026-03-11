from sqlalchemy import Column, Integer, String, Enum
from app.database import Base
import enum

class Role(str, enum.Enum):
    STUDENT = "student"
    INSTRUCTOR = "instructor"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(200), nullable=False)
    role = Column(Enum(Role), nullable=False, default=Role.STUDENT)
