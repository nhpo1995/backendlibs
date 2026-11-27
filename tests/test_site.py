"""Contract checks for the actual published pages, not a mock renderer."""
import json
import hashlib
import subprocess
import sys
import unittest
from pathlib import Path
from urllib.parse import unquote, urlsplit
from zipfile import ZipFile

from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]


class CurriculumTest(unittest.TestCase):
    def test_course_is_organized_by_knowledge(self):
        course = json.loads((ROOT / "content/springboot/course.json").read_text(encoding="utf-8"))
        self.assertGreaterEqual(len(course["modules"]), 7)
        self.assertGreaterEqual(len(course["lessons"]), 28)
        self.assertFalse(any("buoi" in lesson["slug"] for lesson in course["lessons"]))
        for lesson in course["lessons"]:
            page = ROOT / "lessons/springboot" / lesson["slug"] / "index.html"
            with self.subTest(lesson=lesson["slug"]):
                soup = BeautifulSoup(page.read_text(encoding="utf-8"), "html.parser")
                self.assertEqual(soup.h1.get_text(" ", strip=True), lesson["title"])
                self.assertIsNotNone(soup.select_one("[data-editor]"))
                self.assertIsNotNone(soup.select_one("[data-quiz]"))
                self.assertIsNotNone(soup.select_one("#bai-tap-code"))
                self.assertIsNotNone(soup.select_one("#nguon-chinh-thuc a[href^='https://']"))
                self.assertNotIn("Video", soup.select_one(".hero").get_text())
                for code in soup.select("pre code"):
                    self.assertTrue(any(c.startswith("language-") for c in code.get("class", [])))

    def test_all_local_links_and_fragments(self):
        pages = [ROOT / "index.html", *sorted((ROOT / "lessons/springboot").glob("*/index.html")), ROOT / "lessons/springboot/index.html", *sorted((ROOT / "practice").glob("*/index.html"))]
        cache = {}
        for page in pages:
            soup = BeautifulSoup(page.read_text(encoding="utf-8"), "html.parser")
            ids = [node["id"] for node in soup.select("[id]")]
            self.assertEqual(len(ids), len(set(ids)), f"duplicate ids: {page}")
            for node in soup.select("a[href], script[src], link[href]"):
                url = urlsplit(node.get("href", node.get("src", "")))
                if url.scheme or url.netloc:
                    continue
                target = (page.parent / unquote(url.path)).resolve() if url.path else page
                with self.subTest(page=page.relative_to(ROOT), link=node.get("href", node.get("src"))):
                    self.assertTrue(target.exists(), f"missing: {target}")
                    if url.fragment and target.suffix == ".html" and target.exists():
                        if target not in cache:
                            cache[target] = BeautifulSoup(target.read_text(encoding="utf-8"), "html.parser")
                        self.assertIsNotNone(cache[target].find(id=unquote(url.fragment)), f"missing #{url.fragment} in {target}")

    def test_alias_video_links_stay_with_their_actual_source(self):
        soup = BeautifulSoup((ROOT / "lessons/springboot/buoi-06/index.html").read_text(encoding="utf-8"), "html.parser")
        self.assertEqual(soup.select_one("#moc-video a")["href"], "../dto-contracts/index.html#moc-video")
        for old, canonical in json.loads((ROOT / "content/springboot/course.json").read_text(encoding="utf-8"))["aliases"].items():
            original = subprocess.check_output(["git", "show", f"HEAD:lessons/springboot/{old}/index.html"], cwd=ROOT, encoding="utf-8")
            before = {a["href"] for a in BeautifulSoup(original, "html.parser").select("a[href]") if "drive.google.com/file/" in a["href"]}
            current = BeautifulSoup((ROOT / f"lessons/springboot/{canonical}/index.html").read_text(encoding="utf-8"), "html.parser")
            after = {a["href"] for a in current.select("a[href]")}
            self.assertTrue(before <= after, f"lost optional video pointers: {old}: {before - after}")

    def test_build_is_repeatable_without_changing_output(self):
        paths = [ROOT / "index.html", *sorted((ROOT / "lessons").rglob("index.html")), *sorted((ROOT / "practice").glob("*/index.html"))]
        before = {p: hashlib.sha256(p.read_bytes()).digest() for p in paths}
        subprocess.run([sys.executable, "scripts/build_site.py"], cwd=ROOT, check=True, capture_output=True)
        self.assertEqual(before, {p: hashlib.sha256(p.read_bytes()).digest() for p in paths})

    def test_downloads_have_source_and_identical_acceptance_tests(self):
        with ZipFile(ROOT / "practice/spring-foundations/downloads/spring-foundations-starter.zip") as starter, ZipFile(ROOT / "practice/spring-foundations/downloads/spring-foundations-solution.zip") as solution:
            for archive in [starter, solution]:
                self.assertTrue(any(name.endswith("pom.xml") for name in archive.namelist()))
                self.assertFalse(any("/target/" in name for name in archive.namelist()))
            for path in (ROOT / "practice/spring-foundations/solution/src/test").rglob("*.java"):
                relative = path.relative_to(ROOT / "practice/spring-foundations/solution").as_posix()
                self.assertEqual(starter.read("spring-foundations-starter/" + relative), solution.read("spring-foundations-solution/" + relative))

    def test_react_export_preserves_article_code_references_and_anchors(self):
        course = json.loads((ROOT / "content/springboot/course.json").read_text(encoding="utf-8"))
        for lesson in course["lessons"]:
            with self.subTest(lesson=lesson["slug"]):
                original = BeautifulSoup((ROOT / f"lessons/springboot/{lesson['slug']}/index.html").read_text(encoding="utf-8"), "html.parser").select_one("main")
                for generated_ui in list(original.select("#bai-tap-code, #kiem-tra-nang-luc, .completion, .lesson-navigation")):
                    generated_ui.decompose()
                data = json.loads((ROOT / f"frontend/generated/lessons/{lesson['slug']}.json").read_text(encoding="utf-8"))
                exported = BeautifulSoup(data["introHtml"] + data["bodyHtml"] + data["referencesHtml"] + data["videoHtml"], "html.parser")
                self.assertCountEqual([code.get_text() for code in original.select("pre code")], [code.get_text() for code in exported.select("pre code")])
                self.assertEqual({a["href"] for a in original.select("a[href^='https://']")}, {a["href"] for a in exported.select("a[href^='https://']")})
                self.assertEqual({node["id"] for node in original.select("[id]")}, {node["id"] for node in exported.select("[id]")})


if __name__ == "__main__":
    unittest.main()
