from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean
from sqlalchemy.sql import func
from app.services.database import Base


class Contest(Base):
    __tablename__ = "contests"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    prize = Column(String(100), nullable=False)
    deadline = Column(DateTime(timezone=True), nullable=False)
    tags = Column(Text, nullable=False, default="#HashCampus")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
