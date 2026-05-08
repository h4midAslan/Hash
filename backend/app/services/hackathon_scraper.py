"""
Azərbaycan hackathon scraper.
Mənbələr:
  1. Devpost API — "Azerbaijan" / "Baku" axtarışı
  2. startupbaku.az events
  3. innovation.gov.az / youth.gov.az
"""
import re
import time
import logging
from datetime import datetime
from html import unescape

import requests
from bs4 import BeautifulSoup

log = logging.getLogger(__name__)
TODAY = datetime.now()

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36",
    "Accept-Language": "az,en;q=0.9",
}

MONTHS_EN = {
    "january": 1, "february": 2, "march": 3, "april": 4,
    "may": 5, "june": 6, "july": 7, "august": 8,
    "september": 9, "october": 10, "november": 11, "december": 12,
    "jan": 1, "feb": 2, "mar": 3, "apr": 4, "jun": 6,
    "jul": 7, "aug": 8, "sep": 9, "oct": 10, "nov": 11, "dec": 12,
}

MONTHS_AZ = {
    "yanvar": 1, "fevral": 2, "mart": 3, "aprel": 4,
    "may": 5, "iyun": 6, "iyul": 7, "avqust": 8,
    "sentyabr": 9, "oktyabr": 10, "noyabr": 11, "dekabr": 12,
}

AZ_KEYWORDS = [
    "hackathon", "hakaton", "yarış", "müsabiqə", "competition",
    "challenge", "startup", "olympiad", "olimpiada", "grant",
    "bootcamp", "ideathon", "datathon", "innovation", "tədbir",
]


def strip_html(text: str) -> str:
    text = re.sub(r"<[^>]+>", "", str(text))
    return unescape(text).strip()


def parse_deadline(text: str) -> datetime | None:
    if not text:
        return None

    # Range "May 07 - 09, 2026" → son günü götür
    m = re.search(
        r"(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|"
        r"jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)"
        r"\s+\d{1,2}\s*[-–]\s*(\d{1,2}),?\s*(\d{4})",
        text, re.IGNORECASE
    )
    if m:
        text = f"{m.group(1)} {m.group(2)}, {m.group(3)}"

    # ISO: 2026-05-30
    m = re.match(r"(\d{4})-(\d{2})-(\d{2})", text.strip())
    if m:
        try:
            return datetime(int(m.group(1)), int(m.group(2)), int(m.group(3)))
        except Exception:
            pass

    # "May 30, 2026"
    m = re.search(
        r"(january|february|march|april|may|june|july|august|"
        r"september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)"
        r"\s+(\d{1,2}),?\s+(\d{4})", text, re.IGNORECASE
    )
    if m:
        try:
            return datetime(int(m.group(3)), MONTHS_EN[m.group(1).lower()], int(m.group(2)))
        except Exception:
            pass

    # "30 May 2026"
    m = re.search(
        r"(\d{1,2})\s+(january|february|march|april|may|june|july|august|"
        r"september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)"
        r"\s+(\d{4})", text, re.IGNORECASE
    )
    if m:
        try:
            return datetime(int(m.group(3)), MONTHS_EN[m.group(2).lower()], int(m.group(1)))
        except Exception:
            pass

    # "30 Yanvar 2026" (Azərbaycan)
    m = re.search(
        r"(\d{1,2})\s+(yanvar|fevral|mart|aprel|may|iyun|iyul|avqust|sentyabr|oktyabr|noyabr|dekabr)"
        r"\s+(\d{4})", text, re.IGNORECASE
    )
    if m:
        try:
            return datetime(int(m.group(3)), MONTHS_AZ[m.group(2).lower()], int(m.group(1)))
        except Exception:
            pass

    # DD.MM.YYYY
    m = re.search(r"(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})", text)
    if m:
        try:
            return datetime(int(m.group(3)), int(m.group(2)), int(m.group(1)))
        except Exception:
            pass

    return None


def is_expired(deadline_str: str) -> bool:
    dt = parse_deadline(deadline_str)
    if dt is None:
        return False
    return dt < TODAY


def fmt_deadline(raw: str) -> str:
    dt = parse_deadline(raw)
    if dt:
        return dt.strftime("%d.%m.%Y")
    return raw[:60] if raw else ""


# ─── DEVPOST — Azərbaycan axtarışı ───────────────────────────────────────────

def scrape_devpost_az() -> list[dict]:
    results = []
    searches = ["Azerbaijan", "Baku", "Azərbaycan"]

    for query in searches:
        try:
            r = requests.get(
                "https://devpost.com/api/hackathons",
                params={"search": query, "status": "open", "order_by": "deadline", "per_page": 10},
                headers={**HEADERS, "Accept": "application/json"},
                timeout=12,
            )
            if r.status_code != 200:
                continue

            for h in r.json().get("hackathons", []):
                title = strip_html(h.get("title", ""))
                url = h.get("url", "")
                if not url.startswith("http"):
                    url = "https://devpost.com" + url
                deadline_raw = h.get("submission_period_dates", "") or h.get("ends_at", "")
                if is_expired(deadline_raw):
                    continue
                prize = strip_html(str(h.get("prize_amount", "") or "")).replace("$0", "").strip()
                tagline = strip_html(str(h.get("tagline", "") or ""))
                desc = f"Mükafat: {prize}" if prize and prize not in ("0", "$0") else (tagline or "Devpost hackathon")

                results.append({
                    "title": title[:120],
                    "url": url,
                    "description": desc[:300],
                    "deadline": fmt_deadline(deadline_raw),
                    "trusted": True,
                })
            time.sleep(0.5)
        except Exception as e:
            print(f"[HACKATHON] Devpost '{query}' error: {e}", flush=True)

    print(f"[HACKATHON] Devpost AZ: {len(results)} nəticə", flush=True)
    return results


# ─── startupbaku.az ───────────────────────────────────────────────────────────

def scrape_startupbaku() -> list[dict]:
    results = []
    urls_to_try = [
        "https://startupbaku.az/events",
        "https://startupbaku.az/news",
        "https://startupbaku.az",
    ]
    seen = set()

    for page_url in urls_to_try:
        try:
            r = requests.get(page_url, headers=HEADERS, timeout=10)
            if r.status_code != 200:
                continue
            soup = BeautifulSoup(r.text, "html.parser")

            for a in soup.find_all("a", href=True):
                text = a.get_text(strip=True)
                href = a["href"]
                if not text or len(text) < 8:
                    continue
                if not any(kw in text.lower() for kw in AZ_KEYWORDS):
                    continue
                if href.startswith("/"):
                    href = "https://startupbaku.az" + href
                elif not href.startswith("http"):
                    continue
                if href in seen:
                    continue
                seen.add(href)

                results.append({
                    "title": text[:120],
                    "url": href,
                    "description": "startupbaku.az — Azərbaycan startap ekosistemi",
                    "deadline": "",
                    "trusted": True,
                })
        except Exception as e:
            print(f"[HACKATHON] startupbaku error: {e}", flush=True)

    print(f"[HACKATHON] Startupbaku: {len(results)} nəticə", flush=True)
    return results


# ─── innovation.gov.az / youth.gov.az ────────────────────────────────────────

GOV_PAGES = [
    ("https://innovation.gov.az/az/news", "innovation.gov.az"),
    ("https://youth.gov.az/az/events", "youth.gov.az"),
    ("https://ict.gov.az/az/news", "ict.gov.az"),
]


def scrape_gov_pages() -> list[dict]:
    results = []
    seen = set()

    for page_url, source in GOV_PAGES:
        try:
            r = requests.get(page_url, headers=HEADERS, timeout=10)
            if r.status_code != 200:
                print(f"[HACKATHON] {source} status: {r.status_code}", flush=True)
                continue
            soup = BeautifulSoup(r.text, "html.parser")

            for a in soup.find_all("a", href=True):
                text = a.get_text(strip=True)
                href = a["href"]
                if not text or len(text) < 8:
                    continue
                if not any(kw in text.lower() for kw in AZ_KEYWORDS):
                    continue

                domain = page_url.split("/az/")[0]
                if href.startswith("/"):
                    href = domain + href
                elif not href.startswith("http"):
                    continue
                if href in seen:
                    continue
                seen.add(href)

                results.append({
                    "title": text[:120],
                    "url": href,
                    "description": f"{source} — rəsmi elan",
                    "deadline": "",
                    "trusted": True,
                })
        except Exception as e:
            print(f"[HACKATHON] {source} error: {e}", flush=True)

    print(f"[HACKATHON] Gov pages: {len(results)} nəticə", flush=True)
    return results


# ─── ƏSAS ─────────────────────────────────────────────────────────────────────

def scrape_hackathons() -> list[dict]:
    seen: set[str] = set()
    all_items: list[dict] = []

    for item in scrape_devpost_az() + scrape_startupbaku() + scrape_gov_pages():
        if item["url"] not in seen:
            seen.add(item["url"])
            all_items.append(item)

    # Deadline-lı nəticələr öncə
    all_items.sort(key=lambda x: (
        not x["trusted"],
        x["deadline"] == "",
        x["title"].lower()
    ))

    print(f"[HACKATHON] Cəmi {len(all_items)} unikal nəticə", flush=True)
    return all_items
