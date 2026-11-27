"""Fetch pinned upstream Prism sources, keep license, require explicit invocation."""
from pathlib import Path
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / "assets/vendor/prism"
BASE = "https://raw.githubusercontent.com/PrismJS/prism/v1.30.0/"


def read(path):
    with urlopen(BASE + path, timeout=30) as response:
        return response.read().decode("utf-8")


def main():
    DEST.mkdir(parents=True, exist_ok=True)
    parts = ["/* Prism 1.30.0, MIT license, see LICENSE. Local bundle, no CDN. */\nwindow.Prism = { manual: true };\n"]
    for component in ["core", "markup", "clike", "java", "sql", "json", "yaml", "powershell", "bash", "properties", "http"]:
        parts.append(read(f"components/prism-{component}.min.js"))
    (DEST / "prism.js").write_text("\n".join(parts), encoding="utf-8")
    (DEST / "prism.css").write_text(read("themes/prism-tomorrow.css"), encoding="utf-8")
    (DEST / "LICENSE").write_text(read("LICENSE"), encoding="utf-8")
    (DEST / "README.md").write_text("# Prism 1.30.0\n\nSource: https://github.com/PrismJS/prism/tree/v1.30.0\n\nMIT license in LICENSE. Rebuild only with `python scripts/vendor_prism.py`; normal site builds use the committed local files.\n\nCore + markup, clike, java, sql, json, yaml, powershell, bash, properties, http. Theme: Tomorrow.\n", encoding="utf-8")
    print("Vendored Prism 1.30.0, languages, theme and license.")


if __name__ == "__main__":
    main()
