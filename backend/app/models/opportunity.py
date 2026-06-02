from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Date
from sqlalchemy.sql import func
from app.models.base import Base


class Opportunity(Base):
    __tablename__ = "opportunities"

    id           = Column(Integer, primary_key=True, index=True)
    title        = Column(String(500), nullable=False)
    organizer    = Column(String(255), nullable=False)
    category     = Column(String(50), nullable=False)   # hackathon|staj|teqaud|tedbir|proqram
    deadline     = Column(Date, nullable=True)
    location     = Column(String(255), nullable=True)
    prize        = Column(String(100), nullable=True)
    description  = Column(Text, nullable=True)
    tags         = Column(Text, nullable=True)           # JSON array string
    url          = Column(String(1000), nullable=False)
    logo_url     = Column(String(1000), nullable=True)
    is_featured  = Column(Boolean, default=False)
    is_active    = Column(Boolean, default=True)
    difficulty   = Column(String(50), nullable=True)
    source_name  = Column(String(100), nullable=True)   # hansı mənbədən
    content_hash = Column(String(64), nullable=True)    # change detection
    created_at   = Column(DateTime(timezone=True), server_default=func.now())
    updated_at   = Column(DateTime(timezone=True), onupdate=func.now())

    @property
    def is_new(self):
        from datetime import datetime, timezone, timedelta
        if not self.created_at:
            return False
        return (datetime.now(timezone.utc) - self.created_at) < timedelta(days=7)
