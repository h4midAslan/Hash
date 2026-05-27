import json
import logging
from pywebpush import webpush, WebPushException
from app.config import settings

logger = logging.getLogger(__name__)


def send_push(subscription_info: dict, title: str, body: str, url: str = "/feed"):
    try:
        webpush(
            subscription_info=subscription_info,
            data=json.dumps({"title": title, "body": body, "url": url}),
            vapid_private_key=settings.VAPID_PRIVATE_KEY.replace("\\n", "\n"),
            vapid_claims={"sub": settings.VAPID_EMAIL},
        )
        return True
    except WebPushException as e:
        logger.warning("Push failed: %s", e)
        return False
    except Exception as e:
        logger.warning("Push error: %s", e)
        return False


def send_push_to_user(db, user_id: int, title: str, body: str, url: str = "/feed"):
    from app.models.push_subscription import PushSubscription
    subs = db.query(PushSubscription).filter(PushSubscription.user_id == user_id).all()
    dead = []
    for sub in subs:
        info = {"endpoint": sub.endpoint, "keys": {"p256dh": sub.p256dh, "auth": sub.auth}}
        ok = send_push(info, title, body, url)
        if not ok:
            dead.append(sub.id)
    if dead:
        db.query(PushSubscription).filter(PushSubscription.id.in_(dead)).delete(synchronize_session=False)
        db.commit()
