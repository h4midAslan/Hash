from datetime import datetime, timezone

from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.models.hackathon import Hackathon
from app.services.database import get_db, SessionLocal
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


def _do_refresh():
    from app.services.hackathon_scraper import scrape_hackathons
    db = SessionLocal()
    try:
        print("[HACKATHON] Scraping başladı...", flush=True)
        items = scrape_hackathons()
        print(f"[HACKATHON] {len(items)} nəticə tapıldı, DB-yə yazılır...", flush=True)
        db.query(Hackathon).delete()
        for item in items:
            db.add(Hackathon(**item))
        db.commit()
        print(f"[HACKATHON] Tamamlandı: {len(items)} nəticə.", flush=True)
    except Exception as e:
        print(f"[HACKATHON] Xəta: {e}", flush=True)
        db.rollback()
    finally:
        db.close()


@router.get("", response_model=list[HackathonOut])
def get_hackathons(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.services.hackathon_scraper import is_expired

    count = db.query(Hackathon).count()
    latest = db.query(Hackathon).order_by(Hackathon.scraped_at.desc()).first()

    cache_stale = (
        latest is None
        or (datetime.now(timezone.utc) - latest.scraped_at.replace(tzinfo=timezone.utc)).total_seconds()
        > CACHE_TTL_HOURS * 3600
    )

    # DB boşdursa — sync scrape et (ilk açılış)
    if count == 0:
        _do_refresh()
    elif cache_stale:
        background_tasks.add_task(_do_refresh)

    all_items = (
        db.query(Hackathon)
        .order_by(Hackathon.trusted.desc(), Hackathon.id.asc())
        .all()
    )

    # Keçmiş tarixliləri süz, maks 5 göstər
    active = [h for h in all_items if not is_expired(h.deadline or "")]
    return active[:5]


@router.post("/refresh")
def manual_refresh(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Yalnız adminlər yeniləyə bilər")
    background_tasks.add_task(_do_refresh)
    return {"detail": "Yeniləmə başladı, bir neçə dəqiqə gözləyin."}


@router.get("/test-scrape")
def test_scrape():
    import requests as req
    from bs4 import BeautifulSoup

    HEADERS = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
    }

    results = {}

    # Devpost
    try:
        r = req.get("https://devpost.com/hackathons?status=open", headers=HEADERS, timeout=12)
        soup = BeautifulSoup(r.text, "lxml")
        cards = soup.select("article.hackathon-tile")
        results["devpost"] = {
            "status": r.status_code,
            "cards_found": len(cards),
            "html_snippet": r.text[:300],
        }
    except Exception as e:
        results["devpost"] = {"error": str(e)}

    # MLH
    try:
        r = req.get("https://mlh.io/seasons/2026/events", headers=HEADERS, timeout=12)
        soup = BeautifulSoup(r.text, "lxml")
        events = soup.select(".event")
        results["mlh"] = {
            "status": r.status_code,
            "events_found": len(events),
            "html_snippet": r.text[:300],
        }
    except Exception as e:
        results["mlh"] = {"error": str(e)}

    # Edumap
    try:
        r = req.get("https://edumap.az/musabiqeler", headers=HEADERS, timeout=12)
        soup = BeautifulSoup(r.text, "lxml")
        links = soup.find_all("a", href=True)
        results["edumap"] = {
            "status": r.status_code,
            "links_found": len(links),
            "html_snippet": r.text[:300],
        }
    except Exception as e:
        results["edumap"] = {"error": str(e)}

    return results


@router.get("/status")
def scrape_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Yalnız adminlər")
    count = db.query(Hackathon).count()
    latest = db.query(Hackathon).order_by(Hackathon.scraped_at.desc()).first()

    # DuckDuckGo əlçatanlığını yoxla
    import requests as req
    ddg_ok = False
    ddg_error = ""
    try:
        r = req.get("https://html.duckduckgo.com/html/",
                    params={"q": "hackathon test"},
                    headers={"User-Agent": "Mozilla/5.0"},
                    timeout=8)
        ddg_ok = r.status_code == 200
        ddg_error = f"HTTP {r.status_code}"
    except Exception as e:
        ddg_error = str(e)

    return {
        "table_count": count,
        "last_scraped": latest.scraped_at.isoformat() if latest else None,
        "duckduckgo_reachable": ddg_ok,
        "duckduckgo_error": ddg_error if not ddg_ok else None,
    }
