# Rà toàn bộ bài tập lập trình — 20/11/2026

## Phạm vi và phát hiện

Đọc starter, lời giải, mục tiêu và tiêu chí của toàn bộ 35 bài Spring. Phạm vi là tính nhất quán của bài tập/editor và cơ chế đối chiếu; không tuyên bố đã chạy toàn bộ demo hoặc kiểm chứng ngữ nghĩa mọi implementation Java.

- Cả 35 bài có `lab.instructions` để chỉ rõ giữ khung nào, thay phần nào và phần nào cần thực hiện tiếp trong project. React và HTML trung gian cùng lấy hướng dẫn từ nguồn course.json.
- 31 bài code dùng đối chiếu toàn đoạn; 4 bài dùng tự nghiệm thu: boot-configuration, security-oauth2, debugging-request-flow, project-capstone. Không chấm checklist bằng độ giống văn bản.
- Bean registration: lời giải giữ cả cấu hình bean, thêm constructor chọn vietnamese và List<Greeting>, cùng endpoint minh họa. Starter có đủ interface/config/controller để điền TODO.
- API errors: lời giải có cả @RestControllerAdvice/class ApiErrors, không chỉ phương thức handler.
- Dynamic query và Authentication: lời giải giữ dòng khởi tạo trong starter, không yêu cầu người học xóa phần khung khi bổ sung code.
- Validation: starter/lời giải có cả record và controller; @Valid là code thực sự. Endpoint /registrations/check chỉ kiểm tra dữ liệu, không lưu đăng ký. Tiêu chí nêu rõ phạm vi snippet và phần nghiệm thu advice riêng.
- SOLID: chuyển các khai báo Work/PayPolicy đã có trong lời giải vào starter, để người học tập trung triển khai Checkout.
- Những bài yêu cầu sửa dòng cũ (sort, method chain, JPQL, field mutable) được hướng dẫn thay thế cụ thể. Không chấp nhận code trùng lặp hoặc câu lệnh throw giữ chỗ chỉ vì đã có phần đáp án.
- YAML: bổ sung thụt dòng sau khóa đang gõ dở; PowerShell: bổ sung thụt dòng sau dấu mở khối. Không dùng dấu câu trong string/comment để tăng lề. Java tiếp tục dùng cơ chế cú pháp riêng; Tab/Shift+Tab dùng đơn vị 4 dấu cách.

Nháp và keys localStorage cũ được giữ. Khi muốn dùng khung mới, người học có thể tải nháp trước rồi chọn Khôi phục starter; không tự ghi đè nháp.

## Bằng chứng thực thi

- `npm run build`: đạt, gồm TypeScript và đóng gói 67 entry production.
- `npm run test:code-check`: 60/60 đạt. Có kiểm tra từng bài, starter chưa làm không khớp, lời giải có thể đối chiếu/tự nghiệm thu, và điền TODO trong 5 bài có lỗi khung/validation vẫn giữ phần starter.
- `python -m unittest discover -s tests -p 'test_*.py'`: 7/7 đạt.
- `npm run test:browser`: 22/22 đạt trên Edge headless. Vòng kiểm tra đủ 35 bài trên mobile: hướng dẫn có mặt, starter không đạt nhầm, lời giải có thêm dòng trống được báo khớp hoặc yêu cầu nghiệm thu đúng chế độ, không tràn trang/lỗi JavaScript. Có test riêng Enter/Tab/Shift+Tab trên Java, YAML, PowerShell và dấu câu trong literal/comment.
- `node tests/production-smoke.cjs`: đạt root `/`, 67 route thật, nút đối chiếu/lazy chunk, reload, nháp và tài nguyên. Không build lại base path trong lần này.
- Đã xem ảnh `test-results/validation-exercise-reviewed.png`: hướng dẫn, phạm vi snippet và editor tô màu hiển thị đúng. Đã sửa khoảng trắng giữa hai câu hướng dẫn sau kiểm tra ảnh.

Không có môi trường chấm Java trên web; khớp mẫu không chứng minh compile/chạy thành công. Những cấu trúc thuộc repository, entity, controller hoặc test vẫn phải được đặt đúng file/import/dependency khi đưa vào project. Không triển khai backend hay đăng nhập.

## Tài liệu đối chiếu

- [Spring Framework 6.2 — Qualifiers](https://docs.spring.io/spring-framework/reference/6.2/core/beans/annotation-config/autowired-qualifiers.html): chọn dependency qua qualifier và inject collection.
- [Spring Framework 6.2 — RequestBody](https://docs.spring.io/spring-framework/reference/6.2/web/webmvc/mvc-controller/ann-methods/requestbody.html): @Valid trên request body và phản hồi 400 mặc định khi validation thất bại.
