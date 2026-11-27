# Đề cương Spring Boot từ cơ chế đến triển khai

Đối tượng là developer đã vững Java Core, gồm interface, exception, annotation, reflection và collection. Kiểm tra nhanh SQL/HTTP đầu khóa bằng một request và một truy vấn. Nội dung bổ sung được trỏ theo kết quả kiểm tra đầu vào.

Đầu ra cuối khóa là một API danh bạ do học viên tự triển khai. Học viên có thể lần theo từ lúc Boot dựng context đến lúc request đi qua filter, binding, service proxy, transaction và event. Họ giải thích được nguyên nhân của lỗi, chứng minh bằng test hoặc quan sát runtime, và chọn cách sửa phù hợp với ràng buộc của hệ thống.

Đề cương kế thừa [review 35 bài hiện tại](verification/spring-curriculum-learning-review.md). Bài thực hành trong tài liệu này là đặc tả để biên soạn starter và nghiệm thu. Kết quả dự kiến cần được xác nhận trên môi trường của từng bài trước khi xuất bản.

## Thứ tự và kết quả học tập

| Cụm | Các bài theo thứ tự | Học viên phải giải thích được |
| --- | --- | --- |
| 1. Container và metadata | Khởi tạo context → đăng ký BeanDefinition và tìm ứng viên → annotation và meta-annotation → vòng đời, scope, post-processor và thread safety | Ai đọc metadata, đọc lúc nào, chỉnh định nghĩa hay instance, đối tượng inject là gì. So sánh @Component, @Bean và annotation do ứng dụng tự khai báo. |
| 2. AOP và Spring Boot | Lời gọi qua proxy → pointcut/advice và thứ tự interceptor → starter/BOM và auto-configuration → external config, ConfigurationProperties và chẩn đoán startup | Vì sao cùng một method có hành vi khác nhau khi gọi qua bean, qua this hoặc qua object tự new. Vì sao một cấu hình mặc định có hiệu lực hoặc rút lui. |
| 3. Biên HTTP và hợp đồng | Servlet/filter và DispatcherServlet → mapping, binding, conversion → DTO, mapping và validation → ProblemDetail, i18n và test MVC | Lỗi xảy ra trước hay sau controller, request/response DTO tách gì khỏi persistence, mã lỗi nào ổn định cho client. |
| 4. JPA, transaction và đồng thời | Datasource/JDBC và migration → EntityManager, persistence context và flush → service transaction và rollback → propagation → isolation, khóa và invariant | Vì sao có SQL mà vẫn rollback, tại sao self-invocation làm mất ranh giới dự kiến, hai transaction nhìn thấy gì và cơ chế nào bảo vệ dữ liệu. |
| 5. Truy vấn theo use case | Quan hệ và phía sở hữu → query/projection → bộ lọc động và pagination → fetch plan, N+1 và đọc kế hoạch SQL → hợp đồng danh sách | Vì sao JSON giống có thể dùng SQL khác. Chọn cột, thứ tự, fetch plan và index theo nhu cầu đọc. Đo thay vì đoán. |
| 6. Event và độ tin cậy | Gọi trực tiếp hay publish domain event → ApplicationEventPublisher và listener trong process → transaction-bound event và async → outbox, retry và idempotent consumer | Listener chạy lúc nào, payload cần gì, nhìn thấy dữ liệu nào, hệ thống phục hồi ra sao nếu lỗi sau commit hoặc gửi lặp. |
| 7. Spring Security | FilterChainProxy và SecurityContext → authentication → authorization theo action và ownership → session/CSRF/CORS → OAuth2 resource server và JWT | Filter nào xử lý request, phân biệt 401/403 theo cấu hình, kiểm chứng quyền ở đúng tầng và đối chiếu issuer/audience/scope trong API của lab. |
| 8. Kiểm thử và quan sát hệ thống | Chọn độ sâu test → DB thật với Testcontainers → artifact/migration/health → log, metric, trace → điều tra incident | Test thực thi phần nào, bằng chứng nào xác nhận dữ liệu thực đã đổi, và cách lần ngược từ response hoặc trace về điểm sai. |
| 9. Tích hợp API và xử lý lỗi phụ thuộc | HTTP client → connect/read timeout và ngân sách thời gian → lỗi tạm thời, retry và idempotency → circuit breaker | Phân biệt request chưa được xử lý với kết quả chưa biết. Chọn khi nào retry, dừng hoặc đối soát sau timeout. |
| 10. Async, scheduling và tài nguyên | Executor, hàng đợi và backpressure → context qua ranh giới thread → lịch chạy nhiều instance → task recovery | Xác định task chạy ở đâu, điều gì xảy ra khi hàng đợi đầy, khi tiến trình dừng hoặc khi hai instance cùng bắt một job. |
| 11. Cache và tính nhất quán | Cache theo use case đọc → key, TTL và eviction → ranh giới commit → cache stampede và nhiều instance | Xác định mức dữ liệu cũ chấp nhận được, tránh lẫn dữ liệu giữa scope khác nhau và kiểm chứng invalidation sau commit/rollback. |
| 12. Vòng đời khi triển khai | Startup/readiness/liveness → graceful shutdown và worker drain → migration tương thích khi rollout → đồ án tích hợp | Chọn thời điểm nhận/ngừng traffic, bảo toàn công việc chưa xong và triển khai hai phiên bản cùng dùng một schema. |

Kiểm thử nhỏ xuất hiện từ cụm 1. Cụm 8 hệ thống hóa cách chọn test và kiểm chứng trước bàn giao. SOLID được dùng khi tách policy/storage ở cụm 1 và khi thiết kế biên giữa module ở cụm 6. Bài tổng hợp hợp đồng đi sau pagination và validation. Bài rollback đi sau proxy và persistence context.

## Bài thực hành theo cụm

Mỗi cụm có hai hoặc ba tình huống. Bài đầu dựng hành vi đúng, bài sau làm biến thể, gây lỗi hoặc đặt tải đồng thời. Một bài thực hành cần có starter, seed, hành vi còn thiếu, lệnh chạy, bảng ca nghiệm thu và hướng giải thích sau khi làm. Học viên được dùng bất kỳ implementation nào thỏa hợp đồng và đạt kiểm tra.

| Cụm | Bài thực hành | Bằng chứng phải nộp |
| --- | --- | --- |
| 1 | **C1. Thêm hai kênh thông báo**. Chọn một bean mặc định, cho phép một use case chọn kênh riêng và chạy unit test với fake. | Test cho 0/1/2 ứng viên, kiểm tra bean được inject và lý do chọn. |
| 1 | **C2. Sửa lỗi trộn dữ liệu request**. Một singleton giữ thông tin người dùng trong field. Tái hiện bằng hai lời gọi được điều phối rồi chuyển dữ liệu sang tham số. | Ca lỗi lặp lại được, test sau sửa, giải thích scope và vị trí đặt state. |
| 2 | **B1. Đo thời gian một use case**. Viết aspect dùng annotation của ứng dụng, ghi thời gian cả khi target ném lỗi, kiểm tra đường gọi ngoài bean và self-invocation. | Test số lần advice chạy, kết quả và exception gốc, giải thích điều kiện áp dụng proxy. |
| 2 | **B2. Viết cấu hình mặc định có thể ghi đè**. Một module cung cấp bean mặc định, có cờ bật/tắt và cho ứng dụng cung cấp bean thay thế. | Ma trận classpath/property/user bean bằng ApplicationContextRunner, lý do từng condition match hoặc không match. |
| 3 | **W1. API tiếp nhận yêu cầu đăng ký**. Dùng cùng ba payload cho binding sai kiểu, vi phạm constraint và thành công. | Status, mã lỗi, field và test xác nhận controller/service có hoặc không được gọi. |
| 3 | **W2. Thiết kế hợp đồng cập nhật thành viên**. Xử lý field thiếu, null, rỗng, ID URL và thuộc tính chỉ do server đặt. | Bảng hợp đồng, test DTO/JSON và test đọc lại dữ liệu sau lỗi. |
| 4 | **D1. Thay tập thành viên nguyên tử**. Seed [1,2], nhận [2,3]. Thêm ca ID thiếu và ca lỗi ghi giữa chừng. | SQL thể hiện xóa/thêm đúng cặp, dữ liệu đọc từ transaction khác, mô tả flush và commit. |
| 4 | **D2. Chẩn đoán rollback và propagation**. Hai service có giao dịch lồng nhau, inner thất bại, outer bắt lỗi. So REQUIRED với một tác vụ audit thực sự cần giao dịch độc lập. | Bảng thiết lập/kết quả, test UnexpectedRollbackException khi phù hợp và giải thích chi phí/kết nối của REQUIRES_NEW. |
| 4 | **D3. Hai quản trị viên cập nhật đồng thời**. Điều phối hai transaction đọc cùng phiên bản rồi cập nhật. Chọn cơ chế giữ invariant, kiểm tra phiên bản hoặc khóa phù hợp. | Lịch xen kẽ có thể lặp, trạng thái cuối, phản hồi conflict hoặc retry có giới hạn theo chính sách đã chọn. |
| 5 | **Q1. API danh sách nhóm có bộ lọc**. Kết hợp projection, sort whitelist và tie-breaker theo ID, có dòng đồng hạng và điều kiện vắng mặt. | JSON đúng, cột SQL phù hợp, kiểm chứng thứ tự/trang/count và giải thích quy ước số trang. |
| 5 | **Q2. Điều tra trang thành viên chậm**. Đo N+1 trên seed có nhiều nhóm. So projection, fetch phù hợp hoặc đọc hai lượt với phân trang. | Số query và kết quả trước/sau, kiểm tra hàng trùng và giải thích trade-off. |
| 6 | **E1. Thông báo sau khi tạo nhóm**. So listener thường và listener gắn commit. Tạo ca commit, rollback và publish ngoài transaction. | Timeline, số lần listener chạy theo từng ca và bằng chứng DB. |
| 6 | **E2. Gửi thông báo qua worker**. Dừng tiến trình giữa commit và gửi. Lưu bản ghi outbox cùng transaction và khôi phục từ lần chạy sau. | Trạng thái DB/outbox trước và sau restart, retry và tiêu chí chọn outbox so với listener trong process. |
| 6 | **E3. Xử lý event bị giao lại**. Cùng event ID được nhận hai lần, có lỗi giữa chừng. Giữ hiệu ứng nghiệp vụ đúng theo contract. | Test nhận trùng, lỗi giữa chừng và chạy lại; giải thích ranh giới idempotency của hệ thống. |
| 7 | **S1. Áp dụng quyền vào danh bạ**. Đọc công khai hoặc có đăng nhập theo contract, ghi theo role và kiểm tra ownership của nhóm khi cần. | Ma trận anonymous/reader/admin/owner và dữ liệu sau các request bị từ chối. |
| 7 | **S2. Debug hai ca cùng 403**. So admin thiếu CSRF với người dùng có CSRF nhưng thiếu quyền trong cấu hình session mẫu. | Test giữ nguyên payload, thay từng điều kiện và xác định tầng xử lý. |
| 7 | **S3. Bật resource server trong lab**. Dùng token từ test issuer, kiểm issuer, audience, thời hạn và scope theo contract. | Ma trận token hợp lệ, lỗi xác thực và thiếu quyền, test tách decoder thật với test mock authorization. |
| 8 | **O1. Từ test xanh đến DB mục tiêu**. Chạy lại ca migration, truy vấn native và cập nhật đồng thời trên PostgreSQL đã ghim phiên bản. | Test tự động, nơi H2 đủ dùng và ca cần DB mục tiêu, artifact có migration được áp dụng. |
| 8 | **O2. Điều tra một request ghi chậm hoặc thất bại**. Dùng trace/log, metric và SQL để loại trừ các giả thuyết. | Mã đối chiếu, bằng chứng điểm lỗi/độ trễ, dữ liệu sau thao tác và test hồi quy. |
| 9 | **I1. Đối soát lời mời khi nhà cung cấp trả chậm**. Stub ghi lời mời rồi giữ response quá timeout. Retry cùng khóa idempotency theo hợp đồng đối tác hoặc đối soát bằng mã tham chiếu trước khi gửi lại. | Stub ghi đúng một lời mời, test phân biệt timeout với lỗi từ chối xác định, trace nối các lần thử và kiểm tra giới hạn tổng thời gian. |
| 9 | **I2. Cô lập lỗi khi nhà cung cấp gián đoạn**. Điều khiển stub trả thành công, lỗi tạm thời và lỗi vĩnh viễn. Cấu hình retry hữu hạn và circuit breaker cho lời gọi thực sự cần bảo vệ. | Số request thực đến stub, chuyển trạng thái circuit, lỗi vĩnh viễn kết thúc sớm và phục hồi có thể tái hiện bằng clock kiểm soát được. |
| 10 | **A1. Xử lý đợt gửi lời mời vượt công suất**. Dùng executor có giới hạn và chặn worker bằng latch để bão hòa hàng đợi. Chọn chính sách từ chối hoặc hoãn, truyền mã đối chiếu sang task. | Số task chạy/chờ/bị từ chối và trạng thái lưu bền khớp chính sách. Task không dựa vào transaction hoặc context chưa được truyền của thread gửi. |
| 10 | **A2. Hai instance cùng chạy lịch quét outbox**. Dùng cơ chế claim có thời hạn hoặc khóa phù hợp. Dừng một worker sau khi claim rồi kiểm tra worker còn lại có thể phục hồi. | Test hai worker dùng chung DB và lần chạy lại sau sự cố. Kiểm tra không bỏ mất lời mời và đối soát hiệu ứng gửi lặp theo hợp đồng. |
| 11 | **K1. Cache trang thành viên theo phạm vi truy cập**. Chọn key bao gồm phạm vi và bộ lọc; giữ kiểm tra quyền ở biên phù hợp. Đo hit/miss khi đổi tham số và danh tính. | Test hai phạm vi truy cập không lẫn dữ liệu. Cùng key cho kết quả đúng và giảm số query so với đọc trực tiếp. |
| 11 | **K2. Làm mới cache sau khi đổi thành viên**. Dùng hai instance và một giao dịch bị rollback. Kiểm chứng invalidation phụ thuộc kết quả commit và xác định giới hạn stale khi đọc đồng thời. | Bảng kết quả commit/rollback, dữ liệu đọc từ hai instance, TTL và ca đối chứng cho cửa sổ dữ liệu cũ. |
| 12 | **R1. Shutdown khi còn request và task đang chạy**. Dùng request có latch và worker đang giữ claim. Gửi tín hiệu dừng trong môi trường lab rồi khởi động lại. | Timeline readiness, request đang xử lý và trạng thái task. Ghi rõ kết quả khi hết thời gian chờ và bằng chứng job có thể phục hồi. |
| 12 | **R2. Thêm trạng thái lời mời khi hai phiên bản cùng chạy**. Thêm schema tương thích, backfill, chuyển đường đọc/ghi, sau đó mới bỏ cấu trúc cũ khi không còn phiên bản phụ thuộc. | Ma trận phiên bản/schema, dữ liệu trước/sau migration và điểm còn có thể quay lui. Chạy trên PostgreSQL của lab. |
| 12 | **O3. Đồ án danh bạ**. Tích hợp quyền, phân trang, thay tập thành viên và gửi lời mời qua worker. Dùng các ca đối tác xử lý xong nhưng response mất và ứng dụng dừng sau commit để kiểm tra phục hồi. | Source tự triển khai, script chạy/seed, test ma trận hợp đồng, trace, trạng thái outbox và bằng chứng hiệu ứng nghiệp vụ không lặp trong phạm vi đã cam kết. |

## Nhánh chuyên sâu theo dự án

| Nhánh | Học sau | Bài toán phù hợp |
| --- | --- | --- |
| Kafka hoặc RabbitMQ | Event, Outbox, idempotency | Bàn giao công việc giữa các tiến trình, quan sát giao lại, thứ tự và phục hồi consumer. |
| Spring Batch | Transaction, scheduling, test DB | Nhập dữ liệu theo lô có checkpoint, restart và đối soát từng phần. |
| WebFlux/R2DBC | HTTP client, xử lý bất đồng bộ, quan sát tải | Dịch vụ có luồng streaming hoặc cần đo hiệu quả của xử lý I/O theo mô hình reactive. |
| GraalVM Native Image | Container, cấu hình build, kiểm thử ứng dụng | Đo startup, bộ nhớ và mức tương thích với reflection hoặc cấu hình runtime của ứng dụng cụ thể. |
| Spring Cloud | Tích hợp API, observability, rollout | Hệ thống nhiều dịch vụ cần cơ chế tích hợp và vận hành dùng chung. |

## Kiểm tra mức độ hiểu

Mỗi bài dùng ba loại câu hỏi. **Dự đoán** đặt một đầu vào mới và hỏi kết quả ở từng tầng. **Giải thích** yêu cầu chỉ ra đối tượng, interceptor hoặc framework component quyết định kết quả. **Chuyển giao** đổi một điều kiện và yêu cầu chọn cách sửa, viết test hoặc tìm bằng chứng. Một câu trắc nghiệm nhận diện annotation chỉ dùng để khởi động.

Chấm mỗi bài thực hành theo thang 10. Hai điểm cho dự đoán có căn cứ, ba điểm cho giải thích đúng cơ chế và điều kiện, bốn điểm cho implementation/test chứng minh hợp đồng, một điểm cho trade-off hoặc cách chẩn đoán ca mới. Mốc đề xuất 8/10 và phải qua ca nghiệm thu trọng yếu của bài, ví dụ DB giữ nguyên khi rollback, quyền được bảo vệ hoặc consumer không áp dụng hiệu ứng hai lần. Công bố ca trọng yếu và rubric trước khi làm, giữ một số bộ dữ liệu kiểm thử độc lập với ví dụ.

**Mẫu đề tích hợp Transaction và Event.** Tạo nhóm G, ghi một audit record và phát GroupCreated. Cố tình để việc gán thành viên thất bại sau khi đã flush. Học viên lập bảng dự đoán group, audit và notification ở ba ca: thành công, rollback, ứng dụng dừng sau commit. Phần rollback cần đo dữ liệu từ transaction mới. Phần dừng sau commit cần test restart hoặc cơ chế điều phối cho kết quả lặp lại được. Học viên giải thích audit nào phải đi cùng transaction, audit nào có yêu cầu bền độc lập và cách tránh notification trùng.

## Cách viết và trình bày

1. Mở bài bằng một tình huống dev có thể gặp và câu hỏi cần trả lời. Ghi kiến thức dùng lại từ bài trước, với liên kết trực tiếp.
2. Giải thích cơ chế theo thứ tự thực thi. Mỗi annotation quan trọng trả lời ba câu hỏi: ai đọc, đọc lúc nào và tác động ở ranh giới nào.
3. Tách ví dụ khỏi văn bản bằng khối nền sáng có nhãn **Ví dụ**, đầu vào và kết quả. Code dùng nền riêng và tô sáng cú pháp. Với tình huống so sánh, đặt hai ca cạnh nhau ở desktop và xếp dọc ở mobile. Dùng màu kèm nhãn trạng thái.
4. Dùng sơ đồ khi vị trí hoặc thời điểm làm thay đổi kết quả. Ưu tiên sơ đồ lifecycle, proxy call, timeline flush/commit, event phase và filter chain. Khi bấm một bước, hiển thị dữ liệu vào, điều kiện và kết quả ngay tại bước đó.
5. Kết bài bằng câu kiểm tra chuyển giao và liên kết lab. Để chi tiết ít dùng, lịch sử API, phương án nâng cao và nguồn trong mục tra cứu.

**Ví dụ bố cục.** Đặt hai khối cạnh nhau: “Service A gọi Writer qua bean” và “Writer gọi this.save()”. Ở mỗi khối cho thấy caller, proxy, target và kết quả quan sát. Dưới đó hỏi: “Nếu chuyển annotation lên method public mà controller gọi thì transaction bắt đầu ở đâu?” Phần lab dùng test và DB để xác nhận.

## Nguồn và quy tắc chọn thực hành

| Nguồn chính | Đưa vào giáo trình |
| --- | --- |
| [Spring Framework 6.2 · Container extension points](https://docs.spring.io/spring-framework/reference/6.2/core/beans/factory-extension.html) và [AOP proxy](https://docs.spring.io/spring-framework/reference/6.2/core/aop/proxying.html) | Phân biệt biến đổi metadata và xử lý instance. Nêu điều kiện proxy theo cấu hình thực tế. Dùng aspect cho mối quan tâm cắt ngang, giữ nghiệp vụ trong service. |
| [Spring Boot 3.5 · Auto-configuration](https://docs.spring.io/spring-boot/3.5/reference/features/developing-auto-configuration.html) | Phân tích condition và khả năng thay bean mặc định bằng test context. |
| [Spring MVC · RequestBody](https://docs.spring.io/spring-framework/reference/6.2/web/webmvc/mvc-controller/ann-methods/requestbody.html), [Jakarta Validation](https://jakarta.ee/specifications/bean-validation/3.0/jakarta-bean-validation-spec-3.0.html) và [RFC 9457](https://www.rfc-editor.org/rfc/rfc9457) | Phân biệt lỗi chuyển đổi và lỗi ràng buộc. Response có contract ổn định, tránh trả dữ liệu nhạy cảm trong lỗi. |
| [Spring Framework · Propagation](https://docs.spring.io/spring-framework/reference/6.2/data-access/transaction/declarative/tx-propagation.html), [Hibernate 6.6 User Guide](https://docs.hibernate.org/orm/6.6/userguide/html_single/) và [PostgreSQL 16 · Isolation](https://www.postgresql.org/docs/16/transaction-iso.html) | Dạy cùng lúc ranh giới service, trạng thái persistence và cách DB mục tiêu thực thi isolation. Đo SQL trên seed cố định. |
| [Spring Framework · ApplicationContext events](https://docs.spring.io/spring-framework/reference/6.2/core/beans/context-introduction.html), [Transaction-bound events](https://docs.spring.io/spring-framework/reference/6.2/data-access/transaction/event.html) và [AWS · Transactional Outbox](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/transactional-outbox.html) | Tách gọi trực tiếp, listener theo phase và bàn giao bền vững. Dùng outbox khi cần xử lý cửa sổ mất sự kiện sau commit và tính tới giao lặp. |
| [Spring Security 6.5 · Servlet architecture](https://docs.spring.io/spring-security/reference/6.5/servlet/architecture.html) và [JWT resource server](https://docs.spring.io/spring-security/reference/6.5/servlet/oauth2/resource-server/jwt.html) | Dạy theo filter/Authentication/authority. Chọn CSRF theo cách browser gửi credential và test chính sách trên cấu hình lab. |
| [Spring Boot · Testcontainers](https://docs.spring.io/spring-boot/3.5/reference/testing/testcontainers.html), [Database initialization](https://docs.spring.io/spring-boot/3.5/how-to/data-initialization.html) và [Micrometer Observation](https://docs.micrometer.io/micrometer/reference/observation/introduction.html) | Một cơ chế migration cho schema của dự án. Dùng DB mục tiêu cho ca dialect và đồng thời. Đo theo câu hỏi vận hành, giữ cardinality của metric trong giới hạn. |
| [Spring Cloud Circuit Breaker](https://docs.spring.io/spring-cloud-circuitbreaker/reference/index.html) và [RFC 9110 · Idempotent Methods](https://www.rfc-editor.org/rfc/rfc9110.html#section-9.2.2) | Dạy retry trong ngân sách thời gian và theo hợp đồng của lời gọi. Dùng stub để đo số lần gửi và phân biệt lỗi phụ thuộc với lỗi nghiệp vụ. |
| [Spring Framework · Task execution và scheduling](https://docs.spring.io/spring-framework/reference/6.2/integration/scheduling.html) và [Cache Abstraction](https://docs.spring.io/spring-framework/reference/6.2/integration/cache.html) | Đo executor khi quá tải và xác định ranh giới thread. Đối chiếu abstraction cache với TTL, key và hành vi của provider được chọn cho lab. |
| [Spring Boot · Availability probes](https://docs.spring.io/spring-boot/3.5/reference/actuator/endpoints.html#actuator.endpoints.kubernetes-probes) và [Graceful shutdown](https://docs.spring.io/spring-boot/3.5/reference/web/graceful-shutdown.html) | Kiểm thử vòng đời bằng tín hiệu dừng, request đang xử lý và worker chưa xong. Tách khả năng sống của tiến trình khỏi khả năng nhận traffic. |

Baseline repo được xác nhận trong POM là Boot 3.5.10 và Java 17. Tài liệu tham chiếu theo nhánh 3.5/6.2/6.5 có thể là bản vá mới hơn, nên xác nhận bằng dependency tree và test trước khi chốt API. Đề xuất dùng PostgreSQL 16 được ghim image cho các lab mới cần DB thật. H2 tiếp tục phù hợp với các bài kiểm tra nhanh không phụ thuộc hành vi DB. Nếu chọn DB triển khai khác, đổi nguồn isolation/locking và chạy lại ca nghiệm thu trên DB đó.

## Thứ tự biên soạn và đưa lên web

1. Biên soạn cụm Container/Annotation, Proxy/AOP và dựng bộ khung danh bạ dùng xuyên suốt. Nghiệm thu một bài với đúng format lý thuyết, ví dụ tách nền, sơ đồ, câu hỏi và test.
2. Nối Binding → DTO → Validation → API Errors bằng cùng một bộ ca. Sau đó dựng cụm JPA/Transaction với test hai transaction thật.
3. Hoàn thiện Truy vấn theo use case. Biên soạn Event/Outbox trên use case đã có giao dịch, rồi tiếp tục Security và vận hành theo các điều kiện tiên quyết trong bảng.
4. Mở rộng cùng luồng lời mời qua stub API ngoài, executor, cache và rollout. Nghiệm thu đồ án sau khi đã chạy các bài phục hồi, tái xử lý và triển khai tương thích.
5. Chạy mỗi bài theo route đã công bố, build starter/solution, xác nhận ca lỗi trước khi sửa và ca thành công sau khi sửa. Kiểm thử UI mô phỏng và khả năng đọc qua mobile. Gắn lại thứ tự và liên kết bài, giữ bookmark hiện có.
