# Tiến độ Spring Security · Railway 97

Nguồn: [SPRING-SECURITY](https://drive.google.com/drive/folders/1bPIpScT0yNa5YPr5YzXw3_IiD_Hfei9G). Đã kiểm kê ngày 18.11.2026: hai video, Buổi 12 và 13. Giữ số buổi theo tên nguồn, không gộp với Railway 89. Link nguồn chỉ phục vụ biên soạn, không xuất hiện trên trang HTML.

| Bài | Slug | Trạng thái | Nguồn và bước tiếp theo |
| --- | --- | --- | --- |
| [Buổi 12 · HTTP Basic, BCrypt và xác thực từ database](buoi-12/index.html) | buoi-12 | Hoàn tất | [Railway 97 - Buổi 12 - 30.01.2026.mp4](https://drive.google.com/file/d/17wfZKj-DQJBfcjqV7jpHSeOxUwcShq-o/view). Đã đọc phụ đề từ 7:01 đến 2:59:11, rà bài đọc độc lập và kiểm tra demo HTTP/H2. Xem kết quả kiểm tra bên dưới. |
| Buổi 13 · 02.02.2026 | buoi-13 | Chưa làm | [Railway 97 - Buổi 13 - 02.02.2026.mp4](https://drive.google.com/file/d/1ocZH9Fbfm6EqDxbP1UNRvS4iBHqgmDlr/view). Đã xác minh tên và ID từ danh sách thư mục; chưa đọc nội dung. Cuối Buổi 12 thông báo tiếp theo là phân quyền và ghép frontend; cần đối chiếu video trước khi đặt tiêu đề bài. |

## Ghi chú nguồn Buổi 12

- 10:15–20:56: transaction, ví dụ chuyển tiền, bài tập ném RuntimeException sau save; 49:47–1:06:04: chữa bài, có hai trường hợp chưa chẩn đoán xong và một trường hợp quan sát được thay đổi department khi bỏ transaction. Bài đọc không quy kết nguyên nhân cho code chưa thấy đầy đủ.
- 1:06:10–1:33:09: authentication/authorization, starter tự bật bảo vệ, 401, bean SecurityFilterChain, HTTP Basic, UserDetailsService, BCrypt, sửa so sánh String bằng ==.
- 2:17:01–2:27:12: chữa bài tài khoản tạm, đăng ký service thành bean. 2:27:37–2:34:50: chuyển lookup sang repository, hash password khi tạo, thử username không tồn tại.
- 2:51:53–2:59:11: tạo account rồi xác thực bằng account mới; học viên đề cập tắt CSRF lúc 2:56:32. Demo website sẽ giữ CSRF và hướng dẫn gửi token + cookie; đây là phần dựng lại có chủ đích.
- Đã lấy khung hình tại 2:32:40: IDE với CustomUserDetailsService và lookup repository; độ phân giải ở trình phát hạn chế, không suy ra phiên bản dependency hay chép nguyên văn toàn bộ mã. Ví dụ website dùng phiên bản khai báo riêng.

## Kết quả kiểm tra ngày 18.11.2026

- Đã rà bài đọc độc lập, bỏ qua ghi chú video: có dữ liệu teacher/Linh, đầu vào và đầu ra 401/403/201/409/500, giải thích filter/provider/hash, hướng dẫn gây lỗi và đọc lại dữ liệu. Tám câu hỏi có đáp án. Reviewer độc lập không phát hiện vấn đề cản trở hoàn tất.
- Môi trường chạy: OpenJDK Corretto 25.0.3, Maven 3.9.11, Spring Boot 3.5.13, bytecode Java 17, Hibernate 6.6.45.Final, H2 2.3.232. `mvn verify`: 7 test, 0 failure/error, build và đóng gói JAR thành công. Đã thấy ca xác thực account mẫu thất bại trước triển khai, sau đó kiểm tra toàn bộ yêu cầu qua test HTTP thật.
- Chạy JAR độc lập ở 127.0.0.1:8912, kiểm tra bằng Python HTTP client có cookie jar: 401 thiếu/sai Basic, 403 thiếu CSRF, lấy token/cookie, tạo account201, đăng nhập account mới, trùng409, hai ca 500 và dữ liệu Teacher/Changed sau đọc lại. Test JDBC cùng JVM xác nhận hash và matches, không lộ hash qua DTO.
- Khi thử cấu hình ban đầu, dispatch lỗi nội bộ che CSRF403 thành401. Đã thêm rule chỉ cho DispatcherType.ERROR để giữ mã lỗi gốc; request API thông thường vẫn cần authenticated.
- Kiểm tra 25 HTML không chứa Drive URL. Mọi liên kết nội bộ của trang chủ và hai trang mới (file, source, asset, fragment) đều tồn tại; không trùng ID. Đã mở trình duyệt localhost qua trang chủ → danh mục → bài học, quan sát bố cục, mở đáp án BCrypt, xác nhận 13 nút sao chép mã.
- PowerShell không có trong môi trường hiện tại nên chưa thực thi trực tiếp các khối PowerShell; cùng chuỗi request, token/cookie và JSON đã được kiểm chứng bằng HTTP client Python cùng test Java. Chưa thử MySQL thật, frontend hoặc sự cố mất điện. Buổi 13 vẫn Chưa làm, là bước tiếp theo của bộ nguồn.
