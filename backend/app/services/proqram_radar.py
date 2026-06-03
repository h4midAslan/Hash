"""
Proqram Radar — Azərbaycan akselerator, inkubator, bootcamp, gənclər proqramları.

Mənbələr:
  1. Google News RSS   — 14 sorğu, hər 20 dəq
  2. AZ proqram saytları — innovation.gov, startupbaku, MOST, genclik.gov (hər 1 saat)
  3. Beynəlxalq         — YCombinator, Techstars, Google for Startups (hər 3 saat)
"""

import asyncio, hashlib, json, logging, re
from datetime import date, datetime, timedelta
from difflib import SequenceMatcher
from email.utils import parsedate_to_datetime
from urllib.parse import urljoin, quote

import aiohttp
from bs4 import BeautifulSoup

log = logging.getLogger("proqram_radar")

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "az,en;q=0.9",
}

# ─── Google News sorğuları ────────────────────────────────────────────────────
GNEWS_QUERIES = [
    "akselerator proqramı Azərbaycan 2026",
    "inkubator proqramı Bakı 2026",
    "startup akselerator Azərbaycan",
    "gənclər proqramı Azərbaycan 2026",
    "DigiCamp Azərbaycan 2026",
    "youth program Azerbaijan 2026",
    "leadership program Azerbaijan",
    "bootcamp proqramı Bakı 2026",
    "tech bootcamp Azerbaijan",
    "coding bootcamp Baku",
    "rəqəmsal bacarıq proqramı Azərbaycan",
    "digital skills program Azerbaijan",
    "innovation program Azerbaijan 2026",
    "cohort program Azerbaijan startup",
]

# ─── AZ proqram saytları ──────────────────────────────────────────────────────
DIRECT_SOURCES = [
    ("https://innovation.gov.az/az/programs",               "İnnovasiya Agentliyi",       "generic"),
    ("https://innovation.gov.az/az/news",                   "İnnovasiya Agentliyi",       "generic"),
    ("https://most.az/az/programs",                         "MOST Technology Park",       "generic"),
    ("https://most.az/az/news",                             "MOST Technology Park",       "generic"),
    ("https://genclik.gov.az/az/programs",                  "Azərbaycan Gənclər Fondu",   "generic"),
    ("https://genclik.gov.az/az/news",                      "Azərbaycan Gənclər Fondu",   "generic"),
    ("https://startupbaku.az/programs",                     "Startup Baku",               "generic"),
    ("https://ada.edu.az/programs",                         "ADA Universiteti",           "generic"),
    ("https://mincom.gov.az/az/programs",                   "Rəqəmsal İnkişaf Nazirliy",  "generic"),
    ("https://aztu.edu.az/az/news",                         "AZTU",                       "generic"),
]

# ─── Beynəlxalq proqramlar ────────────────────────────────────────────────────
INTL_SOURCES = [
    ("https://www.ycombinator.com/blog",                    "Y Combinator",    "generic"),
    ("https://techstars.com/the-line/tag/accelerator",      "Techstars",       "generic"),
]

# ─── Sözlər ──────────────────────────────────────────────────────────────────
PROQRAM_TITLE_MUST = [
    "akselerator", "accelerator",
    "inkubator", "incubator",
    "bootcamp", "boot camp",
    "digicamp", "digital camp",
    "gənclər proqram", "youth program",
    "leadership program", "liderlik proqram",
    "rəqəmsal bacarıq", "digital skills",
    "cohort", "kohort",
    "fellowsh",
    "startup proqram", "startup program",
    "innovation program", "innovasiya proqram",
    "texnologiya proqram", "tech program",
    "qəbul açıldı", "müraciət qəbul",
    "proqrama daxil", "proqrama seçim",
]

PROQRAM_BODY_WORDS = {
    "akselerator","accelerator","inkubator","bootcamp",
    "proqram","program","digicamp","youth program",
    "cohort","startup","fellowship","digital skills",
    "müraciət","application open","qeydiyyat",
}

_NOISE = {
    "pensiya","pension","vergi","parlament","seçki",
    "futbol","idman","hərbi","xarici siyasət","büdcə",
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
    "Akselerator":   ["akselerator","accelerator"],
    "İnkubator":     ["inkubator","incubator"],
    "Bootcamp":      ["bootcamp","boot camp"],
    "DigiCamp":      ["digicamp","digital camp"],
    "Gənclər":       ["gəncl","youth","young"],
    "AI/Tech":       ["ai","texnologiya","tech","it "],
    "Startup":       ["startup","startap"],
    "Maliyyə":       ["maliyyə","finance","fintech"],
    "Liderlik":      ["liderlik","leadership"],
    "Pulsuz":        ["pulsuz","free","ödənişsiz"],
    "Ödənişli":      ["ödənişli","paid","maaş"],
    "Onlayn":        ["onlayn","online","virtual"],
    "Sertifikat":    ["sertifikat","certificate"],
    "Beynəlxalq":    ["international","beynəlxalq","global"],
    "MOST":          ["most ","most.az"],
}

KNOWN_ORGS = {
    "most.az":            "MOST Technology Park",
    "most texnologiya":   "MOST Technology Park",
    "startup baku":       "Startup Baku",
    "ada universit":      "ADA Universiteti",
    "innovation.gov":     "İnnovasiya Agentliyi",
    "innovasiya agent":   "İnnovasiya Agentliyi",
    "gənclik fondu":      "Azərbaycan Gənclər Fondu",
    "genclik.gov":        "Azərbaycan Gənclər Fondu",
    "mincom":             "Rəqəmsal İnkişaf Nazirliyi",
    "aztu":               "AZTU",
    "y combinator":       "Y Combinator",
    "ycombinator":        "Y Combinator",
    "techstars":          "Techstars",
    "google for startup": "Google for Startups",
    "unec":               "UNEC",
    "kapital bank":       "Kapital Bank",
}


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _h(t): return hashlib.sha256(t.encode("utf-8","ignore")).hexdigest()[:64]
def _clean(t,n=400): t=re.sub(r"\s+"," ",t).strip(); return t[:n].rsplit(" ",1)[0]+"..." if len(t)>n else t
def _sim(a,b): return SequenceMatcher(None,a.lower(),b.lower()).ratio()
def _org(text,fallback="Azərbaycan"):
    t=text.lower()
    for k,v in KNOWN_ORGS.items():
        if k in t: return v
    return fallback

def _tags(text):
    t=text.lower()
    return [tag for tag,kws in TAG_MAP.items() if any(kw in t for kw in kws)][:6]

def _prize(text):
    for p in [r"(\d[\d\s,.]*)[\s]*(AZN|azn|manat|₼)",r"(\d[\d\s,.]*)[\s]*(USD|usd|\$)"]:
        m=re.search(p,text,re.IGNORECASE)
        if m:
            amt=re.sub(r"\s","",m.group(1))
            cur=m.group(2).upper().replace("MANAT","AZN").replace("₼","AZN")
            return f"{amt} {cur}"
    return None

def _deadline(text):
    today=date.today();t=text.lower()
    mon_pat="|".join(sorted(AZ_MONTHS.keys(),key=len,reverse=True))
    m=re.search(rf"(\d{{1,2}})\s+({mon_pat})\s*,?\s*(\d{{4}})?",t)
    if m:
        try:
            day=int(m.group(1));mon=AZ_MONTHS[m.group(2)]
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
    if "onlayn" in t or "online" in t or "remote" in t or "virtual" in t: return "Onlayn"
    if "global" in t or "worldwide" in t: return "Beynəlxalq (Onlayn)"
    return "Bakı"

def _is_proqram_title(title):
    t=title.lower()
    return any(kw in t for kw in PROQRAM_TITLE_MUST)

def _is_junk(title):
    if len(title)<8 or _CYRILLIC.search(title): return True
    return any(n in title.lower() for n in _NOISE)

def _item(title,org,url,desc=None,deadline=None,loc="Bakı",prize=None,tags=None,featured=False,source="unknown"):
    return {
        "title":title,"organizer":org,"category":"proqram",
        "deadline":deadline,"location":loc,"prize":prize,
        "description":desc,"tags":json.dumps(tags or []),
        "url":url,"logo_url":None,
        "is_featured":featured,"is_active":True,
        "source_name":source,"content_hash":_h(title+url),
    }


# ─── Parserlər ────────────────────────────────────────────────────────────────

def _parse_gnews(xml_text, query):
    items=[]
    try: soup=BeautifulSoup(xml_text,"lxml-xml")
    except: soup=BeautifulSoup(xml_text,"lxml")

    for entry in soup.find_all(["item","entry"]):
        tel=entry.find("title")
        if not tel: continue
        title=re.sub(r"\s*[-–|]\s*[^-–|]{1,60}$","",tel.get_text(strip=True)).strip()
        title=_clean(title,220)
        if _is_junk(title) or not _is_proqram_title(title): continue

        link=""
        for tag in ["link","guid"]:
            el=entry.find(tag)
            if el:
                href=el.get("href") or el.get_text(strip=True)
                if href and href.startswith("http"): link=href;break
        if not link: continue

        desc_el=entry.find(["description","summary","content"])
        desc=_clean(BeautifulSoup(desc_el.get_text(separator=" ",strip=True),"lxml").get_text(),400) if desc_el else ""

        full=title+" "+desc
        if any(n in full.lower() for n in _NOISE): continue
        if not any(w in full.lower() for w in PROQRAM_BODY_WORDS): continue

        pub_date=None
        pub_el=entry.find(["pubDate","published","updated"])
        if pub_el:
            try: pub_date=parsedate_to_datetime(pub_el.get_text(strip=True)).date()
            except: pass

        dl=_deadline(full)
        if not dl and pub_date:
            est=pub_date+timedelta(days=60)
            if est>=date.today(): dl=est
        if dl and dl<date.today(): continue

        items.append(_item(
            title=title,org=_org(full),url=link,
            desc=desc or None,deadline=dl,
            loc=_loc(full),prize=_prize(full),
            tags=_tags(full),source="gnews_proqram",
            featured="innovation.gov" in full.lower() or "most.az" in full.lower(),
        ))
    return items


def _parse_generic(html, base_url, org_name):
    soup=BeautifulSoup(html,"lxml")
    items=[]
    containers=[]
    for sel in ["article",".program-item",".news-item",".card",".item",".entry"]:
        found=soup.select(sel)
        if found and len(found)>=2: containers=found[:20];break
    if not containers:
        containers=[a for a in soup.find_all("a",href=True) if len(a.get_text(strip=True))>20][:20]

    for el in containers:
        title=""
        for tag in ["h2","h3","h4",".title",".program-title","a"]:
            t_el=el.find(tag) if hasattr(el,"find") else None
            if t_el and t_el.get_text(strip=True):
                title=_clean(t_el.get_text(strip=True),200);break
        if not title or _is_junk(title): continue
        if not _is_proqram_title(title): continue

        a_el=el.find("a",href=True) if hasattr(el,"find") else (el if getattr(el,"name",None)=="a" else None)
        if not a_el: continue
        href=a_el.get("href","")
        if not href or href.startswith(("#","javascript")): continue
        link=href if href.startswith("http") else urljoin(base_url,href)

        body=_clean(el.get_text(separator=" ",strip=True),400)
        full=title+" "+body
        dl=_deadline(full)
        if dl and dl<date.today(): continue

        items.append(_item(
            title=title,org=_org(full,org_name),url=link,
            desc=body if len(body)>len(title)+20 else None,
            deadline=dl,loc=_loc(full),prize=_prize(full),
            tags=_tags(full),source="direct_proqram",
            featured=org_name in ("İnnovasiya Agentliyi","MOST Technology Park"),
        ))
    return items


# ─── DB ───────────────────────────────────────────────────────────────────────

def _save(items, db):
    from app.models.opportunity import Opportunity
    if not items: return 0
    existing=db.query(Opportunity.url,Opportunity.title,Opportunity.content_hash)\
               .filter(Opportunity.category=="proqram").all()
    url_hash={r.url:r.content_hash for r in existing}
    etitles=[r.title for r in existing]
    saved=0
    for item in items:
        t,u=item.get("title","").strip(),item.get("url","").strip()
        if not t or not u: continue
        if u in url_hash:
            if url_hash[u]!=item.get("content_hash"):
                rec=db.query(Opportunity).filter(Opportunity.url==u).first()
                if rec:
                    rec.deadline=item["deadline"];rec.description=item["description"]
                    rec.prize=item["prize"];rec.content_hash=item["content_hash"];rec.is_active=True
            continue
        if any(_sim(t,et)>0.82 for et in etitles): continue
        try: db.add(Opportunity(**item));url_hash[u]=item.get("content_hash");etitles.append(t);saved+=1
        except Exception as e: log.debug("add xəta: %s",e)
    try: db.commit()
    except Exception as e: db.rollback();log.error("commit xəta: %s",e);return 0
    return saved


def _deactivate_expired(db):
    from app.models.opportunity import Opportunity
    today=date.today()
    expired=db.query(Opportunity).filter(
        Opportunity.category=="proqram",Opportunity.is_active==True,
        Opportunity.deadline.isnot(None),Opportunity.deadline<today,
    ).all()
    for o in expired: o.is_active=False
    if expired:
        try: db.commit();log.info("⌛ %d köhnəlmiş proqram deaktiv edildi",len(expired))
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
        url=f"https://news.google.com/rss/search?q={quote(q)}&hl=az&gl=AZ&ceid=AZ:az"
        xml=await _fetch(session,url)
        if not xml:
            url2=f"https://news.google.com/rss/search?q={quote(q)}&hl=en&gl=AZ&ceid=AZ:en"
            xml=await _fetch(session,url2)
        if not xml: return 0
        items=_parse_gnews(xml,q)
        n=_save(items,db)
        if n: log.info("🚀 GNews '%s' → %d yeni proqram",q,n)
        return n
    results=await asyncio.gather(*[_one(q) for q in GNEWS_QUERIES],return_exceptions=True)
    return sum(r for r in results if isinstance(r,int))


async def _scrape_direct(session, db):
    total=0
    for url,org,_ in DIRECT_SOURCES:
        html=await _fetch(session,url)
        if html:
            items=_parse_generic(html,url,org)
            n=_save(items,db)
            if n: log.info("🏛️ %s → %d yeni proqram",org,n)
            total+=n
        await asyncio.sleep(2)
    return total


async def _scrape_international(session, db):
    total=0
    for url,org,_ in INTL_SOURCES:
        html=await _fetch(session,url)
        if html:
            items=_parse_generic(html,url,org)
            n=_save(items,db)
            if n: log.info("🌍 %s → %d yeni proqram",org,n)
            total+=n
        await asyncio.sleep(3)
    return total


# ─── Public API ───────────────────────────────────────────────────────────────

_INTERVAL_GNEWS  = 1200   # 20 dəq
_INTERVAL_DIRECT = 3600   # 1 saat
_INTERVAL_INTL   = 10800  # 3 saat
_INTERVAL_CLEANUP= 86400  # 1 gün

_running=False


async def run_proqram_radar(get_db_func):
    global _running
    if _running: return
    _running=True
    log.info("🚀 Proqram Radar başladı")

    _gnews_last=_direct_last=_intl_last=_cleanup_last=None

    conn=aiohttp.TCPConnector(limit=8,ssl=False)
    async with aiohttp.ClientSession(connector=conn) as session:
        while True:
            now=datetime.utcnow()
            db=next(get_db_func())
            try:
                if _gnews_last is None or (now-_gnews_last).total_seconds()>=_INTERVAL_GNEWS:
                    n=await _scrape_gnews(session,db)
                    log.info("📰 Proqram GNews: %d yeni",n);_gnews_last=now

                if _direct_last is None or (now-_direct_last).total_seconds()>=_INTERVAL_DIRECT:
                    n=await _scrape_direct(session,db)
                    log.info("🏛️ Proqram saytlar: %d yeni",n);_direct_last=now

                if _intl_last is None or (now-_intl_last).total_seconds()>=_INTERVAL_INTL:
                    n=await _scrape_international(session,db)
                    log.info("🌍 Proqram beynəlxalq: %d yeni",n);_intl_last=now

                if _cleanup_last is None or (now-_cleanup_last).total_seconds()>=_INTERVAL_CLEANUP:
                    _deactivate_expired(db);_cleanup_last=now

            except Exception as e: log.error("Proqram Radar xəta: %s",e,exc_info=True)
            finally: db.close()
            await asyncio.sleep(60)
