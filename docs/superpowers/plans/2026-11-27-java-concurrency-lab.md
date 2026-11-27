# Bài thực hành đa luồng Java

**Mục tiêu**
Thêm bài đọc và bài code có thể tự chạy trước khi học `@Async`. Phạm vi là concurrency trong một JVM và đường nối sang Spring.

**Thiết kế**
Mở rộng bài Vòng đời bean và nối từ bài Async hiện có. Tận dụng ZIP Maven Spring Core, giữ Java 17 và các URL hiện có.

- [x] Viết test cho lịch xen kẽ của phép tăng volatile, bộ đếm, quota thư mời và tác vụ chạy nền. Xác nhận starter có TODO thất bại.
- [x] Cung cấp lời giải và kiểm test ở hai chế độ. Tách dự đoán, tự viết và đối chiếu.
- [x] Biên soạn ví dụ, cách đọc lỗi, tình huống chuyển giao và đoạn nối sang `@Async`.
- [x] Chạy Maven, giải nén ZIP thực tế, kiểm liên kết trợ học và build React.

Giữ rõ ranh giới trong bài. Khóa Java bảo vệ cùng instance. Việc dừng task phụ thuộc phản ứng với interrupt. Công việc cần sống qua restart cần cơ chế bền vững riêng.
