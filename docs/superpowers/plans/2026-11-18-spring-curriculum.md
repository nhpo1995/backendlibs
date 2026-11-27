# Spring Curriculum Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Giáo trình Spring độc lập video, có highlight, bài tương tác, editor và starter coding chạy thật.

**Architecture:** Nguồn HTML từng bài + manifest JSON được Python build thành HTML tĩnh. CSS/JS dùng chung và Prism offline. Giữ URL/demo cũ; module phân theo kiến thức.

**Tech Stack:** HTML/CSS/JavaScript, Prism 1.30.0, Python + BeautifulSoup, Java 17/Maven/Spring Boot 3.5.10/H2.

**Spec:** ../specs/2026-11-18-spring-curriculum-design.md

## Global Constraints

- Dùng đường dẫn tương đối; file:// và GitHub Pages.
- Nội dung tiếng Việt, đủ bối cảnh, cơ chế, đầu vào/đầu ra và cách kiểm chứng.
- Không giả định editor trên web thực thi Spring; không đăng nhập trong đợt này.
- Giữ nguyên demo cũ và thay đổi có sẵn, không push/publish/commit.

## Review Focus

- Không có localStorage hoặc clipboard: đọc bài và tải code vẫn hoạt động.
- Draft khác starter, reset/lời giải không được âm thầm làm mất code.
- File mode, GitHub Pages prefix, fragment và URL demo cũ hoạt động.
- Java/HTML trong snippet được escape, không chèn code người học vào innerHTML.
- Bài coding bắt người học viết backend, trạng thái starter và solution được kiểm thử riêng.

## Task 1: Nguồn và cấu trúc giáo trình

**Files:** content/springboot/course.json; content/springboot/*.html; scripts/build_site.py; scripts/requirements.txt; tests/test_site.py.

**Interfaces:** Manifest modules/lessons; lesson slug/title/module/summary/prerequisites/lab/quiz. HTML nguồn là nội dung main không chứa shell. Build tạo URL ổn định lessons/springboot/<slug>/index.html.

- [x] Tạo kiểm tra link/fragment, nguồn và mục bắt buộc; chạy để thấy chưa có giáo trình mới.
- [x] Trích xuất 20 bài hiện tại không mất code/demo; viết lại bối cảnh, nguồn tùy chọn, thêm thực hành coding và gom chủ đề.
- [x] Bổ sung các bài HTTP, container/lifecycle/proxy, Boot config, security chuyên sâu và testing/vận hành, đối chiếu tài liệu chính thức.
- [x] Build trang chủ/danh mục/từng bài và kiểm tra đường dẫn.

## Task 2: Trải nghiệm hybrid

**Files:** assets/site.js; assets/styles.css; assets/vendor/prism/*; tests/browser.mjs.

**Interfaces:** HTML data attributes cho editor/quiz/completion/search, không fetch nội dung. Storage namespaced theo bài và version.

- [x] Viết browser checks cho search, quiz, editor draft/reset/download, highlight/copy, storage failure, responsive.
- [x] Vendor Prism kèm license, triển khai chức năng và accessibility.
- [x] Chạy browser qua HTTP và file://, không có JS error hoặc tràn viewport.

## Task 3: Starter và lời giải thực tế

**Files:** practice/spring-foundations/{starter,solution}; practice/spring-foundations/README.md; practice/spring-foundations/downloads/*.zip.

**Interfaces:** Cùng test contract chạy với starter và solution; starter compile nhưng acceptance tests thất bại do TODO; solution pass. Không dùng test chỉ lặp implementation.

- [x] Viết tests cho bean wiring, API validation/CRUD, transaction rollback và quyền/CSRF.
- [x] Chạy starter xác nhận lỗi có ý nghĩa; triển khai lời giải, chạy solution đạt.
- [x] Đóng gói source zip không target, hướng dẫn từng mốc và link từ bài học.

## Task 4: Rà soát và bàn giao

**Files:** lessons/COURSES.md; lessons/springboot/PROGRESS.md; README.md; docs/superpowers/plans/2026-11-18-spring-curriculum-progress.md.

- [x] Rà toàn bộ bài bỏ qua video; xác nhận người mới có đủ dữ liệu và bước gỡ lỗi.
- [x] Kiểm tra build idempotent, toàn bộ liên kết, browser, Maven; reviewer độc lập nếu công cụ cho phép.
- [x] Ghi rõ bằng chứng kiểm thử và giới hạn; cập nhật tiến độ chính xác, bảo toàn lịch sử cũ.
