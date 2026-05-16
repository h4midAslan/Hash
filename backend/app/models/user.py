from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.sql import func
from app.models.base import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    faculty = Column(String(255))  # fakultə
    major = Column(String(255))  # ixtisas
    course = Column(Integer)  # kurs (1-4)
    headline = Column(String(255))  # "Frontend Developer | 3-cu kurs"
    bio = Column(Text)
    profile_picture = Column(String(500))
    phone = Column(String(50))
    github_url = Column(String(500))
    linkedin_url = Column(String(500))
    website_url = Column(String(500))
    skills = Column(Text)  # comma-separated: "Python,React,Design"
    certificates = Column(Text)  # comma-separated
    is_open_for_team = Column(Boolean, default=False)  # komanda ucun aciq
    is_admin = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    verification_token = Column(String(255), nullable=True)
    last_seen = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
