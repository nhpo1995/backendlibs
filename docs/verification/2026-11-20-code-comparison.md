# Kiểm chứng nút đối chiếu bài tập — 2026-11-20

## Phạm vi

React editor có nút Kiểm tra, đối chiếu lời giải ngay trên trình duyệt. Java/YAML dùng cây cú pháp từ parser CodeMirror hiện có; PowerShell dùng tokenizer cho snippet của giáo trình. Bỏ qua định dạng/chú thích giữa thành phần code, giữ chuỗi, toán tử, ranh giới lệnh PowerShell và cấu trúc YAML. Không biên dịch/chạy Java và không đánh dấu hoàn thành bài.

Metadata `lab.comparison`: `whole` mặc định; `addition` cho đoạn Java chèn vào starter giữ nguyên; `manual` cho bài cần nghiệm thu theo hướng dẫn. Lời giải chỉ có chú thích tự chuyển sang thông báo tự kiểm chứng. Khác lời giải không đồng nghĩa implementation sai. Kết quả bị xóa khi sửa hoặc reset, giữ lại khi lưu nháp. Tải comparator bất đồng bộ không được hiển thị kết quả của nháp cũ.

## Kết quả đã chạy

- `npm run build`: đạt, bao gồm TypeScript và đóng gói 67 entry tĩnh (trang chủ + 66 deep links).
- `npm run test:code-check`: 14/14 đạt; định dạng Java, generic, literal, comment chưa đóng, YAML, PowerShell, chèn code vào starter và các lời giải hiện có.
- `python -m unittest discover -s tests -p 'test_*.py'`: 7/7 đạt.
- `npm run test:browser`: 18/18 đạt trên Edge headless; gồm 3 ca mới cho đối chiếu, reset/lưu và sửa trong lúc tải comparator.
- `node tests/production-smoke.cjs`: đạt trên bản build root `/`; kiểm tra nút mới và lazy chunk, 67 route, refresh, nháp và tài nguyên, không lỗi JavaScript. Không chạy lại build base path trong lượt này.
- Đã xem ảnh `test-results/code-check-match.png`: code tô màu trực tiếp, nút và thông báo khớp hiển thị đúng, lời giải vẫn đóng.

Chưa triển khai backend, đăng nhập hay môi trường thực thi Java. Việc khớp mẫu không chứng minh tính đúng đắn ngữ nghĩa hoặc chạy thành công.

## Bổ sung: placeholder và thao tác editor

Ba starter (`mvc-request-flow`, `rest-write`, `api-contract-design`) đã đổi dòng `throw new UnsupportedOperationException();` giữ chỗ thành chú thích TODO. Nháp cũ vẫn giữ nguyên; khi còn dòng throw giữ chỗ mà lời giải không có, kết quả yêu cầu xóa/thay dòng này và giải thích lỗi unreachable statement nếu đặt sau return. Không bỏ qua câu lệnh throw để cho code sai khớp mẫu.

CodeMirror được cấu hình đơn vị thụt lề 4 dấu cách và keymap Tab/Shift+Tab; Enter dùng cơ chế tự thụt dòng sẵn có. Hai ca browser mới đã tái hiện lỗi trước khi sửa và đạt sau sửa. Kiểm tra trực tiếp thêm với snippet method `ProductResponse find(long id) {` xác nhận Enter thụt 4 dấu cách. Build/typecheck, 15 unit tests đối chiếu, 7 Python tests và production smoke root đều đạt sau thay đổi.
