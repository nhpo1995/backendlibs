# Kiểm chứng chuyển FE sang React — 19/11/2026

## Thay đổi

FE chính dùng React 19.3.1, TypeScript và Vite 8.3.8. Router có trang chủ, danh mục toàn khóa, trang từng nhóm và trang từng bài. Chọn một nhóm chỉ render bài thuộc nhóm đó; hash nhóm cũ chuyển tới URL nhóm riêng. UI tương tác được quản lý bởi component React, không chạy script DOM cũ song song.

Nội dung tác giả vẫn ở content/. Pipeline Python tạo HTML trung gian rồi xuất JSON theo từng bài; Vite tải bài/editor thành chunk riêng. Tài nguyên học tập, source demo và ZIP được đóng gói có chủ đích, bỏ target/.git/node_modules/.env. Bản production có 67 entry HTML thực cho root, nhóm, bài, alias và thực hành; static host không cần rewrite để reload các URL đó.

## Kết quả

- `npm run build`: xuất nội dung, TypeScript check và Vite build đạt.
- `npx playwright test`: **15/15 đạt** trên Edge. Bao gồm home → đúng nhóm, reload, history, hash cũ, URL thư mục/query/anchor, dữ liệu bài tải chậm 3.5s, fragment sai encoding không crash, 35 trang mobile, editor highlight trực tiếp, Java/YAML/PowerShell, draft/reset/download/XSS, storage/clipboard bị chặn, editor fallback, multi-tab, quiz và progress.
- `python -m unittest discover -s tests -p 'test_*.py'`: **7/7 đạt**. Thêm kiểm chứng export React giữ nguyên code, nguồn HTTPS và các ID nội dung của toàn bộ 35 bài; các kiểm tra cấu trúc/ZIP/safety trước đó vẫn đạt.
- `node tests/production-smoke.cjs`: đạt với base `/` và `/backendlibs/`. Thử 67 deep-link entries qua HTTP trên server tĩnh không có SPA fallback, chọn nhóm, reload, draft, demo/ZIP, URL thư mục bài/alias/catalog/practice/module và không có JS error.
- Môi trường: Windows, Node 24.21.0, Edge; typecheck dùng TypeScript 7.0.2. Không thay implementation Java thực hành nên không chạy lại Maven trong lượt FE này.

## Review và regression

Reviewer độc lập chỉ đọc đã tìm và tái hiện hai lỗi ở dist: URL thư mục cũ không nhận route; anchor bị bỏ nếu payload tải quá 2.5s. Cả hai có regression quan sát RED trước sửa và GREEN sau sửa. Router chuẩn hóa URL thư mục, giữ query/hash; anchor dùng DOM observation + layout frames, không bỏ cuộc theo timeout tải dữ liệu. Không yêu cầu lượt re-review; chạy lại các regression và suite sau sửa.

CodeMirror được mount/destroy trong effect có cleanup, kể cả StrictMode. Keys localStorage giữ nguyên; test xác nhận nháp cũ, progress và flush khi chuyển route SPA trước autosave. Cổng dev mặc định giữ 8765 để có thể dùng lại origin trình duyệt cũ; chạy khác host/cổng không chia sẻ localStorage.

## Phạm vi

- Backend Node.js/TypeScript, đăng nhập và đồng bộ tài khoản vẫn chưa triển khai.
- Dùng `npm run dev` hoặc `npm run preview`; file:// và HTML trung gian không phải FE chính nữa.
- Nội dung vẫn công khai trong build. React route guard chưa và không tự bảo vệ nội dung trước khi có backend/tầng phân phối phù hợp.
- Chưa commit/push/publish. Dev server phục vụ xem thử tại 127.0.0.1:8765.
