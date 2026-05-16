import httpx
from app.config import settings


def send_verification_code(to_email: str, code: str) -> bool:
    plain = f"Doğrulama kodunuz: {code}\n\nKod 10 dəqiqə ərzində etibarlıdır.\n\nhashcampus.site"
    html = f"""<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;color:#222;max-width:480px;margin:0 auto;padding:32px 16px">
  <p style="font-size:16px;font-weight:700;margin:0 0 24px">Hash</p>
  <p style="font-size:14px;margin:0 0 16px">Doğrulama kodunuz:</p>
  <p style="font-size:32px;font-weight:700;letter-spacing:8px;margin:0 0 24px;font-family:monospace">{code}</p>
  <p style="font-size:13px;color:#666;margin:0">Kod 10 dəqiqə ərzində etibarlıdır.</p>
</body>
</html>"""
    try:
        res = httpx.post(
            "https://api.resend.com/emails",
            headers={"Authorization": f"Bearer {settings.RESEND_API_KEY}"},
            json={
                "from": "Hash <noreply@hashcampus.site>",
                "to": [to_email],
                "subject": "Doğrulama kodu",
                "html": html,
                "text": plain,
            },
            timeout=10,
        )
        print(f"[EMAIL] Resend response for {to_email}: status={res.status_code} body={res.text}", flush=True)
        if res.status_code in (200, 201):
            return True
        return False
    except Exception as e:
        print(f"[EMAIL] Exception for {to_email}: {e}", flush=True)
        return False
