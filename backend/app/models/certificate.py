from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.models.base import Base


class Certificate(Base):
    __tablename__ = "certificates"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(255), nullable=False)
    issuer = Column(String(255), nullable=False)
    issue_date = Column(Date)
    credential_url = Column(String(500))\n    image_url = Column(String(500))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", backref="certificates_list")
