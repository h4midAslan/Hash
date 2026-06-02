"""
Opportunity Scraper — Azərbaycandakı bütün imkanları izləyir.

Arxitektura:
  • Hər mənbənin content hash-i saxlanır
  • Hash dəyişibsə → emal edilir, dəyişməyibsə → skip
  • Bütün mənbələr eyni anda paralel yoxlanır (asyncio)
  • Tapılan imkanlar DB-yə yazılır, köhnələr deaktiv edilir
"""

import asyncio
import hashlib
import json
import logging
import re
from datetime import date, datetime, timedelta
from difflib import SequenceMatcher
from typing import Optional
from urllib.parse import urljoin, urlparse

import aiohttp
from bs4 import BeautifulSoup

log = logging.getLogger("opportunity_scraper")

# ─── Sabit məlumatlar ─────────────────────────────────────────────────────────

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "az,en;q=0.9",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}

# ─── Kateqoriya aşkarlanması ──────────────────────────────────────────────────

CATEGORY_KEYWORDS = {
    "hackathon": [
        "hackathon", "hakatom", "haqqaton", "yarış", "müsabiqə", "musabiqe",
        "challenge", "contest", "competition", "texnologiya yarışı",
        "proqramlaşdırma", "startup pitch", "innovasiya müsabiqəsi",
    ],
    "staj": [
        "staj", "internship", "intern", "təcrübə", "tecrube", "praktika",
        "iş təcrübəsi", "yay stajı", "summer intern", "trainee",
    ],
    "teqaud": [
        "təqaüd", "teqaud", "scholarship", "qrant", "grant", "maliyyə dəstəyi",
        "stipendiya", "fellowship", "burs", "maddi yardım", "maliyye",
    ],
    "tedbir": [
        "tədbir", "tedbir", "konfrans", "conference", "seminar", "workshop",
        "webinar", "forum", "summit", "meetup", "bootcamp", "təlim", "talim",
        "seminar", "master class", "treninq",
    ],
    "proqram": [
        "proqram", "akselerator", "accelerator", "inkubator", "incubator",
        "cohort", "kohort", "fellowship program", "leadership", "mentorship",
        "youth program", "gənclər proqramı", "digital program", "camp",
    ],
}

AZ_MONTHS = {
    "yanvar": 1, "yan": 1, "january": 1, "jan": 1,
    "fevral": 2, "fev": 2, "february": 2, "feb": 2,
    "mart": 3, "mar": 3, "march": 3,
    "aprel": 4, "apr": 4, "april": 4,
    "may": 5,
    "iyun": 6, "iyn": 6, "june": 6, "jun": 6,
    "iyul": 7, "iyl": 7, "july": 7, "jul": 7,
    "avqust": 8, "avq": 8, "august": 8, "aug": 8,
    "sentyabr": 9, "sen": 9, "september": 9, "sep": 9,
    "oktyabr": 10, "okt": 10, "october": 10, "oct": 10,
    "noyabr": 11, "noy": 11, "november": 11, "nov": 11,
    "dekabr": 12, "dek": 12, "december": 12, "dec": 12,
}

TAG_KEYWORDS = {
    "Python": ["python"], "JavaScript": ["javascript", "js"],
    "AI": ["süni intellekt", "ai", "artificial intelligence", "machine learning", "ml"],
    "Startup": ["startup", "startap", "biznes", "business"],
    "Fintech": ["fintech", "maliyyə", "bank", "finance"],
    "Robotika": ["robot", "mexatronika", "mechatronics"],
    "Cybersecurity": ["kibertəhlükəsizlik", "security", "cyber"],
    "Mobile": ["mobil", "mobile", "android", "ios", "flutter"],
    "Web": ["web", "frontend", "backend", "fullstack"],
    "Data": ["data", "analitika", "analytics", "sql"],
    "Cloud": ["cloud", "bulud", "aws", "azure", "devops"],
    "Design": ["dizayn", "design", "ux", "ui", "figma"],
    "Aviasiya": ["aviasiya", "aviation", "azal", "pilot"],
    "Enerji": ["enerji", "energy", "socar", "neft", "oil"],
}

LOGO_MAP = {
    "kapital": "https://kapitalbank.az/favicon.ico",
    "abb": "https://abb-bank.az/favicon.ico",
    "pasha": "https://pashabank.az/favicon.ico",
    "azercell": "https://www.azercell.com/favicon.ico",
    "bakcell": "https://www.bakcell.com/favicon.ico",
    "socar": "https://www.socar.az/favicon.ico",
    "azal": "https://www.azal.az/favicon.ico",
    "most": "https://most.az/favicon.ico",
    "ada": "https://ada.edu.az/favicon.ico",
    "unec": "https://unec.edu.az/favicon.ico",
    "startup": "https://startupbaku.az/favicon.ico",
}


# ─── Yardımçı funksiyalar ─────────────────────────────────────────────────────

def _hash(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8", errors="ignore")).hexdigest()


def _detect_category(text: str) -> str:
    text_lower = text.lower()
    scores = {cat: 0 for cat in CATEGORY_KEYWORDS}
    for cat, keywords in CATEGORY_KEYWORDS.items():
        for kw in keywords:
            if kw in text_lower:
                scores[cat] += 1
    best = max(scores, key=scores.get)
    return best if scores[best] > 0 else "proqram"


def _extract_tags(text: str) -> list[str]:
    text_lower = text.lower()
    found = []
    for tag, keywords in TAG_KEYWORDS.items():
        for kw in keywords:
            if kw in text_lower:
                found.append(tag)
                break
    return found[:5]


def _extract_prize(text: str) -> Optional[str]:
    patterns = [
        r"(\d[\d\s,.]*)\s*(AZN|azn|manat|₼)",
        r"(\d[\d\s,.]*)\s*(USD|usd|\$)",
        r"(\d[\d\s,.]*)\s*(EUR|eur|€)",
    ]
    for p in patterns:
        m = re.search(p, text, re.IGNORECASE)
        if m:
            amount = re.sub(r"\s", "", m.group(1))
            currency = m.group(2).upper().replace("MANAT", "AZN").replace("₼", "AZN")
            if currency == "$":
                currency = "USD"
            if currency == "€":
                currency = "EUR"
            return f"{amount} {currency}"
    return None


def _extract_deadline(text: str) -> Optional[date]:
    text_lower = text.lower()
    today = date.today()
    year = today.year

    # Format: "20 iyun 2026" or "20 iyun"
    m = re.search(
        r"(\d{1,2})\s+(" + "|".join(AZ_MONTHS.keys()) + r")\s*(\d{4})?",
        text_lower,
    )
    if m:
        try:
            day = int(m.group(1))
            month = AZ_MONTHS[m.group(2)]
            yr = int(m.group(3)) if m.group(3) else year
            d = date(yr, month, day)
            if d >= today:
                return d
            if not m.group(3):
                d = date(yr + 1, month, day)
                return d
        except ValueError:
            pass

    # Format: "2026-06-20" or "20.06.2026" or "20/06/2026"
    for p in [
        r"(\d{4})-(\d{2})-(\d{2})",
        r"(\d{2})[./](\d{2})[./](\d{4})",
    ]:
        m = re.search(p, text)
        if m:
            try:
                g = m.groups()
                if len(g[0]) == 4:
                    d = date(int(g[0]), int(g[1]), int(g[2]))
                else:
                    d = date(int(g[2]), int(g[1]), int(g[0]))
                if d >= today:
                    return d
            except ValueError:
                pass

    # "son müraciət: X gün" / "X days left"
    m = re.search(r"(\d+)\s*(gün|day)", text_lower)
    if m:
        try:
            return today + timedelta(days=int(m.group(1)))
        except Exception:
            pass

    return None


def _extract_location(text: str) -> str:
    text_lower = text.lower()
    if "onlayn" in text_lower or "online" in text_lower or "virtual" in text_lower:
        if any(x in text_lower for x in ["bakı", "baku", "azərbaycan"]):
            return "Bakı / Onlayn"
        return "Onlayn"
    if any(x in text_lower for x in ["bakı", "baku"]):
        return "Bakı"
    if "azərbaycan" in text_lower or "azerbaijan" in text_lower:
        return "Azərbaycan"
    return "Bakı"


def _clean_text(text: str, max_len: int = 300) -> str:
    text = re.sub(r"\s+", " ", text).strip()
    if len(text) > max_len:
        text = text[:max_len].rsplit(" ", 1)[0] + "..."
    return text


def _similarity(a: str, b: str) -> float:
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()


def _org_logo(organizer: str) -> Optional[str]:
    org_lower = organizer.lower()
    for key, url in LOGO_MAP.items():
        if key in org_lower:
            return url
    return None


# ─── Mənbə tərifi ─────────────────────────────────────────────────────────────

class Source:
    def __init__(self, name: str, url: str, organizer: str,
                 category_hint: Optional[str] = None,
                 logo: Optional[str] = None,
                 is_featured: bool = False,
                 check_interval: int = 300):   # saniyə
        self.name = name
        self.url = url
        self.organizer = organizer
        self.category_hint = category_hint
        self.logo = logo or _org_logo(organizer)
        self.is_featured = is_featured
        self.check_interval = check_interval
        self._last_hash: Optional[str] = None
        self._last_check: Optional[datetime] = None

    def needs_check(self) -> bool:
        if self._last_check is None:
            return True
        return (datetime.utcnow() - self._last_check).total_seconds() >= self.check_interval

    def mark_checked(self, content_hash: str):
        self._last_check = datetime.utcnow()
        changed = self._last_hash != content_hash
        self._last_hash = content_hash
        return changed


# ─── Bütün mənbələr ───────────────────────────────────────────────────────────

SOURCES: list[Source] = [
    # Dövlət / Rəsmi
    Source("genclik_gov", "https://genclik.gov.az/az/news",
           "Azərbaycan Gənclər Fondu", is_featured=True, check_interval=600),
    Source("mincom_gov", "https://mincom.gov.az/az/news",
           "Rəqəmsal İnkişaf Nazirliyi", is_featured=True, check_interval=600),
    Source("innovation_az", "https://innovation.az/az/news",
           "İnnovasiya Agentliyi", is_featured=True, check_interval=600),
    Source("e_gov", "https://www.e-gov.az/az/pages/opportunities",
           "Elektron Hökumət", check_interval=900),

    # Tech / Startup
    Source("most_az", "https://most.az/az/news",
           "MOST Texnologiya Parkı", is_featured=True, check_interval=300),
    Source("startup_baku", "https://startupbaku.az/news",
           "Startup Baku", is_featured=True, check_interval=300),
    Source("bakuvc", "https://bakuvc.com/news",
           "Baku Venture Capital", check_interval=600),
    Source("entrepreneur_az", "https://entrepreneur.az/news",
           "Entrepreneur.az", check_interval=600),

    # Banklar — Karriyer
    Source("kapital_career", "https://www.kapitalbank.az/az/career",
           "Kapital Bank", category_hint="staj", check_interval=900),
    Source("abb_career", "https://abb-bank.az/az/career",
           "ABB Bank", category_hint="staj", check_interval=900),
    Source("pasha_career", "https://www.pashabank.az/az/career",
           "PAŞA Bank", category_hint="staj", check_interval=900),
    Source("rabite_career", "https://rabitebank.az/az/about/career",
           "Rabitəbank", category_hint="staj", check_interval=1200),
    Source("atb_career", "https://www.atb.az/az/career",
           "Azər Türk Bank", category_hint="staj", check_interval=1200),

    # Telekom
    Source("azercell_career", "https://www.azercell.com/az/career.html",
           "Azercell", category_hint="staj", check_interval=900),
    Source("bakcell_career", "https://www.bakcell.com/az/career",
           "Bakcell", category_hint="staj", check_interval=900),
    Source("nar_career", "https://nar.az/az/career",
           "Nar Mobile", category_hint="staj", check_interval=900),

    # Böyük şirkətlər
    Source("socar_career", "https://career.socar.az/az/vacancies",
           "SOCAR", category_hint="staj", check_interval=900),
    Source("azal_career", "https://www.azal.az/az/career",
           "AZAL", category_hint="staj", check_interval=900),
    Source("pasha_holding", "https://www.pasha-holding.az/az/career",
           "PAŞA Holding", category_hint="staj", check_interval=900),

    # Universitetlər
    Source("ada_news", "https://ada.edu.az/az/news",
           "ADA Universiteti", check_interval=600),
    Source("unec_news", "https://unec.edu.az/az/news",
           "UNEC", check_interval=600),
    Source("aztu_news", "https://aztu.edu.az/az/news",
           "AZTU", check_interval=600),
    Source("bsu_news", "https://bsu.edu.az/az/news",
           "BDU", check_interval=600),

    # Xəbər saytları — tech/career bölmələri
    Source("report_tech", "https://report.az/az/texnologiya/",
           "Report.az", check_interval=180),
    Source("trend_tech", "https://www.trend.az/az/cgi-bin/rss.cgi",
           "Trend.az", check_interval=180),
    Source("1news_tech", "https://1news.az/az/tech",
           "1news.az", check_interval=180),
    Source("biznesinfo", "https://biznesinfo.az/az/news",
           "BiznesInfo.az", check_interval=300),

    # Özəl proqramlar
    Source("young_professionals", "https://jobs.azerbaijani.co/",
           "AzerbaijaniJobs", category_hint="staj", check_interval=600),
    Source("ejobs_az", "https://ejobs.az/az/vacancies",
           "eJobs.az", category_hint="staj", check_interval=300),
    Source("boss_az", "https://boss.az/vacancies?search=staj",
           "BOSS.az", category_hint="staj", check_interval=300),
    Source("hellojob_az", "https://hellojob.az/az/search?type=internship",
           "HelloJob.az", category_hint="staj", check_interval=300),
]


# ─── HTTP Sessiya ─────────────────────────────────────────────────────────────

async def _fetch(session: aiohttp.ClientSession, url: str) -> Optional[str]:
    try:
        async with session.get(
            url, headers=HEADERS, timeout=aiohttp.ClientTimeout(total=15),
            ssl=False, allow_redirects=True,
        ) as resp:
            if resp.status == 200:
                return await resp.text(errors="ignore")
            log.debug("HTTP %s → %s", resp.status, url)
            return None
    except asyncio.TimeoutError:
        log.debug("Timeout: %s", url)
        return None
    except Exception as e:
        log.debug("Fetch error %s: %s", url, e)
        return None


# ─── HTML Ayrıştırıcı ─────────────────────────────────────────────────────────

def _parse_items(html: str, base_url: str, source: Source) -> list[dict]:
    """
    Ümumi HTML parser — xəbər/imkan səhifəsindən item-ləri çıxarır.
    Müxtəlif sayt strukturlarına uyğunlaşır.
    """
    soup = BeautifulSoup(html, "lxml")
    items = []

    # Hər saytın xüsusi selektor cəhdləri
    selectors = [
        "article",
        ".news-item", ".news_item", ".news-card",
        ".vacancy-item", ".vacancy_item", ".job-item",
        ".event-item", ".program-item", ".opportunity-item",
        "[class*='news']", "[class*='vacancy']", "[class*='career']",
        "[class*='event']", "[class*='opportunity']",
        "li.item", ".list-item",
    ]

    containers = []
    for sel in selectors:
        found = soup.select(sel)
        if found and len(found) >= 2:
            containers = found[:20]
            break

    # Heç bir selector işləməsə → bütün linklərə bax
    if not containers:
        containers = soup.find_all("a", href=True)[:30]

    for el in containers:
        # Başlıq
        title = ""
        for tag in ["h1", "h2", "h3", "h4", "a", ".title", ".name"]:
            t = el.find(tag) if hasattr(el, "find") else None
            if t and t.get_text(strip=True):
                title = _clean_text(t.get_text(strip=True), 200)
                break
        if not title:
            title = _clean_text(el.get_text(strip=True), 200)
        if len(title) < 10:
            continue

        # URL
        link = ""
        a = el.find("a", href=True) if hasattr(el, "find") else (el if el.name == "a" else None)
        if a and a.get("href"):
            href = a["href"]
            link = href if href.startswith("http") else urljoin(base_url, href)
        if not link:
            continue

        # Məzmun
        text_content = el.get_text(separator=" ", strip=True)
        full_text = f"{title} {text_content}"

        # Kateqoriya
        cat = source.category_hint or _detect_category(full_text)

        # Bütün məlumatlar
        items.append({
            "title": title,
            "organizer": source.organizer,
            "category": cat,
            "deadline": _extract_deadline(full_text),
            "location": _extract_location(full_text),
            "prize": _extract_prize(full_text),
            "description": _clean_text(text_content, 300),
            "tags": json.dumps(_extract_tags(full_text)),
            "url": link,
            "logo_url": source.logo,
            "is_featured": source.is_featured,
            "source_name": source.name,
            "content_hash": _hash(title + link),
        })

    return items


# ─── DB Yazma ─────────────────────────────────────────────────────────────────

def _save_items(items: list[dict], db) -> int:
    from app.models.opportunity import Opportunity

    saved = 0
    existing_titles = [
        o.title for o in db.query(Opportunity.title).filter(
            Opportunity.is_active == True
        ).all()
    ]

    for item in items:
        # URL ilə dublikat yoxla
        exists = db.query(Opportunity).filter(
            Opportunity.url == item["url"]
        ).first()
        if exists:
            # Mövcud olanı yenilə (deadline, description dəyişmiş ola bilər)
            new_hash = item["content_hash"]
            if exists.content_hash != new_hash:
                exists.deadline = item["deadline"]
                exists.description = item["description"]
                exists.prize = item["prize"]
                exists.content_hash = new_hash
                db.commit()
            continue

        # Başlıq oxşarlığı yoxla
        too_similar = any(
            _similarity(item["title"], t) > 0.85
            for t in existing_titles
        )
        if too_similar:
            continue

        # Keyfiyyət filteri — çox qısa və mənasız olanları at
        if len(item["title"]) < 15:
            continue
        skip_words = ["404", "not found", "xəta", "error", "cookie",
                      "giriş", "login", "qeydiyyat", "register"]
        if any(w in item["title"].lower() for w in skip_words):
            continue

        opp = Opportunity(**item)
        db.add(opp)
        existing_titles.append(item["title"])
        saved += 1

    db.commit()
    return saved


# ─── Ana Scraper ──────────────────────────────────────────────────────────────

_running = False


async def _scrape_source(session: aiohttp.ClientSession, source: Source, db) -> int:
    if not source.needs_check():
        return 0

    html = await _fetch(session, source.url)
    if not html:
        source.mark_checked("")
        return 0

    content_hash = _hash(html[:5000])
    changed = source.mark_checked(content_hash)

    if not changed:
        return 0  # Dəyişiklik yoxdur — emal etmə

    log.info("🔍 Dəyişiklik aşkarlandı: %s", source.name)
    items = _parse_items(html, source.url, source)
    if not items:
        return 0

    saved = _save_items(items, db)
    if saved:
        log.info("✅ %d yeni imkan → %s", saved, source.name)
    return saved


async def scrape_all_once(db) -> int:
    """Bütün mənbələri bir dəfə yoxla — startup zamanı çağrılır."""
    total = 0
    connector = aiohttp.TCPConnector(limit=10, ssl=False)
    async with aiohttp.ClientSession(connector=connector) as session:
        tasks = [_scrape_source(session, src, db) for src in SOURCES]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        for r in results:
            if isinstance(r, int):
                total += r
    log.info("🎯 İlk tarama tamamlandı: %d yeni imkan", total)
    return total


async def run_forever(get_db_func):
    """
    Arxa planda davamlı izləyir.
    Hər mənbənin öz check_interval-ı var.
    Dəyişiklik olmayan mənbəyə heç vaxt emal vaxtı xərclənmir.
    """
    global _running
    if _running:
        return
    _running = True
    log.info("🚀 Opportunity scraper işə düşdü (%d mənbə)", len(SOURCES))

    connector = aiohttp.TCPConnector(limit=8, ssl=False)
    async with aiohttp.ClientSession(connector=connector) as session:
        while True:
            db = next(get_db_func())
            try:
                tasks = [
                    _scrape_source(session, src, db)
                    for src in SOURCES
                    if src.needs_check()
                ]
                if tasks:
                    await asyncio.gather(*tasks, return_exceptions=True)
            except Exception as e:
                log.error("Scraper loop xətası: %s", e)
            finally:
                db.close()
            await asyncio.sleep(30)   # 30 saniyədə bir "hazır olan" mənbələri yoxla
