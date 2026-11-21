# Tiến độ giáo trình Spring — sau refactor 19/11/2026

**Mô phỏng · 21/11/2026.** Cả 42 bài có liên kết mô phỏng trong mục lục. Validation và Phân quyền dùng giao diện theo tình huống. 40 bài còn lại có dữ liệu riêng và khung đối chiếu ba bước. Bài Phân quyền phân biệt rule HTTP, `@PreAuthorize` ở service và quyền trên nhóm. Bốn ca method security đã chạy từ ZIP trên Spring Boot 3.5.10. Kết quả của các mô phỏng trên web là minh họa có điều kiện.

**Biên soạn phần còn lại:** đã cập nhật 32 bài hiện có và thêm 7 bài về auto-configuration, transaction, Event/Outbox, HTTP client chịu lỗi, async, cache và vòng đời triển khai. Đưa JPA nền lên trước REST ghi và transaction lên trước Event. Bản web có 42 bài trong 12 phần, 84 tình huống tự đánh giá và các đề thực hành theo đề cương. Gói Maven nâng cao có ca kiểm chứng proxy, back off, rollback, event phase, outbox, cache, timeout và executor. Các ca PostgreSQL/Testcontainers, issuer thật, nhiều instance và rollout vẫn cần chạy trong môi trường tương ứng.

**Kiểm tra cách hiểu:** 42/42 bài có hai tình huống riêng để dev dự đoán kết quả, giải thích cơ chế và nêu cách kiểm chứng. Mỗi tình huống có đáp án và tiêu chí tự đánh giá mở ngay trên web. Trắc nghiệm nằm trong phần ôn nhanh.

**Hoàn tất lượt biên soạn đầu của Spring Core:** đã viết lại IoC, đăng ký/chọn bean (gồm annotation và meta-annotation) và vòng đời bean bằng cùng use case gửi lời mời. [Lab C1 và C2](../../practice/spring-core-lab/README.md) có yêu cầu và ca nghiệm thu riêng. Sáu test Maven đạt trên Spring Boot 3.5.10, JDK 25, target Java 17. Kiểm tra được bài đọc, liên kết và editor trên web. Chặng kế tiếp nối sang proxy/AOP và cách Boot quyết định cấu hình.

**Đề cương biên soạn tiếp:** đã tổng hợp nguồn kỹ thuật và xác định 12 cụm học, 28 bài thực hành, tiêu chí đánh giá và thứ tự triển khai. Phần nâng cao gồm tích hợp API, async/scheduling, cache và vòng đời triển khai. [Đề cương Spring Boot từ cơ chế đến triển khai](../../docs/spring-boot-curriculum.md). Các bài thực hành mới đang ở mức đặc tả.

**Review mạch học cho dev:** đã đối chiếu 35 bài ở phiên bản trước khi biên soạn thêm 7 bài. [Báo cáo từng bài và thứ tự đề xuất](../../docs/verification/spring-curriculum-learning-review.md).

**Rà bài tập 20/11/2026:** đã rà 35/35 starter và lời giải; thêm hướng dẫn giữ/thay code riêng từng bài, chuẩn hóa 31 bài đối chiếu toàn đoạn và 4 bài tự nghiệm thu. Sửa lời giải thiếu khung ở Bean registration, API errors, Dynamic query, Authentication; bổ sung controller/@Valid thật ở Validation và kiểu dữ liệu có sẵn ở SOLID. Editor Java/YAML/PowerShell đã kiểm tra Tab/Shift+Tab/Enter. 60 kiểm tra code/nội dung, 22 browser tests (gồm kiểm từng bài), 7 Python tests và production smoke root đạt. Không chạy/compile toàn bộ snippet hay demo Java trong lượt rà này. [Chi tiết và giới hạn](../../docs/verification/2026-11-20-all-exercises.md).

**Cập nhật FE React:** giao diện chính hiện ở `frontend/src/`, chạy bằng `npm run dev` tại 127.0.0.1:8765. Chọn nhóm chỉ mở bài thuộc nhóm đó. Giữ nội dung 35 bài và các keys nháp/tiến độ cũ; HTML tại lessons/ là đầu ra trung gian để xuất nội dung, không còn là FE chính để chạy bằng Python/file://. [Bằng chứng chuyển React](../../docs/verification/2026-11-19-react-frontend.md): 15 browser tests, 7 Python tests, build/typecheck và production deep links/base path đạt. Các kiểm tra file:// ghi ở đợt trước chỉ áp dụng bản FE tĩnh cũ.

Giáo trình hiện có 42 bài/12 phần theo kiến thức, đã tách/gộp độc lập với ranh giới video. Nguồn biên soạn là `content/springboot/`. Video là tham khảo tùy chọn và URL buổi cũ là alias.

[Project thực hành coding](../../practice/spring-foundations/index.html): starter TODO, solution, 17 test; editor trên web không thực thi Java. [Walkthrough demo tùy chọn](../../practice/reference-directory/index.html) tách khỏi đồ án tự triển khai.

## Phạm vi và kiểm chứng

- Giữ baseline Boot 3.5.10/Java 17; môi trường chạy kiểm thử hiện tại JDK 25.0.4.1, Maven 3.9.16, H2, bytecode Java 17.
- Có kiểm tra toàn bộ link/fragment, build lặp, ZIP/test contract, frontend qua Edge và file://. Báo cáo chi tiết và giới hạn ở [verification](../../docs/verification/2026-11-19-spring-curriculum.md).
- Đăng nhập bảo vệ nội dung chưa triển khai theo phạm vi được thống nhất. React được phép nếu cần; FE hiện tại vẫn tĩnh.
- Lịch sử xác minh demo bên dưới là bằng chứng của đợt trước, không coi là đã chạy lại toàn bộ MySQL hoặc mọi đoạn code trong đợt này.

## Danh mục hiện tại

| Phần | Bài theo chủ đề | Trạng thái |
| --- | --- | --- |
| Nền tảng backend | [HTTP, môi trường và cách kiểm chứng backend](nen-tang-http/index.html) | Đã biên soạn và review; có bài tập |
| Spring Core | [IoC container và đồ thị dependency](ioc-container/index.html) | Đã biên soạn và review; có bài tập |
| Spring Core | [Thiết kế trách nhiệm và SOLID](design-solid/index.html) | Đã biên soạn và review; có bài tập |
| Spring Core | [Đăng ký và lựa chọn bean](bean-registration/index.html) | Đã biên soạn và review; có bài tập |
| Spring Core | [Vòng đời bean và quản lý trạng thái](bean-lifecycle/index.html) | Đã biên soạn và review; có bài tập |
| Spring Core | [Proxy, AOP và ranh giới transaction](aop-transaction/index.html) | Đã biên soạn và review; có bài tập |
| Spring Boot | [Spring Boot: auto-configuration, properties và profiles](boot-configuration/index.html) | Đã biên soạn và review; có bài tập |
| Spring Boot | [Datasource, schema và kết nối cơ sở dữ liệu](boot-datasource/index.html) | Đã biên soạn và review; có bài tập |
| Spring Web MVC | [Luồng request trong Spring Web MVC](mvc-request-flow/index.html) | Đã biên soạn và review; có bài tập |
| Spring Web MVC | [Request binding và chuyển đổi kiểu dữ liệu](mvc-binding/index.html) | Đã biên soạn và review; có bài tập |
| Spring Web MVC | [DTO và ranh giới dữ liệu API](dto-contracts/index.html) | Đã biên soạn và review; có bài tập |
| Spring Web MVC | [REST: tạo, cập nhật và định danh tài nguyên](rest-write/index.html) | Đã biên soạn và review; có bài tập |
| Spring Web MVC | [Thiết kế hợp đồng API từ use case](api-contract-design/index.html) | Đã biên soạn và review; có bài tập |
| Spring Web MVC | [Validation, constraint tùy biến và i18n](bean-validation/index.html) | Đã biên soạn và review; có bài tập |
| Spring Web MVC | [Chuẩn hóa lỗi API với ProblemDetail](api-errors/index.html) | Đã biên soạn và review; có bài tập |
| Dữ liệu và transaction | [JDBC, ORM và vòng đời entity JPA](jpa-fundamentals/index.html) | Đã biên soạn và review; có bài tập |
| Dữ liệu và transaction | [Ánh xạ quan hệ một–một](jpa-one-to-one/index.html) | Đã biên soạn và review; có bài tập |
| Dữ liệu và transaction | [Quan hệ một–nhiều và entity bảng nối](jpa-relationships/index.html) | Đã biên soạn và review; có bài tập |
| Dữ liệu và transaction | [Chọn kiểu truy vấn và quản lý bulk update](jpa-query-bulk/index.html) | Đã biên soạn và review; có bài tập |
| Dữ liệu và transaction | [DTO mapping và projection ở tầng truy vấn](jpa-projections/index.html) | Đã biên soạn và review; có bài tập |
| Dữ liệu và transaction | [Tìm kiếm động với Criteria và Specification](dynamic-query/index.html) | Đã biên soạn và review; có bài tập |
| Dữ liệu và transaction | [Phân trang, thứ tự ổn định và chi phí truy vấn](data-pagination/index.html) | Đã biên soạn và review; có bài tập |
| Dữ liệu và transaction | [Fetch plan, lazy loading và N+1](jpa-fetch-plan/index.html) | Đã biên soạn và review; có bài tập |
| Dữ liệu và transaction | [Thay thế tập liên kết và tính nhất quán](data-collection-update/index.html) | Đã biên soạn và review; có bài tập |
| Spring Security | [Authentication và lưu mật khẩu](security-authentication/index.html) | Đã biên soạn và review; có bài tập |
| Spring Security | [Authorization ở request và method](security-authorization/index.html) | Hoàn tất mô phỏng 4 tình huống. Đã kiểm tra mở đáp án theo từng ca trên kích thước điện thoại. |
| Spring Security | [Session, CSRF và CORS](security-session-csrf/index.html) | Đã biên soạn và review; có bài tập |
| Spring Security | [Lab kiểm chứng policy Security](security-lab/index.html) | Đã biên soạn và review; có bài tập |
| Spring Security | [OAuth2, OpenID Connect và JWT Resource Server](security-oauth2/index.html) | Đã biên soạn cơ chế/thiết kế; chưa có lab provider tích hợp |
| Kiểm thử và vận hành | [Chiến lược kiểm thử và vận hành Spring Boot](testing-deployment/index.html) | Đã biên soạn và review; có bài tập |
| Kiểm thử và vận hành | [Logging và quan sát ứng dụng](logging-observability/index.html) | Đã biên soạn và review; có bài tập |
| Kiểm thử và vận hành | [Gỡ lỗi theo dấu request qua các tầng](debugging-request-flow/index.html) | Đã biên soạn và review; có bài tập |
| Dự án và tự đánh giá | [Dự án: thiết kế danh bạ user và group](project-directory/index.html) | Đã biên soạn và review; có bài tập |
| Dự án và tự đánh giá | [Thiết kế API danh sách account](api-list-contract/index.html) | Đã biên soạn và review; có bài tập |
| Dự án và tự đánh giá | [Đồ án: tự xây backend account và group](project-capstone/index.html) | Đã biên soạn và review; có bài tập |

---

# Lịch sử nguồn và kiểm tra trước refactor

Nguồn khóa là thư mục [Record-Spring trên Google Drive](https://drive.google.com/drive/folders/1HX18CWQShml5hZyAwlfGY7ijznzm5dTz). Danh sách dưới đây ghi thứ tự dự kiến từ các tên tệp đã thấy. Với bài chưa làm, đối chiếu tên, thư mục và URL video trước khi biên soạn. Slug cho các bài đó là đường dẫn dự kiến.

| Bài | Slug | Trạng thái | Video hoặc ghi chú nguồn |
| --- | --- | --- | --- |
| [Buổi 1 · API đọc sản phẩm](buoi-01/index.html) | buoi-01 | Hoàn tất | [Railway 89 · Buổi 1 · 27.12.2024](https://drive.google.com/file/d/1cW61-1ARRNIeKo2WMezMz3IkfXkAJGsi/view). Đủ tiêu chí tự học. Tái hiện live coding là phần bổ sung tùy chọn. |
| [Buổi 2 · Spring Data JPA và tìm sản phẩm](buoi-02/index.html) | buoi-02 | Hoàn tất | [Railway 89 · Buổi 2 · 30.12.2024](https://drive.google.com/file/d/1otS4D3yJT7nScKQrDfarYTW7Yj18k9cv/view). Đã đối chiếu transcript, màn hình và kiểm tra demo H2. |
| [Buổi 3 · Tạo và cập nhật sản phẩm](buoi-03/index.html) | buoi-03 | Hoàn tất | [Railway 89 · 03.01.2025](https://drive.google.com/file/d/1_E7h91MhMPgUnt6mFRBvCn_sv6cEUeZt/view). Đã kiểm tra POST, PUT, sinh ID và enum trên H2. |
| [Buổi 4 · Quan hệ một–một và fetch](buoi-04/index.html) | buoi-04 | Hoàn tất | [Railway 89 · 08.01.2025](https://drive.google.com/file/d/13XuT5Y9OeXAC9FszT8RLwBxqDkiiSkDU/view). Đã đối chiếu SQL của LAZY và fetch join trên H2. |
| [Buổi 5 · Quan hệ nhiều–nhiều và JPQL](buoi-05/index.html) | buoi-05 | Hoàn tất | [Railway 89 · 10.01.2025](https://drive.google.com/file/d/1j6FnHakgEx10OFEh-1Tj7JH9TZ73DiSS/view). Đã kiểm tra JPQL qua bảng nối và lỗi thuộc tính. |
| [Buổi 6 · DTO, validation và gán chi tiết](buoi-06/index.html) | buoi-06 | Hoàn tất | [Railway 89 · 13.01.2025](https://drive.google.com/file/d/1MpU2daNue6AIHFLCKBFLPIWDFjgeCmX-/view). Đã kiểm tra thay thế tập liên kết, gọi lặp, ID thiếu và rollback. |
| [Buổi 7 · Xóa liên kết và tìm kiếm động](buoi-07/index.html) | buoi-07 | Hoàn tất | [Railway 89 · 15.01.2025](https://drive.google.com/file/d/1Ez-srzoJ4l-YZR87GAflitn73FIIS1de/view). Đã kiểm tra Criteria, bulk delete, khóa ngoại và rollback trên H2. |
| [Buổi 8 · Thực hành quản lý user và group](buoi-08/index.html) | buoi-08 | Hoàn tất | [Railway 89 · tệp ghi 17.01.2024](https://drive.google.com/file/d/1p-DeTUgiThPstBbsldVLZxkxnUN8lPDe/view). Đối chiếu đề và màn hình cuối buổi. Demo H2 đạt CRUD, lọc và membership. |
| [Buổi 9 · Thiết kế từ yêu cầu, SOLID và DI](buoi-09/index.html) | buoi-09 | Hoàn tất | [Railway 89 · 20.01.2025](https://drive.google.com/file/d/1dwJzfGIBXfsskU0fpZQe-QsHrQFEm8_w/view). Đã chạy ví dụ Java thuần và tái hiện lỗi thuộc tính trong derived query. |
| [Buổi 10 · Spring Bean, scope và chọn dependency](buoi-10/index.html) | buoi-10 | Hoàn tất | [Bản dùng lấy mốc · 22.01.2025](https://drive.google.com/file/d/1FfjHVfoSt9X1SFUB5_y9jX-dMjK2uNQj/view) · [Tệp cùng tên](https://drive.google.com/file/d/1xVGwm83DXHVxcPvgtRXxiVr0JoL2sSmr/view). Đã đối chiếu chủ đề tại các mốc chính và chạy các ca lỗi bean, route, schema. |
| [Buổi 11 · Truy vấn Spring Data JPA và cập nhật hàng loạt](buoi-11/index.html) | buoi-11 | Hoàn tất | [Railway 89 · Buổi 11](https://drive.google.com/file/d/16V-WFgKb3Xi7Is8ewczwW65qwNZeeU6r/view). Đã đối chiếu phụ đề đến 2:08:37; kiểm tra nhanh hai khung hình đoạn sau không thấy nội dung chia sẻ. Demo H2 đã kiểm tra derived, JPQL, SQL native và bulk UPDATE/DELETE. |
| [Buổi 12 · Phân trang, sắp xếp, Lombok và DevTools](buoi-12/index.html) | buoi-12 | Hoàn tất | [Railway 89 · Buổi 12](https://drive.google.com/file/d/1PqXt2ugQHNQ963FBbYti8bp-Ret1KTXv/view). Đã đối chiếu kết quả Page trên màn hình; hai mode JPA và SQL cùng JSON trên H2, có kiểm tra sort ổn định và tham số sai. |
| [Buổi 13 · DTO, ModelMapper và tìm kiếm bằng Specification](buoi-13/index.html) | buoi-13 | Hoàn tất | [Railway 89 · Buổi 13](https://drive.google.com/file/d/1sds_NIloUPofAD7NXJKnSr6t73eHdhWB/view). Đã đối chiếu ModelMapper và Specification; kiểm tra JSON, cột SELECT, điều kiện lọc và phân trang trên H2. |
| [Buổi 14 · Thiết kế API quản lý group và account từ giao diện](buoi-14/index.html) | buoi-14 | Hoàn tất | [Railway 89 · Buổi 14](https://drive.google.com/file/d/1uQQGwDZ-ianRFtGSkmdRO0gYEOAx2q70/view). Đã đối chiếu đề từ UI; kiểm tra CRUD, Location, xung đột ID trong body và luồng tạo/sửa group trên giao diện. |
| [Buổi 15 · Bean Validation, constraint tự viết và thông báo đa ngôn ngữ](buoi-15/index.html) | buoi-15 | Hoàn tất | [Railway 89 · Buổi 15](https://drive.google.com/file/d/1ppVD0WlS5RYTSzkGFE0rOg2OesM2olhk/view). Đã đối chiếu đề đăng ký; kiểm tra constraint, tiếng Việt/Anh, input sai kiểu và input sai quy tắc. |
| [Buổi 16 · Chuẩn hóa lỗi API bằng RestControllerAdvice](buoi-16/index.html) | buoi-16 | Hoàn tất | [Railway 89 · Buổi 16](https://drive.google.com/file/d/1Ma8b-o2cNIQepzEgsatOfcvJVmKTbKTV/view). Đã kiểm tra ProblemDetail, mã lỗi HTTP và tái hiện trùng handler lớp cha. Spring Data REST là bài mở rộng riêng. |
| [Buổi 17 · Spring Security, logging và tổng hợp quản lý group](buoi-17/index.html) | buoi-17 | Hoàn tất | [Railway 89 · Buổi 17](https://drive.google.com/file/d/1XpFn-fQp-E4jA76wHZUcRtMpvgK37JzS/view). Đã kiểm tra HTTP Basic, CSRF, role, log, thay membership và số đếm group trên API và giao diện. |
| [Ôn tập Java advanced · API danh sách account](on-tap-java-advanced/index.html) | on-tap-java-advanced | Hoàn tất | [Railway 89 · 19.02.2025](https://drive.google.com/file/d/1MBn-qvrQshPcaFiFAunT7kAQHyxIsvGU/view). Đã đối chiếu đề, Page JSON và ca 401. Đã chạy tìm account, phân trang product và xem WWW-Authenticate. |
| [Ôn tập 02 · Theo dấu một request qua Spring, JPA và Security](on-tap-02/index.html) | on-tap-02 | Hoàn tất | [Railway 89 · 21.02.2025](https://drive.google.com/file/d/1vtaB8p0wJyGBuq_ARPg-sWwcJEpqnQeB/view). Đã đối chiếu slide quan hệ và Basic. Đã chạy 401, hai ca 403, validation 400 và xác nhận sửa thành công qua Location. |
| [Buổi thi lần 2 · Tự thi thực hành API account và group](thi-lan-02/index.html) | thi-lan-02 | Hoàn tất | [Railway 89 · 24.02.2025](https://drive.google.com/file/d/1hr4o6FoVivFnbpQqammJLK8p8O4NZpdR/view). Đã đối chiếu Postman, walkthrough và code Security. Đã chạy CRUD, kiểm trạng thái sau lỗi, đếm liên kết và dọn dữ liệu. |

## Buổi 1 · kiểm tra và nội dung bổ sung tùy chọn

- [Trang bài học](buoi-01/index.html) đáp ứng phạm vi tự học: giải thích luồng Spring Boot/JPA, có ví dụ chạy được và câu hỏi có đáp án. Video dài 3 giờ 23 phút, có transcript tiếng Việt trên Drive; xem lại là tùy chọn. Ngày 16.11.2026 đã kiểm tra điều hướng và chạy lại `mvn -B -ntp test`: 4/4 bài test API trên H2. MySQL thật chưa được xác nhận.

Các mục dưới đây dùng khi muốn tái hiện live coding sát video hơn.

- Bổ sung trình tự thực hành từ `/products` với ID cố định đến `/products/{id}`. Ghi lại lỗi liên quan đến ID và cách kiểm tra dữ liệu trước khi ghi JSON. [Đoạn 2:42:51](https://drive.google.com/file/d/1cW61-1ARRNIeKo2WMezMz3IkfXkAJGsi/view?t=9771)
- Giải thích lỗi khi gọi repository chưa được gán, cách video dùng `@Service` và `@Autowired`, rồi nối sang constructor injection của demo. [Đoạn 2:04:03](https://drive.google.com/file/d/1cW61-1ARRNIeKo2WMezMz3IkfXkAJGsi/view?t=7443)
- Thêm bài thực hành kiểm tra phiên bản dependency Maven thực sự chọn, cùng ví dụ curl phân biệt lỗi kết nối và HTTP 404. [Maven 42:36](https://drive.google.com/file/d/1cW61-1ARRNIeKo2WMezMz3IkfXkAJGsi/view?t=2556) · [curl 1:18:50](https://drive.google.com/file/d/1cW61-1ARRNIeKo2WMezMz3IkfXkAJGsi/view?t=4730)
- Ghi lại thử nghiệm getter viết tay, sự khác nhau giữa plugin IDE và annotation processor, thao tác build lại và phần cấu hình còn dở ở cuối buổi. [Getter 3:02:22](https://drive.google.com/file/d/1cW61-1ARRNIeKo2WMezMz3IkfXkAJGsi/view?t=10942) · [Cấu hình 3:21:31](https://drive.google.com/file/d/1cW61-1ARRNIeKo2WMezMz3IkfXkAJGsi/view?t=12091)

## Buổi 2 · nguồn và kết quả kiểm tra

- Video dài 3:40:39. Đã đọc transcript tiếng Việt đến lời chào ở 3:16:46 và đối chiếu các màn hình về mapping, trường tính toán và repository. Bài thực hành cuối buổi dùng tên và giá.
- Bài có phần JDBC, ORM, ánh xạ entity, callback, API danh sách và hai truy vấn tìm sản phẩm, kèm bài tái hiện lỗi và 7 câu có đáp án. Demo bổ sung `@RequestParam`, thứ tự theo ID và dữ liệu H2 để tự chạy. Các đoạn JDBC và callback trong bài là ví dụ minh họa độc lập.
- Ngày 16.11.2026 đã kiểm tra liên kết tương đối và tham số của 39 liên kết mốc video. Demo đóng gói thành công với Spring Boot 3.5.10, Maven 3.9.16 và Java 25.0.4.1. Đã chạy 9 ca HTTP thật với H2, kiểm tra log SQL và bind, tái hiện lỗi khởi động khi thiếu `And` trên bản sao. Kiểm thử CSDL của demo dùng H2.

## Buổi 3–6 · nguồn và kết quả kiểm tra

- Đã đối chiếu transcript tiếng Việt và các khung hình về mã PUT, ánh xạ cột join, entity bảng nối, SQL và phản hồi gán chi tiết. Transcript hiện có đến 3:18:23 ở Buổi 3, 3:02:33 ở Buổi 4, 3:14:45 ở Buổi 5 và 3:14:42 ở Buổi 6.
- Bốn trang dùng một [demo Maven](buoi-06/demo/pom.xml), chạy Spring Boot 3.5.10 với H2 trong bộ nhớ. Buổi 4 có bảng riêng để quan sát một–một. Buổi 6 dùng PUT thay toàn bộ tập chi tiết làm lời giải mở rộng cho bài tập cuối video. Các trang ghi rõ những điều chỉnh của demo.
- Ngày 16.11.2026 đã đóng gói demo với Maven 3.9.16 và Java 25.0.4.1, chạy 36 ca HTTP và so số truy vấn SELECT của Buổi 4. Đã tái hiện 6 tình huống lỗi trong bản sao, gồm thiếu bộ sinh ID, trùng khóa, thiếu FK đích, derived query sai, JPQL dùng tên cột và rollback khi ghi trùng liên kết. Kết quả CSDL áp dụng cho H2.
- Đã kiểm tra điều hướng tương đối, ID video và tham số thời gian của 86 liên kết, cùng 22 câu hỏi có đáp án.
- Rà lại ngày 16.11.2026. Làm rõ điều kiện bắt buộc ở quan hệ một–một, bổ sung truy vấn con `IN` theo đoạn chữa Buổi 5 và chỉnh cấu hình Jackson của demo để từ chối số thập phân cho trường số nguyên và số thứ tự cho enum. Đã chạy lại các luồng HTTP trên H2, đối chiếu 3 kết quả JOIN với truy vấn con, kiểm tra dữ liệu sau các request bị từ chối, và xác nhận 87 liên kết mốc video sau khi bổ sung.

## Buổi 7–10 · nguồn và kết quả kiểm tra

- Buổi 7, 9 và 10 dùng transcript tiếng Việt, có lời lần lượt đến 3:03:43, 3:08:26 và 3:07:42 theo bản được dẫn. Buổi 8 không có phụ đề trên Drive. Đã lấy đủ yêu cầu từ slide, kiểm tra khung hình phần làm bài và màn hình controller/schema cuối buổi. Demo Buổi 8 là lời giải tự học dựa trên đề, có đối chiếu phần chữa đầu Buổi 9.
- Hai tệp Buổi 10 có ID khác nhau, cùng thời lượng 3:12:27. Transcript ở các đoạn ôn DI, gỡ lỗi user, tự đăng ký bean và chọn ứng viên khớp về chủ đề và mốc gần nhau. Câu chữ phụ đề có chênh lệch. Dùng bản 1FfjHVfoSt9X1SFUB5_y9jX-dMjK2uNQj cho mốc của trang.
- Ngày 16.11.2026 đã đóng gói hai demo bằng Maven 3.9.16 và Java 25.0.4.1. Demo API chạy Spring Boot 3.5.10 và H2. Đã chạy 56 ca HTTP trên hai app, gồm 16 ca Buổi 7, 38 ca Buổi 8 và 2 ca Buổi 10. Đã thử hai request thêm cùng thành viên chạy đồng thời và đọc lại đúng một liên kết. Ca khôi phục bằng Qualifier với profile ambiguous chạy riêng và trả lại 200.
- Đã tái hiện 8 tình huống lỗi trên bản sao hoặc profile thực hành, gồm lỗi FK, rollback sau bulk delete, giờ làm âm, dependency null, derived query sai thuộc tính, thiếu bean theo qualifier, hai bean cùng kiểu và cột mapping không tồn tại. Hai ca lỗi xóa giữ nguyên offering và hai ID detail gốc. Demo Java Buổi 9 trả đúng 800000, 850000 và hai bản ghi.
- Đã rà từng bài theo luồng mục tiêu → cơ chế → chạy ví dụ → dự đoán đầu ra → gây lỗi và kiểm tra cách sửa. Đối chiếu 27 câu có đáp án, 55 mốc video và 130 liên kết nội bộ qua danh mục, Buổi 6 và bốn trang mới. Đã đi từ danh mục qua từng buổi trên trình duyệt, mở đáp án và kiểm tra phần hiển thị đoạn mã. Phạm vi xác nhận CSDL là H2.

## Buổi 11–17 · nguồn và kết quả kiểm tra

- Video được đối chiếu với danh sách Record-Spring. Các mốc phụ đề cuối quan sát được theo thứ tự: 2:08:37, 3:05:27, 3:18:17, 3:04:42, 3:00:42, 3:00:56 và 3:28:47. Đã đối chiếu khung hình cho metadata phân trang, Specification, đề giao diện group, đăng ký, lỗi trùng handler và cấu hình security đời cũ. Buổi 11 thiếu phụ đề từ 2:08:37 đến hết; lấy mẫu khung hình ở 2:20 và 2:40 không thấy mã hoặc slide. Các mốc xem lại nằm trong phần đã đối chiếu.
- Ngày 16.11.2026 đã rà bài đọc độc lập theo thứ tự đầu vào → cơ chế → kết quả → chẩn đoán và cách kiểm tra lại. Đã chạy các đoạn PowerShell chép từ cả bảy trang, mở đáp án và theo điều hướng liên buổi trên trình duyệt. Kiểm tra 43 câu có đáp án, 65 mốc video, 234 liên kết nội bộ trong phạm vi danh mục, Buổi 1 và Buổi 10–17, cùng 28 liên kết tài liệu chính thức trả HTTP 200.
- [Demo chung](buoi-17/demo/README.md) đã build bằng Maven 3.9.16 và Java 25.0.4.1, dùng Spring Boot 3.5.10, bytecode Java 17 và H2 2.3.232. [verify.py](buoi-17/demo/verify.py) kiểm tra 76 phản hồi HTTP, gồm tìm kiếm, metadata, Location, validation/i18n, trạng thái lỗi, quyền và membership. Log đã xác nhận projection chỉ lấy ID và tên, còn ModelMapper chạy sau truy vấn đọc entity. Giao diện localhost đã kiểm tra tạo/sửa group, gán nhiều group cho account, cập nhật số đếm và từ chối ghi với reader.
- Tái hiện bảy lỗi trong bản sao: tên cột thay cho thuộc tính JPQL, thiếu @Modifying, tham số SQL không khớp, bỏ kết quả ghép Specification, thiếu @Valid, trùng exception handler và đảo thứ tự rule Security. Phạm vi chạy thực tế là demo H2; Lombok, DevTools và Spring Data REST là phần mở rộng trình bày riêng, không bật trong JAR chung. Tái hiện sát màn hình lớp và thử MySQL thật là nội dung bổ sung.

## Ba buổi ôn tập và tự thi · nguồn và kết quả kiểm tra

- Đã xác minh ba bản ghi trong Record-Spring theo thứ tự 19, 21 và 24.02.2025. Transcript bắt đầu/kết thúc lần lượt ở 8:20–1:55:25, 34:41–3:02:37 và 11:55–2:32:55. Đã lấy mẫu khung hình đề account, DevTools, slide quan hệ, Basic Authentication, Postman và cấu hình phân quyền. Các mốc nằm trong khoảng có phụ đề; phần đề tự luyện và thang tự chấm được biên soạn cho website.
- Ngày 16.11.2026 đã rà bài đọc độc lập theo thứ tự yêu cầu → dữ liệu → cơ chế → đầu ra → gây lỗi và thử lại. Kiểm tra 21 câu có đáp án, 39 mốc video, 110 liên kết nội bộ trong phạm vi danh mục và các trang liên quan, cùng 11 liên kết tài liệu chính thức trả HTTP 200. Kiểm tra cấu trúc HTML bằng parser; lần thử mở trang qua trình duyệt trong ứng dụng bị chặn giao thức file.
- Đã đóng gói lại demo chung bằng Maven 3.9.16, Java 25.0.4.1 và Spring Boot 3.5.10. Đã chạy các khối PowerShell trong cả ba trang trên H2, bao gồm số đếm sau thay đổi membership, username trùng, cập nhật group đã xóa, 401, hai ca 403 và kiểm tra dữ liệu sau lỗi. Bộ verify.py kiểm tra 76 phản hồi HTTP. Mô hình account có role/phòng ban là ví dụ thiết kế; demo thực hành phân trang bằng product và chạy authentication với hai danh tính in-memory.

### Rà lại khả năng thực hành · Buổi thi lần 2

- Ngày 16.11.2026, viết lại hướng dẫn theo từng bước trên giao diện: khởi động và kiểm tra seed, tạo group, tìm/tạo account, sửa nhóm, gây lỗi rồi đọc lại dữ liệu, xóa và kiểm tra kết quả. Tách cách đọc Network và lệnh HTTP khỏi phần thao tác chính.
- Đã làm theo các bước trên demo H2: số đếm Backend 2 → 3 → 2, Exam Team 0 → 1; username trùng 409, group thiếu 404, reader 403, email và liên kết được giữ sau lỗi. Quan sát xóa group trả 204 trên giao diện; xóa account và tìm rỗng được xác nhận qua API. Chạy lại lệnh HTTP từ HTML, kiểm trang 2 và 3, 76 phản hồi trong verify.py, liên kết nội bộ và 13 mốc video.
