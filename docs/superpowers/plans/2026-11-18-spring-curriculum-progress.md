# Tiến độ — spring-curriculum

- Thiết kế: phương án hybrid đã được người dùng đồng ý; giữ website tĩnh, editor không thực thi Java, đăng nhập làm sau.
- Thực hiện trực tiếp trên nhánh codex/spring-curriculum-hybrid; không worktree, không tự commit/push.
- Pre-flight: Task 1 tạo manifest/HTML và data attributes; Task 2 tiêu thụ các attributes; Task 3 dùng link ổn định practice/spring-foundations; không xung đột giao diện.
- Điều chỉnh theo user: không giữ ranh giới buổi, 35 slug theo chủ đề; alias chỉ hỗ trợ bookmark. React được phép nhưng hiện FE tĩnh đáp ứng các chức năng và file://.
- Task 1: hoàn tất — đã biên soạn 35 bài/8 phần, tách/gộp nội dung và đối chiếu tài liệu chính thức; dữ liệu nguồn tách khỏi HTML đầu ra.
- Task 2: hoàn tất — Prism offline, editor draft/reset/download, quiz, search và progress; 8 browser tests đạt, ảnh desktop/mobile đã xem.
- Task 3: hoàn tất — starter compile, acceptance chưa đạt do TODO đúng chủ đích; solution 17/17 test; 15 HTTP response thật đạt. ZIP chứa source và cùng test contract.
- Task 4: hoàn tất — 6 Python tests đạt, build lặp cùng bytes, toàn bộ link/fragment hợp lệ, 88/88 tài liệu công khai HTTP 200. README/COURSES/PROGRESS và AGENTS cập nhật theo kiến trúc hiện tại.
- Final review: reviewer độc lập chỉ đọc. Sửa các finding quan trọng: mất nháp đa tab; verifier có thể xóa seed khi Location sai; đồ án chấm thao tác demo thay coding; code mẫu test không gửi request; contract ID lặp bị trộn; Maven cwd; archive và alias sai nguồn. Chi tiết và bằng chứng trong docs/verification/2026-11-19-spring-curriculum.md.
- Verification bổ sung: phát hiện lỗi servlet ERROR dispatch qua HTTP thật, regression RED→GREEN; sửa tương phản lead trên trang practice, browser test RED→GREEN.
- Không commit/push/publish. OAuth2 provider, MySQL thật, đăng nhập/đồng bộ nội dung nằm ngoài phần kiểm chứng đã hoàn tất; được ghi rõ ở từng bài và báo cáo.
