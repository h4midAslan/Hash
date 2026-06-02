"""
Hackathon Radar — Azərbaycan hackathonlarını avtomatik tapır.

3 qat mənbə:
  1. Google News RSS    — ən geniş əhatə, real-time (hər 15 dəq)
  2. AZ saytları        — TEKNOFEST, İnnovasiya Agentliyi, MOST, Gənclər Fondu (hər 1 saat)
  3. Beynəlxalq         — Devpost, MLH — AZ tələbələrin iştirak edə bildiyi (hər 2 saat)

Bütün tapılan hackathonlar opportunities cədvəlinə category='hackathon' ilə yazılır.
Keçmiş deadline-lı imkanlar avtomatik deaktiv edilir.
"""

import asyncio
import hashlib
import json
import logging
import re
from datetime import date, datetime, timedelta
from difflib import SequenceMatcher
from email.utils import parsedate_to_datetime
from urllib.parse import urljoin, quote

import aiohttp
from bs4 import BeautifulSoup

log = logging.getLogger("hackathon_radar")

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "az,en;q=0.9",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Cache-Control": "no-cache",
}

# ─── Google News RSS sorğuları ────────────────────────────────────────────────
# Mümkün qədər çox Azərbaycan hackathon sorğusu — həm AZ, həm EN
GNEWS_QUERIES = [
    # Əsas hackathon sorğuları
    "hackathon Azərbaycan 2026",
    "hackathon Bakı 2026",
    "hakatom Azərbaycan",
    "hakaton Bakı müsabiqə",
    # Məşhur təşkilatlar
    "TEKNOFEST Azərbaycan 2026",
    "MOST hackathon Bakı",
    "Startup Baku competition",
    "innovation challenge Azerbaijan 2026",
    # Texniki yarışmalar
    "proqramlaşdırma yarışması Azərbaycan",
    "coding competition Azerbaijan 2026",
    "IT yarışması Azərbaycan 2026",
    "texnologiya müsabiqəsi Bakı 2026",
    # Rəqəmsal / AI
    "DigiHack Azerbaijan",
    "AI hackathon Azerbaijan",
    "süni intellekt yarışması Azərbaycan",
    # Startap/innovasiya
    "startup competition Azerbaijan",
    "innovasiya müsabiqəsi Azərbaycan 2026",
    "tələbə yarışması texnologiya Azərbaycan",
    # Kiber
    "CTF Azərbaycan 2026",
    "cybersecurity competition Azerbaijan",
    "kibertəhlükəsizlik yarışması",
    # Gənclik
    "gənclik proqramı müsabiqə Azərbaycan",
    "youth tech challenge Azerbaijan",
]

# ─── Birbaşa AZ saytları ──────────────────────────────────────────────────────
# (url, org_name, parser_type)
DIRECT_SOURCES = [
    ("https://www.teknofest.az/az/competitions",             "TEKNOFEST Azərbaycan",      "teknofest"),
    ("https://www.teknofest.az/az/news",                     "TEKNOFEST Azərbaycan",      "generic"),
    ("https://innovation.gov.az/az/news",                    "İnnovasiya Agentliyi",      "generic"),
    ("https://innovation.gov.az/az/competitions",            "İnnovasiya Agentliyi",      "generic"),
    ("https://genclik.gov.az/az/news",                       "Azərbaycan Gənclər Fondu",  "generic"),
    ("https://most.az/az/news",                              "MOST Technology Park",      "generic"),
    ("https://most.az/az/events",                            "MOST Technology Park",      "generic"),
    ("https://ada.edu.az/news",                              "ADA Universiteti",          "generic"),
    ("https://mincom.gov.az/az/news",                        "Rəqəmsal İnkişaf Nazirliy", "generic"),
    ("https://aztu.edu.az/az/news",                          "AZTU",                      "generic"),
]

# Devpost — "azerbaijan" tag-li hackathonlar
DEVPOST_URLS = [
    "https://devpost.com/hackathons?utf8=%E2%9C%93&search=azerbaijan&status%5B%5D=upcoming&status%5B%5D=open",
    "https://devpost.com/hackathons?utf8=%E2%9C%93&status%5B%5D=upcoming&status%5B%5D=open&order_by=recently-added",
]

# MLH — tələbə hackathonları
MLH_URL = "https://mlh.io/seasons/2026/events"

# ─── Azərbaycan ayları ────────────────────────────────────────────────────────
AZ_MONTHS = {
    "yanvar":1, "yan":1, "january":1, "jan":1,
    "fevral":2, "fev":2, "february":2, "feb":2,
    "mart":3, "march":3, "mar":3,
    "aprel":4, "april":4, "apr":4,
    "may":5,
    "iyun":6, "iyn":6, "june":6, "jun":6,
    "iyul":7, "iyl":7, "july":7, "jul":7,
    "avqust":8, "avq":8, "august":8, "aug":8,
    "sentyabr":9, "sen":9, "september":9, "sep":9,
    "oktyabr":10, "okt":10, "october":10, "oct":10,
    "noyabr":11, "noy":11, "november":11, "nov":11,
    "dekabr":12, "dek":12, "december":12, "dec":12,
}

# ─── Hackathon açar sözlər ────────────────────────────────────────────────────
# Başlıqda bu sözlərdən biri MÜTLƏQ olmalıdır
HACK_TITLE_MUST = [
    "hackathon", "hakatom", "hakaton", "hack ",
    "yarışma", "müsabiqə", "musabiqe",
    "challenge", "contest", "competition",
    "teknofest",
    "digihack", "coding challenge",
    "proqramlaşdırma yarış", "it yarış",
    "innovation challenge", "startup competition",
    "texnologiya müsabiqə", "texnologiya yarış",
    "ctf", "capture the flag",
    "tələbə yarış", "youth challenge",
]

# Tam mətndə ən azı biri olmalıdır
HACK_BODY_WORDS = {
    "hackathon", "hakatom", "hakaton",
    "yarışma", "müsabiqə", "yarış", "challenge", "contest",
    "competition", "teknofest", "mvp", "prototip", "prototype",
    "pitch", "demo day", "startup", "coding", "ctf",
}

# Bunlar olsa → at
_NOISE = {
    "pensiya", "pension", "vergi", "parlament", "seçki",
    "futbol", "idman xəbər", "hərbi", "xarici siyasət",
    "diplomatik görüş", "nazirlik iclası", "büdcə",
}

_CYRILLIC = re.compile(r"[а-яёА-ЯЁ]{3,}")

# ─── Tag açar sözlər ──────────────────────────────────────────────────────────
TAG_MAP = {
    "Python":         ["python"],
    "JavaScript":     ["javascript", "js", "node.js"],
    "AI/ML":          ["süni intellekt", "artificial intelligence", "machine learning", "ml ", "ai "],
    "Startup":        ["startup", "startap", "biznes inkubas"],
    "Fintech":        ["fintech", "bank texnologiya", "maliyyə texnologiya"],
    "Robototexnika":  ["robot", "mexatronika", "mechatronics", "drone", "uav"],
    "Cybersecurity":  ["kibertəhlükəsizlik", "security", "cyber", "ctf"],
    "Mobile":         ["mobil", "android", "ios", "flutter"],
    "Web":            ["web dev", "frontend", "backend", "fullstack"],
    "Data":           ["data analitika", "data science", "sql", "analytics"],
    "Cloud":          ["cloud", "aws", "azure", "devops"],
    "Dizayn":         ["ui/ux", "figma", "dizayn", "design"],
    "Enerji":         ["enerji", "energy", "green tech", "socar"],
    "TEKNOFEST":      ["teknofest"],
    "Pulsuz":         ["pulsuz", "free", "ödənişsiz"],
    "Sertifikat":     ["sertifikat", "certificate"],
    "Beynəlxalq":     ["international", "beynəlxalq", "global"],
    "MLH":            ["mlh"],
}

# ─── Tanınan təşkilatlar ──────────────────────────────────────────────────────
KNOWN_ORGS = {
    "teknofest":            "TEKNOFEST Azərbaycan",
    "most texnologiya":     "MOST Technology Park",
    "most technology":      "MOST Technology Park",
    "most.az":              "MOST Technology Park",
    "startup baku":         "Startup Baku",
    "ada universit":        "ADA Universiteti",
    "ada.edu":              "ADA Universiteti",
    "unec":                 "UNEC",
    "aztu":                 "AZTU",
    "bdu":                  "Bakı Dövlət Universiteti",
    "innovation.gov":       "İnnovasiya Agentliyi",
    "innovasiya agent":     "İnnovasiya Agentliyi",
    "gənclik fondu":        "Azərbaycan Gənclər Fondu",
    "genclik.gov":          "Azərbaycan Gənclər Fondu",
    "mincom":               "Rəqəmsal İnkişaf Nazirliyi",
    "rəqəmsal inkişaf":     "Rəqəmsal İnkişaf Nazirliyi",
    "kapital bank":         "Kapital Bank",
    "pasha":                "PAŞA Holding",
    "abb bank":             "ABB Bank",
    "azercell":             "Azercell Telekom",
    "bakcell":              "Bakcell",
    "socar":                "SOCAR",
    "devpost":              "Devpost",
    "mlh":                  "Major League Hacking",
    "lablab":               "Lablab.ai",
}


# ─── Yardımçı funksiyalar ─────────────────────────────────────────────────────

def _h(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8", errors="ignore")).hexdigest()[:64]


def _clean(text: str, n: int = 400) -> str:
    text = re.sub(r"\s+", " ", text).strip()
    if len(text) > n:
        return text[:n].rsplit(" ", 1)[0] + "..."
    return text


def _similarity(a: str, b: str) -> float:
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()


def _extract_org(text: str, fallback: str = "Azərbaycan") -> str:
    t = text.lower()
    for key, name in KNOWN_ORGS.items():
        if key in t:
            return name
    return fallback


def _extract_tags(text: str) -> list:
    t = text.lower()
    return [tag for tag, kws in TAG_MAP.items() if any(kw in t for kw in kws)][:6]


def _extract_prize(text: str):
    for pat in [
        r"(\d[\d\s,.]*)[\s]*(AZN|azn|manat|₼)",
        r"(\d[\d\s,.]*)[\s]*(USD|usd|\$)",
        r"(\d[\d\s,.]*)[\s]*(EUR|eur|€)",
    ]:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            amt = re.sub(r"\s", "", m.group(1))
            cur = m.group(2).upper().replace("MANAT", "AZN").replace("₼", "AZN")
            return f"{amt} {cur}"
    return None


def _extract_deadline(text: str):
    today = date.today()
    t = text.lower()
    mon_pat = "|".join(sorted(AZ_MONTHS.keys(), key=len, reverse=True))

    # "20 iyun 2026" or "20 iyun"
    m = re.search(rf"(\d{{1,2}})\s+({mon_pat})\s*,?\s*(\d{{4}})?", t)
    if m:
        try:
            day = int(m.group(1))
            mon = AZ_MONTHS[m.group(2)]
            yr  = int(m.group(3)) if m.group(3) else today.year
            d   = date(yr, mon, day)
            if d >= today:
                return d
            if not m.group(3):
                d2 = date(yr + 1, mon, day)
                if d2 >= today:
                    return d2
        except ValueError:
            pass

    # ISO: "2026-07-15"
    m = re.search(r"(\d{4})-(\d{2})-(\d{2})", text)
    if m:
        try:
            d = date(int(m.group(1)), int(m.group(2)), int(m.group(3)))
            if d >= today:
                return d
        except ValueError:
            pass

    # EU: "15.07.2026" or "15/07/2026"
    m = re.search(r"(\d{2})[./](\d{2})[./](\d{4})", text)
    if m:
        try:
            d = date(int(m.group(3)), int(m.group(2)), int(m.group(1)))
            if d >= today:
                return d
        except ValueError:
            pass

    return None


def _extract_location(text: str) -> str:
    t = text.lower()
    if ("onlayn" in t or "online" in t or "virtual" in t) and ("bakı" in t or "baku" in t):
        return "Bakı / Onlayn"
    if "onlayn" in t or "online" in t or "virtual" in t or "remote" in t:
        return "Onlayn"
    if "global" in t or "worldwide" in t or "international" in t or "beynəlxalq" in t:
        return "Beynəlxalq (Onlayn)"
    return "Bakı"


def _is_hack_title(title: str) -> bool:
    t = title.lower()
    return any(kw in t for kw in HACK_TITLE_MUST)


def _is_junk(title: str) -> bool:
    if len(title) < 8:
        return True
    if _CYRILLIC.search(title):
        return True
    t = title.lower()
    return any(n in t for n in _NOISE)


def _build_item(
    title: str,
    organizer: str,
    url: str,
    description: str = None,
    deadline=None,
    location: str = "Bakı",
    prize: str = None,
    tags: list = None,
    logo_url: str = None,
    is_featured: bool = False,
    source_name: str = "unknown",
) -> dict:
    return {
        "title": title,
        "organizer": organizer,
        "category": "hackathon",
        "deadline": deadline,
        "location": location,
        "prize": prize,
        "description": description,
        "tags": json.dumps(tags or []),
        "url": url,
        "logo_url": logo_url,
        "is_featured": is_featured,
        "is_active": True,
        "source_name": source_name,
        "content_hash": _h(title + url),
    }


# ─── Parserlər ────────────────────────────────────────────────────────────────

def _parse_gnews_rss(xml_text: str, query: str) -> list:
    """Google News RSS-i emal edir — yalnız hackathon başlıqlılar keçir."""
    items = []
    try:
        soup = BeautifulSoup(xml_text, "lxml-xml")
    except Exception:
        soup = BeautifulSoup(xml_text, "lxml")

    entries = soup.find_all(["item", "entry"])
    log.debug("GNews '%s': %d entry", query, len(entries))

    for entry in entries:
        # ── Başlıq ──
        title_el = entry.find("title")
        if not title_el:
            continue
        # Google News: "Başlıq - Mənbə" → "Başlıq"
        raw_title = title_el.get_text(strip=True)
        title = re.sub(r"\s*[-–|]\s*[^-–|]{1,60}$", "", raw_title).strip()
        title = _clean(title, 220)

        if _is_junk(title):
            continue
        if not _is_hack_title(title):
            continue

        # ── URL ──
        link = ""
        for tag in ["link", "guid"]:
            el = entry.find(tag)
            if el:
                href = el.get("href") or el.get_text(strip=True)
                if href and href.startswith("http"):
                    link = href
                    break
        if not link:
            continue

        # ── Açıqlama ──
        desc_el = entry.find(["description", "summary", "content"])
        desc = ""
        if desc_el:
            desc = BeautifulSoup(desc_el.get_text(separator=" ", strip=True), "lxml").get_text()
            desc = _clean(desc, 400)

        full = title + " " + desc
        full_lower = full.lower()

        # Səs-küylü xəbərləri at
        if any(n in full_lower for n in _NOISE):
            continue

        # Hackathon sözü tam mətndə də yoxdursa at
        if not any(w in full_lower for w in HACK_BODY_WORDS):
            continue

        # ── Tarix ──
        pub_date = None
        pub_el = entry.find(["pubDate", "published", "updated", "dc:date"])
        if pub_el:
            try:
                pub_date = parsedate_to_datetime(pub_el.get_text(strip=True)).date()
            except Exception:
                pass

        deadline = _extract_deadline(full)
        # Deadline tapılmadısa yayım tarixindən 45 gün
        if not deadline and pub_date:
            est = pub_date + timedelta(days=45)
            if est >= date.today():
                deadline = est

        # Keçmiş deadline → atla
        if deadline and deadline < date.today():
            continue

        items.append(_build_item(
            title=title,
            organizer=_extract_org(full),
            url=link,
            description=desc or None,
            deadline=deadline,
            location=_extract_location(full),
            prize=_extract_prize(full),
            tags=_extract_tags(full),
            is_featured="teknofest" in full_lower or "innovation.gov" in full_lower,
            source_name="gnews_hack",
        ))

    return items


def _parse_teknofest(html: str) -> list:
    """TEKNOFEST Azerbaijan competition saytı üçün xüsusi parser."""
    soup = BeautifulSoup(html, "lxml")
    base = "https://www.teknofest.az"
    items = []

    # TEKNOFEST müxtəlif CSS strukturları istifadə edir — hamısını yoxlayırıq
    cards = (
        soup.select(".competition-card") or
        soup.select(".competition-item") or
        soup.select(".card") or
        soup.select("article") or
        soup.select(".item")
    )

    # Fallback: bütün başlıq elementlərini tap
    if not cards:
        cards = soup.select("h2, h3, h4")

    for card in cards[:25]:
        # Başlıq
        title_el = card.find(["h2", "h3", "h4", ".title", ".competition-title", ".name"])
        if title_el:
            title = _clean(title_el.get_text(strip=True), 200)
        else:
            title = _clean(card.get_text(strip=True)[:150], 150)

        if not title or len(title) < 5:
            continue

        # Link
        a = card.find("a", href=True) if hasattr(card, "find") else (
            card if getattr(card, "name", None) == "a" else None
        )
        if not a:
            # Başlığın özü link ola bilər
            if hasattr(card, "find_parent"):
                a = card.find_parent("a")
        if not a:
            continue

        href = a.get("href", "")
        if not href or href in ("#", "/"):
            continue
        link = href if href.startswith("http") else urljoin(base, href)

        body = _clean(card.get_text(separator=" ", strip=True), 350)
        deadline = _extract_deadline(body)
        if deadline and deadline < date.today():
            continue

        full_title = f"TEKNOFEST: {title}" if "teknofest" not in title.lower() else title

        items.append(_build_item(
            title=full_title,
            organizer="TEKNOFEST Azərbaycan",
            url=link,
            description=body if len(body) > len(title) + 15 else None,
            deadline=deadline,
            location="Bakı",
            prize=_extract_prize(body),
            tags=["TEKNOFEST"] + _extract_tags(body),
            logo_url=None,
            is_featured=True,
            source_name="teknofest_az",
        ))

    return items


def _parse_generic_az(html: str, base_url: str, org_name: str) -> list:
    """AZ dövlət/şirkət saytları üçün universal parser."""
    soup = BeautifulSoup(html, "lxml")
    items = []

    # Kart/item elementlərini tap
    selectors = [
        "article", ".news-item", ".event-item", ".card", ".item",
        ".competition-item", ".hackathon-item", "li.event",
        ".post", ".entry", ".news-card",
    ]
    containers = []
    for sel in selectors:
        found = soup.select(sel)
        if found and len(found) >= 2:
            containers = found[:20]
            break

    # Fallback: link+mətn
    if not containers:
        containers = [
            a for a in soup.find_all("a", href=True)
            if len(a.get_text(strip=True)) > 20
        ][:20]

    for el in containers:
        # Başlıq
        title = ""
        for tag in ["h2", "h3", "h4", ".title", ".name", ".news-title", "a"]:
            t_el = el.find(tag) if hasattr(el, "find") else None
            if t_el and t_el.get_text(strip=True):
                title = _clean(t_el.get_text(strip=True), 200)
                break
        if not title:
            title = _clean(el.get_text(strip=True)[:150], 150)

        if not title or _is_junk(title):
            continue
        if not _is_hack_title(title):
            continue

        # Link
        a_el = (
            el.find("a", href=True) if hasattr(el, "find")
            else (el if getattr(el, "name", None) == "a" else None)
        )
        if not a_el:
            continue
        href = a_el.get("href", "")
        if not href or href.startswith(("#", "javascript")):
            continue
        link = href if href.startswith("http") else urljoin(base_url, href)

        body = _clean(el.get_text(separator=" ", strip=True), 400)
        full = title + " " + body

        if any(n in full.lower() for n in _NOISE):
            continue

        deadline = _extract_deadline(full)
        if deadline and deadline < date.today():
            continue

        items.append(_build_item(
            title=title,
            organizer=_extract_org(full, org_name),
            url=link,
            description=body if len(body) > len(title) + 20 else None,
            deadline=deadline,
            location=_extract_location(full),
            prize=_extract_prize(full),
            tags=_extract_tags(full),
            is_featured=org_name in ("TEKNOFEST Azərbaycan", "İnnovasiya Agentliyi"),
            source_name="direct_az",
        ))

    return items


def _parse_devpost(html: str) -> list:
    """Devpost hackathon siyahısı."""
    soup = BeautifulSoup(html, "lxml")
    items = []

    cards = (
        soup.select(".hackathon-tile") or
        soup.select(".challenge-listing") or
        soup.select("article.hackathon") or
        soup.select("li.hackathon") or
        soup.select(".hackathon")
    )

    for card in cards[:20]:
        title_el = card.select_one("h2, h3, .title, .challenge-title, .hackathon-title")
        title = _clean(title_el.get_text(strip=True), 220) if title_el else ""
        if not title:
            continue

        a = card.find("a", href=True)
        if not a:
            continue
        href = a.get("href", "")
        link = href if href.startswith("http") else "https://devpost.com" + href

        body = _clean(card.get_text(separator=" ", strip=True), 350)
        deadline = _extract_deadline(body)
        if deadline and deadline < date.today():
            continue

        prize_el = card.select_one(".prize, .prize-amount, .reward, .total-prizes")
        prize = prize_el.get_text(strip=True) if prize_el else _extract_prize(body)

        items.append(_build_item(
            title=title,
            organizer="Devpost",
            url=link,
            description=body if len(body) > 50 else None,
            deadline=deadline,
            location="Onlayn",
            prize=prize,
            tags=["Beynəlxalq"] + _extract_tags(body),
            is_featured=False,
            source_name="devpost",
        ))

    return items


def _parse_mlh(html: str) -> list:
    """Major League Hacking tələbə hackathonları."""
    soup = BeautifulSoup(html, "lxml")
    items = []

    events = (
        soup.select(".event-wrapper") or
        soup.select(".event") or
        soup.select("article.event") or
        soup.select("li.event")
    )

    for ev in events[:25]:
        title_el = ev.select_one("h3, h4, .event-name, .title")
        title = _clean(title_el.get_text(strip=True), 200) if title_el else ""
        if not title or len(title) < 5:
            continue

        a = ev.find("a", href=True)
        href = a.get("href", "") if a else ""
        link = href if href.startswith("http") else "https://mlh.io" + href
        if not link or link == "https://mlh.io":
            continue

        body = _clean(ev.get_text(separator=" ", strip=True), 300)
        deadline = _extract_deadline(body)
        if deadline and deadline < date.today():
            continue

        # MLH-də tarix formatı: "Mar 15 - 16, 2026"
        date_el = ev.select_one(".event-date, .date, time")
        if date_el:
            deadline = _extract_deadline(date_el.get_text(strip=True)) or deadline

        items.append(_build_item(
            title=f"MLH: {title}" if "mlh" not in title.lower() else title,
            organizer="Major League Hacking",
            url=link,
            description=body if len(body) > 40 else None,
            deadline=deadline,
            location="Onlayn",
            prize=None,
            tags=["MLH", "Beynəlxalq", "Tələbə"] + _extract_tags(body),
            is_featured=False,
            source_name="mlh",
        ))

    return items


# ─── DB saxlama ───────────────────────────────────────────────────────────────

def _save(items: list, db) -> int:
    from app.models.opportunity import Opportunity

    if not items:
        return 0

    # Mövcud hackathonları yüklə
    existing = (
        db.query(Opportunity.url, Opportunity.title, Opportunity.content_hash)
          .filter(Opportunity.category == "hackathon")
          .all()
    )
    url_to_hash  = {row.url: row.content_hash for row in existing}
    existing_titles = [row.title for row in existing]

    saved = 0
    for item in items:
        t = item.get("title", "").strip()
        u = item.get("url", "").strip()
        if not t or not u:
            continue

        if u in url_to_hash:
            # URL mövcuddur — dəyişiklik varsa yenilə
            if url_to_hash[u] != item.get("content_hash"):
                rec = db.query(Opportunity).filter(Opportunity.url == u).first()
                if rec:
                    rec.deadline     = item["deadline"]
                    rec.description  = item["description"]
                    rec.prize        = item["prize"]
                    rec.content_hash = item["content_hash"]
                    rec.is_active    = True
            continue

        # Oxşar başlıq varsa at (0.82 threshold)
        if any(_similarity(t, et) > 0.82 for et in existing_titles):
            continue

        try:
            db.add(Opportunity(**item))
            url_to_hash[u] = item.get("content_hash")
            existing_titles.append(t)
            saved += 1
        except Exception as e:
            log.debug("add xəta (%s): %s", t[:40], e)

    try:
        db.commit()
    except Exception as e:
        db.rollback()
        log.error("DB commit xəta: %s", e)
        return 0

    return saved


# ─── HTTP ─────────────────────────────────────────────────────────────────────

async def _fetch(session: aiohttp.ClientSession, url: str) -> str | None:
    try:
        async with session.get(
            url,
            headers=HEADERS,
            timeout=aiohttp.ClientTimeout(total=25),
            ssl=False,
            allow_redirects=True,
        ) as r:
            if r.status == 200:
                return await r.text(errors="ignore")
            log.debug("HTTP %d: %s", r.status, url)
    except asyncio.TimeoutError:
        log.debug("timeout: %s", url)
    except Exception as e:
        log.debug("fetch err %s: %s", url, e)
    return None


# ─── Tarama blokları ──────────────────────────────────────────────────────────

async def _scrape_gnews(session: aiohttp.ClientSession, db) -> int:
    """Bütün Google News sorğularını paralel işlət."""
    total = 0

    async def _one(query: str) -> int:
        # AZ dilinde yoxla
        url_az = (
            f"https://news.google.com/rss/search"
            f"?q={quote(query)}&hl=az&gl=AZ&ceid=AZ:az"
        )
        xml = await _fetch(session, url_az)

        # AZ version boş gəlsə EN-ə keç
        if not xml:
            url_en = (
                f"https://news.google.com/rss/search"
                f"?q={quote(query)}&hl=en&gl=AZ&ceid=AZ:en"
            )
            xml = await _fetch(session, url_en)

        if not xml:
            return 0

        items = _parse_gnews_rss(xml, query)
        if not items:
            return 0

        n = _save(items, db)
        if n:
            log.info("🔥 GNews '%s' → %d yeni hackathon", query, n)
        return n

    results = await asyncio.gather(
        *[_one(q) for q in GNEWS_QUERIES],
        return_exceptions=True,
    )
    total = sum(r for r in results if isinstance(r, int))
    return total


async def _scrape_direct_az(session: aiohttp.ClientSession, db) -> int:
    """Birbaşa AZ saytları taranır — ardıcıl (serverlərə yük verməmək üçün)."""
    total = 0
    for url, org, parser_type in DIRECT_SOURCES:
        html = await _fetch(session, url)
        if not html:
            log.debug("Əlçatmaz: %s", url)
            continue

        if parser_type == "teknofest":
            items = _parse_teknofest(html)
        else:
            items = _parse_generic_az(html, url, org)

        if items:
            n = _save(items, db)
            if n:
                log.info("🏆 %s → %d yeni hackathon", org, n)
            total += n

        # AZ serverlərinə yük vermə
        await asyncio.sleep(2)

    return total


async def _scrape_international(session: aiohttp.ClientSession, db) -> int:
    """Devpost + MLH — beynəlxalq hackathonlar."""
    total = 0

    # Devpost
    for durl in DEVPOST_URLS:
        html = await _fetch(session, durl)
        if html:
            items = _parse_devpost(html)
            n = _save(items, db)
            if n:
                log.info("🌍 Devpost → %d yeni hackathon", n)
            total += n
            break  # İlk işləyən URL yetər

    # MLH
    html = await _fetch(session, MLH_URL)
    if html:
        items = _parse_mlh(html)
        n = _save(items, db)
        if n:
            log.info("🌍 MLH → %d yeni hackathon", n)
        total += n

    return total


def _deactivate_expired(db) -> int:
    """Deadline keçmiş hackathonları is_active=False et."""
    from app.models.opportunity import Opportunity

    today = date.today()
    expired = (
        db.query(Opportunity)
          .filter(
              Opportunity.category == "hackathon",
              Opportunity.is_active == True,
              Opportunity.deadline.isnot(None),
              Opportunity.deadline < today,
          )
          .all()
    )
    for opp in expired:
        opp.is_active = False

    if expired:
        try:
            db.commit()
            log.info("⌛ %d köhnəlmiş hackathon deaktiv edildi", len(expired))
        except Exception as e:
            db.rollback()
            log.error("deactivate commit xəta: %s", e)

    return len(expired)


# ─── Public API ───────────────────────────────────────────────────────────────

# Tarama intervalları (saniyə)
_INTERVAL_GNEWS   = 900    # 15 dəq — ən tez-tez
_INTERVAL_DIRECT  = 3600   # 1 saat
_INTERVAL_INTL    = 7200   # 2 saat
_INTERVAL_CLEANUP = 86400  # 1 gün — köhnəlmiş imkanları deaktiv et

_running = False


async def run_hackathon_radar(get_db_func):
    """
    Hackathon Radar — daimi arxa plan döngüsü.
    main.py lifespan-dan asyncio.create_task ilə çağır.
    """
    global _running
    if _running:
        log.warning("Hackathon Radar artıq işləyir, ikinci nüsxə başlamır")
        return
    _running = True
    log.info("🚀 Hackathon Radar başladı (gnews=15dəq, direct=1s, intl=2s)")

    _gnews_last   = None
    _direct_last  = None
    _intl_last    = None
    _cleanup_last = None

    conn = aiohttp.TCPConnector(limit=10, ssl=False)
    async with aiohttp.ClientSession(connector=conn) as session:
        while True:
            now = datetime.utcnow()
            db = next(get_db_func())
            try:
                # Google News — hər 15 dəq
                if _gnews_last is None or (now - _gnews_last).total_seconds() >= _INTERVAL_GNEWS:
                    total = await _scrape_gnews(session, db)
                    log.info("📰 GNews dövrü bitdi: %d yeni hackathon", total)
                    _gnews_last = now

                # AZ saytları — hər 1 saat
                if _direct_last is None or (now - _direct_last).total_seconds() >= _INTERVAL_DIRECT:
                    total = await _scrape_direct_az(session, db)
                    log.info("🏆 AZ saytlar dövrü bitdi: %d yeni hackathon", total)
                    _direct_last = now

                # Beynəlxalq — hər 2 saat
                if _intl_last is None or (now - _intl_last).total_seconds() >= _INTERVAL_INTL:
                    total = await _scrape_international(session, db)
                    log.info("🌍 Beynəlxalq dövrü bitdi: %d yeni hackathon", total)
                    _intl_last = now

                # Köhnəlmiş imkanlar — gündə bir
                if _cleanup_last is None or (now - _cleanup_last).total_seconds() >= _INTERVAL_CLEANUP:
                    _deactivate_expired(db)
                    _cleanup_last = now

            except Exception as e:
                log.error("Hackathon Radar ana döngü xəta: %s", e, exc_info=True)
            finally:
                db.close()

            await asyncio.sleep(60)  # hər dəqiqə yoxla
