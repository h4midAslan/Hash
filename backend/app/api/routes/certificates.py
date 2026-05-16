from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import date
from app.services.database import get_db
from app.services.auth import get_current_user
from app.models.user import User
from app.models.certificate import Certificate

router = APIRouter(prefix="/api/certificates", tags=["certificates"])


class CertificateCreate(BaseModel):
    name: str
    issuer: str
    issue_date: date | None = None
    credential_url: str | None = None
    image_url: str | None = None


class CertificateResponse(BaseModel):
    id: int
    user_id: int
    name: str
    issuer: str
    issue_date: date | None
    credential_url: str | None
    image_url: str | None

    class Config:
        from_attributes = True


@router.post("", response_model=CertificateResponse)
def add_certificate(data: CertificateCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    cert = Certificate(
        user_id=current_user.id,
        name=data.name,
        issuer=data.issuer,
        issue_date=data.issue_date,
        credential_url=data.credential_url,
        image_url=data.image_url,
    )
    db.add(cert)
    db.commit()
    db.refresh(cert)
    return cert


@router.get("/me", response_model=list[CertificateResponse])
def get_my_certificates(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Certificate).filter(Certificate.user_id == current_user.id).order_by(Certificate.issue_date.desc()).all()


@router.get("/user/{user_id}", response_model=list[CertificateResponse])
def get_user_certificates(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Certificate).filter(Certificate.user_id == user_id).order_by(Certificate.issue_date.desc()).all()


@router.delete("/{cert_id}")
def delete_certificate(cert_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    cert = db.query(Certificate).filter(Certificate.id == cert_id, Certificate.user_id == current_user.id).first()
    if not cert:
        raise HTTPException(status_code=404, detail="Sertifikat tapilmadi")
    db.delete(cert)
    db.commit()
    return {"detail": "Sertifikat silindi"}
