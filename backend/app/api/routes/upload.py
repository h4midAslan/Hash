from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from typing import List
import cloudinary
import cloudinary.uploader
from app.config import settings
from app.services.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/upload", tags=["upload"])

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
ALLOWED_VIDEO_TYPES = {"video/mp4", "video/webm", "video/quicktime"}
MAX_IMAGE_SIZE = 5 * 1024 * 1024   # 5MB
MAX_VIDEO_SIZE = 30 * 1024 * 1024  # 30MB

cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
    secure=True,
)


@router.post("")
async def upload_file(file: UploadFile = File(...), current_user: User = Depends(get_current_user)):
    if file.content_type in ALLOWED_IMAGE_TYPES:
        resource_type = "image"
        max_size = MAX_IMAGE_SIZE
        size_label = "5MB"
    elif file.content_type in ALLOWED_VIDEO_TYPES:
        resource_type = "video"
        max_size = MAX_VIDEO_SIZE
        size_label = "30MB"
    else:
        raise HTTPException(status_code=400, detail="Yalnız şəkil (JPG, PNG, WebP, GIF) və ya video (MP4, WebM, MOV) qəbul olunur")

    content = await file.read()
    if len(content) > max_size:
        raise HTTPException(status_code=400, detail=f"Fayl {size_label}-dan böyük ola bilməz")

    if not settings.CLOUDINARY_CLOUD_NAME:
        raise HTTPException(status_code=500, detail="Cloudinary konfiqurasiya edilməyib")

    try:
        result = cloudinary.uploader.upload(
            content,
            folder=f"vektorin/{current_user.id}",
            resource_type=resource_type,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Yükləmə uğursuz: {e}")

    return {"url": result["secure_url"], "resource_type": resource_type}


@router.post("/multiple")
async def upload_multiple(files: List[UploadFile] = File(...), current_user: User = Depends(get_current_user)):
    if len(files) > 10:
        raise HTTPException(status_code=400, detail="Maksimum 10 şəkil yüklənə bilər")
    urls = []
    for file in files:
        if file.content_type not in ALLOWED_IMAGE_TYPES:
            raise HTTPException(status_code=400, detail="Yalnız şəkil faylları qəbul olunur")
        content = await file.read()
        if len(content) > MAX_IMAGE_SIZE:
            raise HTTPException(status_code=400, detail="Hər şəkil 5MB-dan böyük ola bilməz")
        if not settings.CLOUDINARY_CLOUD_NAME:
            raise HTTPException(status_code=500, detail="Cloudinary konfiqurasiya edilməyib")
        try:
            result = cloudinary.uploader.upload(content, folder=f"vektorin/{current_user.id}", resource_type="image")
            urls.append(result["secure_url"])
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Yükləmə uğursuz: {e}")
    return {"urls": urls}
