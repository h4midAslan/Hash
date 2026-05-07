"""
Azərbaycan hackathon/yarış scraper servisi.
DuckDuckGo HTML axtarışından istifadə edir — API açarı tələb etmir.
"""
import re
import time
import logging
from urllib.parse import unquote, urlparse, parse_qs

import requests
from bs4 import BeautifulSoup

log = logging.getLogger(__name__)

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
    )
}

SEARCH_QUERIES = [
    "hackathon Azerbaijan 2026",
    "Azərbaycan hackathon 2026",
    "Baku hackathon 2026",
    "Azerbaijan startup competition 2026",
    "Azərbaycan tələbə müsabiqəsi 2026",
    "Azerbaijan coding competition students 2026",
    "Azerbaijan innovation challenge 2026",
    "Baku Tech Week 2026",
]

TRUSTED_DOMAINS = [
    "asan.gov.az", "dtx.gov.az", "startupbaku.az", "startup.az",
    "ada.edu.az", "bsu.edu.az", "aztu.edu.az", "inha.edu.az",
    "azertag.az", "report.az", "renewables.az", "bakues.az",
    "youth.gov.az", "innovation.gov.az", "fondera.az", "edumap.az",
    "hackathon.com", "mlh.io", "gdg.community.dev", "linkedin.com",
]

RELEVANCE_KEYWORDS = [
    "hackathon", "yarış", "müsabiqə", "competition", "challenge",
    "startup", "innovation", "grant", "mükafat", "prize",
    "tələbə", "student", "apply", "qeydiyyat", "registration",
    "bootcamp", "ideathon", "datathon", "olympiad",
]

DATE_PATTERN = re.compile(
    r"\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{4}[\/\-\.]\d{2}[\/\-\.]\d{2}|"
    r"(?:January|February|March|April|May|June|July|August|September|October|November|December"
    r"|Yanvar|Fevral|Mart|Aprel|May|İyun|İyul|Avqust|Sentyabr|Oktyabr|Noyabr|Dekabr)"
    r"\s+\d{1,2},?\s*\d{4})\b",
    re.IGNORECASE,
)


def _ddg_search(query: str, max_results: int = 7) -> list[str]:
    urls = []
    try:
        r = requests.get(
            "https://html.duckduckgo.com/html/",
            params={"q": query, "kl": "az-az", "kp": "-1"},
            headers=HEADERS,
            timeout=10,
        )
        soup = BeautifulSoup(r.text, "lxml")
        for a in soup.select("a.result__a")[:max_results]:
            href = a.get("href", "")
            if "uddg=" in href:
                parsed = urlparse(href)
                href = unquote(parse_qs(parsed.query).get("uddg", [""])[0])
            if href.startswith("http"):
                urls.append(href)
    except Exception as e:
        log.warning(f"DDG search error for '{query}': {e}")
    return urls


def _fetch_meta(url: str) -> dict | None:
    try:
        r = requests.get(url, headers=HEADERS, timeout=8)
        r.raise_for_status()
        soup = BeautifulSoup(r.text, "lxml")

        title_tag = (
            soup.find("meta", property="og:title")
            or soup.find("meta", {"name": "title"})
            or soup.find("title")
        )
        title = (
            title_tag.get("content", "") if hasattr(title_tag, "get") else title_tag.get_text()
        ).strip() if title_tag else ""

        desc_tag = (
            soup.find("meta", property="og:description")
            or soup.find("meta", {"name": "description"})
        )
        desc = desc_tag.get("content", "").strip() if desc_tag else ""

        body = soup.get_text(" ", strip=True)[:2000]
        dates = DATE_PATTERN.findall(body)
        deadline = dates[0][0] if dates else ""

        return {"title": title[:120], "description": desc[:300], "deadline": deadline}
    except Exception as e:
        log.debug(f"Fetch failed {url}: {e}")
        return None


def _is_relevant(title: str, desc: str) -> bool:
    combined = (title + " " + desc).lower()
    return any(kw in combined for kw in RELEVANCE_KEYWORDS)


def _is_trusted(url: str) -> bool:
    return any(domain in url for domain in TRUSTED_DOMAINS)


def scrape_hackathons() -> list[dict]:
    """
    DuckDuckGo-dan Azərbaycan hackathon/yarışlarını topla.
    Returns list of dicts: {title, url, description, deadline, trusted}
    """
    seen: set[str] = set()
    results: list[dict] = []

    for query in SEARCH_QUERIES:
        log.info(f"Scraping: {query}")
        urls = _ddg_search(query)
        time.sleep(2)

        for url in urls:
            if url in seen:
                continue
            seen.add(url)

            meta = _fetch_meta(url)
            if not meta:
                continue
            if not _is_relevant(meta["title"], meta.get("description", "")):
                continue

            results.append({
                "title":       meta["title"] or url[:80],
                "url":         url,
                "description": meta.get("description", ""),
                "deadline":    meta.get("deadline", ""),
                "trusted":     _is_trusted(url),
            })
            log.info(f"  + {results[-1]['title'][:60]}")

        time.sleep(2)

    results.sort(key=lambda x: (not x["trusted"], x["title"]))
    return results
