import json
from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.services.database import get_db
from app.services.auth import get_current_user
from app.models.opportunity import Opportunity
from app.models.user import User

router = APIRouter(prefix="/api/opportunities", tags=["opportunities"])


class OpportunityOut(BaseModel):
    id: int
    title: str
    organizer: str
    category: str
    deadline: Optional[date] = None
    location: Optional[str] = None
    prize: Optional[str] = None
    description: Optional[str] = None
    tags: list[str] = []
    url: str
    logo_url: Optional[str] = None
    is_featured: bool = False
    is_new: bool = False
    difficulty: Optional[str] = None
    source_name: Optional[str] = None
    days_left: Optional[int] = None

    class Config:
        from_attributes = True


def _build_out(o: Opportunity) -> OpportunityOut:
    tags = []
    if o.tags:
        try:
            tags = json.loads(o.tags)
        except Exception:
            tags = [t.strip() for t in o.tags.split(",") if t.strip()]

    days_left = None
    if o.deadline:
        days_left = (o.deadline - date.today()).days

    return OpportunityOut(
        id=o.id,
        title=o.title,
        organizer=o.organizer,
        category=o.category,
        deadline=o.deadline,
        location=o.location,
        prize=o.prize,
        description=o.description,
        tags=tags,
        url=o.url,
        logo_url=o.logo_url,
        is_featured=o.is_featured,
        is_new=o.is_new,
        difficulty=o.difficulty,
        source_name=o.source_name,
        days_left=days_left,
    )


@router.get("", response_model=list[OpportunityOut])
def list_opportunities(
    category: Optional[str] = Query(None),
    q: Optional[str] = Query(None),
    deadline_filter: Optional[str] = Query(None),  # "week" | "month"
    sort: Optional[str] = Query("newest"),           # "newest" | "deadline" | "prize"
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Opportunity).filter(Opportunity.is_active == True)

    # Vaxtı keçmiş olanları göstərmə
    query = query.filter(
        (Opportunity.deadline == None) | (Opportunity.deadline >= date.today())
    )

    if category and category != "all":
        query = query.filter(Opportunity.category == category)

    if q:
        like = f"%{q}%"
        from sqlalchemy import or_
        query = query.filter(
            or_(
                Opportunity.title.ilike(like),
                Opportunity.organizer.ilike(like),
                Opportunity.tags.ilike(like),
                Opportunity.description.ilike(like),
            )
        )

    if deadline_filter == "week":
        from datetime import timedelta
        query = query.filter(
            Opportunity.deadline != None,
            Opportunity.deadline <= date.today() + timedelta(days=7),
        )
    elif deadline_filter == "month":
        from datetime import timedelta
        query = query.filter(
            Opportunity.deadline != None,
            Opportunity.deadline <= date.today() + timedelta(days=30),
        )

    if sort == "deadline":
        query = query.order_by(
            Opportunity.is_featured.desc(),
            Opportunity.deadline.asc().nullslast(),
        )
    else:
        query = query.order_by(
            Opportunity.is_featured.desc(),
            Opportunity.created_at.desc(),
        )

    opps = query.limit(100).all()
    return [_build_out(o) for o in opps]


@router.get("/stats")
def get_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    total = db.query(Opportunity).filter(
        Opportunity.is_active == True,
        (Opportunity.deadline == None) | (Opportunity.deadline >= date.today()),
    ).count()

    by_cat = {}
    for cat in ["hackathon", "staj", "teqaud", "tedbir", "proqram"]:
        by_cat[cat] = db.query(Opportunity).filter(
            Opportunity.is_active == True,
            Opportunity.category == cat,
            (Opportunity.deadline == None) | (Opportunity.deadline >= date.today()),
        ).count()

    return {"total": total, "by_category": by_cat}


@router.get("/{opp_id}", response_model=OpportunityOut)
def get_opportunity(
    opp_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from fastapi import HTTPException
    o = db.query(Opportunity).filter(Opportunity.id == opp_id).first()
    if not o:
        raise HTTPException(404, "Tapılmadı")
    return _build_out(o)
