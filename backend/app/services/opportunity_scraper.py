"""
Opportunity Scraper — Azərbaycandakı imkanları avtomatik tapır.

Əsas mənbə: Google News RSS — Google hər Azərbaycan saytını indeksləyir,
RSS həmişə açıqdır, JavaScript lazım deyil. Ən etibarlı yanaşmadır.

İkinci mənbə: boss.az, hellojob.az — real strukturlaşmış iş elanı saytları.
"""

import asyncio
import hashlib
import json
import logging
import re
from datetime import date, datetime, timedelta
from difflib import SequenceMatcher
from typing import Optional
from urllib.parse import urljoin, quote

import aiohttp
from bs4 import BeautifulSoup

log = logging.getLogger("opportunity_scraper")

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "az,en;q=0.9",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}

# ─── Tanınan təşkilatlar ───────────────────────────────────────────────────────
KNOWN_ORGS = {
    "kapital bank": "Kapital Bank",
    "abb bank": "ABB Bank",
    "abb azerbaijan": "ABB Azerbaijan",
    "pasha bank": "PAŞA Bank",
    "pashabank": "PAŞA Bank",
    "pasha holding": "PAŞA Holding",
    "azercell": "Azercell Telekom",
    "bakcell": "Bakcell",
    "nar mobile": "Nar Mobile",
    "socar": "SOCAR",
    "azal": "AZAL",
    "most texnologiya": "MOST Technology Park",
    "most technology": "MOST Technology Park",
    "startup baku": "Startup Baku",
    "ada universit": "ADA Universiteti",
    "unec": "UNEC",
    "aztu": "AZTU",
    "bdu": "Bakı Dövlət Universiteti",
    "teknofest": "TEKNOFEST Azərbaycan",
    "mincom": "Rəqəmsal İnkişaf Nazirliyi",
    "rəqəmsal inkişaf": "Rəqəmsal İnkişaf Nazirliyi",
    "gənclik fondu": "Azərbaycan Gənclər Fondu",
    "genclik.gov": "Azərbaycan Gənclər Fondu",
    "innovation.az": "İnnovasiya Agentliyi",
    "innovasiya agent": "İnnovasiya Agentliyi",
    "rabitebank": "Rabitəbank",
    "atb bank": "Azər Türk Bank",
    "bakı şəhər icra": "Bakı Şəhər İcra Hakimiyyəti",
    "baku city": "Bakı Şəhər İcra Hakimiyyəti",
}

CATEGORY_KEYWORDS = {
    "hackathon": [
        "hackathon", "hakatom", "hakaton", "yarış", "müsabiqə", "musabiqe",
        "challenge", "contest", "competition", "innovasiya müsabiqəsi",
        "proqramlaşdırma müsabiqəsi", "texnologiya yarışı",
    ],
    "staj": [
        "staj", "internship", "intern ", "təcrübə", "praktika",
        "iş təcrübəsi", "yay stajı", "summer intern", "trainee",
        "stajirovka",
    ],
    "teqaud": [
        "təqaüd", "teqaud", "scholarship", "qrant", "grant",
        "stipendiya", "fellowship", "burs", "maliyyə dəstəyi",
    ],
    "tedbir": [
        "konfrans", "conference", "seminar", "workshop", "webinar",
        "forum", "summit", "meetup", "bootcamp", "təlim kursu",
        "master class",
    ],
    "proqram": [
        "proqram", "akselerator", "accelerator", "inkubator",
        "cohort", "kohort", "gənclər proqramı", "digicamp",
        "digital camp", "leadership program",
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
    "AI":["süni intellekt","artificial intelligence","machine learning","ml"],
    "Startup":["startup","startap","biznes inkubasiya"],
    "Fintech":["fintech","bank texnologiya"],
    "Robototexnika":["robot","mexatronika","mechatronics"],
    "Cybersecurity":["kibertəhlükəsizlik","security","cyber"],
    "Mobile":["mobil","mobile","android","ios","flutter"],
    "Web":["web","frontend","backend","fullstack"],
    "Data":["data analitika","data analytics","sql","data science"],
    "Cloud":["cloud","bulud","aws","azure","devops"],
    "Design":["dizayn","design","ux","ui","figma"],
    "Aviasiya":["aviasiya","aviation","azal"],
    "Enerji":["enerji","energy","socar"],
    "Pulsuz":["pulsuz","free","ödənişsiz"],
    "Ödənişli":["ödənişli","paid","maaş"],
    "Komanda":["komanda","team"],
    "Sertifikat":["sertifikat","certificate"],
}

# ─── Google News RSS axtarış sorğuları ────────────────────────────────────────
# Hər sorğu müxtəlif kateqoriya üçün
GNEWS_QUERIES = [
    # Staj — "staj proqramı" daha spesifikdir
    ("staj proqramı Azərbaycan",          "staj"),
    ("staj elanı Bakı 2026",              "staj"),
    ("internship program Azerbaijan",      "staj"),
    ("yay stajı Azərbaycan",              "staj"),
    # Hackathon
    ("hackathon Azərbaycan",              "hackathon"),
    ("hakatom müsabiqə Bakı",             "hackathon"),
    ("texnologiya yarışması Azərbaycan",  "hackathon"),
    ("innovation challenge Azerbaijan",   "hackathon"),
    # Təqaüd — "tələbə" sözü əlavə edərək pensiyadan ayır
    ("tələbə təqaüdü Azərbaycan 2026",   "teqaud"),
    ("student scholarship Azerbaijan",    "teqaud"),
    ("tədqiqat qrantı Azərbaycan",        "teqaud"),
    # Proqram
    ("akselerator startup Azərbaycan",    "proqram"),
    ("inkubator proqramı Bakı",           "proqram"),
    ("gənclər proqramı Azərbaycan 2026",  "proqram"),
    ("digicamp Azerbaijan",               "proqram"),
    # Tədbir
    ("IT konfransı Bakı 2026",            "tedbir"),
    ("texnologiya seminarı Azərbaycan",   "tedbir"),
]

# Pensiya/ictimai xəbərləri filtreləmək üçün
_NOISE_WORDS = {
    "pensiya", "pension", "пенсия", "sığorta", "ictimai", "məvacib",
    "vergi", "büdcə", "hökumət qərarı", "nazirlik iclası",
    "xarici siyasət", "diplomatik", "hərbi", "müdafiə",
    "deputat", "parlament", "seçki", "referendum",
    "futbol", "idman", "turizm", "mədəniyyət",
}


def gnews_url(query):
    q = quote(query)
    return f"https://news.google.com/rss/search?q={q}&hl=az&gl=AZ&ceid=AZ:az"


# ─── Yardımçı funksiyalar ──────────────────────────────────────────────────────
def _hash(text):
    return hashlib.sha256(text.encode("utf-8", errors="ignore")).hexdigest()

def _extract_organizer(text):
    t = text.lower()
    for key, name in KNOWN_ORGS.items():
        if key in t:
            return name
    return None

def _detect_category(text, hint=None):
    if hint:
        return hint
    t = text.lower()
    scores = {cat: 0 for cat in CATEGORY_KEYWORDS}
    for cat, kws in CATEGORY_KEYWORDS.items():
        for kw in kws:
            if kw in t:
                scores[cat] += (2 if cat == "staj" and "staj" in kw else 1)
    best = max(scores, key=scores.get)
    return best if scores[best] > 0 else "proqram"

def _extract_tags(text):
    t = text.lower()
    return [tag for tag, kws in TAG_KEYWORDS.items() if any(kw in t for kw in kws)][:5]

def _extract_prize(text):
    for p in [r"(\d[\d\s,.]*)[\s]*(AZN|azn|manat|₼)",
              r"(\d[\d\s,.]*)[\s]*(USD|usd|\$)",
              r"(\d[\d\s,.]*)[\s]*(EUR|eur|€)"]:
        m = re.search(p, text, re.IGNORECASE)
        if m:
            amt = re.sub(r"\s", "", m.group(1))
            cur = m.group(2).upper().replace("MANAT","AZN").replace("₼","AZN")
            return f"{amt} {cur}"
    return None

def _extract_deadline(text):
    today = date.today()
    t = text.lower()
    # "20 iyun 2026"
    m = re.search(r"(\d{1,2})\s+(" + "|".join(AZ_MONTHS.keys()) + r")\s*(\d{4})?", t)
    if m:
        try:
            day = int(m.group(1))
            mon = AZ_MONTHS[m.group(2)]
            yr  = int(m.group(3)) if m.group(3) else today.year
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
                d = date(int(g[0]),int(g[1]),int(g[2])) if len(g[0])==4 else date(int(g[2]),int(g[1]),int(g[0]))
                if d >= today:
                    return d
            except ValueError:
                pass
    return None

def _extract_location(text):
    t = text.lower()
    if ("onlayn" in t or "online" in t) and ("bakı" in t or "baku" in t):
        return "Bakı / Onlayn"
    if "onlayn" in t or "online" in t:
        return "Onlayn"
    return "Bakı"

def _clean(text, n=300):
    text = re.sub(r"\s+", " ", text).strip()
    return text[:n].rsplit(" ", 1)[0] + "..." if len(text) > n else text

def _similarity(a, b):
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()

_SKIP = {"404","not found","xəta","error","cookie","giriş","login",
         "qeydiyyat","register","şifrə","sitemap","haqqımızda","contact"}

_CYRILLIC = re.compile(r'[а-яёА-ЯЁ]{3,}')

def _is_junk(title):
    if len(title) < 15:
        return True
    t = title.lower()
    if _CYRILLIC.search(title):   # Rusca/Kiril başlıqları at
        return True
    return any(w in t for w in _SKIP)


# ─── RSS parser ───────────────────────────────────────────────────────────────
def _parse_rss(xml_text, category_hint, default_org="Azərbaycan"):
    """Google News RSS və digər RSS/Atom feedlərini emal edir."""
    items = []
    try:
        soup = BeautifulSoup(xml_text, "lxml-xml")
    except Exception:
        soup = BeautifulSoup(xml_text, "lxml")

    entries = soup.find_all(["item", "entry"])
    log.debug("RSS entries: %d", len(entries))

    for entry in entries:
        # Başlıq
        title_el = entry.find("title")
        if not title_el:
            continue
        title = re.sub(r"\s*-\s*[\w\s]+$", "", title_el.get_text(strip=True))  # "Title - Source" → "Title"
        title = _clean(title, 200)
        if _is_junk(title):
            continue

        # URL
        link = ""
        for tag in ["link","guid"]:
            el = entry.find(tag)
            if el:
                href = el.get("href") or el.get_text(strip=True)
                if href and href.startswith("http"):
                    link = href
                    break
        if not link:
            continue

        # Açıqlama
        desc_el = entry.find(["description","summary","content"])
        desc = ""
        if desc_el:
            desc = BeautifulSoup(desc_el.get_text(separator=" ", strip=True), "lxml").get_text()
            desc = _clean(desc, 300)

        full = title + " " + desc

        # Səs-küylü məzmunu at (pensiya, xarici siyasət, idman...)
        full_lower = full.lower()
        if any(noise in full_lower for noise in _NOISE_WORDS):
            continue

        # Yalnız imkanla əlaqəli məqalələr
        opp_words = set(sum(CATEGORY_KEYWORDS.values(), []))
        if not any(w in full_lower for w in opp_words):
            continue

        # Kateqoriya
        cat = _detect_category(full, category_hint)

        # Təşkilat — tanınan şirkət yoxsa default_org
        org = _extract_organizer(full) or default_org

        # Yayım tarixi — deadline üçün əsas (yoxdursa None)
        pub_date_el = entry.find(["pubDate","published","updated","dc:date"])
        pub_date = None
        if pub_date_el:
            try:
                from email.utils import parsedate_to_datetime
                pub_date = parsedate_to_datetime(pub_date_el.get_text(strip=True)).date()
            except Exception:
                pass

        deadline = _extract_deadline(full)
        # Google News-da son müraciət tarixi məqalə içindədir;
        # tapılmadısa yayım tarixindən 30 gün sonrası
        if not deadline and pub_date:
            estimated = pub_date + timedelta(days=30)
            if estimated >= date.today():
                deadline = estimated

        items.append({
            "title": title,
            "organizer": org,
            "category": cat,
            "deadline": deadline,
            "location": _extract_location(full),
            "prize": _extract_prize(full),
            "description": desc or None,
            "tags": json.dumps(_extract_tags(full)),
            "url": link,
            "logo_url": None,
            "is_featured": False,
            "source_name": "gnews_" + category_hint if category_hint else "gnews",
            "content_hash": _hash(title + link),
        })

    return items


# ─── HTML parser (boss.az, hellojob.az) ───────────────────────────────────────
def _parse_jobboard(html, base_url, org_name, category_hint):
    soup = BeautifulSoup(html, "lxml")
    items = []

    selectors = [
        ".vacancy-item", ".job-item", ".vacancy_item", ".job-list-item",
        "article.vacancy", ".result-item", ".job-box", ".card-job",
        "li.vacancy", ".search-result-item",
    ]
    containers = []
    for sel in selectors:
        found = soup.select(sel)
        if found and len(found) >= 2:
            containers = found[:30]
            break

    if not containers:
        containers = [a for a in soup.find_all("a", href=True) if len(a.get_text(strip=True)) > 20][:30]

    for el in containers:
        title = ""
        for tag in ["h2","h3","h4",".title",".job-title",".vacancy-title","a"]:
            t_el = el.find(tag) if hasattr(el, "find") else None
            if t_el and t_el.get_text(strip=True):
                title = _clean(t_el.get_text(strip=True), 200)
                break
        if not title or _is_junk(title):
            continue

        a_el = el.find("a", href=True) if hasattr(el, "find") else (el if getattr(el,"name",None)=="a" else None)
        if not a_el:
            continue
        href = a_el.get("href","")
        if not href or href.startswith("#"):
            continue
        link = href if href.startswith("http") else urljoin(base_url, href)

        body = _clean(el.get_text(separator=" ", strip=True), 300)
        full = title + " " + body

        items.append({
            "title": title,
            "organizer": _extract_organizer(full) or org_name,
            "category": _detect_category(full, category_hint),
            "deadline": _extract_deadline(full),
            "location": _extract_location(full),
            "prize": _extract_prize(full),
            "description": body if body != title else None,
            "tags": json.dumps(_extract_tags(full)),
            "url": link,
            "logo_url": None,
            "is_featured": False,
            "source_name": "jobboard",
            "content_hash": _hash(title + link),
        })

    return items


# ─── DB yazma ──────────────────────────────────────────────────────────────────
def _save(items, db):
    from app.models.opportunity import Opportunity
    saved = 0
    existing = [(o.url, o.title) for o in
                db.query(Opportunity.url, Opportunity.title)
                  .filter(Opportunity.is_active == True).all()]
    existing_urls   = {u for u, _ in existing}
    existing_titles = [t for _, t in existing]

    for item in items:
        if not item.get("title") or not item.get("url"):
            continue
        if item["url"] in existing_urls:
            rec = db.query(Opportunity).filter(Opportunity.url == item["url"]).first()
            if rec and rec.content_hash != item["content_hash"]:
                rec.deadline = item["deadline"]
                rec.description = item["description"]
                rec.prize = item["prize"]
                rec.content_hash = item["content_hash"]
            continue
        if any(_similarity(item["title"], t) > 0.85 for t in existing_titles):
            continue

        db.add(Opportunity(**item))
        existing_urls.add(item["url"])
        existing_titles.append(item["title"])
        saved += 1

    db.commit()
    return saved


# ─── HTTP ──────────────────────────────────────────────────────────────────────
async def _fetch(session, url):
    try:
        async with session.get(url, headers=HEADERS,
                               timeout=aiohttp.ClientTimeout(total=20),
                               ssl=False, allow_redirects=True) as r:
            if r.status == 200:
                return await r.text(errors="ignore")
    except Exception as e:
        log.debug("fetch err %s: %s", url, e)
    return None


# ─── Ana tarama funksiyaları ───────────────────────────────────────────────────
async def _scrape_gnews(session, db):
    """Google News RSS — bütün sorğuları paralel işlət."""
    total = 0

    async def _one(query, cat_hint):
        url = gnews_url(query)
        xml = await _fetch(session, url)
        if not xml:
            return 0
        items = _parse_rss(xml, cat_hint, "Azərbaycan")
        if not items:
            return 0
        n = _save(items, db)
        if n:
            log.info("📰 GNews '%s' → %d yeni", query, n)
        return n

    results = await asyncio.gather(
        *[_one(q, cat) for q, cat in GNEWS_QUERIES],
        return_exceptions=True
    )
    total = sum(r for r in results if isinstance(r, int))
    return total


async def _scrape_jobboards(session, db):
    """boss.az, hellojob.az — strukturlaşmış iş elanı saytları."""
    boards = [
        ("https://boss.az/vacancies?search=staj&type=internship", "boss.az", "staj"),
        ("https://boss.az/vacancies?search=intern", "boss.az", "staj"),
        ("https://hellojob.az/az/search?type=internship", "HelloJob.az", "staj"),
        ("https://ejobs.az/az/vacancies?type=2", "eJobs.az", "staj"),
    ]
    total = 0
    for url, org, cat in boards:
        html = await _fetch(session, url)
        if not html:
            continue
        items = _parse_jobboard(html, url, org, cat)
        n = _save(items, db)
        if n:
            log.info("💼 %s → %d yeni", org, n)
        total += n
    return total


# ─── Public API ───────────────────────────────────────────────────────────────
_running = False
_last_run: Optional[datetime] = None
GNEWS_INTERVAL = 1800   # 30 dəq
JOBBOARD_INTERVAL = 3600  # 1 saat


async def scrape_all_once(db):
    conn = aiohttp.TCPConnector(limit=10, ssl=False)
    async with aiohttp.ClientSession(connector=conn) as s:
        n1 = await _scrape_gnews(s, db)
        n2 = await _scrape_jobboards(s, db)
    log.info("🎯 İlk tarama: %d yeni imkan", n1 + n2)
    return n1 + n2


async def run_forever(get_db_func):
    global _running, _last_run
    if _running:
        return
    _running = True
    log.info("🚀 Radar scraper başladı")

    _gnews_last = None
    _job_last   = None

    conn = aiohttp.TCPConnector(limit=8, ssl=False)
    async with aiohttp.ClientSession(connector=conn) as s:
        while True:
            now = datetime.utcnow()
            db = next(get_db_func())
            try:
                if _gnews_last is None or (now - _gnews_last).total_seconds() >= GNEWS_INTERVAL:
                    await _scrape_gnews(s, db)
                    _gnews_last = now

                if _job_last is None or (now - _job_last).total_seconds() >= JOBBOARD_INTERVAL:
                    await _scrape_jobboards(s, db)
                    _job_last = now

            except Exception as e:
                log.error("Loop xəta: %s", e)
            finally:
                db.close()
            await asyncio.sleep(60)
