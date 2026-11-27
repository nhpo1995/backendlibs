# Backend Service · Giáo trình Spring theo chủ đề

[Trang chủ](index.html) dẫn tới [lộ trình Spring](lessons/springboot/index.html) với 42 bài trong 12 phần. Bài đọc đi từ container, Web MVC và JPA đến Event, Security, kiểm thử, tích hợp API, async, cache và triển khai. Video là nguồn xem lại tùy chọn ở cuối bài.

FE hiện dùng **React + TypeScript + Vite**, có trang chủ, trang nhóm và trang bài học riêng. Chọn Spring Core/Security chỉ mở bài thuộc nhóm đó; các URL/hash cũ vẫn được chuyển đúng bài/nhóm. Nội dung bài được giữ riêng trong `content/`, xuất thành dữ liệu cho React và tải theo từng bài. Prism tô màu ví dụ chỉ đọc; CodeMirror tô màu ngay trong ô gõ, có số dòng và hoàn tác. Không có khung xem trước riêng. Editor không biên dịch/chạy Java; nháp và tiến độ lưu trên trình duyệt, chưa đồng bộ tài khoản.

[Project Spring Foundations](practice/spring-foundations/index.html) có starter TODO, solution riêng và cùng 17 test cho Core, CRUD/validation, transaction, security và HTTP thật. Starter compile nhưng acceptance tests chưa đạt khi chưa hoàn thành TODO. Các demo tham khảo cũ giữ đường dẫn để đối chiếu, gồm [demo ứng dụng có UI](lessons/springboot/buoi-17/demo/README.md); thao tác trên demo không thay bài tập tự viết backend.

Nút **Kiểm tra** trong editor đối chiếu với lời giải trên trình duyệt, bỏ qua khoảng trắng, dòng trống và chú thích giữa các thành phần code. Nội dung chuỗi, toán tử và cấu trúc YAML được giữ khi so sánh. “Khớp lời giải” không có nghĩa đã biên dịch/chạy thành công; một implementation khác có thể đúng dù chưa khớp mẫu. Sửa code hoặc khôi phục starter sẽ xóa kết quả cũ. Bài chỉ có checklist hướng dẫn sẽ yêu cầu tự kiểm chứng.

Editor dùng thụt lề 4 dấu cách: Tab tăng lề, Shift+Tab giảm lề, Enter tự thụt dòng theo cú pháp. Starter snippet dùng chú thích TODO để người học thay bằng code. Với nháp cũ còn `throw new UnsupportedOperationException();`, bộ đối chiếu nhắc xóa dòng giữ chỗ khi lời giải không dùng nó; giữ `throw` sau `return` gây lỗi unreachable statement trong Java. Nháp hiện có không bị tự sửa.

Trong `course.json`, `lab.comparison` mặc định là `whole`; dùng `addition` khi lời giải Java là một đoạn cần chèn vào starter giữ nguyên, hoặc `manual` khi cần nghiệm thu theo hướng dẫn. Không tự đánh dấu hoàn thành từ kết quả đối chiếu. Chạy `npm run test:code-check` để kiểm tra bộ đối chiếu.

Sau rà soát 35 bài, các lời giải code hiện dùng `whole` và hiển thị đủ ngữ cảnh starter; 4 bài checklist/cấu hình chạy ngoài editor dùng `manual`. `lab.instructions` chỉ rõ phần giữ lại, phần thay thế và phần thực hành tiếp trong project. [Kết quả rà soát toàn bộ bài tập](docs/verification/2026-11-20-all-exercises.md).

```text
backendlibs/
├── index.html                 Trang chủ
├── assets/                    CSS/JS và Prism offline
├── frontend/src/              Component React, router và trạng thái UI
├── frontend/generated/        Dữ liệu bài sinh tự động, không sửa tay
├── vite.config.mts            Vite/React/TypeScript và base path
├── dist/                      FE production + entry cho deep links
├── content/springboot/        HTML nguồn và course.json theo chủ đề
├── scripts/build_site.py      Build HTML tĩnh, không fetch lúc đọc
├── practice/spring-foundations/  Starter, solution, đề và ZIP mã nguồn
└── lessons/
    ├── COURSES.md             Danh mục giáo trình và nguồn
    └── springboot/
        ├── index.html         Danh mục bài học Spring Boot
        ├── PROGRESS.md        Tiến độ hiện tại và lịch sử nguồn cũ
        ├── ioc-container/index.html  Ví dụ bài theo chủ đề
        └── buoi-01/           Alias URL cũ và demo tham khảo
```

## Biên soạn và build

Sửa `content/springboot/<slug>.html`, phần mở rộng ở `content/springboot/extensions/` nếu có, và metadata/bài tập/quiz trong `course.json`. UI sửa trong `frontend/src/`. Không sửa trực tiếp HTML trung gian, dữ liệu generated hoặc dist. Slug là tên kiến thức; một nguồn video có thể đóng góp cho nhiều bài và một bài có thể dùng nhiều nguồn. Đọc [AGENTS.md](AGENTS.md) và dùng skill backend-lesson để rà bài đọc độc lập.

```powershell
python -m pip install -r scripts/requirements.txt
python scripts/package_practice.py
npm ci
npm run build
python -m unittest discover -s tests -p 'test_*.py'
npm run test:browser
node tests/production-smoke.cjs
```

Browser tests dùng Microsoft Edge đã cài (`channel: msedge`); có thể đổi channel/executable trong `playwright.config.cjs` theo máy. Bộ đọc HTML chỉ là kiểm tra cấu trúc/liên kết, không thay review kiến thức. HTML nguồn hiện tại là bản có thẩm quyền để biên soạn tiếp, không nhập lại từ trang theo buổi cũ. `vendor_prism.py` chỉ dùng khi muốn lấy lại bundle đúng phiên bản đã chốt.

`npm run build` biên soạn/xuất nội dung, typecheck, build Vite và đóng gói tài nguyên/deep-link entries. `npm run typecheck` kiểm tra TypeScript riêng. Editor nằm tại `assets/editor-entry.js`, được React tải khi mở bài và hủy đúng lifecycle; không dùng DOM script cũ song song với React. Java/YAML dùng parser CodeMirror, PowerShell dùng mode tương thích. Textarea gốc là fallback nếu chunk editor không tải được. `build:editor` chỉ còn phục vụ bundle tương thích của HTML trung gian; FE React được Vite bundle.

```powershell
mvn -f practice/spring-foundations/solution/pom.xml verify
# Starter: chọn test từng mốc theo hướng dẫn, chưa làm TODO thì failure là dự kiến.
```

Baseline Java 17, Boot 3.5.10, Framework 6.2 và Security 6.5 nhằm đồng bộ demo; không khẳng định là phiên bản mới nhất. Các bài ghi môi trường H2 và giới hạn kiểm thử; OAuth2/OIDC cần provider riêng và chưa có lab tích hợp chạy kèm. [Bằng chứng kiểm tra](docs/verification/2026-11-19-spring-curriculum.md).

[Kiểm chứng FE React](docs/verification/2026-11-19-react-frontend.md): 15 browser tests, 7 Python tests và production smoke cho root/base path. Khi sửa nội dung HTML/course.json trong lúc Vite chạy, chạy `npm run prepare:content` ở terminal khác hoặc khởi động lại dev server để xuất dữ liệu mới; sửa component React/CSS được HMR tự cập nhật.

## Đăng nhập giai đoạn sau

Hiện FE React được build thành tài nguyên tĩnh công khai. Backend nền tảng dự kiến Node.js + TypeScript, chưa triển khai theo yêu cầu tạm dừng. Đăng nhập bảo vệ bài đọc phải được thực thi ở backend/tầng phân phối, không phải chỉ route guard hoặc ẩn HTML/JSON. Các project Java trong phần thực hành không phải backend nền tảng.

## Mở website trên máy

Cần Node.js 22.12+ hoặc 24.x, npm và Python cho bước xuất nội dung. Từ thư mục gốc repo, chạy:

```powershell
npm ci
npm run dev
```

Mở [http://127.0.0.1:8765](http://127.0.0.1:8765). Dừng server Python cũ trước nếu nó đang giữ cổng này. Giữ nguyên host/cổng sẽ giữ được nháp và tiến độ cũ; đổi sang localhost hoặc cổng khác tạo storage origin khác. Dừng Vite bằng Ctrl+C. Từ đây dùng Vite hoặc bản build, không mở file:// hoặc dùng HTML trung gian làm FE chính.

```powershell
npm run build
npm run preview
```

Preview production tại [http://127.0.0.1:5174](http://127.0.0.1:5174). Toàn bộ output nằm trong dist; deploy thư mục này, không deploy repo root. Build có sẵn entry cho URL bài/nhóm/alias nên refresh trên static hosting không cần rewrite mọi request.

Nếu deploy dưới thư mục con, ví dụ GitHub Pages `/backendlibs/`:

```powershell
$env:PUBLIC_BASE = '/backendlibs/'
npm run build
node tests/production-smoke.cjs
Remove-Item Env:PUBLIC_BASE
```

## Demo MySQL tham khảo

Chuẩn bị JDK 17 trở lên, Maven 3.6.3 trở lên và MySQL cục bộ. Từ thư mục chứa README, chuyển vào thư mục Buổi 1 trước khi chạy các lệnh dưới đây. Bạn cũng có thể dùng IntelliJ Database hoặc MySQL Workbench để chạy các câu SQL.

```powershell
Set-Location lessons/springboot/buoi-01
mysql -u root -p
```

Trong MySQL CLI, dùng schema riêng cho bài thực hành. Nếu đã có database tên `product` dùng cho việc khác, đổi tên schema trong lệnh SQL và đặt `DB_URL` tương ứng trước khi chạy demo.

```sql
CREATE DATABASE IF NOT EXISTS product CHARACTER SET utf8mb4;
USE product;
SOURCE demo/src/main/resources/schema.sql
SOURCE demo/src/main/resources/data.sql

CREATE USER IF NOT EXISTS 'railway'@'localhost' IDENTIFIED BY 'thay-bang-mat-khau-may-ban';
GRANT SELECT ON product.* TO 'railway'@'localhost';
```

Nếu đã có user `railway`, dùng mật khẩu của user đó. Trong PowerShell, truyền thông tin kết nối qua biến môi trường của phiên hiện tại.

```powershell
$env:DB_USER = 'railway'
$env:DB_PASSWORD = 'thay-bang-mat-khau-may-ban'
mvn -f demo/pom.xml spring-boot:run
```

Khi MySQL dùng cổng khác `3306`, đặt `DB_URL`. Khi cổng HTTP `811` bị chiếm, đặt `SERVER_PORT` và dùng cổng đó trong các lệnh curl.

```powershell
curl.exe -i http://localhost:811/products/1
curl.exe -i http://localhost:811/products/999
curl.exe -i http://localhost:811/products/abc
```

| Request | Kết quả với dữ liệu mẫu |
| --- | --- |
| `GET /products/1` | `200 OK` và JSON có `id`, `name`, `price`, `color` |
| `GET /products/999` | `404 Not Found` nếu ID 999 không có trong bảng |
| `GET /products/abc` | `400 Bad Request` vì ID cần là số |

Để xác nhận luồng HTTP → JPA → SQL trên H2 trong bộ nhớ, chạy:

```powershell
mvn -f demo/pom.xml verify
```

## Xuất bản website tĩnh

Sau khi build, phục vụ nội dung `dist/` hoặc dùng artifact này để cấu hình GitHub Pages. Assets và project source/ZIP được đóng gói; target Java, node_modules và file riêng tư không được đưa vào output. Spring Boot/DB của project thực hành chạy riêng. Chưa publish. [Hướng dẫn cấu hình GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

