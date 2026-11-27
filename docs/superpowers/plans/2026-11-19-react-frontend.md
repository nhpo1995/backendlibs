# React frontend migration

Thiết kế đã được chấp thuận trong chat: chuyển FE sang React + TypeScript + Vite, backend để sau.

## Thiết kế

- React sở hữu layout, trang chủ, danh mục/nhóm, trang bài, quiz, completion và editor. Nội dung bài là HTML được biên soạn trong content/, không đổi sang JSX thủ công và không sửa kiến thức trong lượt chuyển FE.
- Trang nhóm có URL riêng /lessons/springboot/modules/<id>/index.html và chỉ hiện bài trong nhóm đó. Trang khóa có thể xem toàn bộ. Hash nhóm của URL cũ chuyển sang trang nhóm, Back/Forward hoạt động.
- Giữ đường dẫn canonical/alias bài cũ và anchor. Build tạo entry HTML cho các đường dẫn để refresh trên static hosting không cần backend rewrite. Hỗ trợ base path triển khai trong thư mục con.
- CodeMirror trực tiếp, Prism cho snippet, quiz và keys localStorage giữ nguyên. Khởi tạo/hủy editor theo lifecycle React; tab không sửa không ghi đè draft của tab khác.
- Dev/preview bằng Node/Vite. Python chỉ còn là công cụ biên soạn/xuất nội dung; không phục vụ FE. Project Java thực hành giữ nguyên. Không đăng nhập, API backend hoặc publish.

## Kế hoạch và giao diện dữ liệu

- [x] Test điều hướng: homepage → nhóm chỉ hiện bài nhóm, nhóm khác, Back/Forward, refresh và hash cũ.
- [x] Export dữ liệu từ HTML đã kiểm chứng sang frontend/generated: course.json; từng lesson JSON (bodyHtml, introHtml, referencesHtml, videoHtml, toc); tài liệu practice HTML. Điều chỉnh URL tài nguyên khi chuyển từ practice/canonical.
- [x] App React/TS: Header, HomePage, CoursePage, ModulePage, LessonPage, PracticePage, Article, CodingExercise, Quiz, ProgressProvider. Router giữ URL cũ.
- [x] Vite config và build đóng gói tài nguyên/demo/ZIP có chủ đích, bỏ target/.git/node_modules. Tạo entry HTML cho các deep links. Không dùng runtime script DOM cũ cùng React.
- [x] Chạy typecheck/build, browser regression cho toàn bộ bài, draft/reset/download/XSS/multi-tab/fallback, ảnh desktop/mobile, preview production và base path.
- [x] Cập nhật README/AGENTS/tiến độ và báo cáo kiểm chứng; review theo skill requesting-code-review nếu cần phát hiện lỗi lifecycle/router.

Không commit/push. Giữ branch hiện tại và tất cả thay đổi cục bộ. Không xóa dữ liệu đã biên soạn hoặc starter/solution.

Kiểm chứng: 15 browser tests, 7 Python tests, build/typecheck và production smoke ở / và /backendlibs/ đều đạt. Review độc lập: sửa URL thư mục và anchor tải chậm với regression RED→GREEN. Không backend/commit/push/publish.
