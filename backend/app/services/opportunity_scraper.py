"""
Opportunity Scraper — Azərbaycandakı imkanları avtomatik tapır.

Mənbə seçim prinsipi:
  • Konkret imkan/vakansiya/proqram səhifələri — ümumi xəbər yox
  • İş elanı saytları (boss.az, hellojob.az, ejobs.az) → staj kateqoriyası
  • Texnologiya/startup xəbərləri → hackathon/proqram kateqoriyası
  • Dövlət portları → rəsmi proqramlar

Content hash ilə dəyişiklik aşkarlanır — dəyişməyən səhifəyə vaxt xərclənmir.
"""

import asyncio
import hashlib
import json
import logging
import re
from datetime import date, datetime, timedelta
from difflib import SequenceMatcher
from typing import Optional
from urllib.parse import urljoin

import aiohttp
from bs4 import BeautifulSoup

log = logging.getLogger("opportunity_scraper")

# ─── HTTP headers ──────────────────────────────────────────────────────────────
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "az,en;q=0.9",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}

# ─── Kateqoriya açar sözləri ───────────────────────────────────────────────────
CATEGORY_KEYWORDS = {
    "hackathon": [
        "hackathon", "hakatom", "hakaton", "yarış", "müsabiqə", "musabiqe",
        "challenge", "contest", "competition", "texnologiya yarışı",
        "innovasiya müsabiqəsi", "proqramlaşdırma müsabiqəsi",
    ],
    "staj": [
        "staj", "internship", "intern", "təcrübə", "tecrube", "praktika",
        "iş təcrübəsi", "yay stajı", "summer intern", "trainee", "trainee program",
        "praktik", "stajirovka",
    ],
    "teqaud": [
        "təqaüd", "teqaud", "scholarship", "qrant", "grant", "maliyyə dəstəyi",
        "stipendiya", "fellowship", "burs",
    ],
    "tedbir": [
        "konfrans", "conference", "seminar", "workshop", "webinar", "forum",
        "summit", "meetup", "bootcamp", "təlim", "talim", "master class",
    ],
    "proqram": [
        "proqram", "akselerator", "accelerator", "inkubator", "incubator",
        "cohort", "kohort", "fellowship program", "youth program",
        "gənclər proqramı", "digital program", "camp", "digicamp",
    ],
}

AZ_MONTHS = {
    "yanvar":1,"yan":1,"january":1,"jan":1,
    "fevral":2,"fev":2,"february":2,"feb":2,
    "mart":3,"march":3,"mar":3,
    "aprel":4,"april":4,"apr":4,
    "may":5,
    "iyun":6,"iyn":6,"june":6,"jun":6,
    "iyul":7,"iyl":7,"july":7,"jul":7,
    "avqust":8,"avq":8,"august":8,"aug":8,
    "sentyabr":9,"sen":9,"september":9,"sep":9,
    "oktyabr":10,"okt":10,"october":10,"oct":10,
    "noyabr":11,"noy":11,"november":11,"nov":11,
    "dekabr":12,"dek":12,"december":12,"dec":12,
}

TAG_KEYWORDS = {
    "Python":["python"],"JavaScript":["javascript","js"],
    "AI":["süni intellekt","ai","artificial intelligence","machine learning","ml"],
    "Startup":["startup","startap","biznes inkubasiya"],
    "Fintech":["fintech","maliyyə texnologiya","bank texnologiya"],
    "Robototexnika":["robot","mexatronika","mechatronics"],
    "Cybersecurity":["kibertəhlükəsizlik","security","cyber","kiber"],
    "Mobile":["mobil","mobile","android","ios","flutter"],
    "Web":["web","frontend","backend","fullstack"],
    "Data":["data analitika","data analytics","sql","data science"],
    "Cloud":["cloud","bulud","aws","azure","devops"],
    "Design":["dizayn","design","ux","ui","figma"],
    "Aviasiya":["aviasiya","aviation","azal"],
    "Enerji":["enerji","energy","socar","neft","oil"],
    "Pulsuz":["pulsuz","free","ödənişsiz"],
    "Ödənişli":["ödənişli","paid","maaş"],
    "Komanda":["komanda","team","group"],
    "Sertifikat":["sertifikat","certificate","certified"],
}

# ─── Mənbə sinfi ───────────────────────────────────────────────────────────────
class Source:
    def __init__(self, name, url, organizer, category_hint=None,
                 logo=None, is_featured=False, check_interval=300,
                 item_selector=None, title_selector=None, link_selector=None):
        self.name = name
        self.url = url
        self.organizer = organizer
        self.category_hint = category_hint
        self.logo = logo
        self.is_featured = is_featured
        self.check_interval = check_interval
        self.item_selector = item_selector
        self.title_selector = title_selector
        self.link_selector = link_selector
        self._last_hash = None
        self._last_check = None

    def needs_check(self):
        if self._last_check is None:
            return True
        return (datetime.utcnow() - self._last_check).total_seconds() >= self.check_interval

    def mark_checked(self, h):
        changed = self._last_hash != h
        self._last_hash = h
        self._last_check = datetime.utcnow()
        return changed


# ─── Mənbə siyahısı ───────────────────────────────────────────────────────────
# Yalnız real imkan/vakansiya/proqram SƏHIFƏLƏRI — ümumi xəbər yox

SOURCES = [
    # ── İş elanı saytları (staj/internship) ─────────────────────────────────
    Source("boss_staj",
           "https://boss.az/vacancies?search=staj&employment_type=internship",
           "Boss.az", category_hint="staj", check_interval=900,
           item_selector=".vacancy-item, .job-list-item, article, .vacancy"),

    Source("boss_intern",
           "https://boss.az/vacancies?search=intern",
           "Boss.az", category_hint="staj", check_interval=900),

    Source("hellojob_intern",
           "https://hellojob.az/az/search?type=internship",
           "HelloJob.az", category_hint="staj", check_interval=600),

    Source("ejobs_staj",
           "https://ejobs.az/az/vacancies?type=2",
           "eJobs.az", category_hint="staj", check_interval=600),

    Source("isveren_staj",
           "https://www.isveren.az/az/vacancies?type=internship",
           "İşveren.az", category_hint="staj", check_interval=900),

    # ── Tech/Startup proqramları ─────────────────────────────────────────────
    Source("most_programs",
           "https://most.az/az/programs",
           "MOST Technology Park", category_hint="proqram",
           is_featured=True, check_interval=1800),

    Source("most_news",
           "https://most.az/az/news",
           "MOST Technology Park", check_interval=1200),

    Source("startup_baku",
           "https://startupbaku.az/programs",
           "Startup Baku", category_hint="proqram",
           is_featured=True, check_interval=1800),

    Source("startup_baku_news",
           "https://startupbaku.az/news",
           "Startup Baku", check_interval=1200),

    Source("innovation_az",
           "https://innovation.az/az/competitions",
           "İnnovasiya Agentliyi", category_hint="hackathon",
           is_featured=True, check_interval=1800),

    Source("innovation_news",
           "https://innovation.az/az/news",
           "İnnovasiya Agentliyi", check_interval=1200),

    # ── Dövlət proqramları ───────────────────────────────────────────────────
    Source("genclik_opportunities",
           "https://genclik.gov.az/az/opportunities",
           "Azərbaycan Gənclər Fondu", is_featured=True, check_interval=3600),

    Source("genclik_news",
           "https://genclik.gov.az/az/news",
           "Azərbaycan Gənclər Fondu", check_interval=1800),

    Source("mincom_news",
           "https://mincom.gov.az/az/news",
           "Rəqəmsal İnkişaf Nazirliyi", is_featured=True, check_interval=1800),

    # ── Şirkət kariyer/staj səhifələri ──────────────────────────────────────
    Source("kapital_career",
           "https://www.kapitalbank.az/az/career",
           "Kapital Bank", category_hint="staj", check_interval=3600),

    Source("abb_career",
           "https://abb-bank.az/az/career",
           "ABB Bank", category_hint="staj", check_interval=3600),

    Source("pasha_career",
           "https://www.pashabank.az/az/career",
           "PAŞA Bank", category_hint="staj", check_interval=3600),

    Source("azercell_career",
           "https://www.azercell.com/az/career.html",
           "Azercell", category_hint="staj", check_interval=3600),

    Source("socar_career",
           "https://career.socar.az/az/vacancies",
           "SOCAR", category_hint="staj", check_interval=3600),

    Source("azal_career",
           "https://www.azal.az/az/career",
           "AZAL", category_hint="staj", check_interval=3600),

    Source("pasha_holding",
           "https://www.pasha-holding.az/az/career",
           "PAŞA Holding", category_hint="staj", check_interval=3600),

    # ── Hackathon/müsabiqə saytları ──────────────────────────────────────────
    Source("teknofest_az",
           "https://teknofest.az/az/competitions",
           "TEKNOFEST Azərbaycan", category_hint="hackathon",
           is_featured=True, check_interval=3600),

    Source("ada_opportunities",
           "https://ada.edu.az/az/news",
           "ADA Universiteti", check_interval=3600),

    Source("unec_news",
           "https://unec.edu.az/az/news",
           "UNEC", check_interval=3600),

    # ── Xəbər saytları (seçilmiş texnologiya/karyera bölmələri) ─────────────
    Source("report_tech",
           "https://report.az/az/texnologiya/",
           "Report.az", check_interval=600),

    Source("1news_tech",
           "https://1news.az/az/tech",
           "1news.az", check_interval=600),

    Source("azertac_ikt",
           "https://azertag.az/az/xeber?category=ikt",
           "AZERTAC", check_interval=900),
]


# ─── Yardımçı funksiyalar ──────────────────────────────────────────────────────
def _hash(text):
    return hashlib.sha256(text.encode("utf-8", errors="ignore")).hexdigest()

def _detect_category(text, hint=None):
    if hint:
        return hint
    text_lower = text.lower()
    scores = {cat: 0 for cat in CATEGORY_KEYWORDS}
    for cat, kws in CATEGORY_KEYWORDS.items():
        for kw in kws:
            if kw in text_lower:
                scores[cat] += 1
    best = max(scores, key=scores.get)
    return best if scores[best] > 0 else "proqram"

def _extract_tags(text):
    t = text.lower()
    found = []
    for tag, kws in TAG_KEYWORDS.items():
        if any(kw in t for kw in kws):
            found.append(tag)
    return found[:5]

def _extract_prize(text):
    for p in [r"(\d[\d\s,.]*)[\s]*(AZN|azn|manat|₼)",
              r"(\d[\d\s,.]*)[\s]*(USD|usd|\$)",
              r"(\d[\d\s,.]*)[\s]*(EUR|eur|€)"]:
        m = re.search(p, text, re.IGNORECASE)
        if m:
            amt = re.sub(r"\s", "", m.group(1))
            cur = m.group(2).upper().replace("MANAT","AZN").replace("₼","AZN").replace("$","USD").replace("€","EUR")
            return f"{amt} {cur}"
    return None

def _extract_deadline(text):
    today = date.today()
    year = today.year
    t = text.lower()

    # "20 iyun 2026" or "20 iyun"
    m = re.search(r"(\d{1,2})\s+(" + "|".join(AZ_MONTHS.keys()) + r")\s*(\d{4})?", t)
    if m:
        try:
            day = int(m.group(1))
            mon = AZ_MONTHS[m.group(2)]
            yr  = int(m.group(3)) if m.group(3) else year
            d = date(yr, mon, day)
            if d >= today:
                return d
            if not m.group(3):
                return date(yr + 1, mon, day)
        except ValueError:
            pass

    # "2026-07-15" or "15.07.2026"
    for p in [r"(\d{4})-(\d{2})-(\d{2})", r"(\d{2})[./](\d{2})[./](\d{4})"]:
        m = re.search(p, text)
        if m:
            try:
                g = m.groups()
                d = date(int(g[0]), int(g[1]), int(g[2])) if len(g[0]) == 4 else date(int(g[2]), int(g[1]), int(g[0]))
                if d >= today:
                    return d
            except ValueError:
                pass

    return None

def _extract_location(text):
    t = text.lower()
    online = "onlayn" in t or "online" in t or "virtual" in t
    baku   = "bakı" in t or "baku" in t or "azərbaycan" in t
    if online and baku:
        return "Bakı / Onlayn"
    if online:
        return "Onlayn"
    if baku:
        return "Bakı"
    return "Bakı"

def _clean(text, n=300):
    text = re.sub(r"\s+", " ", text).strip()
    return text[:n].rsplit(" ", 1)[0] + "..." if len(text) > n else text

def _similarity(a, b):
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()

# İmkanla əlaqəli başlıq filteri
_OPPORTUNITY_WORDS = set(sum(CATEGORY_KEYWORDS.values(), []) + [
    "staj", "vakansiya", "vacancy", "intern", "proqram", "qrant", "grant",
    "müsabiqə", "yarış", "hackathon", "fellowship", "scholarship",
    "akselerator", "inkubator", "camp", "bootcamp",
])

def _is_opportunity(title, desc):
    combined = (title + " " + desc).lower()
    return any(w in combined for w in _OPPORTUNITY_WORDS)

_SKIP_WORDS = {"404", "not found", "xəta", "error", "cookie", "giriş", "login",
               "qeydiyyat", "register", "şifrə", "parol", "sitemap", "haqqımızda",
               "əlaqə", "contact us"}

def _is_junk(title):
    if len(title) < 12:
        return True
    t = title.lower()
    return any(w in t for w in _SKIP_WORDS)


# ─── HTML parser ──────────────────────────────────────────────────────────────
def _parse_html(html, base_url, source):
    soup = BeautifulSoup(html, "lxml")
    items = []

    # Selektor cəhdləri
    selectors = (
        [source.item_selector] if source.item_selector else []
    ) + [
        "article", ".vacancy-item", ".vacancy_item", ".job-item",
        ".news-item", ".news_item", ".news-card", ".program-item",
        ".list-item", "li.item", ".card", "[class*='vacancy']",
        "[class*='job']", "[class*='program']", "[class*='news']",
    ]

    containers = []
    for sel in selectors:
        found = soup.select(sel)
        if found and len(found) >= 2:
            containers = found[:25]
            break

    if not containers:
        # Fallback: title-like linkler
        containers = [
            a for a in soup.find_all("a", href=True)
            if len(a.get_text(strip=True)) > 20
        ][:30]

    for el in containers:
        # Başlıq
        title = ""
        for tag in ["h1","h2","h3","h4",".title",".name","a"]:
            t_el = el.find(tag) if hasattr(el, "find") else None
            if t_el and t_el.get_text(strip=True):
                title = _clean(t_el.get_text(strip=True), 200)
                break
        if not title:
            title = _clean(el.get_text(strip=True), 200)

        if _is_junk(title):
            continue

        # URL
        a_el = el.find("a", href=True) if hasattr(el, "find") else (el if getattr(el, "name", None) == "a" else None)
        if not a_el:
            continue
        href = a_el.get("href", "")
        if not href or href.startswith("#") or href.startswith("javascript"):
            continue
        link = href if href.startswith("http") else urljoin(base_url, href)

        # Məzmun
        body = _clean(el.get_text(separator=" ", strip=True), 300)
        full = title + " " + body

        # Yalnız imkanla əlaqəli olanları əlavə et
        if not _is_opportunity(title, body) and not source.category_hint:
            continue

        cat = _detect_category(full, source.category_hint)

        items.append({
            "title": title,
            "organizer": source.organizer,
            "category": cat,
            "deadline": _extract_deadline(full),
            "location": _extract_location(full),
            "prize": _extract_prize(full),
            "description": body if body != title else None,
            "tags": json.dumps(_extract_tags(full)),
            "url": link,
            "logo_url": source.logo,
            "is_featured": source.is_featured,
            "source_name": source.name,
            "content_hash": _hash(title + link),
        })

    return items


# ─── DB yazma ──────────────────────────────────────────────────────────────────
def _save(items, db):
    from app.models.opportunity import Opportunity
    saved = 0
    existing = [
        (o.url, o.title)
        for o in db.query(Opportunity.url, Opportunity.title)
                   .filter(Opportunity.is_active == True).all()
    ]
    existing_urls   = {u for u, _ in existing}
    existing_titles = [t for _, t in existing]

    for item in items:
        if item["url"] in existing_urls:
            # Hash dəyişibsə — yenilə
            rec = db.query(Opportunity).filter(Opportunity.url == item["url"]).first()
            if rec and rec.content_hash != item["content_hash"]:
                rec.deadline    = item["deadline"]
                rec.description = item["description"]
                rec.prize       = item["prize"]
                rec.tags        = item["tags"]
                rec.content_hash = item["content_hash"]
            continue

        if any(_similarity(item["title"], t) > 0.85 for t in existing_titles):
            continue

        from app.models.opportunity import Opportunity as Opp
        db.add(Opp(**item))
        existing_urls.add(item["url"])
        existing_titles.append(item["title"])
        saved += 1

    db.commit()
    return saved


# ─── HTTP fetch ────────────────────────────────────────────────────────────────
async def _fetch(session, url):
    try:
        async with session.get(url, headers=HEADERS,
                               timeout=aiohttp.ClientTimeout(total=18),
                               ssl=False, allow_redirects=True) as r:
            if r.status == 200:
                return await r.text(errors="ignore")
            log.debug("HTTP %s → %s", r.status, url)
    except asyncio.TimeoutError:
        log.debug("Timeout: %s", url)
    except Exception as e:
        log.debug("Fetch err %s: %s", url, e)
    return None


# ─── Tək mənbə scrape ─────────────────────────────────────────────────────────
async def _scrape_one(session, source, db):
    if not source.needs_check():
        return 0
    html = await _fetch(session, source.url)
    if not html:
        source.mark_checked("")
        return 0
    h = _hash(html[:8000])
    changed = source.mark_checked(h)
    if not changed:
        return 0
    log.info("🔍 Dəyişiklik: %s", source.name)
    items = _parse_html(html, source.url, source)
    if not items:
        return 0
    saved = _save(items, db)
    if saved:
        log.info("✅ %d yeni imkan ← %s", saved, source.name)
    return saved


# ─── Public API ───────────────────────────────────────────────────────────────
_running = False

async def scrape_all_once(db):
    """Startup-da bütün mənbələri bir dəfə yoxla."""
    total = 0
    conn = aiohttp.TCPConnector(limit=12, ssl=False)
    async with aiohttp.ClientSession(connector=conn) as s:
        results = await asyncio.gather(
            *[_scrape_one(s, src, db) for src in SOURCES],
            return_exceptions=True
        )
        total = sum(r for r in results if isinstance(r, int))
    log.info("🎯 İlk tarama: %d yeni imkan (%d mənbə)", total, len(SOURCES))
    return total


async def run_forever(get_db_func):
    """Davamlı arxa planda izləyir. Hər 30s check_interval-ı bitmiş mənbələri yoxlayır."""
    global _running
    if _running:
        return
    _running = True
    log.info("🚀 Radar scraper başladı (%d mənbə)", len(SOURCES))
    conn = aiohttp.TCPConnector(limit=8, ssl=False)
    async with aiohttp.ClientSession(connector=conn) as s:
        while True:
            db = next(get_db_func())
            try:
                due = [src for src in SOURCES if src.needs_check()]
                if due:
                    await asyncio.gather(
                        *[_scrape_one(s, src, db) for src in due],
                        return_exceptions=True
                    )
            except Exception as e:
                log.error("Loop xəta: %s", e)
            finally:
                db.close()
            await asyncio.sleep(30)
