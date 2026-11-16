---
name: backend-lesson
description: Use when a Backend Service project session receives a video or course folder, or asks to draft, review, continue, or check progress on a lesson. Supports multiple courses and source folders.
---

# Biên soạn bài học Backend Service

## Xác định nguồn và phạm vi

1. Dùng thư mục chứa `AGENTS.md` của Backend Service làm gốc. Mở `lessons/COURSES.md` và `PROGRESS.md` của khóa liên quan. Dùng các file đó cùng thư mục bài hiện có để tiếp tục công việc giữa các session.
2. Với link video, mở nguồn bằng quyền xem hiện có. Đối chiếu ID hoặc URL gốc của video trước, rồi đối chiếu thư mục chứa và tên video hiển thị. Dùng bằng chứng này để chọn khóa, mục bài và đường dẫn. Ghi URL đã xác minh vào `PROGRESS.md` khi nhận bài. Tên trùng ở nhiều khóa hoặc hai tệp trùng tên trong cùng thư mục cần phân biệt bằng nguồn thực tế.
3. Với link thư mục, kiểm kê tên video và đối chiếu danh mục. Một khóa có thể lấy nguồn từ nhiều thư mục. Với khóa mới, dùng tên và thứ tự xác nhận được từ nguồn hoặc lời user, tạo mục trong `lessons/COURSES.md` và bảng `PROGRESS.md` của khóa. Nếu chưa rõ đây là nguồn bổ sung cho khóa cũ hay một khóa mới, chỉ hỏi thông tin còn thiếu sau khi đã kiểm tra nguồn.
4. Yêu cầu về video hoặc bài cụ thể quyết định phạm vi. Khi user chỉ gửi một thư mục, cập nhật danh mục rồi làm tối đa một bài trong lượt đó. Tiếp tục mục `Đang làm` nếu có đúng một mục trong phạm vi, nếu không thì lấy mục `Cần bổ sung` hoặc `Chưa làm` đầu tiên theo thứ tự khóa. Nếu có nhiều mục đang dở hoặc thứ tự không thể xác định an toàn, báo lựa chọn cụ thể. Khi user yêu cầu nhiều bài, theo phạm vi họ chỉ định.

## Lấy nội dung từ video

- Đọc transcript hoặc phụ đề trên trình phát nếu có. Lập sườn bao phủ toàn bộ thời lượng và đọc kỹ các đoạn chuyển chủ đề, code, cấu hình và gỡ lỗi. Đối chiếu đoạn quan trọng với khung hình, log hoặc tài liệu đi kèm. Với Google Drive chỉ có quyền xem, dùng chức năng hiển thị được cấp quyền.
- Xác định kiến thức và bài tập giảng viên thực sự dạy. Khi khảo sát nguồn, ghi các thử nghiệm live coding, kết quả và phần còn dở để xác minh nội dung và chọn mốc xem lại. Với từ nhận dạng sai hoặc code khó đọc, dựa vào màn hình hoặc nguồn kỹ thuật để xác minh. Ghi rõ phần chưa đọc được hay thiếu quyền truy cập.
- Tra tài liệu chính thức đúng công nghệ và phiên bản liên quan. Dùng đặc tả hoặc tài liệu maintainer để giải thích cơ chế. Đánh dấu nội dung mở rộng, khác biệt phiên bản và code dựng lại để người đọc biết ví dụ nào đến từ video, ví dụ nào để thực hành thêm.

## Viết bài tự học

- Xem bài mẫu `lessons/springboot/buoi-01/index.html` để theo cấu trúc và giao diện. Dùng `lessons/<khoa>/<bai>/index.html`, thư mục `demo/` khi bài cần code độc lập và CSS/JS dùng chung trong `assets/`.
- Viết như tài liệu gốc cho người chưa biết video tồn tại. Chọn thứ tự theo kiến thức cần có và câu hỏi người học cần giải quyết. Với mỗi ví dụ chính, nêu tình huống, dữ liệu ban đầu, thao tác, kết quả mong đợi và cơ chế tạo ra kết quả. Dẫn lại bài trước để ôn sâu khi cần, đồng thời giải thích những chi tiết cần thiết để hiểu ví dụ ngay tại trang đang đọc.
- Đặt diễn biến trên lớp, khác biệt giữa demo và video, và mốc thời gian trong phần xem lại hoặc ghi chú nguồn. Thay một câu như “Ở phần chữa đầu buổi, video kiểm tra danh sách detail” bằng bài toán đầy đủ, chẳng hạn offering đang có `[1, 2]`, client yêu cầu `[2, 3]`, nên bảng nối phải gỡ `1`, giữ `2`, thêm `3`. Bỏ cụm dẫn theo video chưa đủ nếu người đọc vẫn phải đoán dữ liệu, mục tiêu hoặc bước kiểm tra.
- Mỗi bài có mục tiêu, kiến thức cần biết trước, mục lục, giải thích khái niệm và cơ chế, ví dụ có đầu vào và đầu ra mong đợi, lỗi thường gặp, câu hỏi tự kiểm tra có đáp án và nguồn đối chiếu.
- Với live coding, chuyển thao tác thành trình tự thực hành: dựng từng phần, quan sát lỗi, kiểm tra giả thuyết, sửa và chạy lại. Dùng code hoặc log ngắn cho các bước có giá trị học tập. Đưa bản hoàn chỉnh và hướng dẫn chạy để người học có chỗ đối chiếu. Chỉ dùng đoạn video làm tài liệu bổ trợ, bài đọc cần đủ để tự làm các bước chính.
- Trước khi đánh dấu `Hoàn tất`, đọc lại từ góc nhìn người mới và bỏ qua toàn bộ liên kết hoặc ghi chú video. Dùng từng ví dụ chính để kiểm tra người học có đủ dữ liệu để dự đoán kết quả, giải thích vì sao kết quả đúng và thực hiện bước kiểm chứng từ trang web hay không. Thử lần theo một bài gỡ lỗi từ dấu hiệu đến nguyên nhân và cách xác nhận đã sửa. Sửa các chỗ còn phụ thuộc bối cảnh video rồi rà lại. Cập nhật trang danh mục của khóa khi bài đã có nội dung. Thêm liên kết ở trang chủ khi có khóa mới.

## Ghi lại tiến độ

- Cập nhật đúng dòng trong `PROGRESS.md` từ lúc bắt đầu. Dùng `Đang làm` cho bài đang xử lý, `Cần bổ sung` cho bài đã có nội dung nhưng còn phần việc cụ thể, `Chưa làm` cho bài đã biết nguồn, và `Hoàn tất` sau khi kiểm tra nội dung và đầu ra theo phạm vi yêu cầu.
- Ghi đường dẫn bài, nguồn đã kiểm tra, phần đã làm, điểm còn thiếu và bước tiếp theo. Khi gặp blocker, ghi điều kiện cần để tiếp tục ngay trên dòng hoặc ghi chú của bài. Mỗi khóa theo tiến độ riêng, kể cả khi nhiều session đang làm các khóa khác nhau.
- Kiểm tra điều hướng, đường dẫn tương đối, mốc video và chạy ví dụ khi môi trường cho phép. Ghi môi trường thực tế đã kiểm thử, ví dụ H2 hay MySQL, để session sau biết phần nào còn cần xác nhận.
