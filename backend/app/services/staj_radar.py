"""
Staj Radar — Azərbaycandakı staj (internship) elanlarını avtomatik tapır.

Mənbələr:
  1. Google News RSS     — 16 sorğu, hər 20 dəq
  2. İş elanı saytları  — boss.az, hellojob.az, ejobs.az, vacancy.az (hər 45 dəq)
  3. Şirkət saytları     — Kapital Bank, ABB, SOCAR, Azercell, PAŞA Bank (hər 2 saat)
"""

import asyncio, hashlib, json, logging, re
from datetime import date, datetime, timedelta
from difflib import SequenceMatcher
from email.utils import parsedate_to_datetime
from urllib.parse import urljoin, quote

import aiohttp
from bs4 import BeautifulSoup

log = logging.getLogger("staj_radar")

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "az,en;q=0.9",
}

# ─── Google News sorğuları ────────────────────────────────────────────────────
GNEWS_QUERIES = [
    "staj proqramı Azərbaycan 2026",
    "staj elanı Bakı 2026",
    "yay stajı Azərbaycan 2026",
    "pulsuz staj proqramı Bakı",
    "ödənişli staj Azərbaycan",
    "tələbə stajı elan Bakı",
    "internship program Azerbaijan 2026",
    "summer internship Baku 2026",
    "paid internship Azerbaijan",
    "staj qəbulu Azərbaycan bank",
    "staj SOCAR Azərbaycan",
    "staj Kapital Bank ABB",
    "IT staj Bakı 2026",
    "trainee program Azerbaijan",
    "graduate program Azerbaijan 2026",
    "intern Azerbaijan technology",
]

# ─── İş elanı saytları ───────────────────────────────────────────────────────
JOBBOARD_SOURCES = [
    ("https://boss.az/vacancies?search=staj&type=internship",          "boss.az",     "jobboard"),
    ("https://boss.az/vacancies?search=intern",                        "boss.az",     "jobboard"),
    ("https://boss.az/vacancies?search=trainee",                       "boss.az",     "jobboard"),
    ("https://hellojob.az/az/vacancies?search=staj",                   "HelloJob.az", "jobboard"),
    ("https://hellojob.az/az/vacancies?search=intern",                 "HelloJob.az", "jobboard"),
    ("https://ejobs.az/az/vacancies?type=2",                           "eJobs.az",    "jobboard"),
    ("https://vacancy.az/az/vacancies?category=intern",                "Vacancy.az",  "jobboard"),
    ("https://isveren.az/vacancies?type=staj",                         "isveren.az",  "jobboard"),
]

# ─── Şirkət careers səhifələri ────────────────────────────────────────────────
COMPANY_SOURCES = [
    ("https://careers.kapitalbank.az/az/vacancies?type=intern",        "Kapital Bank",  "generic"),
    ("https://careers.abb-bank.az/az/vacancies",                       "ABB Bank",      "generic"),
    ("https://hr.socar.az/az/vacancies?type=intern",                   "SOCAR",         "generic"),
    ("https://careers.azercell.com/az/vacancies",                      "Azercell",      "generic"),
    ("https://careers.pashabank.az/az/vacancies",                      "PAŞA Bank",     "generic"),
    ("https://careers.bakcell.com/az/vacancies",                       "Bakcell",       "generic"),
]

# ─── Sözlər ──────────────────────────────────────────────────────────────────
STAJ_TITLE_MUST = [
    "staj", "internship", "intern ", "trainee",
    "stajirovka", "iş təcrübəsi", "praktika",
    "yay proqramı", "summer program", "graduate program",
    "apprentice",
]

STAJ_BODY_WORDS = {
    "staj", "internship", "intern", "trainee", "praktika",
    "iş təcrübəsi", "stajirovka", "summer program",
}

_NOISE = {
    "pensiya", "pension", "vergi", "seçki", "futbol",
    "hərbi", "xarici siyasət", "hökumət iclası", "büdcə",
}

_CYRILLIC = re.compile(r"[а-яёА-ЯЁ]{3,}")

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

TAG_MAP = {
    "Ödənişli":      ["ödənişli", "paid", "maaş", "stipendiya"],
    "Pulsuz":        ["pulsuz", "free", "könüllü"],
    "IT/Texnologiya":["it ", "texnologiya", "software", "developer", "proqramçı"],
    "Maliyyə":       ["maliyyə", "finance", "bank", "mühasibat"],
    "Marketing":     ["marketing", "smm", "reklam"],
    "Hüquq":         ["hüquq", "law", "legal"],
    "Mühəndislik":   ["mühəndis", "engineer", "engineering"],
    "Dizayn":        ["dizayn", "design", "ux", "ui"],
    "Sertifikat":    ["sertifikat", "certificate"],
    "Yay Stajı":     ["yay stajı", "summer intern"],
    "SOCAR":         ["socar"],
    "Bank":          ["bank", "kapital", "abb", "pasha", "rabitə"],
}

KNOWN_ORGS = {
    "kapital bank": "Kapital Bank",
    "abb bank":     "ABB Bank",
    "abb azerbaijan":"ABB Azerbaijan",
    "socar":        "SOCAR",
    "azercell":     "Azercell",
    "bakcell":      "Bakcell",
    "nar mobile":   "Nar Mobile",
    "pasha bank":   "PAŞA Bank",
    "pashabank":    "PAŞA Bank",
    "pasha holding":"PAŞA Holding",
    "azal":         "AZAL",
    "most.az":      "MOST Technology Park",
    "ada universit":"ADA Universiteti",
    "unec":         "UNEC",
    "aztu":         "AZTU",
    "boss.az":      "boss.az",
    "hellojob":     "HelloJob.az",
    "rabitəbank":   "Rabitəbank",
    "atb bank":     "Azər Türk Bank",
}


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _h(t): return hashlib.sha256(t.encode("utf-8","ignore")).hexdigest()[:64]
def _clean(t, n=400): t=re.sub(r"\s+"," ",t).strip(); return t[:n].rsplit(" ",1)[0]+"..." if len(t)>n else t
def _sim(a, b): return SequenceMatcher(None,a.lower(),b.lower()).ratio()

def _org(text, fallback="Azərbaycan"):
    t = text.lower()
    for k, v in KNOWN_ORGS.items():
        if k in t: return v
    return fallback

def _tags(text):
    t = text.lower()
    return [tag for tag,kws in TAG_MAP.items() if any(kw in t for kw in kws)][:5]

def _prize(text):
    for p in [r"(\d[\d\s,.]*)[\s]*(AZN|azn|manat|₼)",r"(\d[\d\s,.]*)[\s]*(USD|usd|\$)"]:
        m = re.search(p, text, re.IGNORECASE)
        if m:
            amt = re.sub(r"\s","",m.group(1))
            cur = m.group(2).upper().replace("MANAT","AZN").replace("₼","AZN")
            return f"{amt} {cur}"
    return None

def _deadline(text):
    today = date.today()
    t = text.lower()
    mon_pat = "|".join(sorted(AZ_MONTHS.keys(), key=len, reverse=True))
    m = re.search(rf"(\d{{1,2}})\s+({mon_pat})\s*,?\s*(\d{{4}})?", t)
    if m:
        try:
            day=int(m.group(1)); mon=AZ_MONTHS[m.group(2)]
            yr=int(m.group(3)) if m.group(3) else today.year
            d=date(yr,mon,day)
            if d>=today: return d
            if not m.group(3):
                d2=date(yr+1,mon,day)
                if d2>=today: return d2
        except ValueError: pass
    for p in [r"(\d{4})-(\d{2})-(\d{2})",r"(\d{2})[./](\d{2})[./](\d{4})"]:
        m=re.search(p,text)
        if m:
            try:
                g=m.groups()
                d=date(int(g[0]),int(g[1]),int(g[2])) if len(g[0])==4 else date(int(g[2]),int(g[1]),int(g[0]))
                if d>=today: return d
            except ValueError: pass
    return None

def _loc(text):
    t=text.lower()
    if ("onlayn" in t or "online" in t) and ("bakı" in t or "baku" in t): return "Bakı / Onlayn"
    if "onlayn" in t or "online" in t or "remote" in t: return "Onlayn"
    return "Bakı"

def _is_staj_title(title):
    t = title.lower()
    return any(kw in t for kw in STAJ_TITLE_MUST)

def _is_junk(title):
    if len(title) < 8 or _CYRILLIC.search(title): return True
    return any(n in title.lower() for n in _NOISE)

def _item(title, org, url, desc=None, deadline=None, loc="Bakı", prize=None, tags=None, featured=False, source="unknown"):
    return {
        "title": title, "organizer": org, "category": "staj",
        "deadline": deadline, "location": loc, "prize": prize,
        "description": desc, "tags": json.dumps(tags or []),
        "url": url, "logo_url": None,
        "is_featured": featured, "is_active": True,
        "source_name": source, "content_hash": _h(title+url),
    }


# ─── Parserlər ────────────────────────────────────────────────────────────────

def _parse_gnews(xml_text, query):
    items = []
    try:
        soup = BeautifulSoup(xml_text, "lxml-xml")
    except Exception:
        soup = BeautifulSoup(xml_text, "lxml")

    for entry in soup.find_all(["item","entry"]):
        tel = entry.find("title")
        if not tel: continue
        title = re.sub(r"\s*[-–|]\s*[^-–|]{1,60}$","",tel.get_text(strip=True)).strip()
        title = _clean(title, 220)
        if _is_junk(title) or not _is_staj_title(title): continue

        link = ""
        for tag in ["link","guid"]:
            el = entry.find(tag)
            if el:
                href = el.get("href") or el.get_text(strip=True)
                if href and href.startswith("http"): link=href; break
        if not link: continue

        desc_el = entry.find(["description","summary","content"])
        desc = _clean(BeautifulSoup(desc_el.get_text(separator=" ",strip=True),"lxml").get_text(),400) if desc_el else ""

        full = title+" "+desc
        if any(n in full.lower() for n in _NOISE): continue
        if not any(w in full.lower() for w in STAJ_BODY_WORDS): continue

        pub_date = None
        pub_el = entry.find(["pubDate","published","updated"])
        if pub_el:
            try: pub_date = parsedate_to_datetime(pub_el.get_text(strip=True)).date()
            except: pass

        dl = _deadline(full)
        if not dl and pub_date:
            est = pub_date + timedelta(days=60)
            if est >= date.today(): dl = est
        if dl and dl < date.today(): continue

        items.append(_item(
            title=title, org=_org(full), url=link,
            desc=desc or None, deadline=dl,
            loc=_loc(full), prize=_prize(full),
            tags=_tags(full), source="gnews_staj",
        ))
    return items


def _parse_jobboard(html, base_url, org_name):
    soup = BeautifulSoup(html, "lxml")
    items = []
    containers = []
    for sel in [".vacancy-item",".job-item",".vacancy_item",".card-job","article.vacancy",".result-item","li.vacancy"]:
        found = soup.select(sel)
        if found and len(found) >= 2:
            containers = found[:30]; break
    if not containers:
        containers = [a for a in soup.find_all("a",href=True) if len(a.get_text(strip=True))>25][:25]

    for el in containers:
        title = ""
        for tag in ["h2","h3","h4",".title",".job-title",".vacancy-title","a"]:
            t_el = el.find(tag) if hasattr(el,"find") else None
            if t_el and t_el.get_text(strip=True):
                title = _clean(t_el.get_text(strip=True),200); break
        if not title or _is_junk(title): continue
        if not _is_staj_title(title): continue

        a_el = el.find("a",href=True) if hasattr(el,"find") else (el if getattr(el,"name",None)=="a" else None)
        if not a_el: continue
        href = a_el.get("href","")
        if not href or href.startswith(("#","javascript")): continue
        link = href if href.startswith("http") else urljoin(base_url,href)

        body = _clean(el.get_text(separator=" ",strip=True),350)
        full = title+" "+body
        dl = _deadline(full)
        if dl and dl < date.today(): continue

        items.append(_item(
            title=title, org=_org(full,org_name), url=link,
            desc=body if len(body)>len(title)+20 else None,
            deadline=dl, loc=_loc(full), prize=_prize(full),
            tags=_tags(full), source="jobboard_staj",
        ))
    return items


def _parse_company(html, base_url, org_name):
    soup = BeautifulSoup(html, "lxml")
    items = []
    for sel in ["article",".vacancy",".job",".position",".role",".card","li"]:
        found = soup.select(sel)
        if found and len(found) >= 2:
            for el in found[:15]:
                title = ""
                for tag in ["h2","h3","h4",".title",".name","a"]:
                    t_el = el.find(tag) if hasattr(el,"find") else None
                    if t_el and t_el.get_text(strip=True):
                        title = _clean(t_el.get_text(strip=True),200); break
                if not title or _is_junk(title): continue
                if not _is_staj_title(title): continue

                a_el = el.find("a",href=True) if hasattr(el,"find") else None
                if not a_el: continue
                href = a_el.get("href","")
                if not href or href.startswith("#"): continue
                link = href if href.startswith("http") else urljoin(base_url,href)

                body = _clean(el.get_text(separator=" "),300)
                items.append(_item(
                    title=title, org=org_name, url=link,
                    desc=body if len(body)>len(title)+15 else None,
                    deadline=_deadline(body), loc=_loc(body),
                    prize=_prize(body), tags=_tags(body),
                    featured=True, source="company_staj",
                ))
            break
    return items


# ─── DB ───────────────────────────────────────────────────────────────────────

def _save(items, db):
    from app.models.opportunity import Opportunity
    if not items: return 0
    existing = db.query(Opportunity.url,Opportunity.title,Opportunity.content_hash)\
                 .filter(Opportunity.category=="staj").all()
    url_hash = {r.url: r.content_hash for r in existing}
    etitles  = [r.title for r in existing]
    saved = 0
    for item in items:
        t,u = item.get("title","").strip(), item.get("url","").strip()
        if not t or not u: continue
        if u in url_hash:
            if url_hash[u] != item.get("content_hash"):
                rec = db.query(Opportunity).filter(Opportunity.url==u).first()
                if rec:
                    rec.deadline=item["deadline"]; rec.description=item["description"]
                    rec.prize=item["prize"]; rec.content_hash=item["content_hash"]; rec.is_active=True
            continue
        if any(_sim(t,et)>0.82 for et in etitles): continue
        try:
            db.add(Opportunity(**item)); url_hash[u]=item.get("content_hash"); etitles.append(t); saved+=1
        except Exception as e: log.debug("add xəta: %s",e)
    try: db.commit()
    except Exception as e: db.rollback(); log.error("commit xəta: %s",e); return 0
    return saved


def _deactivate_expired(db):
    from app.models.opportunity import Opportunity
    today = date.today()
    expired = db.query(Opportunity).filter(
        Opportunity.category=="staj", Opportunity.is_active==True,
        Opportunity.deadline.isnot(None), Opportunity.deadline<today,
    ).all()
    for o in expired: o.is_active=False
    if expired:
        try: db.commit(); log.info("⌛ %d köhnəlmiş staj deaktiv edildi",len(expired))
        except: db.rollback()


# ─── HTTP ─────────────────────────────────────────────────────────────────────

async def _fetch(session, url):
    try:
        async with session.get(url,headers=HEADERS,timeout=aiohttp.ClientTimeout(total=25),ssl=False,allow_redirects=True) as r:
            if r.status==200: return await r.text(errors="ignore")
    except: pass
    return None


# ─── Tarama blokları ──────────────────────────────────────────────────────────

async def _scrape_gnews(session, db):
    async def _one(q):
        url = f"https://news.google.com/rss/search?q={quote(q)}&hl=az&gl=AZ&ceid=AZ:az"
        xml = await _fetch(session, url)
        if not xml:
            url2 = f"https://news.google.com/rss/search?q={quote(q)}&hl=en&gl=AZ&ceid=AZ:en"
            xml = await _fetch(session, url2)
        if not xml: return 0
        items = _parse_gnews(xml, q)
        n = _save(items, db)
        if n: log.info("📋 GNews '%s' → %d yeni staj",q,n)
        return n
    results = await asyncio.gather(*[_one(q) for q in GNEWS_QUERIES], return_exceptions=True)
    return sum(r for r in results if isinstance(r,int))


async def _scrape_jobboards(session, db):
    total = 0
    for url,org,_ in JOBBOARD_SOURCES:
        html = await _fetch(session, url)
        if html:
            items = _parse_jobboard(html, url, org)
            n = _save(items, db)
            if n: log.info("💼 %s → %d yeni staj",org,n)
            total += n
        await asyncio.sleep(1)
    return total


async def _scrape_companies(session, db):
    total = 0
    for url,org,_ in COMPANY_SOURCES:
        html = await _fetch(session, url)
        if html:
            items = _parse_company(html, url, org)
            n = _save(items, db)
            if n: log.info("🏢 %s → %d yeni staj",org,n)
            total += n
        await asyncio.sleep(2)
    return total


# ─── Public API ───────────────────────────────────────────────────────────────

_INTERVAL_GNEWS   = 1200   # 20 dəq
_INTERVAL_JOBS    = 2700   # 45 dəq
_INTERVAL_COMPANY = 7200   # 2 saat
_INTERVAL_CLEANUP = 86400  # 1 gün

_running = False


async def run_staj_radar(get_db_func):
    global _running
    if _running: return
    _running = True
    log.info("🚀 Staj Radar başladı")

    _gnews_last=_jobs_last=_company_last=_cleanup_last=None

    conn = aiohttp.TCPConnector(limit=10, ssl=False)
    async with aiohttp.ClientSession(connector=conn) as session:
        while True:
            now = datetime.utcnow()
            db = next(get_db_func())
            try:
                if _gnews_last is None or (now-_gnews_last).total_seconds()>=_INTERVAL_GNEWS:
                    n = await _scrape_gnews(session, db)
                    log.info("📰 Staj GNews: %d yeni",n); _gnews_last=now

                if _jobs_last is None or (now-_jobs_last).total_seconds()>=_INTERVAL_JOBS:
                    n = await _scrape_jobboards(session, db)
                    log.info("💼 Staj jobboards: %d yeni",n); _jobs_last=now

                if _company_last is None or (now-_company_last).total_seconds()>=_INTERVAL_COMPANY:
                    n = await _scrape_companies(session, db)
                    log.info("🏢 Staj şirkətlər: %d yeni",n); _company_last=now

                if _cleanup_last is None or (now-_cleanup_last).total_seconds()>=_INTERVAL_CLEANUP:
                    _deactivate_expired(db); _cleanup_last=now

            except Exception as e: log.error("Staj Radar xəta: %s",e, exc_info=True)
            finally: db.close()
            await asyncio.sleep(60)
