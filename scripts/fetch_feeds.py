#!/usr/bin/env python3
"""Build data/feed-cache.json from the RSS feeds configured in data/feeds.json.

Runs daily via .github/workflows/rss-cache.yml. Feeds whose rssUrl still
contains PLACEHOLDER are skipped, so the cache stays empty (and the section
stays hidden on the Articles page) until real feed URLs are configured.
"""
import json
import sys
import time
from datetime import date
from pathlib import Path

import feedparser

ROOT = Path(__file__).resolve().parent.parent
FEEDS_FILE = ROOT / "data" / "feeds.json"
CACHE_FILE = ROOT / "data" / "feed-cache.json"


def main() -> int:
    config = json.loads(FEEDS_FILE.read_text(encoding="utf-8-sig"))
    max_items = int(config.get("maxItemsPerFeed", 5))
    items = []

    for feed in config.get("feeds", []):
        url = str(feed.get("rssUrl", "")).strip()
        if not url or "PLACEHOLDER" in url.upper():
            print(f"skip (placeholder): {feed.get('name')}")
            continue
        parsed = feedparser.parse(url)
        if parsed.bozo and not parsed.entries:
            print(f"warn: could not parse {url}", file=sys.stderr)
            continue
        for entry in parsed.entries[:max_items]:
            stamp = entry.get("published_parsed") or entry.get("updated_parsed")
            iso = time.strftime("%Y-%m-%d", stamp) if stamp else ""
            link = entry.get("link", "")
            title = entry.get("title", "").strip()
            if not link or not title:
                continue
            items.append({
                "source": feed.get("name", parsed.feed.get("title", "Feed")),
                "title": title,
                "url": link,
                "date": iso,
            })
        print(f"ok: {feed.get('name')} ({len(parsed.entries[:max_items])} items)")

    items.sort(key=lambda item: item["date"], reverse=True)
    cache = {"updated": date.today().isoformat() if items else None, "items": items}
    CACHE_FILE.write_text(json.dumps(cache, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {CACHE_FILE} with {len(items)} items")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
