from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from app.services.database import get_db
from app.services.auth import get_current_user, hash_password
from app.models.user import User
from app.models.post import Post, PostLike, PostDislike, Comment, PostReport
from app.models.connection import Connection
from app.models.message import Message
from app.models.activity_log import ActivityLog
from app.models.certificate import Certificate
from app.models.project import Project
from app.models.notification import Notification
from app.models.article import Article, ArticleLike, ArticleComment
from app.models.event import Event
from app.models.feedback import Feedback
from app.models.contest import Contest

router = APIRouter(prefix="/api/admin", tags=["admin"])


def get_admin_user(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Yalnız admin icazəlidir")
    return current_user


# ─── Schemas ───

class StatsResponse(BaseModel):
    total_users: int
    active_users: int
    total_posts: int
    total_connections: int
    accepted_connections: int
    total_messages: int


class AdminUserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    major: str | None
    course: int | None
    is_active: bool
    is_admin: bool
    is_open_for_team: bool
    is_verified: bool
    created_at: str | None
    last_seen: str | None = None

    class Config:
        from_attributes = True


class AdminPostResponse(BaseModel):
    id: int
    content: str | None
    image_url: str | None
    is_pinned: bool
    created_at: str | None
    author_name: str
    author_id: int
    like_count: int
    comment_count: int


class EmailNotifyRequest(BaseModel):
    subject: str
    message: str


class ContestRequest(BaseModel):
    title: str
    prize: str
    deadline: str
    tags: str = "#HashCampus"


# ─── Stats ───

@router.get("/stats", response_model=StatsResponse)
def get_stats(db: Session = Depends(get_db), admin: User = Depends(get_admin_user)):
    return StatsResponse(
        total_users=db.query(func.count(User.id)).scalar(),
        active_users=db.query(func.count(User.id)).filter(User.is_active == True).scalar(),
        total_posts=db.query(func.count(Post.id)).scalar(),
        total_connections=db.query(func.count(Connection.id)).scalar(),
        accepted_connections=db.query(func.count(Connection.id)).filter(Connection.status == "accepted").scalar(),
        total_messages=db.query(func.count(Message.id)).scalar(),
    )


# ─── Online Users ───

@router.get("/online")
def get_online_users(db: Session = Depends(get_db), admin: User = Depends(get_admin_user)):
    cutoff = datetime.now(timezone.utc) - timedelta(minutes=3)
    users = db.query(User).filter(User.last_seen >= cutoff, User.is_active == True).all()
    return [
        {
            "id": u.id,
            "full_name": u.full_name,
            "email": u.email,
            "major": u.major,
            "last_seen": u.last_seen.isoformat() if u.last_seen else None,
        }
        for u in users
    ]


# ─── Users ───

@router.get("/users", response_model=list[AdminUserResponse])
def get_all_users(q: str = "", db: Session = Depends(get_db), admin: User = Depends(get_admin_user)):
    query = db.query(User).order_by(User.created_at.desc())
    if q:
        query = query.filter(User.full_name.ilike(f"%{q}%"))
    users = query.all()
    return [
        AdminUserResponse(
            id=u.id,
            email=u.email,
            full_name=u.full_name,
            major=u.major,
            course=u.course,
            is_active=u.is_active,
            is_admin=u.is_admin,
            is_open_for_team=u.is_open_for_team,
            is_verified=u.is_verified,
            created_at=str(u.created_at) if u.created_at else None,
            last_seen=str(u.last_seen) if u.last_seen else None,
        )
        for u in users
    ]


@router.patch("/users/{user_id}/toggle-active")
def toggle_user_active(user_id: int, db: Session = Depends(get_db), admin: User = Depends(get_admin_user)):
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Özünüzü blok edə bilməzsiniz")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="İstifadəçi tapılmadı")

    user.is_active = not user.is_active
    db.commit()
    return {"message": f"{'Aktiv edildi' if user.is_active else 'Blok edildi'}", "is_active": user.is_active}


@router.patch("/users/{user_id}/verify")
def verify_user(user_id: int, db: Session = Depends(get_db), admin: User = Depends(get_admin_user)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="İstifadəçi tapılmadı")
    user.is_verified = True
    user.verification_token = None
    db.commit()
    return {"message": "Təsdiqləndi"}


@router.patch("/users/{user_id}/toggle-admin")
def toggle_user_admin(user_id: int, db: Session = Depends(get_db), admin: User = Depends(get_admin_user)):
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Öz admin statusunuzu dəyişə bilməzsiniz")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="İstifadəçi tapılmadı")

    user.is_admin = not user.is_admin
    db.commit()
    return {"message": f"{'Admin edildi' if user.is_admin else 'Admin çıxarıldı'}", "is_admin": user.is_admin}


@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), admin: User = Depends(get_admin_user)):
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Özünüzü silə bilməzsiniz")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="İstifadəçi tapılmadı")

    try:
        # Əlaqəli datanı düzgün sırada sil (FK constraint-lərə görə)
        db.query(ActivityLog).filter(ActivityLog.user_id == user_id).delete(synchronize_session=False)
        db.query(Notification).filter(
            (Notification.user_id == user_id) | (Notification.from_user_id == user_id)
        ).delete(synchronize_session=False)
        db.query(Certificate).filter(Certificate.user_id == user_id).delete(synchronize_session=False)
        db.query(Project).filter(Project.user_id == user_id).delete(synchronize_session=False)
        db.query(PostReport).filter(PostReport.reporter_id == user_id).delete(synchronize_session=False)
        db.query(PostDislike).filter(PostDislike.user_id == user_id).delete(synchronize_session=False)
        db.query(PostLike).filter(PostLike.user_id == user_id).delete(synchronize_session=False)
        db.query(Comment).filter(Comment.user_id == user_id).delete(synchronize_session=False)
        db.query(ArticleLike).filter(ArticleLike.user_id == user_id).delete(synchronize_session=False)
        db.query(ArticleComment).filter(ArticleComment.user_id == user_id).delete(synchronize_session=False)
        articles = db.query(Article).filter(Article.author_id == user_id).all()
        for article in articles:
            db.query(ArticleLike).filter(ArticleLike.article_id == article.id).delete(synchronize_session=False)
            db.query(ArticleComment).filter(ArticleComment.article_id == article.id).delete(synchronize_session=False)
        db.query(Article).filter(Article.author_id == user_id).delete(synchronize_session=False)
        posts = db.query(Post).filter(Post.author_id == user_id).all()
        for post in posts:
            db.query(Notification).filter(Notification.post_id == post.id).delete(synchronize_session=False)
            db.query(PostReport).filter(PostReport.post_id == post.id).delete(synchronize_session=False)
            db.query(PostDislike).filter(PostDislike.post_id == post.id).delete(synchronize_session=False)
            db.query(PostLike).filter(PostLike.post_id == post.id).delete(synchronize_session=False)
            db.query(Comment).filter(Comment.post_id == post.id).delete(synchronize_session=False)
        db.query(Post).filter(Post.author_id == user_id).delete(synchronize_session=False)
        db.query(Connection).filter(
            (Connection.sender_id == user_id) | (Connection.receiver_id == user_id)
        ).delete(synchronize_session=False)
        db.query(Message).filter(
            (Message.sender_id == user_id) | (Message.receiver_id == user_id)
        ).delete(synchronize_session=False)
        db.query(Event).filter(Event.created_by == user_id).delete(synchronize_session=False)

        db.delete(user)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Silmə xətası: {str(e)}")

    return {"message": "İstifadəçi silindi"}


# ─── Posts ───

@router.get("/posts", response_model=list[AdminPostResponse])
def get_all_posts(q: str = "", db: Session = Depends(get_db), admin: User = Depends(get_admin_user)):
    query = db.query(Post).order_by(Post.created_at.desc())
    if q:
        query = query.filter(Post.content.ilike(f"%{q}%"))
    posts = query.all()
    return [
        AdminPostResponse(
            id=p.id,
            content=p.content,
            image_url=p.image_url,
            is_pinned=p.is_pinned,
            created_at=str(p.created_at) if p.created_at else None,
            author_name=p.author.full_name,
            author_id=p.author_id,
            like_count=len(p.likes),
            comment_count=len(p.comments),
        )
        for p in posts
    ]


@router.delete("/posts/{post_id}")
def delete_post(post_id: int, db: Session = Depends(get_db), admin: User = Depends(get_admin_user)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post tapılmadı")

    db.delete(post)
    db.commit()
    return {"message": "Post silindi"}


@router.patch("/posts/{post_id}/pin")
def toggle_pin(post_id: int, db: Session = Depends(get_db), admin: User = Depends(get_admin_user)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post tapılmadı")

    post.is_pinned = not post.is_pinned
    db.commit()
    return {"message": "Pin statusu dəyişdirildi", "is_pinned": post.is_pinned}


# ─── Reports ───

class ReportedPostResponse(BaseModel):
    post_id: int
    post_content: str | None
    post_image_url: str | None
    post_video_url: str | None
    author_name: str
    author_id: int
    report_count: int
    reasons: list[str]
    latest_reported_at: str | None


@router.get("/reports", response_model=list[ReportedPostResponse])
def get_reports(db: Session = Depends(get_db), admin: User = Depends(get_admin_user)):
    rows = (
        db.query(PostReport)
        .filter(PostReport.resolved == False)
        .order_by(PostReport.created_at.desc())
        .all()
    )
    grouped: dict[int, dict] = {}
    for r in rows:
        if not r.post_id:
            continue
        g = grouped.setdefault(r.post_id, {"reports": [], "latest": None})
        g["reports"].append(r)
        if g["latest"] is None or r.created_at > g["latest"]:
            g["latest"] = r.created_at

    result = []
    for post_id, g in grouped.items():
        post = db.query(Post).filter(Post.id == post_id).first()
        if not post:
            continue
        result.append(ReportedPostResponse(
            post_id=post.id,
            post_content=post.content,
            post_image_url=post.image_url,
            post_video_url=post.video_url,
            author_name=post.author.full_name,
            author_id=post.author_id,
            report_count=len(g["reports"]),
            reasons=[r.reason for r in g["reports"] if r.reason],
            latest_reported_at=str(g["latest"]) if g["latest"] else None,
        ))
    result.sort(key=lambda x: x.latest_reported_at or "", reverse=True)
    return result


@router.post("/reports/dismiss/{post_id}")
def dismiss_reports(post_id: int, db: Session = Depends(get_db), admin: User = Depends(get_admin_user)):
    db.query(PostReport).filter(
        PostReport.post_id == post_id,
        PostReport.resolved == False,
    ).update({"resolved": True})
    db.commit()
    return {"message": "Şikayətlər bağlandı"}


# ─── Activity Logs ───

# Yalnız hesaba giriş/çıxış və qeydiyyatı göstər — mesaj və şəkil logları məxfidir
ALLOWED_LOG_ACTIONS = {"login_success", "login_failed", "register"}


class ActivityLogResponse(BaseModel):
    id: int
    user_id: int | None
    email: str | None
    full_name: str | None
    action: str
    ip_address: str | None
    user_agent: str | None
    details: str | None
    created_at: str | None


@router.get("/logs", response_model=list[ActivityLogResponse])
def get_activity_logs(
    action: str | None = None,
    user_id: int | None = None,
    email: str | None = None,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user),
):
    query = db.query(ActivityLog).order_by(ActivityLog.created_at.desc())

    if action and action in ALLOWED_LOG_ACTIONS:
        query = query.filter(ActivityLog.action == action)
    else:
        query = query.filter(ActivityLog.action.in_(ALLOWED_LOG_ACTIONS))

    if user_id is not None:
        query = query.filter(ActivityLog.user_id == user_id)
    if email:
        query = query.filter(ActivityLog.email.ilike(f"%{email}%"))

    limit = max(1, min(limit, 500))
    logs = query.offset(offset).limit(limit).all()

    return [
        ActivityLogResponse(
            id=log.id,
            user_id=log.user_id,
            email=log.email,
            full_name=log.user.full_name if log.user else None,
            action=log.action,
            ip_address=log.ip_address,
            user_agent=log.user_agent,
            details=log.details,
            created_at=str(log.created_at) if log.created_at else None,
        )
        for log in logs
    ]


class AdminCreateUserRequest(BaseModel):
    email: str
    password: str
    full_name: str
    faculty: str
    major: str
    course: int


@router.post("/users/create", response_model=AdminUserResponse)
def admin_create_user(data: AdminCreateUserRequest, db: Session = Depends(get_db), admin: User = Depends(get_admin_user)):
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Bu email artıq mövcuddur")
    user = User(
        email=data.email,
        password_hash=hash_password(data.password),
        full_name=data.full_name,
        faculty=data.faculty,
        major=data.major,
        course=data.course,
        is_verified=True,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return AdminUserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        major=user.major,
        course=user.course,
        is_active=user.is_active,
        is_admin=user.is_admin,
        is_open_for_team=user.is_open_for_team,
        is_verified=user.is_verified,
        created_at=user.created_at.isoformat() if user.created_at else None,
    )


# ─── Messages ───

from app.services.encryption import decrypt_msg


class AdminMessageResponse(BaseModel):
    id: int
    sender_id: int
    sender_name: str
    receiver_id: int
    receiver_name: str
    content: str
    is_read: bool
    created_at: str | None


@router.get("/messages", response_model=list[AdminMessageResponse])
def get_all_messages(
    search: str | None = None,
    user_id: int | None = None,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user),
):
    query = db.query(Message).order_by(Message.created_at.desc())
    if user_id is not None:
        query = query.filter(
            (Message.sender_id == user_id) | (Message.receiver_id == user_id)
        )
    if search:
        query = query.filter(Message.content.ilike(f"%{search}%"))
    limit = max(1, min(limit, 500))
    msgs = query.offset(offset).limit(limit).all()
    return [
        AdminMessageResponse(
            id=m.id,
            sender_id=m.sender_id,
            sender_name=m.sender.full_name if m.sender else str(m.sender_id),
            receiver_id=m.receiver_id,
            receiver_name=m.receiver.full_name if m.receiver else str(m.receiver_id),
            content=decrypt_msg(m.content),
            is_read=m.is_read,
            created_at=str(m.created_at) if m.created_at else None,
        )
        for m in msgs
    ]


@router.get("/messages/conversation")
def get_conversation(
    user1: int,
    user2: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user),
):
    msgs = db.query(Message).filter(
        ((Message.sender_id == user1) & (Message.receiver_id == user2)) |
        ((Message.sender_id == user2) & (Message.receiver_id == user1))
    ).order_by(Message.created_at.asc()).all()
    u1 = db.query(User).filter(User.id == user1).first()
    u2 = db.query(User).filter(User.id == user2).first()
    return {
        "user1": {"id": user1, "name": u1.full_name if u1 else str(user1)},
        "user2": {"id": user2, "name": u2.full_name if u2 else str(user2)},
        "messages": [
            {
                "id": m.id,
                "sender_id": m.sender_id,
                "content": decrypt_msg(m.content),
                "is_read": m.is_read,
                "created_at": str(m.created_at) if m.created_at else None,
            }
            for m in msgs
        ],
    }


@router.delete("/logs/purge-sensitive")
def purge_sensitive_logs(db: Session = Depends(get_db), admin: User = Depends(get_admin_user)):
    """Mesaj və profil şəkli ilə bağlı köhnə log qeydlərini silir."""
    deleted = db.query(ActivityLog).filter(
        ~ActivityLog.action.in_(ALLOWED_LOG_ACTIONS)
    ).delete(synchronize_session=False)
    db.commit()
    return {"deleted": deleted}


# ─── Feedback ───

@router.get("/feedback")
def get_feedbacks(db: Session = Depends(get_db), admin: User = Depends(get_admin_user)):
    feedbacks = db.query(Feedback).order_by(Feedback.created_at.desc()).all()
    return [
        {
            "id": f.id,
            "user_id": f.user_id,
            "user_name": f.user.full_name if f.user else "Silinmiş hesab",
            "user_email": f.user.email if f.user else None,
            "category": f.category,
            "content": f.content,
            "created_at": str(f.created_at) if f.created_at else None,
        }
        for f in feedbacks
    ]


@router.delete("/feedback/{feedback_id}")
def delete_feedback(feedback_id: int, db: Session = Depends(get_db), admin: User = Depends(get_admin_user)):
    fb = db.query(Feedback).filter(Feedback.id == feedback_id).first()
    if not fb:
        raise HTTPException(status_code=404, detail="Tapılmadı")
    db.delete(fb)
    db.commit()
    return {"message": "Silindi"}


# ─── Email Notification ───

@router.post("/notify/email")
def send_email_notification(
    data: EmailNotifyRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user),
):
    from app.services.email import send_notification_email
    if not data.subject.strip() or not data.message.strip():
        raise HTTPException(status_code=400, detail="Mövzu və mətn boş ola bilməz")

    users = db.query(User.email).filter(User.is_verified == True, User.is_active == True).all()
    emails = [u.email for u in users]
    if not emails:
        raise HTTPException(status_code=404, detail="Aktiv istifadəçi tapılmadı")

    html = f"""<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;color:#222;max-width:540px;margin:0 auto;padding:32px 16px">
  <p style="font-size:16px;font-weight:700;margin:0 0 24px">Hash</p>
  <p style="font-size:15px;font-weight:600;margin:0 0 12px">{data.subject}</p>
  <div style="font-size:14px;line-height:1.6;margin:0 0 24px;white-space:pre-wrap">{data.message}</div>
  <p style="font-size:12px;color:#999;margin:0;border-top:1px solid #eee;padding-top:16px">
    Bu e-poçt hashcampus.site tərəfindən göndərilmişdir.
  </p>
</body>
</html>"""

    background_tasks.add_task(send_notification_email, emails, data.subject, html, data.message)
    return {"message": f"{len(emails)} istifadəçiyə göndərilir...", "total": len(emails)}


# ─── Contest ───

@router.get("/contest")
def get_contest(db: Session = Depends(get_db), admin: User = Depends(get_admin_user)):
    c = db.query(Contest).order_by(Contest.created_at.desc()).first()
    if not c:
        return None
    return {
        "id": c.id,
        "title": c.title,
        "prize": c.prize,
        "deadline": str(c.deadline),
        "tags": c.tags,
        "is_active": c.is_active,
    }


@router.post("/contest")
def create_contest(data: ContestRequest, db: Session = Depends(get_db), admin: User = Depends(get_admin_user)):
    db.query(Contest).update({"is_active": False})
    deadline = datetime.fromisoformat(data.deadline.replace("Z", "+00:00"))
    c = Contest(title=data.title, prize=data.prize, deadline=deadline, tags=data.tags, is_active=True)
    db.add(c)
    db.commit()
    return {"message": "Müsabiqə başladıldı"}


@router.patch("/contest/{contest_id}/stop")
def stop_contest(contest_id: int, db: Session = Depends(get_db), admin: User = Depends(get_admin_user)):
    c = db.query(Contest).filter(Contest.id == contest_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Tapılmadı")
    c.is_active = False
    db.commit()
    return {"message": "Müsabiqə dayandırıldı"}
