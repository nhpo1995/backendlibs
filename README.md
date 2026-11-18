# Backend Service

[Trang chủ](index.html) dẫn tới danh mục các khóa học. [Spring Boot](lessons/springboot/index.html) là khóa đầu tiên, dựa trên video Railway 89. Bài đọc, mã nguồn tham khảo và bài tự kiểm tra nằm trong từng buổi. Các mốc thời gian được giữ để tham khảo; website không đặt liên kết đến Google Drive.

[Spring Security · Railway 97](lessons/spring-security/index.html) có bài HTTP Basic, BCrypt, tài khoản database, CSRF và demo độc lập trên H2.

Website dùng HTML, CSS và JavaScript thuần. [Buổi 1](lessons/springboot/buoi-01/index.html) hướng dẫn xây dựng API đọc sản phẩm với Spring Boot, MySQL, JPA và Lombok. Dự án Maven của buổi này nằm trong `lessons/springboot/buoi-01/demo/`. Demo dựng lại phần GET với dữ liệu mẫu, URL `/products/{id}` và phản hồi `404` khi không tìm thấy sản phẩm.

[Buổi 11–17](lessons/springboot/buoi-11/index.html) dùng một [demo Maven và H2](lessons/springboot/buoi-17/demo/README.md) để thực hành truy vấn, phân trang, validation, xử lý lỗi và phân quyền. Có cả giao diện quản lý account/group và bộ kiểm tra HTTP chạy trên dữ liệu mẫu.

```text
backend-service/
├── index.html                 Trang chủ
├── assets/                    CSS và JavaScript dùng chung
└── lessons/
    ├── COURSES.md             Danh mục nguồn và tiến độ theo khóa
    └── springboot/
        ├── index.html         Danh mục bài học Spring Boot
        ├── PROGRESS.md        Video và trạng thái từng bài
        └── buoi-01/
            ├── index.html     Bài đọc Buổi 1
            └── demo/          Mã nguồn và bài thực hành
```

## Biên soạn bài trong session mới

Chọn `backend-service/` làm thư mục chính của project Codex. Gửi link video hoặc thư mục nguồn trong session mới. [AGENTS.md](AGENTS.md) hướng dẫn Codex dùng skill `$backend-lesson`. Bạn cũng có thể gọi skill trực tiếp.

- Với link video, Codex tìm đúng khóa và bài từ nguồn. Có thể kèm tên khóa nếu video chưa thuộc danh mục.
- Với link thư mục, Codex đối chiếu các video và chọn một bài để tiếp tục nếu bạn chưa chỉ định phạm vi. Ghi tên bài khi muốn làm một bài cụ thể.
- Xem [danh mục khóa](lessons/COURSES.md) để biết nguồn và tiến độ. Mỗi khóa cập nhật bảng riêng để các session sau tiếp tục từ đúng bài.

## Mở website trên máy

Mở trực tiếp `index.html` hoặc chạy server tĩnh từ thư mục này.

```powershell
python -m http.server 8765 --bind 127.0.0.1
```

Mở [http://127.0.0.1:8765](http://127.0.0.1:8765). Dừng server bằng Ctrl+C.

## Chạy demo với MySQL

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

## Đưa website lên GitHub Pages

Tạo repository GitHub trống, rồi từ thư mục chứa README chạy các lệnh sau sau khi thay hai giá trị trong URL bằng tên tài khoản và repository của bạn.

```powershell
git init -b main
git add .
git commit -m "Add Backend Service learning site"
git remote add origin https://github.com/TEN-TAI-KHOAN/TEN-REPOSITORY.git
git push -u origin main
```

Khi muốn xuất bản trang tĩnh, mở **Settings → Pages** của repository. Chọn **Deploy from a branch**, nhánh **main** và thư mục **/(root)**, rồi lưu. GitHub Free hỗ trợ GitHub Pages cho repository công khai. Spring Boot và MySQL của từng buổi chạy riêng trên máy để thực hành. [Hướng dẫn cấu hình GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)

