import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.api.routes import auth, users, posts, connections, messages, admin, certificates, upload, projects, events, articles, notifications, hackathons
from alembic.config import Config
from alembic import command

def run_migrations():
    try:
        alembic_cfg = Config("alembic.ini")
        command.upgrade(alembic_cfg, "head")
    except Exception as e:
        print(f"Migration xətası (davam edir): {e}")


def ensure_tables():
    from app.services.database import engine
    from app.models.base import Base
    from sqlalchemy import text
    import app.models.article
    import app.models.hackathon
    try:
        Base.metadata.create_all(bind=engine, checkfirst=True)
        print("ensure_tables: OK")
    except Exception as e:
        print(f"ensure_tables xətası: {e}")

    # Fallback DDL: add columns that migrations may have missed
    _missing_ddl = [
        "ALTER TABLE certificates ADD COLUMN IF NOT EXISTS image_url VARCHAR(500)",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(30)",
        "CREATE UNIQUE INDEX IF NOT EXISTS ix_users_username ON users (username)",
    ]
    for stmt in _missing_ddl:
        try:
            with engine.begin() as conn:
                conn.execute(text(stmt))
        except Exception as e:
            print(f"DDL skip ({stmt[:50]}): {e}")



run_migrations()
ensure_tables()

limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title="Hash API", version="1.0.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

allowed_origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "https://hashcampus.site",
    "https://www.hashcampus.site",
]
frontend_url = os.getenv("FRONTEND_URL")
if frontend_url and frontend_url not in allowed_origins:
    allowed_origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(posts.router)
app.include_router(connections.router)
app.include_router(messages.router)
app.include_router(admin.router)
app.include_router(certificates.router)
app.include_router(upload.router)
app.include_router(projects.router)
app.include_router(events.router)
app.include_router(articles.router)
app.include_router(notifications.router)
app.include_router(hackathons.router)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"UNHANDLED ERROR: {type(exc).__name__}: {exc}")
    return JSONResponse(status_code=500, content={"detail": "Daxili server xətası"})


@app.api_route("/", methods=["GET", "HEAD"])
def root():
    return {"message": "Hash API işləyir"}
