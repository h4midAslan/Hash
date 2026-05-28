from datetime import datetime, timezone
import time
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, outerjoin, select
from app.services.database import get_db
from app.models.post import Post, PostLike, Comment
from app.models.user import User
from app.models.contest import Contest

router = APIRouter(prefix="/api/contest", tags=["contest"])

# Simple in-memory cache
_leaderboard_cache: dict = {"data": None, "ts": 0, "contest_id": None}
_info_cache: dict = {"data": None, "ts": 0}
CACHE_TTL = 30  # seconds


def _active_contest(db: Session):
    return db.query(Contest).filter(Contest.is_active == True).order_by(Contest.created_at.desc()).first()


@router.get("/info")
def get_contest_info(db: Session = Depends(get_db)):
    now_ts = time.time()
    if _info_cache["data"] and now_ts - _info_cache["ts"] < CACHE_TTL:
        return _info_cache["data"]

    c = _active_contest(db)
    if not c:
        return {"active": False}

    now = datetime.now(timezone.utc)
    deadline = c.deadline if c.deadline.tzinfo else c.deadline.replace(tzinfo=timezone.utc)
    remaining = max(0, int((deadline - now).total_seconds()))
    if remaining == 0:
        c.is_active = False
        db.commit()
        _info_cache["data"] = None
        return {"active": False}

    result = {
        "id": c.id,
        "title": c.title,
        "prize": c.prize,
        "deadline": deadline.isoformat(),
        "remaining_seconds": remaining,
        "active": True,
        "tags": [t.strip() for t in c.tags.split(",")],
    }
    _info_cache["data"] = result
    _info_cache["ts"] = now_ts
    return result


@router.get("/leaderboard")
def get_leaderboard(db: Session = Depends(get_db)):
    now_ts = time.time()
    c = _active_contest(db)
    if not c:
        return []

    # Return cached result if still fresh and same contest
    if (
        _leaderboard_cache["data"] is not None
        and _leaderboard_cache["contest_id"] == c.id
        and now_ts - _leaderboard_cache["ts"] < CACHE_TTL
    ):
        return _leaderboard_cache["data"]

    tag_filters = [t.strip().lstrip("#").lower() for t in c.tags.split(",")]

    # Single query: posts + like counts + distinct comment user counts + author
    like_subq = (
        db.query(PostLike.post_id, func.count(PostLike.id).label("like_count"))
        .group_by(PostLike.post_id)
        .subquery()
    )
    comment_subq = (
        db.query(Comment.post_id, func.count(func.distinct(Comment.user_id)).label("comment_count"))
        .group_by(Comment.post_id)
        .subquery()
    )

    query = (
        db.query(
            Post,
            User,
            func.coalesce(like_subq.c.like_count, 0).label("like_count"),
            func.coalesce(comment_subq.c.comment_count, 0).label("comment_count"),
        )
        .join(User, User.id == Post.author_id)
        .outerjoin(like_subq, like_subq.c.post_id == Post.id)
        .outerjoin(comment_subq, comment_subq.c.post_id == Post.id)
        .filter(Post.image_url.isnot(None))
    )
    for tag in tag_filters:
        query = query.filter(Post.content.ilike(f"%#{tag}%"))

    rows = query.all()

    results = []
    for post, author, like_count, comment_count in rows:
        score = like_count + comment_count
        results.append({
            "post_id": post.id,
            "image_url": post.image_url,
            "content": post.content,
            "like_count": like_count,
            "comment_count": comment_count,
            "score": score,
            "created_at": str(post.created_at),
            "author": {
                "id": author.id,
                "full_name": author.full_name,
                "profile_picture": author.profile_picture,
                "major": author.major,
            },
        })

    results.sort(key=lambda x: x["score"], reverse=True)
    for i, r in enumerate(results):
        r["rank"] = i + 1

    _leaderboard_cache["data"] = results
    _leaderboard_cache["ts"] = now_ts
    _leaderboard_cache["contest_id"] = c.id
    return results
