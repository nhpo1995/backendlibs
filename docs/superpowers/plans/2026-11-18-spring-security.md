# Spring Security · Buổi 12

**Goal:** Biên soạn bài tự học từ Railway 97 Buổi 12, dùng nguồn SPRING-SECURITY đã xác minh.
**Architecture:** Trang HTML theo mẫu hiện có, demo Maven độc lập, danh mục và tiến độ riêng. Giữ các thay đổi gỡ Drive của lượt trước.
**Tech Stack:** HTML/CSS/JS chung; Java 17, Spring Boot 3.5.13, Spring Security 6.5, JPA/H2.
**Spec:** AGENTS.md và .agents/skills/backend-lesson/SKILL.md.

## Phạm vi và kiểm tra
- [x] Ghi hai video vào COURSES.md và spring-security/PROGRESS.md. Chỉ làm Buổi 12; Buổi 13 chưa làm.
- [x] Viết test HTTP thật cho thiếu/sai thông tin 401, username không tồn tại, tạo account có CSRF, password hash trong DB và xác thực account mới; test rollback có/không transaction ở service.
- [x] Dựng demo theo test: API /api/me, /api/accounts, /api/csrf; tài khoản mẫu teacher; BCrypt và DTO không trả password. Giữ CSRF, bind localhost, dữ liệu H2 mất khi dừng.
- [x] Viết bài đủ mục tiêu, prerequisites, cơ chế, từng bước chạy, đầu vào/đầu ra, lỗi, đáp án, tài liệu chính thức và mốc video bằng chữ. Phân biệt code dựng lại và nguồn; không đưa Drive URL vào HTML.
- [x] Thêm trang khóa và thẻ trang chủ; kiểm tra đường dẫn file và fragment, xem trang trên trình duyệt, chạy toàn bộ test/demo; đọc độc lập trước khi cập nhật Hoàn tất.

## Điểm rà soát
- BCrypt dùng matches, không encode rồi so chuỗi; không giải mã hash.
- UserDetailsService phải lookup username; authenticated không tự suy ra role.
- POST thiếu CSRF trả 403 có thể xảy ra trước authentication; gửi cả token và session cookie.
- Rollback mặc định cần unchecked exception thoát qua proxy; test không đặt transaction bọc ngoài.
- Trả lỗi/DTO không lộ password/hash; username trùng trả 409, input rỗng trả 400.
