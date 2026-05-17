import os
import hashlib
import base64
from cryptography.fernet import Fernet, InvalidToken

_fernet = None


def _get() -> Fernet:
    global _fernet
    if _fernet is None:
        secret = os.getenv("SECRET_KEY", "changeme-set-in-env")
        key = hashlib.pbkdf2_hmac("sha256", secret.encode(), b"vektorin-msg-v1", 100_000)
        _fernet = Fernet(base64.urlsafe_b64encode(key))
    return _fernet


def encrypt_msg(text: str) -> str:
    return _get().encrypt(text.encode()).decode()


def decrypt_msg(text: str) -> str:
    try:
        return _get().decrypt(text.encode()).decode()
    except (InvalidToken, Exception):
        return text
