"""Export the verified authored content, keeping article HTML separate from UI."""
import json
from pathlib import Path
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / "frontend/generated"


def main():
    course = json.loads((ROOT / "content/springboot/course.json").read_text(encoding="utf-8"))
    simulations = json.loads((ROOT / "content/springboot/simulations.json").read_text(encoding="utf-8"))
    custom_simulations = {"bean-validation", "security-authorization"}
    expected = {lesson["slug"] for lesson in course["lessons"]} - custom_simulations
    if set(simulations) != expected:
        raise ValueError(f"Mismatched lesson simulations: {sorted(set(simulations) ^ expected)}")
    DEST.mkdir(parents=True, exist_ok=True)
    (DEST / "lessons").mkdir(exist_ok=True)
    (DEST / "course.json").write_text(json.dumps(course, ensure_ascii=False), encoding="utf-8")
    for lesson in course["lessons"]:
        soup = BeautifulSoup((ROOT / f"lessons/springboot/{lesson['slug']}/index.html").read_text(encoding="utf-8"), "html.parser")
        main = soup.select_one("main#noi-dung")
        intro = main.select_one(".intro").extract()
        refs = main.select_one("#nguon-chinh-thuc").extract()
        video = main.select_one("#moc-video")
        if video: video.extract()
        toc = [{"id": a["href"][1:], "title": a.get_text(" ", strip=True)} for a in soup.select(".sidebar a[href^='#']")]
        for node in list(main.select("#bai-tap-code, #kiem-tra-nang-luc, .completion, .lesson-navigation")):
            node.decompose()
        data = dict(bodyHtml=main.decode_contents(), introHtml=str(intro), referencesHtml=str(refs), videoHtml=str(video) if video else "", toc=toc)
        if lesson["slug"] in simulations:
            data["simulation"] = simulations[lesson["slug"]]
        (DEST / "lessons" / f"{lesson['slug']}.json").write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
    practice_dir = DEST / "practice"
    practice_dir.mkdir(exist_ok=True)
    for slug in ("spring-foundations", "reference-directory"):
        soup = BeautifulSoup((ROOT / "practice" / slug / "index.html").read_text(encoding="utf-8"), "html.parser")
        data = dict(html=soup.select_one("main").decode_contents(), title=soup.h1.get_text(" ", strip=True))
        (practice_dir / f"{slug}.json").write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
    print(f"Exported React data: {len(course['lessons'])} lessons and 2 practice pages.")


if __name__ == "__main__":
    main()
