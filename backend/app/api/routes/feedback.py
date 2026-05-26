from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.services.database import get_db
from app.services.auth import get_current_user
from app.models.user import User
from app.models.feedback import Feedback

router = APIRouter(prefix="/api/feedback", tags=["feedback"])


class FeedbackCreate(BaseModel):
    content: str
    category: str | None = "other"


@router.post("")
def submit_feedback(data: FeedbackCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    content = data.content.strip()
    if not content:
        raise HTTPException(status_code=400, detail="Feedback boş ola bilməz")
    if len(content) > 2000:
        raise HTTPException(status_code=400, detail="Maksimum 2000 simvol")
    fb = Feedback(user_id=current_user.id, content=content, category=data.category or "other")
    db.add(fb)
    db.commit()
    return {"message": "Təşəkkür edirik! Rəyiniz göndərildi."}
