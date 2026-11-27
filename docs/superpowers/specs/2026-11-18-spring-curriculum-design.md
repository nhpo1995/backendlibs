# Giáo trình Spring hybrid

Thiết kế ghi lại phương án người dùng đồng ý trong chat ngày 18/11/2026.

## Mục tiêu

Chuyển toàn bộ bài học từ thứ tự video sang lộ trình kiến thức: nền tảng, Spring Core, Spring Boot, Web MVC, Data/Transaction, Security, kiểm thử/vận hành và dự án. Người mới đọc được độc lập, giải thích cơ chế và tự viết backend, thay vì chỉ thao tác trên ứng dụng có sẵn.

## Phương án và quyết định

- Chọn hybrid: bài đọc và bài tương tác/editor trên website tĩnh; starter Maven và test chạy Java thật ở local. Có thể gắn môi trường cloud sau.
- Cloud bắt buộc gây phụ thuộc tài khoản/hạn mức; hệ thống thực thi code tự vận hành vượt phạm vi hiện tại.
- Highlight dùng Prism lưu tại repo. Editor dùng textarea có nhãn, preview highlight, lưu nháp có xử lý lỗi storage, tải file, reset có xác nhận khi đã sửa và lời giải đóng mặc định. Không chạy eval, không mô phỏng kết quả biên dịch.
- Theo chỉnh hướng của người dùng: không giữ đơn vị buổi. Tách/gộp thành 35 bài có tên/URL theo chủ đề; URL cũ chỉ là alias dẫn tới nội dung tương ứng, demo giữ đường dẫn vật lý cũ. Bài chính không cần xem video; nguồn video ở mục tham khảo tùy chọn.
- Tách nguồn bài và metadata khỏi shell HTML, build sẵn trang để mở bằng file hoặc GitHub Pages, không phụ thuộc fetch lúc đọc.
- Baseline thực hành: Java 17, Spring Boot 3.5.10 đã có trong repo; tài liệu Framework 6.2, Security 6.5 và Boot 3.5. Không gọi đây là phiên bản mới nhất; không nâng major trong refactor nội dung.
- Bài tập coding có yêu cầu, starter, đầu ra, cách chạy test thật, gợi ý và lời giải. Đề tổng hợp yêu cầu viết implementation, phân biệt rõ với walkthrough kiểm chứng demo có sẵn.

## Đăng nhập giai đoạn sau

Chưa làm đăng nhập trong đợt này. Việc bảo vệ nội dung phải ở server/tầng phân phối, không phải ẩn HTML bằng JavaScript. Content source/build tách biệt cho phép đổi cách phân phối sau; hiện website vẫn công khai.

## Kiểm chứng

Kiểm tra link/fragment trên toàn bộ trang, nguồn kiến thức, bài đọc độc lập, hoạt động copy/highlight/editor/search/progress ở desktop/mobile và file://, test starter ở trạng thái chưa làm và sau khi áp dụng lời giải. Phân biệt test cấu trúc, browser và Spring/H2 thực tế. Không tuyên bố đã chạy MySQL/OAuth2 provider thật nếu chưa có bằng chứng.

## Bảo toàn dữ liệu

Hai file đã thay đổi trước khi bắt đầu: lessons/springboot/PROGRESS.md và lessons/springboot/thi-lan-02/index.html. Lấy nội dung đang có làm đầu vào, không reset. Không push/publish/commit trong phạm vi này.
