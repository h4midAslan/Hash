from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func
from app.services.database import get_db
from app.services.auth import get_current_user
from app.services.notifier import create_notification
from app.models.user import User
from app.models.connection import Connection
from app.services.activity_logger import log_activity
import random

router = APIRouter(prefix="/api/connections", tags=["connections"])


@router.post("/{user_id}")
def send_request(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Özünüzə istek göndərə bilməzsiniz")

    existing = db.query(Connection).filter(
        or_(
            and_(Connection.sender_id == current_user.id, Connection.receiver_id == user_id),
            and_(Connection.sender_id == user_id, Connection.receiver_id == current_user.id),
        )
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Bağlantı artıq mövcuddur")

    conn = Connection(sender_id=current_user.id, receiver_id=user_id)
    db.add(conn)
    db.commit()
    create_notification(db, user_id=user_id, from_user_id=current_user.id, type="connection_request")
    target = db.query(User).filter(User.id == user_id).first()
    log_activity(db, action="connection_request", user_id=current_user.id, email=current_user.email, details=target.full_name if target else str(user_id))
    return {"message": "Bağlantı istəyi göndərildi"}


@router.put("/{connection_id}/accept")
def accept_request(connection_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    conn = db.query(Connection).filter(Connection.id == connection_id, Connection.receiver_id == current_user.id).first()
    if not conn:
        raise HTTPException(status_code=404, detail="İstək tapılmadı")

    conn.status = "accepted"
    db.commit()
    create_notification(db, user_id=conn.sender_id, from_user_id=current_user.id, type="connection_accepted")
    sender = db.query(User).filter(User.id == conn.sender_id).first()
    log_activity(db, action="connection_accept", user_id=current_user.id, email=current_user.email, details=sender.full_name if sender else str(conn.sender_id))
    return {"message": "Bağlantı qəbul edildi"}


@router.put("/{connection_id}/reject")
def reject_request(connection_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    conn = db.query(Connection).filter(Connection.id == connection_id, Connection.receiver_id == current_user.id).first()
    if not conn:
        raise HTTPException(status_code=404, detail="İstək tapılmadı")

    conn.status = "rejected"
    db.commit()
    return {"message": "Bağlantı rədd edildi"}


@router.get("/count/{user_id}")
def get_connection_count(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    count = db.query(func.count(Connection.id)).filter(
        or_(Connection.sender_id == user_id, Connection.receiver_id == user_id),
        Connection.status == "accepted",
    ).scalar()
    return {"count": count}


@router.get("/sent")
def get_sent(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    sent = db.query(Connection).filter(
        Connection.sender_id == current_user.id, Connection.status == "pending"
    ).all()
    return [{"receiver_id": c.receiver_id} for c in sent]


@router.get("/pending")
def get_pending(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    requests = db.query(Connection).filter(
        Connection.receiver_id == current_user.id, Connection.status == "pending"
    ).all()
    result = []
    for r in requests:
        sender = db.query(User).filter(User.id == r.sender_id).first()
        result.append({
            "id": r.id,
            "sender_id": r.sender_id,
            "sender_name": sender.full_name if sender else "Naməlum",
            "sender_major": sender.major if sender else None,
            "created_at": str(r.created_at),
        })
    return result


@router.delete("/{connection_id}")
def remove_connection(connection_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    conn = db.query(Connection).filter(
        Connection.id == connection_id,
        or_(Connection.sender_id == current_user.id, Connection.receiver_id == current_user.id)
    ).first()
    if not conn:
        raise HTTPException(status_code=404, detail="Bağlantı tapılmadı")
    db.delete(conn)
    db.commit()
    return {"message": "Bağlantı silindi"}


@router.get("/suggested")
def get_suggested(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Current user's accepted connection IDs
    my_conns = db.query(Connection).filter(
        or_(Connection.sender_id == current_user.id, Connection.receiver_id == current_user.id),
        Connection.status == "accepted",
    ).all()
    my_ids = set()
    for c in my_conns:
        my_ids.add(c.receiver_id if c.sender_id == current_user.id else c.sender_id)

    # All connection IDs (pending too) — exclude these
    all_conns = db.query(Connection).filter(
        or_(Connection.sender_id == current_user.id, Connection.receiver_id == current_user.id)
    ).all()
    excluded = {current_user.id}
    for c in all_conns:
        excluded.add(c.sender_id)
        excluded.add(c.receiver_id)

    # Friends of friends with mutual count
    mutual_count: dict[int, int] = {}
    for friend_id in my_ids:
        friend_conns = db.query(Connection).filter(
            or_(Connection.sender_id == friend_id, Connection.receiver_id == friend_id),
            Connection.status == "accepted",
        ).all()
        for fc in friend_conns:
            other = fc.receiver_id if fc.sender_id == friend_id else fc.sender_id
            if other not in excluded:
                mutual_count[other] = mutual_count.get(other, 0) + 1

    # Sort by mutual count desc, take top candidates
    candidates = sorted(mutual_count.keys(), key=lambda uid: -mutual_count[uid])[:20]

    # Pad with random active users if fewer than 5 suggestions
    if len(candidates) < 5:
        random_users = db.query(User).filter(
            User.id.notin_(excluded),
            User.is_active == True,
        ).limit(30).all()
        random.shuffle(random_users)
        for u in random_users:
            if u.id not in set(candidates) and len(candidates) < 10:
                candidates.append(u.id)

    result = []
    for uid in candidates[:8]:
        u = db.query(User).filter(User.id == uid).first()
        if u and u.is_active:
            result.append({
                "id": u.id,
                "full_name": u.full_name,
                "major": u.major,
                "profile_picture": u.profile_picture,
                "mutual_count": mutual_count.get(u.id, 0),
            })

    return result


@router.get("/my")
def get_my_connections(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    connections = db.query(Connection).filter(
        or_(Connection.sender_id == current_user.id, Connection.receiver_id == current_user.id),
        Connection.status == "accepted",
    ).all()

    result = []
    for c in connections:
        other_id = c.receiver_id if c.sender_id == current_user.id else c.sender_id
        other = db.query(User).filter(User.id == other_id).first()
        if other:
            result.append({
                "id": c.id,
                "user_id": other.id,
                "full_name": other.full_name,
                "major": other.major,
                "skills": other.skills,
                "profile_picture": other.profile_picture,
            })
    return result
