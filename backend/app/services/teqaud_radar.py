"""
Təqaüd Radar — Azərbaycan tələbə təqaüdləri, qrantları, fellowshipləri.

Mənbələr:
  1. Google News RSS    — 16 sorğu, hər 20 dəq
  2. Dövlət saytları   — edu.gov.az, scholarship.gov.az, prezident.az (hər 1 saat)
  3. Beynəlxalq        — DAAD, Erasmus, Fulbright, Chevening RSS/saytları (hər 3 saat)

XÜSUS QEYD: "Təqaüd" AZ dilinde həm scholarship, həm pension mənasına gəlir.
Pensiya/ictimai məqalələri MÜTLƏQ filterlənməlidir.
"""

import asyncio, hashlib, json, logging, re
from datetime import date, datetime, timedelta
from difflib import SequenceMatcher
from email.utils import parsedate_to_datetime
from urllib.parse import urljoin, quote

import aiohttp
from bs4 import BeautifulSoup

log = logging.getLogger("teqaud_radar")

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "az,en;q=0.9",
}

# ─── Google News sorğuları ────────────────────────────────────────────────────
# "tələbə" sözü mütləq əlavə edilməlidir — adi "təqaüd" pensiya xəbərləri gətirir
GNEWS_QUERIES = [
    "tələbə təqaüdü Azərbaycan 2026",
    "tələbə qrantı Azərbaycan 2026",
    "tədqiqat qrantı Azərbaycan",
    "magistr təqaüdü Azərbaycan",
    "doktorantura qrantı Azərbaycan",
    "student scholarship Azerbaijan 2026",
    "research grant Azerbaijan 2026",
    "fellowship program Azerbaijan",
    "DAAD Azərbaycan 2026",
    "Erasmus Azərbaycan 2026",
    "Fulbright Azerbaijan 2026",
    "Chevening Azerbaijan 2026",
    "xarici təhsil qrantı Azərbaycan",
    "beynəlxalq təqaüd Azərbaycan tələbə",
    "Heydər Əliyev Fondu təqaüd 2026",
    "Azərbaycan dövlət qrantı tələbə",
]

# ─── Dövlət/universtet saytları ───────────────────────────────────────────────
DIRECT_SOURCES = [
    ("https://edu.gov.az/az/section/54",                          "Təhsil Nazirliyi",     "generic"),
    ("https://edu.gov.az/az/news",                                "Təhsil Nazirliyi",     "generic"),
    ("https://prezident.az/az/news",                              "Prezident.az",         "generic"),
    ("https://heydar-aliyev-foundation.org/az/news",              "Heydər Əliyev Fondu",  "generic"),
    ("https://genclik.gov.az/az/scholarships",                    "Gənclər Fondu",        "generic"),
    ("https://genclik.gov.az/az/news",                            "Gənclər Fondu",        "generic"),
    ("https://innovation.gov.az/az/grants",                       "İnnovasiya Agentliyi", "generic"),
    ("https://ada.edu.az/scholarships",                           "ADA Universiteti",     "generic"),
]

# ─── Beynəlxalq scholarship saytları ─────────────────────────────────────────
INTL_SOURCES = [
    ("https://www.daad.az/az/find-funding/scholarship-database/", "DAAD",        "generic"),
    ("https://scholarships.az/az",                                "Scholarships.az", "generic"),
    ("https://grants.az/az",                                      "Grants.az",   "generic"),
]

# ─── Sözlər ──────────────────────────────────────────────────────────────────
# Başlıqda bu sözlərdən biri MÜTLƏQ olmalıdır (tələbə ilə birlikdə)
TEQAUD_TITLE_MUST = [
    "tələbə təqaüd", "tədqiqat qrant", "tələbə qrant",
    "magistr təqaüd", "doktorantura qrant", "doktorantura təqaüd",
    "scholarship", "fellowship", "qrant", "grant",
    "burs ", "stipendiya",
    "daad", "erasmus", "fulbright", "chevening",
    "xarici təhsil", "beynəlxalq təqaüd",
]

TEQAUD_BODY_WORDS = {
    "scholarship", "fellowship", "qrant", "grant", "burs",
    "stipendiya", "tələbə", "tədqiqat", "erasmus",
    "daad", "fulbright", "chevening", "xarici təhsil",
}

# GÜCLÜ FILTER: bunlar olsa → MÜTLƏQ AT (pensiya/sosial xəbərlər)
_PENSION_WORDS = {
    "pensiya", "pension", "pensioner", "yaşlı", "əmək",
    "sosial müavinət", "müavinət", "ictimai", "dövlət yardım",
    "sığorta", "DSMF", "sosial müdafiə",
}
_NOISE = {
    "vergi", "parlament", "seçki", "futbol", "idman",
    "hərbi", "xarici siyasət", "hökumət iclası",
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
    "DAAD":          ["daad"],
    "Erasmus":       ["erasmus"],
    "Fulbright":     ["fulbright"],
    "Chevening":     ["chevening"],
    "Magistratura":  ["magistr", "master", "mba"],
    "Doktorantura":  ["doktorantura", "phd", "doctorate"],
    "Bakalavr":      ["bakalavr", "undergraduate", "bachelor"],
    "Tədqiqat":      ["tədqiqat", "research"],
    "Tam Maliyyə":   ["tam maliyyə", "fully funded", "full scholarship"],
    "Texnologiya":   ["texnologiya", "it ", "stem", "engineering"],
    "Xarici Ölkə":   ["xarici", "abroad", "overseas", "alman", "german", "ingiltərə", "uk"],
    "Azərbaycanlılar":["azərbaycan", "azerbaijan"],
}

KNOWN_ORGS = {
    "daad":                 "DAAD",
    "erasmus":              "Erasmus",
    "fulbright":            "Fulbright",
    "chevening":            "Chevening",
    "ada universit":        "ADA Universiteti",
    "edu.gov":              "Təhsil Nazirliyi",
    "heydər əliyev":        "Heydər Əliyev Fondu",
    "heydar aliyev":        "Heydər Əliyev Fondu",
    "prezident.az":         "Prezident.az",
    "gənclik fondu":        "Gənclər Fondu",
    "genclik.gov":          "Gənclər Fondu",
    "innovation.gov":       "İnnovasiya Agentliyi",
    "scholarships.az":      "Scholarships.az",
    "grants.az":            "Grants.az",
    "unec":                 "UNEC",
    "aztu":                 "AZTU",
    "bdu":                  "Bakı Dövlət Universiteti",
}


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _h(t): return hashlib.sha256(t.encode("utf-8","ignore")).hexdigest()[:64]
def _clean(t,n=400): t=re.sub(r"\s+"," ",t).strip(); return t[:n].rsplit(" ",1)[0]+"..." if len(t)>n else t
def _sim(a,b): return SequenceMatcher(None,a.lower(),b.lower()).ratio()

def _org(text, fallback="Azərbaycan"):
    t=text.lower()
    for k,v in KNOWN_ORGS.items():
        if k in t: return v
    return fallback

def _tags(text):
    t=text.lower()
    return [tag for tag,kws in TAG_MAP.items() if any(kw in t for kw in kws)][:6]

def _prize(text):
    for p in [r"(\d[\d\s,.]*)[\s]*(AZN|azn|manat|₼)",r"(\d[\d\s,.]*)[\s]*(USD|usd|\$)",r"(\d[\d\s,.]*)[\s]*(EUR|eur|€)"]:
        m=re.search(p,text,re.IGNORECASE)
        if m:
            amt=re.sub(r"\s","",m.group(1))
            cur=m.group(2).upper().replace("MANAT","AZN").replace("₼","AZN")
            return f"{amt} {cur}"
    return None

def _deadline(text):
    today=date.today(); t=text.lower()
    mon_pat="|".join(sorted(AZ_MONTHS.keys(),key=len,reverse=True))
    m=re.search(rf"(\d{{1,2}})\s+({mon_pat})\s*,?\s*(\d{{4}})?",t)
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
    if "xarici" in t or "abroad" in t or "overseas" in t: return "Xarici ölkə"
    if "onlayn" in t or "online" in t: return "Onlayn"
    return "Azərbaycan"

def _is_teqaud_title(title):
    t=title.lower()
    return any(kw in t for kw in TEQAUD_TITLE_MUST)

def _is_junk(title):
    if len(title)<8 or _CYRILLIC.search(title): return True
    t=title.lower()
    # Pensiya sözü başlıqda olsa dərhal at
    if any(p in t for p in _PENSION_WORDS): return True
    return any(n in t for n in _NOISE)

def _is_pension_content(full_text):
    """Pension/sosial məzmunundan qorunmaq üçün əlavə yoxlama."""
    t = full_text.lower()
    pension_count = sum(1 for p in _PENSION_WORDS if p in t)
    student_count = sum(1 for s in ["tələbə","student","scholarship","qrant","fellowship"] if s in t)
    # Pensiya sözü çoxdursa və tələbə sözü azdırsa → at
    return pension_count > student_count

def _item(title,org,url,desc=None,deadline=None,loc="Azərbaycan",prize=None,tags=None,featured=False,source="unknown"):
    return {
        "title":title,"organizer":org,"category":"teqaud",
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
        if _is_junk(title) or not _is_teqaud_title(title): continue

        link=""
        for tag in ["link","guid"]:
            el=entry.find(tag)
            if el:
                href=el.get("href") or el.get_text(strip=True)
                if href and href.startswith("http"): link=href; break
        if not link: continue

        desc_el=entry.find(["description","summary","content"])
        desc=_clean(BeautifulSoup(desc_el.get_text(separator=" ",strip=True),"lxml").get_text(),400) if desc_el else ""

        full=title+" "+desc
        if _is_pension_content(full): continue
        if any(n in full.lower() for n in _NOISE): continue
        if not any(w in full.lower() for w in TEQAUD_BODY_WORDS): continue

        pub_date=None
        pub_el=entry.find(["pubDate","published","updated"])
        if pub_el:
            try: pub_date=parsedate_to_datetime(pub_el.get_text(strip=True)).date()
            except: pass

        dl=_deadline(full)
        if not dl and pub_date:
            est=pub_date+timedelta(days=90)  # Təqaüd müraciətlər daha uzun olur
            if est>=date.today(): dl=est
        if dl and dl<date.today(): continue

        items.append(_item(
            title=title,org=_org(full),url=link,
            desc=desc or None,deadline=dl,
            loc=_loc(full),prize=_prize(full),
            tags=_tags(full),source="gnews_teqaud",
            featured="heydər əliyev" in full.lower() or "dövlət qrant" in full.lower(),
        ))
    return items


def _parse_generic(html, base_url, org_name):
    soup=BeautifulSoup(html,"lxml")
    items=[]
    containers=[]
    for sel in ["article",".news-item",".scholarship-item",".grant-item",".card",".item",".entry"]:
        found=soup.select(sel)
        if found and len(found)>=2: containers=found[:20]; break
    if not containers:
        containers=[a for a in soup.find_all("a",href=True) if len(a.get_text(strip=True))>20][:20]

    for el in containers:
        title=""
        for tag in ["h2","h3","h4",".title",".name","a"]:
            t_el=el.find(tag) if hasattr(el,"find") else None
            if t_el and t_el.get_text(strip=True):
                title=_clean(t_el.get_text(strip=True),200); break
        if not title or _is_junk(title): continue
        if not _is_teqaud_title(title): continue

        a_el=el.find("a",href=True) if hasattr(el,"find") else (el if getattr(el,"name",None)=="a" else None)
        if not a_el: continue
        href=a_el.get("href","")
        if not href or href.startswith(("#","javascript")): continue
        link=href if href.startswith("http") else urljoin(base_url,href)

        body=_clean(el.get_text(separator=" ",strip=True),400)
        full=title+" "+body
        if _is_pension_content(full): continue

        dl=_deadline(full)
        if dl and dl<date.today(): continue

        items.append(_item(
            title=title,org=_org(full,org_name),url=link,
            desc=body if len(body)>len(title)+20 else None,
            deadline=dl,loc=_loc(full),prize=_prize(full),
            tags=_tags(full),source="direct_teqaud",
        ))
    return items


# ─── DB ───────────────────────────────────────────────────────────────────────

def _save(items, db):
    from app.models.opportunity import Opportunity
    if not items: return 0
    existing=db.query(Opportunity.url,Opportunity.title,Opportunity.content_hash)\
               .filter(Opportunity.category=="teqaud").all()
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
        Opportunity.category=="teqaud",Opportunity.is_active==True,
        Opportunity.deadline.isnot(None),Opportunity.deadline<today,
    ).all()
    for o in expired: o.is_active=False
    if expired:
        try: db.commit();log.info("⌛ %d köhnəlmiş təqaüd deaktiv edildi",len(expired))
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
        if n: log.info("🎓 GNews '%s' → %d yeni təqaüd",q,n)
        return n
    results=await asyncio.gather(*[_one(q) for q in GNEWS_QUERIES],return_exceptions=True)
    return sum(r for r in results if isinstance(r,int))


async def _scrape_direct(session, db):
    total=0
    for url,org,_ in DIRECT_SOURCES + INTL_SOURCES:
        html=await _fetch(session,url)
        if html:
            items=_parse_generic(html,url,org)
            n=_save(items,db)
            if n: log.info("🏛️ %s → %d yeni təqaüd",org,n)
            total+=n
        await asyncio.sleep(2)
    return total


# ─── Public API ───────────────────────────────────────────────────────────────

_INTERVAL_GNEWS  = 1200   # 20 dəq
_INTERVAL_DIRECT = 3600   # 1 saat
_INTERVAL_INTL   = 10800  # 3 saat
_INTERVAL_CLEANUP= 86400  # 1 gün

_running=False


async def run_teqaud_radar(get_db_func):
    global _running
    if _running: return
    _running=True
    log.info("🚀 Təqaüd Radar başladı")

    _gnews_last=_direct_last=_cleanup_last=None

    conn=aiohttp.TCPConnector(limit=8,ssl=False)
    async with aiohttp.ClientSession(connector=conn) as session:
        while True:
            now=datetime.utcnow()
            db=next(get_db_func())
            try:
                if _gnews_last is None or (now-_gnews_last).total_seconds()>=_INTERVAL_GNEWS:
                    n=await _scrape_gnews(session,db)
                    log.info("📰 Təqaüd GNews: %d yeni",n);_gnews_last=now

                if _direct_last is None or (now-_direct_last).total_seconds()>=_INTERVAL_DIRECT:
                    n=await _scrape_direct(session,db)
                    log.info("🏛️ Təqaüd saytlar: %d yeni",n);_direct_last=now

                if _cleanup_last is None or (now-_cleanup_last).total_seconds()>=_INTERVAL_CLEANUP:
                    _deactivate_expired(db);_cleanup_last=now

            except Exception as e: log.error("Təqaüd Radar xəta: %s",e,exc_info=True)
            finally: db.close()
            await asyncio.sleep(60)
