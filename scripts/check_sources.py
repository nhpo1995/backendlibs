"""Check public reference links and record evidence; never access private video links."""
import concurrent.futures
import datetime
import json
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen

from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]


def check(url):
    try:
        with urlopen(Request(url, headers={"User-Agent": "BackendCurriculumSourceCheck/1.0"}), timeout=25) as response:
            prefix = response.read(100_000).decode("utf-8", errors="replace")
            title = BeautifulSoup(prefix, "html.parser").title
            return dict(url=url, status=response.status, resolved=response.url, title=title.get_text(" ", strip=True) if title else None)
    except HTTPError as error:
        return dict(url=url, status=error.code, error=str(error))
    except Exception as error:
        return dict(url=url, status=None, error=str(error))


def main():
    urls = set()
    for path in (ROOT / "lessons/springboot").glob("*/index.html"):
        soup = BeautifulSoup(path.read_text(encoding="utf-8"), "html.parser")
        refs = soup.select_one("#nguon-chinh-thuc")
        if refs:
            urls.update(a["href"] for a in refs.select('a[href^="https://"]'))
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        results = list(pool.map(check, sorted(urls)))
    report = dict(checked_at_utc=datetime.datetime.now(datetime.timezone.utc).isoformat(),
                  scope="Public reference availability and titles; not a claim that every example was executed", sources=results)
    dest = ROOT / "docs/verification"
    dest.mkdir(parents=True, exist_ok=True)
    (dest / "spring-sources-2026-11-19.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    failed = [item for item in results if item.get("status") != 200]
    print(f"Sources: {len(results) - len(failed)}/{len(results)} returned HTTP 200.")
    for item in failed:
        print(json.dumps(item, ensure_ascii=False))
    raise SystemExit(1 if failed else 0)


if __name__ == "__main__":
    main()
