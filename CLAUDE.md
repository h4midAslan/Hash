# VektorIn — CLAUDE.md

LinkedIn-tipli Azərbaycanlı developer sosial şəbəkəsi. Production domenı: **hashcampus.site**

## Layihə strukturu

```
VektorIn/
├── backend/        # FastAPI + SQLAlchemy + PostgreSQL
│   └── app/
│       ├── api/routes/     # Endpoint-lər (auth, users, posts, ...)
│       ├── models/         # SQLAlchemy modelləri
│       └── services/       # DB, auth, email, notifier, scraper
└── frontend/       # React 19 + Vite + Tailwind CSS v4
    └── src/
        ├── pages/          # Route səhifələri
        ├── components/     # Paylaşılan komponentlər
        ├── hooks/          # useTheme, useLang, useDarkClasses
        ├── api/client.js   # Axios instance
        └── locales/        # az.js, en.js (i18n)
```

## Tech stack

### Backend
- **FastAPI** 0.115 — API framework
- **SQLAlchemy** 2.0 — ORM (sync)
- **Alembic** — DB miqrasiyaları (`alembic upgrade head` avtomatik işləyir startup-da)
- **PostgreSQL** — psycopg[binary] driver
- **python-jose + passlib** — JWT auth
- **Cloudinary** — şəkil upload
- **slowapi** — rate limiting
- **beautifulsoup4 + httpx** — hackathon scraper

### Frontend
- **React 19** + **React Router v7**
- **Tailwind CSS v4** (Vite plugin ilə)
- **TipTap** — rich text editor (articles)
- **Three.js + @react-three/fiber** — 3D elementlər
- **Framer Motion** — animasiyalar
- **Axios** — HTTP client
- **lucide-react** — ikonlar

## Serveri işə salmaq

```bash
# Backend (backend/ qovluğundan)
uvicorn app.main:app --reload --port 8000

# Frontend (frontend/ qovluğundan)
npm run dev        # port 5173
npm run build      # CI=false vite build
```

## API route-ları

| Router | Prefix | Məqsəd |
|--------|--------|--------|
| auth | /auth | Qeydiyyat, login, email verify |
| users | /users | Profil CRUD |
| posts | /posts | Feed postları |
| connections | /connections | Əlaqə/follow sistemi |
| messages | /messages | DM sistemi |
| notifications | /notifications | Bildirişlər |
| articles | /articles | TipTap məqalələr |
| projects | /projects | Developer layihələri |
| certificates | /certificates | Sertifikatlar |
| events | /events | Tədbirlər |
| hackathons | /hackathons | Scrape edilmiş hackathonlar |
| upload | /upload | Cloudinary upload |
| admin | /admin | Admin paneli |

## CORS

Allowed origins: `localhost:5173`, `localhost:5174`, `hashcampus.site`, `www.hashcampus.site`, `.env`-dən `FRONTEND_URL`

## Frontend konvensiyalar

- **Dark mode**: `useDarkClasses()` hook-u ilə — sinifləri şərtlə qaytarır
- **Dil**: `useLang()` hook-u — `az.js` / `en.js` fayllarına baxır
- **API çağırışları**: `src/api/client.js`-dəki Axios instance ilə (token avtomatik əlavə olunur)
- **Toast bildirişlər**: `<Toast>` komponenti

## DB miqrasiyası

```bash
# Yeni miqrasiya yarat
cd backend && alembic revision --autogenerate -m "açıqlama"

# Tətbiq et
alembic upgrade head
```

## Mühit dəyişənləri (backend/.env)

`DATABASE_URL`, `SECRET_KEY`, `CLOUDINARY_*`, `FRONTEND_URL`, `SMTP_*` — `.env.example` yoxdur, mövcud `.env`-ə bax.

## Qeydlər

- `ensure_tables()` startup-da çağırılır — artıq migration olmayan modelləri yaradır (fallback)
- Hackathon scraper (`services/hackathon_scraper.py`) xarici saytları parse edir
- Frontend `dist/` qovluğu — Vercel deploy üçün (`vercel.json` mövcuddur)
