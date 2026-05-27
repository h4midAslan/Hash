from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.services.database import get_db
from app.services.auth import get_current_user
from app.models.user import User
from app.models.push_subscription import PushSubscription
from app.config import settings

router = APIRouter(prefix="/api/push", tags=["push"])


class SubscribeRequest(BaseModel):
    endpoint: str
    p256dh: str
    auth: str


@router.get("/vapid-public-key")
def get_vapid_public_key():
    return {"public_key": settings.VAPID_PUBLIC_KEY}


@router.post("/subscribe")
def subscribe(data: SubscribeRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    existing = db.query(PushSubscription).filter(PushSubscription.endpoint == data.endpoint).first()
    if existing:
        existing.user_id = current_user.id
        existing.p256dh = data.p256dh
        existing.auth = data.auth
    else:
        sub = PushSubscription(
            user_id=current_user.id,
            endpoint=data.endpoint,
            p256dh=data.p256dh,
            auth=data.auth,
        )
        db.add(sub)
    db.commit()
    return {"message": "Abunə olundu"}


@router.post("/unsubscribe")
def unsubscribe(data: SubscribeRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db.query(PushSubscription).filter(
        PushSubscription.endpoint == data.endpoint,
        PushSubscription.user_id == current_user.id,
    ).delete()
    db.commit()
    return {"message": "Abunəlik ləğv edildi"}
