import httpx
from app.config import settings


def send_verification_code(to_email: str, code: str) -> bool:
    html = f"""
    <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#f8fafc;border-radius:16px">
      <h2 style="color:#2563eb;margin-bottom:8px">Hash — Təsdiq Kodu</h2>
      <p style="color:#374151">Qeydiyyatı tamamlamaq üçün aşağıdakı kodu daxil edin:</p>
      <div style="font-size:40px;font-weight:900;letter-spacing:12px;color:#1e40af;background:#eff6ff;border-radius:12px;padding:20px;text-align:center;margin:24px 0">
        {code}
      </div>
      <p style="color:#6b7280;font-size:13px">Kod 10 dəqiqə ərzində etibarlıdır. Bu kodu heç kimlə paylaşmayın.</p>
    </div>
    """
    try:
        res = httpx.post(
            "https://api.resend.com/emails",
            headers={"Authorization": f"Bearer {settings.RESEND_API_KEY}"},
            json={
                "from": "Hash <noreply@hashcampus.site>",
                "to": [to_email],
                "subject": "Hash — Təsdiq kodunuz",
                "html": html,
            },
            timeout=10,
        )
        return res.status_code == 200
    except Exception:
        return False
