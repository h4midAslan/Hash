from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import date
from app.services.database import get_db
from app.models.user import User
from app.models.certificate import Certificate
from app.models.project import Project
from app.models.experience import Experience

router = APIRouter(prefix="/api/public", tags=["public"])


class PublicExperience(BaseModel):
    id: int
    company: str
    role: str
    start_date: str
    end_date: str | None
    is_current: bool
    description: str | None
    class Config: from_attributes = True


class PublicCertificate(BaseModel):
    id: int
    name: str
    issuer: str
    issue_date: date | None
    credential_url: str | None
    image_url: str | None
    class Config: from_attributes = True


class PublicProject(BaseModel):
    id: int
    title: str
    description: str | None
    github_url: str | None
    technologies: str | None
    image_url: str | None
    class Config: from_attributes = True


class PublicProfileResponse(BaseModel):
    id: int
    username: str | None
    full_name: str
    headline: str | None
    faculty: str | None
    major: str | None
    course: int | None
    bio: str | None
    profile_picture: str | None
    github_url: str | None
    linkedin_url: str | None
    website_url: str | None
    skills: str | None
    languages: str | None
    gpa: float | None
    show_email: bool
    email: str | None       # yalnız show_email=True isə doldurulur
    phone: str | None
    is_open_for_team: bool
    experiences: list[PublicExperience]
    certificates: list[PublicCertificate]
    projects: list[PublicProject]

    class Config: from_attributes = True


@router.get("/u/{username}", response_model=PublicProfileResponse)
def get_public_profile(username: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == username.lower()).first()
    if not user:
        raise HTTPException(status_code=404, detail="Profil tapılmadı")

    experiences = db.query(Experience).filter(Experience.user_id == user.id).order_by(Experience.start_date.desc()).all()
    certificates = db.query(Certificate).filter(Certificate.user_id == user.id).all()
    projects = db.query(Project).filter(Project.user_id == user.id).all()

    return {
        "id": user.id,
        "username": user.username,
        "full_name": user.full_name,
        "headline": user.headline,
        "faculty": user.faculty,
        "major": user.major,
        "course": user.course,
        "bio": user.bio,
        "profile_picture": user.profile_picture,
        "github_url": user.github_url,
        "linkedin_url": user.linkedin_url,
        "website_url": user.website_url,
        "skills": user.skills,
        "languages": user.languages,
        "gpa": user.gpa,
        "show_email": user.show_email or False,
        "email": user.email if user.show_email else None,
        "phone": user.phone,
        "is_open_for_team": user.is_open_for_team or False,
        "experiences": experiences,
        "certificates": certificates,
        "projects": projects,
    }
