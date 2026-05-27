from sqlalchemy.orm import Session
from app.models.notification import Notification
from app.models.user import User

PUSH_MESSAGES = {
    "post_liked": ("❤️ Bəyənmə", "{name} postunu bəyəndi", "/feed"),
    "post_commented": ("💬 Şərh", "{name} postuna şərh yazdı", "/feed"),
    "connection_request": ("🤝 Birləşmə sorğusu", "{name} sənə birləşmə sorğusu göndərdi", "/connections"),
    "connection_accepted": ("✅ Birləşmə qəbul edildi", "{name} sorğunu qəbul etdi", "/connections"),
    "message": ("✉️ Yeni mesaj", "{name} sənə mesaj göndərdi", "/messages"),
}


def create_notification(db: Session, user_id: int, from_user_id: int, type: str, post_id: int = None):
    if user_id == from_user_id:
        return
    notif = Notification(user_id=user_id, from_user_id=from_user_id, type=type, post_id=post_id)
    db.add(notif)
    db.commit()

    try:
        from app.services.push import send_push_to_user
        tmpl = PUSH_MESSAGES.get(type)
        if tmpl:
            sender = db.query(User.full_name).filter(User.id == from_user_id).scalar() or "Biri"
            title, body, url = tmpl
            body = body.format(name=sender)
            send_push_to_user(db, user_id, title, body, url)
    except Exception:
        pass
