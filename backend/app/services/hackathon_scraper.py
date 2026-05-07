"""
Hackathon scraper — Devpost JSON API + Hackathon.com API
HTML scraping işləmir (JS-rendered / Cloudflare).
"""
import re
import logging
from datetime import datetime

import requests

log = logging.getLogger(__name__)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36",
    "Accept": "application/json, text/html,*/*",
    "Accept-Language": "en-US,en;q=0.9",
}

TODAY = datetime.now()

MONTHS_EN = {
    "january": 1, "february": 2, "march": 3, "april": 4,
    "may": 5, "june": 6, "july": 7, "august": 8,
    "september": 9, "october": 10, "november": 11, "december": 12,
    "jan": 1, "feb": 2, "mar": 3, "apr": 4, "jun": 6,
    "jul": 7, "aug": 8, "sep": 9, "oct": 10, "nov": 11, "dec": 12,
}


def parse_deadline(text: str) -> datetime | None:
    if not text:
        return None
    text = text.strip()

    # ISO format: "2026-05-30T00:00:00.000Z"
    m = re.match(r"(\d{4})-(\d{2})-(\d{2})", text)
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

    return None


def is_expired(deadline_str: str) -> bool:
    dt = parse_deadline(deadline_str)
    if dt is None:
        return False
    return dt < TODAY


def scrape_devpost() -> list[dict]:
    """Devpost-un gizli JSON API-si."""
    results = []
    try:
        r = requests.get(
            "https://devpost.com/api/hackathons",
            params={
                "challenge_type": "online",
                "status": "open",
                "order_by": "deadline",
                "per_page": 20,
            },
            headers={**HEADERS, "Accept": "application/json"},
            timeout=15,
        )
        if r.status_code != 200:
            print(f"[HACKATHON] Devpost API status: {r.status_code}", flush=True)
            return []

        data = r.json()
        hackathons = data.get("hackathons", [])
        print(f"[HACKATHON] Devpost API returned {len(hackathons)} items", flush=True)

        for h in hackathons:
            title = h.get("title", "").strip()
            url = h.get("url", "")
            if not url.startswith("http"):
                url = "https://devpost.com" + url

            deadline_raw = h.get("submission_period_dates", "") or h.get("ends_at", "")
            prize = h.get("prize_amount", "") or ""
            desc = f"Mükafat: {prize}" if prize else h.get("tagline", "Beynəlxalq online hackathon")

            if is_expired(deadline_raw):
                continue

            dt = parse_deadline(deadline_raw)
            deadline_str = dt.strftime("%d.%m.%Y") if dt else deadline_raw[:50]

            results.append({
                "title": title[:120],
                "url": url,
                "description": str(desc)[:300],
                "deadline": deadline_str,
                "trusted": True,
            })

        print(f"[HACKATHON] Devpost active: {len(results)}", flush=True)
    except Exception as e:
        print(f"[HACKATHON] Devpost error: {e}", flush=True)
    return results


def scrape_hackathon_com() -> list[dict]:
    """hackathon.com açıq API."""
    results = []
    try:
        r = requests.get(
            "https://hackathon.com/api/v1/hackathons",
            params={"status": "open", "limit": 15},
            headers={**HEADERS, "Accept": "application/json"},
            timeout=12,
        )
        if r.status_code != 200:
            print(f"[HACKATHON] hackathon.com status: {r.status_code}", flush=True)
            return []

        data = r.json()
        items = data if isinstance(data, list) else data.get("data", data.get("hackathons", []))
        print(f"[HACKATHON] hackathon.com returned {len(items)} items", flush=True)

        for h in items:
            title = h.get("title") or h.get("name", "")
            url = h.get("url") or h.get("link", "")
            deadline_raw = h.get("deadline") or h.get("end_date", "")
            desc = h.get("description") or h.get("tagline", "")

            if not title or not url:
                continue
            if is_expired(deadline_raw):
                continue

            dt = parse_deadline(deadline_raw)
            deadline_str = dt.strftime("%d.%m.%Y") if dt else deadline_raw[:50]

            results.append({
                "title": str(title)[:120],
                "url": str(url),
                "description": str(desc)[:300],
                "deadline": deadline_str,
                "trusted": True,
            })

        print(f"[HACKATHON] hackathon.com active: {len(results)}", flush=True)
    except Exception as e:
        print(f"[HACKATHON] hackathon.com error: {e}", flush=True)
    return results


def scrape_hackathons() -> list[dict]:
    seen: set[str] = set()
    all_items: list[dict] = []

    for item in scrape_devpost() + scrape_hackathon_com():
        if item["url"] not in seen:
            seen.add(item["url"])
            all_items.append(item)

    all_items.sort(key=lambda x: (not x["trusted"], x["title"].lower()))
    print(f"[HACKATHON] Cəmi {len(all_items)} unikal nəticə", flush=True)
    return all_items
