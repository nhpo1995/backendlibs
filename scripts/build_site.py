"""Build static pages from authored HTML. No runtime fetch or client routing."""
import html
import json
import re
import unicodedata
from pathlib import Path

from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
CONTENT = ROOT / "content/springboot"


def esc(value):
    return html.escape(str(value), quote=True)


def fragment(value):
    value = unicodedata.normalize("NFKD", value.lower().replace("đ", "d"))
    value = "".join(c for c in value if not unicodedata.combining(c))
    return re.sub(r"[^a-z0-9]+", "-", value).strip("-")


def language(code):
    text = code.get_text()
    figure = code.find_parent("figure")
    caption = figure.find("figcaption").get_text().lower() if figure and figure.find("figcaption") else ""
    if re.search(r"powershell|terminal|cửa sổ|curl|mvn|java -jar", caption) or re.search(r"(?m)^\$[a-zA-Z]|^curl\.exe|^mvn |^Set-Location|^Invoke-RestMethod", text):
        return "powershell"
    if "sql" in caption and "jpql" not in caption and not re.search(r"@Query|interface ", text):
        return "sql"
    if re.search(r"(?mi)^\s*(SELECT |CREATE TABLE|CREATE DATABASE|INSERT INTO|UPDATE \w+ SET|DELETE FROM|ALTER TABLE|USE )", text) and not re.search(r"@Query|JdbcTemplate|class |db\.", text):
        return "sql"
    if text.lstrip().startswith("<"):
        return "markup"
    if "yaml" in caption or "yml" in caption or re.match(r"(?:spring|server):", text):
        return "yaml"
    if "properties" in caption or re.match(r"(?:spring|logging|server)\.[\w.]+=", text):
        return "properties"
    if text.lstrip().startswith(("{", "[")) and not re.search(r"class |@", text):
        try:
            json.loads(text)
            return "json"
        except ValueError:
            pass
    if re.match(r"(?:GET|POST|PUT|DELETE|HTTP/) ", text):
        return "http"
    if re.search(r"\bclass\b|\binterface\b|\brecord\b|@\w|\breturn\b|\bpublic\b|\bimport\b|\bvar\b", text):
        return "java"
    return "none"


def head(title, description, prefix):
    return f'''<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="{esc(description)}"><title>{esc(title)} · Backend Service</title>
<link rel="stylesheet" href="{prefix}assets/styles.css">
<link rel="stylesheet" href="{prefix}assets/vendor/prism/prism.css">
<script src="{prefix}assets/vendor/prism/prism.js" defer></script>
<script src="{prefix}assets/vendor/codemirror/editor.js" defer></script>
<script src="{prefix}assets/site.js" defer></script></head><body id="top">
<a class="skip" href="#noi-dung">Đến nội dung</a>
<header class="masthead"><div class="mast-inner"><a class="brand" href="{prefix}index.html"><span class="mark" aria-hidden="true">B</span> Backend Service</a><a class="source" href="{prefix}lessons/springboot/index.html">Lộ trình Spring ↗</a></div></header>'''


def editor(lesson):
    lab = lesson["lab"]
    slug = lesson["slug"]
    lang = lab["language"]
    filename = "application.yaml" if lang == "yaml" else lab["filename"]
    return f'''<section class="chapter coding-lab" id="bai-tap-code"><p class="eyebrow">Tự viết trước khi xem lời giải</p>
<h2>Bài tập lập trình</h2><p>{esc(lab['goal'])}</p>
<p class="exercise-instructions"><strong>Cách sửa starter:</strong> {esc(lab.get('instructions', 'Thay TODO bằng implementation phù hợp, giữ phần khung cần thiết.'))}</p>
<p><strong>Tiêu chí kiểm chứng:</strong> {esc(lab['expected'])}</p>
<p>Đoạn dưới là bài tập ngắn; các kiểu và phương thức liên quan cần nằm trong project của bài. Editor cho sửa, lưu nháp và tải file; <strong>không biên dịch hoặc chạy Java/Spring</strong>. Chạy test thật ở local theo hướng dẫn project.</p>
<div class="editor" data-editor data-lesson="{esc(slug)}" data-version="1" data-language="{esc(lang)}" data-filename="{esc(filename)}">
<label for="editor-{esc(slug)}">Mã của bạn · {esc(filename)}</label>
<textarea id="editor-{esc(slug)}" spellcheck="false" autocapitalize="off" autocomplete="off" rows="10">{esc(lab['starter'])}</textarea>
<div class="editor-actions"><button type="button" data-action="save">Lưu nháp</button><button type="button" data-action="download">Tải mã</button><button type="button" data-action="reset">Khôi phục starter</button></div>
<p class="editor-status" role="status" aria-live="polite">Nháp tự lưu khi trình duyệt cho phép. Không nhập mật khẩu hoặc token thật.</p>
<template data-starter>{esc(lab['starter'])}</template>
</div>
<details class="hint"><summary>Gợi ý cách làm và tự kiểm tra</summary><p>Viết ra dữ liệu ban đầu, request/lời gọi và trạng thái cuối. Làm trường hợp đúng trước rồi thêm trường hợp lỗi. Tại mỗi bước, đối chiếu cơ chế trong bài; không chỉ sửa cho hết báo lỗi.</p><p>{esc(lab['expected'])}</p></details>
<details class="solution"><summary>Lời giải tham khảo · mở sau khi tự làm</summary><p>Đây là hướng giải cho đoạn ngắn, không thay thế implementation và kiểm thử đầy đủ trong project.</p><figure class="snippet"><figcaption>{esc(filename)} · tham khảo</figcaption><pre tabindex="0"><code class="language-{esc(lang)}">{esc(lab['solution'])}</code></pre></figure></details>
<p class="practice-link"><a href="../../../practice/spring-foundations/index.html">Starter Maven, đề theo mốc và bộ kiểm thử chạy local →</a></p></section>'''


def quiz(lesson):
    q = lesson["quiz"]
    cases = "".join(
        f'<section class="understanding-case"><h3>{esc(item["title"])}</h3><p>{esc(item["prompt"])}</p>'
        f'<details class="question"><summary>Mở đáp án và tiêu chí</summary><p>{esc(item["answer"])}</p>'
        f'<p><strong>Tự đánh giá.</strong> {esc(item["criterion"])}</p></details></section>'
        for item in lesson["understanding"]
    )
    options = "".join(f'<label><input type="radio" name="quiz-{esc(lesson["slug"])}" value="{i}"> <span>{esc(answer)}</span></label>' for i, answer in enumerate(q["answers"]))
    return f'''<section class="chapter" id="kiem-tra-nang-luc"><h2>Kiểm tra cách hiểu</h2>
<p>Trước khi mở đáp án, hãy ghi dự đoán, lý do và dấu hiệu bạn sẽ dùng để kiểm chứng.</p>
<div class="understanding-cases">{cases}</div>
<details class="quick-quiz"><summary>Ôn nhanh bằng trắc nghiệm</summary>
<form class="quiz" data-quiz data-correct="{q['correct']}"><fieldset><legend>{esc(q['question'])}</legend>{options}</fieldset><button type="submit">Kiểm tra đáp án</button><p role="status" aria-live="polite" data-feedback></p><template data-explanation>{esc(q['explanation'])}</template></form></details>
<details><summary>Xem giải thích khi không dùng JavaScript</summary><p><strong>{esc(q['answers'][q['correct']])}.</strong> {esc(q['explanation'])}</p></details></section>'''


def render_lesson(lesson, course, number):
    slug = lesson["slug"]
    soup = BeautifulSoup((CONTENT / f"{slug}.html").read_text(encoding="utf-8"), "html.parser")
    extension = CONTENT / "extensions" / f"{slug}.html"
    if extension.exists():
        soup.append(BeautifulSoup(extension.read_text(encoding="utf-8"), "html.parser"))
    # Keep the directory structure in the ZIP so commands in the lessons are copyable.
    if re.search(r"(?:buoi-\d{2}/demo|practice/spring-foundations/(?:starter|solution))", str(soup)):
        downloads = BeautifulSoup(
            '<aside class="callout"><strong>Chạy các ví dụ trên máy</strong>'
            '<p><a download href="../../../practice/spring-demo-bundle/downloads/spring-demo-bundle.zip">Tải bộ demo Maven (.zip)</a>. '
            'Giải nén và dùng thư mục <code>spring-demo-bundle</code> chứa <code>lessons</code> và <code>practice</code> '
            'làm thư mục gốc cho các lệnh trong bài. Khi bài yêu cầu vào thư mục demo, mở thư mục chứa <code>pom.xml</code> của demo đó.</p></aside>',
            "html.parser",
        )
        first = soup.find("section")
        if first:
            first.insert_after(downloads.aside)
    for intro in soup.select(".intro"):
        intro.decompose()
    for section in soup.find_all("section", recursive=False):
        section["class"] = list(dict.fromkeys([*section.get("class", []), "chapter"]))
    # Official sources remain accessible without opening video archives.
    if not soup.select_one("#nguon-chinh-thuc"):
        links = {}
        for link in soup.select("a[href^='https://']"):
            if "drive.google.com" not in link["href"]:
                links[link["href"]] = link.get_text(" ", strip=True)
        refs = soup.new_tag("section", id="nguon-chinh-thuc")
        refs.append(BeautifulSoup('<h2>Nguồn chính thức và tài liệu đối chiếu</h2><ul>' + "".join(f'<li><a href="{esc(url)}">{esc(title)}</a></li>' for url, title in links.items()) + '</ul>', "html.parser"))
        soup.append(refs)
    video = soup.select_one("#moc-video")
    # Some historical pages placed their root video URL in a footer, not the archive.
    # Keep those pointers when replacing the footer with the official bibliography.
    outside_video = [a for a in soup.select("a[href]") if "drive.google.com/file/" in a["href"] and not a.find_parent(id="moc-video")]
    if outside_video:
        if video is None:
            video = soup.new_tag("section", id="moc-video")
            soup.append(video)
        details = video.find("details")
        if details is None:
            details = soup.new_tag("details", attrs={"class": "video-reference"})
            summary = soup.new_tag("summary")
            summary.string = "Nguồn video · xem lại tùy chọn"
            details.append(summary)
            video.append(details)
        existing = {a["href"] for a in video.select("a[href]")}
        pointers = soup.new_tag("ul")
        for link in outside_video:
            if link["href"] in existing:
                continue
            item = soup.new_tag("li")
            item.append(BeautifulSoup(str(link), "html.parser"))
            pointers.append(item)
            existing.add(link["href"])
        if pointers.contents:
            details.append(pointers)
    if video:
        video.extract()
    for footer in list(soup.select("footer.references")):
        # Its useful references have already been collected above.
        footer.decompose()
    for old_nav in list(soup.select(".lesson-nav")):
        old_nav.decompose()
    for code in soup.select("pre code"):
        if not any(c.startswith("language-") for c in code.get("class", [])):
            code["class"] = [f"language-{language(code)}"]
        code.parent["tabindex"] = "0"
    used = {node["id"] for node in soup.select("[id]")}
    toc = []
    for i, heading in enumerate(soup.select("h2")):
        section = heading.find_parent(["section", "footer"])
        target = section if section and section.get("id") else heading
        if not target.get("id"):
            ident = fragment(heading.get_text()) or f"section-{i}"
            while ident in used:
                ident += "-more"
            target["id"] = ident
            used.add(ident)
        if target["id"] != "nguon-chinh-thuc":
            toc.append((target["id"], heading.get_text(" ", strip=True)))
    refs = soup.select_one("#nguon-chinh-thuc").extract()
    module = next(m for m in course["modules"] if m["id"] == lesson["module"])
    steps = f'<li><b>Hiểu cơ chế</b><span>{esc(module["title"])}</span></li><li><b>Thử và giải thích</b><span>Đọc code, dự đoán và kiểm tra giả thuyết</span></li><li><b>Tự triển khai</b><span>Viết code và kiểm chứng ở project</span></li>'
    hero = f'''<div class="hero"><div class="hero-inner"><div><nav class="crumbs" aria-label="Vị trí hiện tại"><a href="../../../index.html">Trang chủ</a> / <a href="../index.html#{esc(module['id'])}">{esc(module['title'])}</a></nav><p class="kicker">Bài {number + 1:02d} / {len(course['lessons'])} · {esc(module['title'])}</p><h1>{esc(lesson['title'])}</h1><p class="lead">{esc(lesson['summary'])}</p><div class="hero-actions"><a class="button" href="#noi-dung">Đọc bài ↓</a><a class="button secondary" href="#bai-tap-code">Tự viết code</a></div></div><div class="flow"><div class="flow-head">Lộ trình trong bài</div><div class="flow-body"><ol>{steps}</ol></div></div></div></div>'''
    toc += [("bai-tap-code", "Bài tập lập trình"), ("kiem-tra-nang-luc", "Kiểm tra cách hiểu"), ("nguon-chinh-thuc", "Nguồn chính thức")]
    nav = '<aside class="sidebar"><nav aria-label="Mục lục bài học"><h2>Nội dung bài học</h2><ol>' + "".join(f'<li><a href="#{esc(ident)}">{esc(title)}</a></li>' for ident,title in toc) + '</ol></nav></aside>'
    previous = course["lessons"][number - 1] if number else None
    following = course["lessons"][number + 1] if number + 1 < len(course["lessons"]) else None
    progression = '<nav class="lesson-navigation" aria-label="Chuyển bài">'
    if previous:
        progression += f'<a href="../{esc(previous["slug"])}/index.html">← {esc(previous["title"])}</a>'
    if following:
        progression += f'<a href="../{esc(following["slug"])}/index.html">{esc(following["title"])} →</a>'
    progression += '</nav>'
    intro = f'<div class="callout intro"><strong>Mục tiêu và điều kiện học</strong><p>{esc(lesson["lab"]["goal"])}</p><p><strong>Cần biết trước:</strong> {esc(lesson["prerequisites"])}. Các bài ứng dụng có thể cần đọc trước phần dữ liệu tương ứng; dùng <a href="../index.html">lộ trình</a> để chọn kiến thức còn thiếu.</p><p class="version-note">Baseline: {esc(course["baseline"])}. Mỗi demo có hướng dẫn riêng; ví dụ H2 không chứng minh hành vi trên DB khác.</p></div>'
    completion = f'<div class="completion"><label><input type="checkbox" data-complete="{esc(slug)}"> Tôi đã tự làm bài tập và giải thích được kết quả</label><p>Đánh dấu để tự theo dõi trên trình duyệt này; đây không phải chứng nhận hay kết quả chấm code.</p><p role="status" data-progress-status aria-live="polite"></p></div>'
    body = head(lesson["title"], lesson["summary"], "../../../") + hero + '<div class="layout">' + nav + '<main id="noi-dung" tabindex="-1">' + intro + str(soup) + editor(lesson) + quiz(lesson) + str(refs) + (str(video) if video else "") + completion + progression + '<p><a href="#top">Về đầu trang ↑</a></p></main></div></body></html>\n'
    path = ROOT / "lessons/springboot" / slug / "index.html"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(body, encoding="utf-8")


def render_catalog(course):
    sections = []
    for module in course["modules"]:
        cards = []
        for i, lesson in enumerate(course["lessons"]):
            if lesson["module"] != module["id"]:
                continue
            cards.append(f'<a class="course-card lesson-card" data-lesson-card data-slug="{esc(lesson["slug"])}" href="{esc(lesson["slug"])}/index.html"><span class="lesson-number">{i + 1:02d}</span><span><strong>{esc(lesson["title"])}</strong><span>{esc(lesson["summary"])}</span><small>{esc(lesson["prerequisites"])}</small></span><span class="lesson-state" aria-label="Chưa đánh dấu">○</span></a>')
        sections.append(f'<section class="module" id="{esc(module["id"])}" data-module><p class="eyebrow">{len(cards)} bài · lý thuyết và thực hành</p><h2>{esc(module["title"])}</h2><p>{esc(module["summary"])}</p>{"".join(cards)}</section>')
    module_nav = "".join(f'<a href="#{esc(m["id"])}">{esc(m["title"])}</a>' for m in course["modules"])
    body = head(course["title"], "Giáo trình Spring theo cơ chế, có bài tập lập trình và kiểm chứng kết quả.", "../../")
    body += f'''<div class="hero"><div class="hero-inner catalog-hero"><p class="kicker">{len(course["lessons"])} bài · {len(course["modules"])} phần kiến thức · học và tự xây</p><h1>Làm chủ <em>Spring Boot</em></h1><p class="lead">Hiểu container, xây API, bảo vệ dữ liệu và kiểm chứng bằng test. Mỗi bài có ví dụ, bài tập và cách giải thích kết quả; video chỉ là nguồn xem lại tùy chọn.</p><div class="hero-actions"><a class="button" href="nen-tang-http/index.html">Bắt đầu từ nền tảng →</a><a class="button secondary" href="../../practice/spring-foundations/index.html">Mở project thực hành</a></div></div></div>
<main class="catalog curriculum" id="noi-dung" tabindex="-1"><div class="learning-guide"><h2>Học để tự triển khai</h2><p>Đi từ nền tảng đến Core và Boot, rồi thực hành Web, Data, Security. Bài ứng dụng DTO/quan hệ cần kiến thức dữ liệu tương ứng; có thể học phần Data trước các bài đó. Kết thúc bằng dự án tự viết backend, dùng demo có sẵn để đối chiếu.</p><p><strong>Nhịp học:</strong> đọc cơ chế → dự đoán ví dụ → viết code → chạy test → giải thích lỗi. Editor trên trang giúp sửa và giữ nháp; Java/Spring chạy thật trong project local.</p><p class="version-note">{esc(course['baseline'])}. Đây là baseline của demo, không phải tuyên bố phiên bản mới nhất.</p></div>
<nav class="module-links" aria-label="Các phần kiến thức">{module_nav}</nav>
<div class="catalog-tools"><label for="lesson-search">Tìm bài theo chủ đề</label><input id="lesson-search" type="search" placeholder="Ví dụ: transaction, bean, phân quyền" data-search><p role="status" aria-live="polite" data-search-status></p><p data-course-progress>Tiến độ được lưu riêng trên trình duyệt của bạn.</p></div>
<noscript><p>Không có JavaScript vẫn đọc được toàn bộ bài và xem lời giải. Tìm kiếm, đánh dấu tiến độ và editor cần JavaScript.</p></noscript>
{''.join(sections)}<p class="catalog-end">Kết thúc lộ trình bằng đồ án tự triển khai; quay lại các bài cần ôn dựa trên kết quả thực hành.</p></main></body></html>\n'''
    (ROOT / "lessons/springboot/index.html").write_text(body, encoding="utf-8")


def render_home(course):
    body = head("Tự học backend có thực hành", "Học Spring theo kiến thức cốt lõi, viết code và kiểm chứng bằng test.", "")
    body += f'''<main id="noi-dung" tabindex="-1"><div class="hero"><div class="hero-inner catalog-hero"><p class="kicker">Giáo trình tự học backend</p><h1>Hiểu cơ chế.<br><em>Tự xây backend.</em></h1><p class="lead">Bài giảng tiếng Việt đi từ nền tảng đến ứng dụng, kèm ví dụ có đầu ra, bài tập lập trình và hướng dẫn kiểm chứng. Học độc lập, không cần theo một video.</p><div class="hero-actions"><a class="button" href="lessons/springboot/index.html">Khám phá lộ trình Spring →</a><a class="button secondary" href="practice/spring-foundations/index.html">Bắt đầu thực hành</a></div></div></div><section class="catalog"><h2>Lộ trình Spring</h2><p>{len(course["lessons"])} bài trong {len(course["modules"])} phần, từ container và dependency injection đến dữ liệu, security và kiểm thử.</p>'''
    body += "".join(f'<a class="course-card" href="lessons/springboot/index.html#{esc(m["id"])}"><span><strong>{esc(m["title"])}</strong><span>{esc(m["summary"])}</span></span><span aria-hidden="true">↗</span></a>' for m in course["modules"])
    body += '<div class="learning-guide"><h2>Học và thực hành theo hai nhịp</h2><p>Trên web: đọc bài, sửa đoạn code, tự kiểm tra và lưu nháp. Trong project: tự triển khai Java/Spring rồi chạy test thật. Starter và lời giải tách riêng để bạn có thể tự làm trước khi đối chiếu.</p></div></section></main></body></html>\n'
    (ROOT / "index.html").write_text(body, encoding="utf-8")


def render_aliases(course):
    """Keep bookmarks without presenting sessions as curriculum units."""
    canonical_ids = {}
    for lesson in course["lessons"]:
        path = ROOT / "lessons/springboot" / lesson["slug"] / "index.html"
        soup = BeautifulSoup(path.read_text(encoding="utf-8"), "html.parser")
        canonical_ids[lesson["slug"]] = {node["id"] for node in soup.select("[id]")}
    for old, slug in course.get("aliases", {}).items():
        path = ROOT / "lessons/springboot" / old / "index.html"
        original = BeautifulSoup(path.read_text(encoding="utf-8"), "html.parser") if path.exists() else BeautifulSoup("", "html.parser")
        ids = {node["id"] for node in original.select("[id]")} - {"top", "noi-dung"}
        links = []
        for ident in sorted(ids):
            target = course.get("alias_fragments", {}).get(old, {}).get(ident, slug)
            suffix = f"#{ident}" if ident in canonical_ids[target] else ""
            links.append(f'<li id="{esc(ident)}"><a href="../{esc(target)}/index.html{esc(suffix)}">Mở nội dung tương ứng: {esc(ident)}</a></li>')
        title = next(lesson["title"] for lesson in course["lessons"] if lesson["slug"] == slug)
        body = head("Bài học đã được tổ chức lại", "Nội dung được chuyển sang giáo trình theo chủ đề.", "../../../")
        body += f'<main class="catalog" id="noi-dung" tabindex="-1"><h1>Bài học đã được tổ chức lại</h1><p>Giáo trình được tách, gộp và sắp xếp theo kiến thức, không theo buổi video. Các project demo vẫn giữ đường dẫn để bạn tiếp tục thực hành.</p><p><a class="button" href="../{esc(slug)}/index.html">{esc(title)} →</a></p><p><a href="../index.html">Xem toàn bộ lộ trình</a></p><ul>{"".join(links)}</ul></main></body></html>\n'
        path.write_text(body, encoding="utf-8")


def main():
    course = json.loads((CONTENT / "course.json").read_text(encoding="utf-8"))
    for i, lesson in enumerate(course["lessons"]):
        render_lesson(lesson, course, i)
    render_catalog(course)
    render_home(course)
    render_aliases(course)
    practice = head("Project thực hành Spring Foundations", "Tự viết backend, chạy test và đối chiếu lời giải.", "../../")
    practice += '<main class="catalog practice-page" id="noi-dung" tabindex="-1">' + (ROOT / "content/practice.html").read_text(encoding="utf-8") + '</main></body></html>\n'
    (ROOT / "practice/spring-foundations/index.html").write_text(practice, encoding="utf-8")
    reference_soup = BeautifulSoup((ROOT / "content/reference-directory-walkthrough.html").read_text(encoding="utf-8"), "html.parser")
    for code in reference_soup.select("pre code"):
        if not any(c.startswith("language-") for c in code.get("class", [])):
            code["class"] = [f"language-{language(code)}"]
    reference = head("Đối chiếu demo danh bạ", "Walkthrough tùy chọn của demo hoàn chỉnh; không thay đồ án coding.", "../../")
    reference += '<main class="catalog practice-page" id="noi-dung" tabindex="-1"><h1>Đối chiếu demo danh bạ</h1><div class="callout intro"><p>Các bước dưới kiểm chứng demo hoàn chỉnh. Đây là tài liệu đối chiếu tùy chọn, không phải bài chấm khả năng tự triển khai. <a href="../../lessons/springboot/project-capstone/index.html">Đồ án coding và tiêu chí chấm →</a></p></div>' + str(reference_soup) + '</main></body></html>\n'
    reference_path = ROOT / "practice/reference-directory/index.html"
    reference_path.parent.mkdir(parents=True, exist_ok=True)
    reference_path.write_text(reference, encoding="utf-8")
    print(f"Built {len(course['lessons'])} lessons, course catalog and homepage.")


if __name__ == "__main__":
    main()
