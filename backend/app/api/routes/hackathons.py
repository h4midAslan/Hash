from datetime import datetime, timezone

from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.models.hackathon import Hackathon
from app.services.database import get_db
from app.services.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/hackathons", tags=["hackathons"])

CACHE_TTL_HOURS = 6


class HackathonOut(BaseModel):
    id: int
    title: str
    url: str
    description: str | None
    deadline: str | None
    trusted: bool

    class Config:
        from_attributes = True


def _do_refresh(db: Session):
    from app.services.hackathon_scraper import scrape_hackathons
    import logging
    log = logging.getLogger(__name__)
    try:
        log.info("Hackathon scraping başladı...")
        items = scrape_hackathons()
        db.query(Hackathon).delete()
        for item in items:
            db.add(Hackathon(**item))
        db.commit()
        log.info(f"Hackathon scraping tamamlandı: {len(items)} nəticə.")
    except Exception as e:
        log.error(f"Scraping xətası: {e}")
        db.rollback()


@router.get("", response_model=list[HackathonOut])
def get_hackathons(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    latest = db.query(Hackathon).order_by(Hackathon.scraped_at.desc()).first()
    cache_stale = (
        latest is None
        or (datetime.now(timezone.utc) - latest.scraped_at.replace(tzinfo=timezone.utc)).total_seconds()
        > CACHE_TTL_HOURS * 3600
    )
    if cache_stale:
        background_tasks.add_task(_do_refresh, db)

    return (
        db.query(Hackathon)
        .order_by(Hackathon.trusted.desc(), Hackathon.id.asc())
        .limit(25)
        .all()
    )


@router.post("/refresh")
def manual_refresh(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Yalnız adminlər yeniləyə bilər")
    background_tasks.add_task(_do_refresh, db)
    return {"detail": "Yeniləmə başladı, bir neçə dəqiqə gözləyin."}
