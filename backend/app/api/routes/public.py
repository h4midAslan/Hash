from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.services.database import get_db
from app.models.user import User
from app.models.certificate import Certificate
from app.models.project import Project

router = APIRouter(prefix="/api/public", tags=["public"])


@router.get("/profile/{identifier}")
def get_public_profile(identifier: str, db: Session = Depends(get_db)):
    # Resolve by numeric id only (username lookup disabled until column is live)
    user = None
    try:
        uid = int(identifier)
        user = db.query(User).filter(User.id == uid).first()
    except ValueError:
        pass  # username lookup re-enabled after DB migration

    if not user:
        raise HTTPException(status_code=404, detail="Profil tapılmadı")

    certs = db.query(Certificate).filter(Certificate.user_id == user.id).order_by(Certificate.issue_date.desc()).all()
    projects = db.query(Project).filter(Project.user_id == user.id).order_by(Project.id.desc()).all()

    return {
        "id": user.id,
        "username": user.username,
        "full_name": user.full_name,
        "headline": user.headline,
        "bio": user.bio,
        "profile_picture": user.profile_picture,
        "major": user.major,
        "faculty": user.faculty,
        "course": user.course,
        "skills": user.skills,
        "github_url": user.github_url,
        "linkedin_url": user.linkedin_url,
        "website_url": user.website_url,
        "is_open_for_team": user.is_open_for_team,
        "certificates": [
            {
                "id": c.id,
                "name": c.name,
                "issuer": c.issuer,
                "issue_date": str(c.issue_date) if c.issue_date else None,
                "credential_url": c.credential_url,
                "image_url": c.image_url,
            }
            for c in certs
        ],
        "projects": [
            {
                "id": p.id,
                "title": p.title,
                "description": p.description,
                "github_url": p.github_url,
                "live_url": getattr(p, "live_url", None),
                "technologies": p.technologies,
            }
            for p in projects
        ],
    }
