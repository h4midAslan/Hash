from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import or_
from pydantic import BaseModel
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.services.database import get_db
from app.services.auth import get_current_user, verify_password, hash_password
from app.models.user import User
from app.services.activity_logger import log_activity

router = APIRouter(prefix="/api/users", tags=["users"])
limiter = Limiter(key_func=get_remote_address)


import re

USERNAME_RE = re.compile(r'^[a-z0-9_]{3,30}$')

class PublicUserResponse(BaseModel):
    id: int
    username: str | None = None
    full_name: str
    headline: str | None
    faculty: str | None
    major: str | None
    course: int | None
    bio: str | None
    profile_picture: str | None
    github_url: str | None
    linkedin_url: str | None
    website_url: str | None
    skills: str | None
    certificates: str | None
    is_open_for_team: bool
    is_admin: bool
    last_seen: datetime | None = None

    class Config:
        from_attributes = True


class UserResponse(BaseModel):
    id: int
    email: str
    username: str | None = None
    full_name: str
    headline: str | None
    faculty: str | None
    major: str | None
    course: int | None
    bio: str | None
    profile_picture: str | None
    phone: str | None
    github_url: str | None
    linkedin_url: str | None
    website_url: str | None
    skills: str | None
    certificates: str | None
    is_open_for_team: bool
    is_admin: bool
    last_seen: datetime | None = None

    class Config:
        from_attributes = True


class UpdateProfileRequest(BaseModel):
    full_name: str | None = None
    username: str | None = None
    headline: str | None = None
    major: str | None = None
    course: int | None = None
    bio: str | None = None
    profile_picture: str | None = None
    phone: str | None = None
    github_url: str | None = None
    linkedin_url: str | None = None
    website_url: str | None = None
    skills: str | None = None
    certificates: str | None = None
    is_open_for_team: bool | None = None


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=UserResponse)
def update_profile(data: UpdateProfileRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    fields = data.model_dump(exclude_unset=True)

    if 'username' in fields and fields['username'] is not None:
        uname = fields['username'].lower().strip()
        if not USERNAME_RE.match(uname):
            raise HTTPException(status_code=400, detail="Username yalnız kiçik hərf, rəqəm və _ ola bilər (3-30 simvol)")
        taken = db.query(User).filter(User.username == uname, User.id != current_user.id).first()
        if taken:
            raise HTTPException(status_code=400, detail="Bu username artıq tutulub")
        fields['username'] = uname

    changed = list(fields.keys())
    for field, value in fields.items():
        setattr(current_user, field, value)
    db.commit()
    db.refresh(current_user)
    log_activity(db, action="profile_update", user_id=current_user.id, email=current_user.email, details=", ".join(changed))
    return current_user


class HeartbeatRequest(BaseModel):
    page: str | None = None


@router.post("/me/heartbeat")
def heartbeat(data: HeartbeatRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from datetime import datetime, timezone
    current_user.last_seen = datetime.now(timezone.utc)
    db.commit()
    return {"ok": True}


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


@router.put("/me/password")
@limiter.limit("5/minute")
def change_password(request: Request, data: ChangePasswordRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not verify_password(data.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Cari şifrə yanlışdır")
    if len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="Yeni şifrə ən az 6 simvol olmalıdır")
    current_user.password_hash = hash_password(data.new_password)
    db.commit()
    log_activity(db, action="password_change", user_id=current_user.id, email=current_user.email, request=request)
    return {"message": "Şifrə uğurla dəyişdirildi"}


@router.get("/search", response_model=list[PublicUserResponse])
def search_users(
    q: str = "",
    skill: str = "",
    major: str = "",
    faculty: str = "",
    course: int | None = None,
    open_for_team: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(User).filter(User.is_active == True, User.id != current_user.id)

    if q:
        query = query.filter(or_(
            User.full_name.ilike(f"{q}%"),
            User.full_name.ilike(f"% {q}%"),
        ))
    if skill:
        query = query.filter(User.skills.ilike(f"%{skill}%"))
    if major:
        query = query.filter(User.major.ilike(f"%{major}%"))
    if faculty:
        query = query.filter(User.faculty.ilike(f"%{faculty}%"))
    if course:
        query = query.filter(User.course == course)
    if open_for_team:
        query = query.filter(User.is_open_for_team == True)

    return query.limit(50).all()


@router.post("/parse-cv")
async def parse_cv_endpoint(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Yalnız PDF faylı qəbul edilir")
    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Fayl 10 MB-dan böyük ola bilməz")
    try:
        from app.services.cv_parser import parse_cv
        result = parse_cv(content)
        return result
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"CV parse xətası: {str(e)}")


@router.get("/{user_id}", response_model=PublicUserResponse)
def get_user(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="İstifadəçi tapılmadı")
    return user
