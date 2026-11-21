# Demo chung · Spring Boot Buổi 11–17

Cần JDK 17 trở lên và Maven. H2 chạy trong bộ nhớ; dừng rồi chạy lại để phục hồi dữ liệu ban đầu. Maven dùng Spring Boot 3.5.10. Chỉ lắng nghe mặc định tại 127.0.0.1:8117.

```powershell
mvn -B -ntp package
java -jar target/springboot-lessons-demo-0.1.0.jar
```

Mở [giao diện quản lý](http://127.0.0.1:8117/ui.html). Account dùng API nghiệp vụ độc lập với hai tài khoản đăng nhập. Login cục bộ: `admin / demo-pass` đọc và ghi, `reader / demo-pass` chỉ đọc API thông thường. Dùng credential giả này cho demo trên localhost. CSRF vẫn bật; UI lấy token từ API và trình duyệt giữ cookie. Các trang bài hướng dẫn PowerShell 7 và curl.exe cho những trường hợp cần thấy status và header.

| Bài | Nơi tìm mã |
| --- | --- |
| [11 · Query và bulk](../../buoi-11/index.html) | [Members.java](src/main/java/vn/railway89/lab/Members.java) |
| [12 · Phân trang](../../buoi-12/index.html) | [Products.java](src/main/java/vn/railway89/lab/Products.java) |
| [13 · DTO và Specification](../../buoi-13/index.html) | [Products.java](src/main/java/vn/railway89/lab/Products.java), [LabApplication.java](src/main/java/vn/railway89/lab/LabApplication.java) |
| [14 · DTO nhập/xuất và CRUD](../../buoi-14/index.html) | [Directory.java](src/main/java/vn/railway89/lab/Directory.java) |
| [15 · Ràng buộc và locale](../../buoi-15/index.html) | [Registration.java](src/main/java/vn/railway89/lab/Registration.java), [message bundle](src/main/resources/messages_vi.properties) |
| [16 · Lỗi HTTP](../../buoi-16/index.html) | [ApiErrors.java](src/main/java/vn/railway89/lab/ApiErrors.java) |
| [17 · Phân quyền, log, membership](../index.html) | [Security.java](src/main/java/vn/railway89/lab/Security.java), [Directory.java](src/main/java/vn/railway89/lab/Directory.java), [giao diện](src/main/resources/static/ui.html) |

Ba mảng dữ liệu mẫu nằm trong [schema.sql](src/main/resources/schema.sql) và [data.sql](src/main/resources/data.sql): thành viên để học JPA query, danh mục sản phẩm để lọc và phân trang, và directory với group/account/membership. JPA phụ trách hai mảng đầu; JdbcTemplate minh họa câu aggregate và transaction ở directory. Demo không yêu cầu MySQL.

Chạy [kiểm tra HTTP](verify.py) trong terminal khác trên một lần khởi động mới:

```powershell
python verify.py
```

Bộ kiểm tra dùng Python 3 và thư viện chuẩn, có ghi/xóa dữ liệu mẫu. Khởi động lại app trước khi chạy lần nữa. Nếu đổi port, truyền base URL cho script.

Để xem SQL JPA và dấu vết ứng dụng:

```powershell
java -jar target/springboot-lessons-demo-0.1.0.jar --logging.level.org.hibernate.SQL=DEBUG --logging.level.vn.railway89.lab=DEBUG
```

ModelMapper có thể in cảnh báo về Unsafe khi chạy trên JDK 25; kiểm tra kết quả mapping trong bài 13. DevTools, Lombok và Spring Data REST là nội dung học riêng, không được bật trong demo này.
