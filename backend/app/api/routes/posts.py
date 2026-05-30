from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload, subqueryload
from sqlalchemy import func as sa_func
from pydantic import BaseModel
import httpx
import json
import time
from app.services.database import get_db
from app.services.auth import get_current_user
from app.services.notifier import create_notification
from app.models.user import User
from app.models.post import Post, PostLike, PostDislike, Comment, PostReport
from app.config import settings
from app.services.activity_logger import log_activity

router = APIRouter(prefix="/api/posts", tags=["posts"])

_posts_cache: dict = {}
_POSTS_CACHE_TTL = 30


def _invalidate_posts_cache():
    _posts_cache.clear()


def _get_posts_base(db: Session, limit: int, offset: int) -> list[dict]:
    key = (limit, offset)
    now = time.time()
    cached = _posts_cache.get(key)
    if cached and now - cached["ts"] < _POSTS_CACHE_TTL:
        return cached["data"]

    posts = (
        db.query(Post)
        .options(joinedload(Post.author), subqueryload(Post.likes), subqueryload(Post.dislikes), subqueryload(Post.comments))
        .order_by(Post.is_pinned.desc(), Post.created_at.desc())
        .offset(offset)
        .limit(min(limit, 50))
        .all()
    )
    data = []
    for post in posts:
        images, single_url = _parse_images(post.image_url)
        data.append({
            "id": post.id,
            "content": post.content,
            "image_url": single_url,
            "images": images,
            "video_url": post.video_url,
            "is_pinned": post.is_pinned,
            "show_dislikes": post.show_dislikes if post.show_dislikes is not None else True,
            "created_at": str(post.created_at) if post.created_at else None,
            "author_name": post.author.full_name,
            "author_id": post.author_id,
            "author_picture": post.author.profile_picture,
            "like_count": len(post.likes),
            "dislike_count": len(post.dislikes),
            "comment_count": len(post.comments),
        })
    _posts_cache[key] = {"data": data, "ts": now}
    return data


class AIEnhanceRequest(BaseModel):
    text: str


@router.post("/ai-enhance")
async def ai_enhance(data: AIEnhanceRequest, current_user: User = Depends(get_current_user)):
    if not data.text.strip():
        raise HTTPException(status_code=400, detail="Mətn boş ola bilməz")
    if not settings.GEMINI_API_KEY:
        raise HTTPException(status_code=503, detail="AI xidməti aktiv deyil")

    prompt = f"""Sen peşəkar LinkedIn post redaktorusan. Aşağıdakı mətnə bax və onu professional, akademik üslubda LinkedIn postu kimi yenidən yaz.

Qaydalar:
- Azərbaycan dilində yaz
- Giriş cümləsi diqqət çəkici olsun
- Strukturlu ol: giriş → əsas fikir → nəticə/çağırış
- Emojilər az istifadə et (1-2 max)
- 150-250 söz arasında olsun
- Həşteqləri sona əlavə et (3-5 ədəd)
- Tələbə icması üçün uyğun ton

İstifadəçinin mətni:
{data.text.strip()}

Yalnız hazır postu yaz, heç bir izahat əlavə etmə."""

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            res = await client.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={settings.GEMINI_API_KEY}",
                json={"contents": [{"parts": [{"text": prompt}]}]},
            )
            if res.status_code != 200:
                import logging
                logging.getLogger(__name__).error("Gemini error %s: %s", res.status_code, res.text)
                raise HTTPException(status_code=502, detail=f"AI xəta: {res.status_code}")
            result = res.json()
            enhanced = result["candidates"][0]["content"]["parts"][0]["text"]
            return {"text": enhanced.strip()}
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="AI cavab vermək üçün çox gec etdi")


class PostCreate(BaseModel):
    content: str | None = None
    image_url: str | None = None
    images: list[str] = []
    video_url: str | None = None
    show_dislikes: bool = True


class CommentCreate(BaseModel):
    content: str


class ReportCreate(BaseModel):
    reason: str | None = None


class PostResponse(BaseModel):
    id: int
    content: str | None
    image_url: str | None
    images: list[str]
    video_url: str | None
    is_pinned: bool
    show_dislikes: bool
    created_at: str | None
    author_name: str
    author_id: int
    author_picture: str | None
    like_count: int
    dislike_count: int
    comment_count: int
    is_liked: bool
    is_disliked: bool

    class Config:
        from_attributes = True


def _parse_images(image_url):
    if not image_url:
        return [], None
    if image_url.startswith("["):
        try:
            imgs = json.loads(image_url)
            return imgs, None
        except Exception:
            pass
    return [], image_url


def _build_post_response(post, current_user_id, user_liked_ids, user_disliked_ids):
    images, single_url = _parse_images(post.image_url)
    return PostResponse(
        id=post.id,
        content=post.content,
        image_url=single_url,
        images=images,
        video_url=post.video_url,
        is_pinned=post.is_pinned,
        show_dislikes=post.show_dislikes if post.show_dislikes is not None else True,
        created_at=str(post.created_at) if post.created_at else None,
        author_name=post.author.full_name,
        author_id=post.author_id,
        author_picture=post.author.profile_picture,
        like_count=len(post.likes),
        dislike_count=len(post.dislikes),
        comment_count=len(post.comments),
        is_liked=post.id in user_liked_ids,
        is_disliked=post.id in user_disliked_ids,
    )


@router.get("", response_model=list[PostResponse])
def get_feed(limit: int = 20, offset: int = 0, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    post_dicts = _get_posts_base(db, limit, offset)
    post_ids = [p["id"] for p in post_dicts]
    user_liked_ids = set(
        r[0] for r in db.query(PostLike.post_id).filter(PostLike.post_id.in_(post_ids), PostLike.user_id == current_user.id).all()
    ) if post_ids else set()
    user_disliked_ids = set(
        r[0] for r in db.query(PostDislike.post_id).filter(PostDislike.post_id.in_(post_ids), PostDislike.user_id == current_user.id).all()
    ) if post_ids else set()

    return [PostResponse(**{**p, "is_liked": p["id"] in user_liked_ids, "is_disliked": p["id"] in user_disliked_ids}) for p in post_dicts]


@router.post("", response_model=PostResponse)
def create_post(data: PostCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    content = data.content.strip() if data.content else None
    if data.images:
        stored_image = json.dumps(data.images)
    else:
        stored_image = data.image_url
    if not content and not stored_image and not data.video_url:
        raise HTTPException(status_code=400, detail="Post boş ola bilməz")
    post = Post(author_id=current_user.id, content=content, image_url=stored_image, video_url=data.video_url, show_dislikes=data.show_dislikes)
    db.add(post)
    db.commit()
    has_image = bool(stored_image)
    has_video = bool(data.video_url)
    detail = "şəkil" if has_image else ("video" if has_video else "mətn")
    log_activity(db, action="post_create", user_id=current_user.id, email=current_user.email, details=detail)
    _invalidate_posts_cache()
    db.refresh(post)
    post.author = current_user
    post.likes = []
    post.dislikes = []
    post.comments = []
    return _build_post_response(post, current_user.id, set(), set())


@router.post("/{post_id}/like")
def toggle_like(post_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post tapılmadı")

    # Remove dislike if exists
    existing_dislike = db.query(PostDislike).filter(PostDislike.post_id == post_id, PostDislike.user_id == current_user.id).first()
    if existing_dislike:
        db.delete(existing_dislike)

    existing = db.query(PostLike).filter(PostLike.post_id == post_id, PostLike.user_id == current_user.id).first()
    if existing:
        db.delete(existing)
        db.commit()
        return {"message": "Like silindi"}

    like = PostLike(post_id=post_id, user_id=current_user.id)
    db.add(like)
    db.commit()
    create_notification(db, user_id=post.author_id, from_user_id=current_user.id, type="post_liked", post_id=post_id)
    return {"message": "Like edildi"}


@router.post("/{post_id}/dislike")
def toggle_dislike(post_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post tapılmadı")

    # Remove like if exists
    existing_like = db.query(PostLike).filter(PostLike.post_id == post_id, PostLike.user_id == current_user.id).first()
    if existing_like:
        db.delete(existing_like)

    existing = db.query(PostDislike).filter(PostDislike.post_id == post_id, PostDislike.user_id == current_user.id).first()
    if existing:
        db.delete(existing)
        db.commit()
        return {"message": "Dislike silindi"}

    dislike = PostDislike(post_id=post_id, user_id=current_user.id)
    db.add(dislike)
    db.commit()
    return {"message": "Dislike edildi"}


@router.delete("/{post_id}")
def delete_post(post_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post tapılmadı")
    if post.author_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Bu postu silə bilməzsən")

    db.delete(post)
    db.commit()
    _invalidate_posts_cache()
    log_activity(db, action="post_delete", user_id=current_user.id, email=current_user.email, details=f"post_id={post_id}")
    return {"message": "Post silindi"}


@router.get("/user/{user_id}", response_model=list[PostResponse])
def get_user_posts(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    posts = (
        db.query(Post)
        .filter(Post.author_id == user_id)
        .options(joinedload(Post.author), subqueryload(Post.likes), subqueryload(Post.dislikes), subqueryload(Post.comments))
        .order_by(Post.created_at.desc())
        .all()
    )

    post_ids = [p.id for p in posts]
    user_liked_ids = set(
        r[0] for r in db.query(PostLike.post_id).filter(PostLike.post_id.in_(post_ids), PostLike.user_id == current_user.id).all()
    ) if post_ids else set()
    user_disliked_ids = set(
        r[0] for r in db.query(PostDislike.post_id).filter(PostDislike.post_id.in_(post_ids), PostDislike.user_id == current_user.id).all()
    ) if post_ids else set()

    return [_build_post_response(post, current_user.id, user_liked_ids, user_disliked_ids) for post in posts]


@router.post("/{post_id}/comment")
def add_comment(post_id: int, data: CommentCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post tapılmadı")

    comment = Comment(post_id=post_id, user_id=current_user.id, content=data.content)
    db.add(comment)
    db.commit()
    create_notification(db, user_id=post.author_id, from_user_id=current_user.id, type="post_commented", post_id=post_id)
    return {"message": "Şərh əlavə edildi"}


@router.get("/{post_id}/comments")
def get_comments(post_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    comments = db.query(Comment).filter(Comment.post_id == post_id).order_by(Comment.created_at.asc()).all()
    return [
        {
            "id": c.id,
            "content": c.content,
            "user_name": c.user.full_name,
            "user_id": c.user_id,
            "created_at": str(c.created_at),
        }
        for c in comments
    ]


@router.post("/{post_id}/report")
def report_post(post_id: int, data: ReportCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post tapılmadı")
    if post.author_id == current_user.id:
        raise HTTPException(status_code=400, detail="Öz postunu şikayət edə bilməzsən")

    existing = db.query(PostReport).filter(
        PostReport.post_id == post_id,
        PostReport.reporter_id == current_user.id,
        PostReport.resolved == False,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Bu postu artıq şikayət etmisən")

    reason = data.reason.strip() if data.reason else None
    report = PostReport(post_id=post_id, reporter_id=current_user.id, reason=reason)
    db.add(report)
    db.commit()
    return {"message": "Şikayət göndərildi"}


@router.post("/{post_id}/pin")
def pin_post(post_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Yalnız admin pin edə bilər")

    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post tapılmadı")

    post.is_pinned = not post.is_pinned
    db.commit()
    return {"message": "Pin statusu dəyişdirildi", "is_pinned": post.is_pinned}
