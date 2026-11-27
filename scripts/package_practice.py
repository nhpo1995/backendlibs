"""Deterministic source ZIPs; never package target, secrets or local IDE files."""
from pathlib import Path
import sys
from zipfile import ZipFile, ZipInfo, ZIP_DEFLATED

ROOT = Path(__file__).resolve().parents[1]
PRACTICE = ROOT / "practice/spring-foundations"

def package_lesson_lab(name):
    project = ROOT / "practice" / name
    dest = project / "downloads"
    dest.mkdir(exist_ok=True)
    files = [project / "pom.xml", project / "README.md", *sorted((project / "src").rglob("*.java"))]
    with ZipFile(dest / f"{name}.zip", "w") as archive:
        for file in files:
            info = ZipInfo(f"{name}/" + file.relative_to(project).as_posix(), (2026, 11, 20, 0, 0, 0))
            info.compress_type = ZIP_DEFLATED
            archive.writestr(info, file.read_bytes())
    print(f"Packaged {name} Maven lab.")

def package_demo_bundle():
    dest = ROOT / "practice/spring-demo-bundle/downloads"
    dest.mkdir(parents=True, exist_ok=True)
    projects = [
        *(ROOT / f"lessons/springboot/buoi-{number:02}/demo" for number in (1, 2, 6, 7, 8, 17)),
        *(PRACTICE / kind for kind in ("starter", "solution")),
    ]
    with ZipFile(dest / "spring-demo-bundle.zip", "w", compression=ZIP_DEFLATED) as archive:
        for project in projects:
            files = [project / name for name in ("pom.xml", "README.md", "verify.py")]
            files += sorted((project / "src").rglob("*"))
            for file in files:
                if file.is_file() and file.suffix in {".xml", ".md", ".py", ".java", ".sql", ".properties", ".yaml", ".yml", ".html", ".css", ".js", ".json"}:
                    info = ZipInfo("spring-demo-bundle/" + file.relative_to(ROOT).as_posix(), (2026, 11, 20, 0, 0, 0))
                    info.compress_type = ZIP_DEFLATED
                    archive.writestr(info, file.read_bytes())
    print("Packaged Spring demo projects with their lesson paths.")


def main():
    dest = PRACTICE / "downloads"
    dest.mkdir(exist_ok=True)
    for kind in ("starter", "solution"):
        project = PRACTICE / kind
        files = [project / "pom.xml", *sorted((project / "src").rglob("*"))]
        with ZipFile(dest / f"spring-foundations-{kind}.zip", "w", compression=ZIP_DEFLATED) as archive:
            for file in files:
                if not file.is_file():
                    continue
                info = ZipInfo(f"spring-foundations-{kind}/" + file.relative_to(project).as_posix(), (2026, 11, 19, 0, 0, 0))
                info.compress_type = ZIP_DEFLATED
                archive.writestr(info, file.read_bytes())
            info = ZipInfo(f"spring-foundations-{kind}/README.md", (2026, 11, 19, 0, 0, 0))
            info.compress_type = ZIP_DEFLATED
            archive.writestr(info, (PRACTICE / "README.md").read_bytes())
        print(f"Packaged {kind} source ZIP.")


if __name__ == "__main__":
    if "--lesson-labs-only" not in sys.argv:
        main()
    for name in ("spring-core-lab", "spring-advanced-lab"):
        package_lesson_lab(name)
    package_demo_bundle()
