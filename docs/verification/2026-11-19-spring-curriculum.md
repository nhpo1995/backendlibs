# Kiểm chứng giáo trình Spring — 19/11/2026

## Kết quả và phạm vi

35 bài có URL theo chủ đề trong 8 phần. Nguồn đã được tách/gộp: DTO tách khỏi thay tập liên kết; fetch plan/N+1 tách khỏi mapping một–một; logging sang vận hành; binding thành bài riêng; Security có chuỗi bài và lab. Đồ án chấm code/test trên API tự viết; walkthrough UI của demo được giữ tại `practice/reference-directory/` để đối chiếu tùy chọn.

Các URL theo buổi cũ là alias, không nằm trong lộ trình. Demo cũ giữ đường dẫn vật lý. Toàn bộ con trỏ video trong các bài Git gốc được kiểm tra vẫn xuất hiện ở đúng trang nguồn tương ứng trong mục tùy chọn. Các thay đổi cục bộ có trước ở đề thực hành và lịch sử tiến độ đã được lấy làm đầu vào, không reset; walkthrough của đề cũ được giữ riêng.

## Bằng chứng chạy thực tế

| Kiểm tra | Lệnh / cách chạy | Kết quả |
| --- | --- | --- |
| Build HTML | `python scripts/build_site.py` | 35 bài, danh mục, trang chủ và trang thực hành |
| Cấu trúc và an toàn | `python -m unittest discover -s tests -p 'test_*.py'` | 6 test đạt: link/fragment, cấu trúc giáo trình, archive/alias theo nguồn, build lặp cùng bytes, ZIP/test contract, chống xóa seed khi Location sai |
| Trình duyệt | `npx playwright test` | 8 test đạt trên Edge; kiểm cả 35 bài ở mobile, HTTP và file://, highlight, copy, quiz, tìm tiếng Việt không dấu, tiến độ, draft/reset/download, storage/clipboard bị chặn, hai tab và tương phản trang practice |
| Starter compile | `mvn -B -ntp -f practice/spring-foundations/starter/pom.xml -DskipTests package` | BUILD SUCCESS |
| Starter acceptance | `mvn -B -ntp -f practice/spring-foundations/starter/pom.xml test` | 17 test: 7 đạt, 4 assertion failure và 6 error do TODO; thất bại có chủ đích, không phải implementation hoàn tất |
| Solution | `mvn -B -ntp -f practice/spring-foundations/solution/pom.xml verify` | 17 test, 0 failure/error, BUILD SUCCESS; có 3 test với server RANDOM_PORT và HTTP client/cookie thật |
| HTTP tới JAR | Chạy solution JAR, sau đó `python practice/spring-foundations/verify_http.py` | 15 response đạt; credential, CSRF, CRUD, Location/read-back, conflict, dữ liệu sau lỗi và dọn đúng group đã tạo |
| Tài liệu công khai | `python scripts/check_sources.py` | 88/88 URL HTTP 200; title và resolved URL trong JSON kèm theo |
| Diff | `git diff --check` | Exit 0, không lỗi whitespace; Git có thông báo LF/CRLF theo cấu hình Windows |

Môi trường thực tế: Windows, JDK Temurin 25.0.4.1, Maven 3.9.16, Boot 3.5.10, H2. Java release trong POM là 17; `javap` xác nhận major version 61. Không tuyên bố đã chạy trên JVM 17 thật. HTML/CSS đã xem qua ảnh chụp desktop/mobile; không chỉ dựa vào test DOM.

## Review độc lập và các sửa quan trọng

Reviewer chỉ đọc đã rà source, metadata, output, demo và bản gốc Git. Các findings quan trọng đã được sửa trong một lượt xử lý:

- Tab chưa sửa không được pagehide ghi đè nháp tab khác. Regression được quan sát thất bại trước sửa và đạt sau sửa.
- Verifier không tin Location để xóa khi chưa xác minh ID mới, tên ngẫu nhiên và GET read-back. Test với implementation giả lập trả nhầm Location đã tái hiện xóa seed ở bản cũ và đạt sau sửa.
- Policy ERROR dispatch: HTTP thật từng trả 401 thay vì 403 khi CSRF bị chặn. Test RANDOM_PORT tái hiện; cho phép dispatcher ERROR để giữ lỗi gốc, không mở request bình thường. Suite 17 test đạt sau sửa.
- Đồ án thay thang điểm chỉ thao tác demo bằng thang điểm implementation/dữ liệu/security/test/bàn giao; walkthrough tách riêng.
- Lời giải testing/CSRF thực sự gửi request và kiểm dữ liệu; SOLID có use case gọi store.save. Bài HTTP dùng endpoint của app được hướng dẫn chạy. Đường dẫn lệnh Maven từ trang semantic được sửa về đúng vị trí demo.
- Offering từ chối ID lặp, account chuẩn hóa ID lặp; phục hồi validation đầu vào và nói rõ hai contract.
- Alias video không dò ID chung trên toàn khóa; phục hồi các video pointer bị rơi khi chuyển footer/inline thành archive tùy chọn.

Không yêu cầu lượt review thứ hai; sửa được kiểm bằng regression, kiểm tra source và suite phù hợp. Không còn finding quan trọng được chủ động bỏ qua.

## Giới hạn

- Kiểm URL xác nhận khả dụng và danh tính tài liệu, không phải bằng chứng mọi câu chữ hoặc đoạn code đều đã chạy. Kiến thức được đối chiếu với tài liệu maintainer theo baseline; link nhánh có thể hiển thị patch mới hơn artifact demo.
- Không chạy lại toàn bộ demo cũ hoặc xác minh MySQL thật trong đợt này. Lịch sử cũ ở PROGRESS giữ nguyên phạm vi ngày kiểm tra gốc. H2 không chứng minh SQL/locking trên DB khác.
- Lab OAuth2/OIDC với provider thật chưa được tích hợp. Bài tương ứng ghi rõ là cơ chế, khung cấu hình và bài thiết kế; placeholder issuer không phải endpoint chạy được.
- Editor sửa/lưu/tải snippet, không biên dịch/chấm Java. Suite starter không chấm toàn bộ 35 bài hoặc account/membership mở rộng; đồ án yêu cầu viết test bổ sung.
- Chưa làm đăng nhập, đồng bộ tiến độ hoặc bảo vệ nội dung. Chưa commit, push hay publish. Các tiến trình Java do lượt kiểm tra này khởi chạy đã được dừng.

Nguồn kiểm URL: [spring-sources-2026-11-19.json](spring-sources-2026-11-19.json).

## Cập nhật: highlight trực tiếp khi gõ

Theo yêu cầu tiếp theo, bỏ hẳn mục xem trước màu cú pháp. Ô gõ dùng CodeMirror đóng gói offline, hỗ trợ Java/YAML/PowerShell, số dòng và hoàn tác; textarea cũ giữ làm model lưu nháp/tải mã và fallback khi bundle bị chặn. Không triển khai backend Node.js/TypeScript trong lượt này theo yêu cầu tạm dừng.

Kiểm tra sau đổi: build editor/HTML đạt; 11 browser tests và 6 Python tests đạt. Browser kiểm nhập trực tiếp có màu, không có preview, nội dung dài cuộn hai chiều, Java/YAML/PowerShell, file://, fallback khi bundle không tải, reset/download, multi-tab và toàn bộ 35 trang mobile. Ảnh `test-results/direct-editor-desktop.png` và `direct-editor-mobile.png` đã được xem để kiểm tra kết quả hiển thị.
