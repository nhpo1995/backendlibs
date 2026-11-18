# Backend Service

- Dự án là website tĩnh tự học backend. Mỗi khóa có trang danh mục trong `lessons/<khoa>/index.html`. Mỗi bài có `index.html` riêng và có thể kèm demo chạy độc lập. Tài nguyên web dùng chung nằm ở `assets/`. Dùng đường dẫn tương đối để trang mở được từ file và trên GitHub Pages.
- Khi nhận link video, thư mục nguồn hoặc yêu cầu tiếp tục một bài, dùng skill `$backend-lesson`. Nếu bộ chọn skill chưa hiển thị, đọc [.agents/skills/backend-lesson/SKILL.md](.agents/skills/backend-lesson/SKILL.md). Bắt đầu từ [danh mục khóa](lessons/COURSES.md) để xác định khóa, bài và trạng thái.
- Trong project này, một link video hoặc thư mục gửi riêng được hiểu là nguồn để đưa vào quy trình biên soạn. Phạm vi cụ thể đi theo yêu cầu kèm theo và quy tắc chọn bài trong skill.
- Viết bài bằng tiếng Việt cho người chưa biết video tồn tại. Bài đọc phải tự cung cấp bối cảnh, giải thích cơ chế và hướng dẫn kiểm chứng kết quả. Mốc video là tài liệu xem lại. Áp dụng bước kiểm tra bài đọc độc lập trong `backend-lesson` trước khi đánh dấu hoàn tất.
- Website hiện không đặt liên kết đến Google Drive, kể cả nút video gốc, thư mục nguồn và mốc thời gian. Có thể giữ mốc thời gian dưới dạng văn bản; liên kết nguồn trong tài liệu biên soạn (`COURSES.md`, `PROGRESS.md`) chỉ phục vụ quy trình nội bộ.
