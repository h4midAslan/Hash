from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy import or_
from pydantic import BaseModel
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.services.database import get_db
from app.services.auth import get_current_user, verify_password, hash_password
from app.models.user import User

router = APIRouter(prefix="/api/users", tags=["users"])
limiter = Limiter(key_func=get_remote_address)


class UserResponse(BaseModel):
    id: int
    email: str
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
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(current_user, field, value)
    db.commit()
    db.refresh(current_user)
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
    return {"message": "Şifrə uğurla dəyişdirildi"}


@router.get("/search", response_model=list[UserResponse])
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


@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="İstifadəçi tapılmadı")
    return user
