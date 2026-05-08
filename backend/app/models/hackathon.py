from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime
from sqlalchemy.sql import func
from app.models.base import Base


class Hackathon(Base):
    __tablename__ = "hackathons"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    url = Column(String(1000), nullable=False)
    description = Column(Text)
    deadline = Column(String(100))
    trusted = Column(Boolean, default=False)
    scraped_at = Column(DateTime(timezone=True), server_default=func.now())
