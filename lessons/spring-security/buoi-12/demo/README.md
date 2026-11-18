# Spring Security · Railway 97 Buổi 12

Demo dựng lại cho [bài đọc](../index.html): Spring Boot 3.5.13, Java 17+, Maven 3.6.3+, JPA/H2 và BCrypt. CSRF được giữ bật. Chỉ dùng dữ liệu thực hành; server bind 127.0.0.1:8912. Mỗi lần khởi động xóa/tạo lại dữ liệu H2.

Từ thư mục demo:

```sh
mvn spring-boot:run
```

Tài khoản mẫu `teacher` / `Learn123!`. GET `/api/me` với HTTP Basic trả danh tính; không có/sai credentials trả 401. GET `/api/accounts` đọc DTO tài khoản, không có password/hash. POST `/api/accounts` tạo tài khoản bằng JSON `username`, `password`, `displayName`; cần Basic, CSRF token và cookie cùng phiên. API chưa phân quyền theo role: mọi tài khoản đã xác thực đều có thể tạo account.

Lấy token bằng GET `/api/csrf` với Basic Auth; lưu cookie JSESSIONID, đọc `headerName` và `token`, rồi gửi cả token lẫn cookie với POST. [Bài đọc](../index.html#tao-account) có lệnh PowerShell và hướng dẫn Postman đầy đủ. Password 8–64 ký tự ASCII in được không dấu cách; username 3–40 ký tự chữ/số/`._-`; displayName không rỗng, tối đa 80 ký tự. JSON sai trả 400, trùng username trả 409.

POST `/api/lab/accounts/{id}/rename?atomic=true|false`, JSON `{"displayName":"Changed"}`, cố ý ném lỗi runtime sau save để học transaction. Cả hai trả 500. `atomic=true` rollback; `atomic=false` giữ thay đổi do repository đã commit riêng. Đọc lại GET `/api/accounts/{id}` sau mỗi lần thử. Khởi động lại để reset dữ liệu và lấy token mới.

Kiểm tra tự động bằng HTTP thật và H2 trong cùng JVM:

```sh
mvn verify
```

Bảy test gồm tạo account và xác thực account mới, JDBC kiểm tra hash và matches, 401, CSRF 403 không làm thay đổi dữ liệu, validation 400, trùng 409 và hai ca transaction. Test không dùng transaction bọc ngoài. H2 in-memory không chia sẻ giữa server chạy bằng Maven và test; không mở SQL client khác rồi coi đó là cùng dữ liệu. MySQL và mất điện thật chưa được kiểm chứng.

Cấu trúc dựng lại theo thứ tự: `SecurityLessonApplication` → `Account`/`AccountRepository` → `SecurityConfig`/`DatabaseUserDetailsService` → `AccountService` → `AccountController`/`ApiErrors` → `DemoData`. Cấu hình trong `src/main/resources/application.properties`; đổi cổng bằng biến `SERVER_PORT`. Không có H2 console, JWT hay phân quyền role trong demo này.
