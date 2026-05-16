import httpx
import logging
from app.config import settings

logger = logging.getLogger(__name__)


def send_verification_code(to_email: str, code: str) -> bool:
    plain = (
        f"Hash - Email Təsdiq Kodu\n\n"
        f"Qeydiyyatı tamamlamaq üçün aşağıdakı kodu daxil edin:\n\n"
        f"  {code}\n\n"
        f"Kod 10 dəqiqə ərzində etibarlıdır.\n\n"
        f"Bu kodu heç kimlə paylaşmayın.\n"
        f"Əgər bu sorğunu siz göndərməmisinizsə, bu emaili nəzərə almayın.\n\n"
        f"-- Hash (hashcampus.site)"
    )
    html = f"""<!DOCTYPE html>
<html lang="az">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4">
    <tr><td align="center" style="padding:40px 16px">
      <table width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background:#ffffff;border:1px solid #e0e0e0">
        <tr><td style="padding:24px 32px;border-bottom:1px solid #e0e0e0">
          <span style="font-size:18px;font-weight:700;color:#1a2a3a">Hash</span>
          <span style="font-size:13px;color:#888;margin-left:8px">hashcampus.site</span>
        </td></tr>
        <tr><td style="padding:32px 32px 16px">
          <p style="margin:0 0 8px;font-size:15px;font-weight:600;color:#1a1a1a">Email təsdiq kodu</p>
          <p style="margin:0;font-size:13px;color:#555;line-height:1.7">
            Qeydiyyatı tamamlamaq üçün aşağıdakı 6 rəqəmli kodu daxil edin.
            Kod <strong>10 dəqiqə</strong> ərzində etibarlıdır.
          </p>
        </td></tr>
        <tr><td style="padding:16px 32px 32px">
          <div style="background:#f4f6fa;border:1px solid #dce3ef;padding:18px 28px;display:inline-block">
            <span style="font-size:30px;font-weight:700;letter-spacing:10px;color:#1a2a3a;font-family:monospace">{code}</span>
          </div>
        </td></tr>
        <tr><td style="padding:20px 32px;border-top:1px solid #e0e0e0;background:#fafafa">
          <p style="margin:0;font-size:12px;color:#999;line-height:1.6">
            Bu kodu heç kimlə paylaşmayın. Əgər bu sorğunu siz göndərməmisinizsə, bu emaili nəzərə almayın.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""
    try:
        res = httpx.post(
            "https://api.resend.com/emails",
            headers={"Authorization": f"Bearer {settings.RESEND_API_KEY}"},
            json={
                "from": "Hash <noreply@hashcampus.site>",
                "to": [to_email],
                "subject": "Hash - Email Təsdiqi",
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
