# Rà soát mạch học Spring Boot cho developer

Phạm vi gồm 35 bài theo thứ tự của `content/springboot/course.json`, nội dung HTML, 5 phần mở rộng, mục tiêu, bài tập, câu hỏi và các phần React liên quan. Đối tượng là dev đã biết Java, SQL và HTTP ở mức cơ bản, đang học cách Spring xử lý từng vấn đề. Đây là review nội dung và mạch học. Các request, SQL và demo được đánh giá từ nội dung và mã nguồn hiện có.

Giáo trình có nhiều điểm đáng giữ: phân biệt Bean Definition với instance, nêu giới hạn của proxy, so sánh JSON với cột SQL thực đọc, phân biệt hai nguyên nhân 403 và kiểm tra dữ liệu sau lỗi. Phần thiếu nhất là cách sắp xếp các kiến thức đó thành chuỗi câu hỏi nối tiếp nhau. Điều hướng trước/sau hiện lấy trực tiếp thứ tự từ danh mục; các điều kiện học chủ yếu là văn bản, nên dev có thể đi đúng đường dẫn mà vẫn gặp một khái niệm chưa được dạy.

## Ưu tiên sửa

1. **Sắp lại kiến thức nền.** Đặt một bước JPA đọc tối thiểu trước hoặc ngay cạnh bài MVC đầu tiên, và đặt JPA nền trước REST ghi. Ở Spring Core, dùng bài AOP để giải thích lời gọi qua proxy. Đưa phần kiểm chứng commit/rollback sang cụm Data sau khi dev đã hiểu transaction, entity managed và flush. Đưa phần tổng hợp hợp đồng group/account sau bài pagination và các phần validation/lỗi mà nó sử dụng.
2. **Dùng một use case xuyên suốt.** Giữ sản phẩm làm ví dụ nhỏ để hiểu cơ chế. Dùng danh bạ nhóm làm bài tích hợp và đồ án. Khi đổi demo, ghi ngay model, URL, cổng, seed và quy ước API. Ví dụ `page=0` ở thiết kế account và `page=1` ở demo product có thể cùng đúng, vì đó là hai hợp đồng. Chỉ rõ bước đổi chỉ số tại biên API.
3. **Đo khả năng giải thích nguyên nhân.** Mỗi bài cần một ca đối chứng chỉ thay một biến, một bằng chứng ở đúng tầng và một câu hỏi áp dụng dữ liệu mới. Ví dụ ở Validation, giữ email và mọi điều kiện HTTP cố định, thay riêng kiểu hoặc nội dung username. Dev phải dự đoán DTO có được dựng hay không, controller có chạy không và lỗi được ánh xạ ra sao.

## Rà từng bài

P1 là điểm đứt mạch hoặc bài tập chưa đo được mục tiêu chính. P2 là phần cần làm rõ để dev chuyển kiến thức sang use case khác. Số thứ tự theo danh mục hiện tại.

| Bài | Ưu tiên | Điểm cần xử lý và bằng chứng học được |
| --- | --- | --- |
| 01 · `nen-tang-http` | P2 | Lý thuyết dùng product, editor dùng group có Basic. Cho sẵn lệnh khởi động và seed của demo đã chọn, rồi đổi duy nhất ID để phân biệt 200/404/400 với lỗi chưa kết nối được. Dẫn sang MVC theo chính request đó. |
| 02 · `ioc-container` | P2 | Ví dụ MailSender và khái niệm đã tốt. Cho cùng use case chạy bằng constructor thủ công/fake và bằng container. Dev phải chỉ ra chỗ Spring chọn instance để phân biệt DI với việc dùng Spring. |
| 03 · `design-solid` | P1 | Bài mở bằng membership, lỗi derived query và UNIQUE trước khi học JPA, còn editor dùng tính lương. Giữ một ví dụ tính lương để đối chiếu thay đổi PayPolicy/store và hợp đồng LSP. Chuyển chẩn đoán repository sang bài Data hoặc đồ án. |
| 04 · `bean-registration` | P1 | Ví dụ mở bằng scan lỗi rồi chuyển sang lỗi cột Hibernate, dễ trộn lỗi do đăng ký bean với persistence. Đặt Greeting làm ví dụ chính và kiểm chứng 0, 1, 2 ứng viên; chuyển mapping cột về JPA. Làm rõ collection nhận nhiều bean, khác injection một giá trị. |
| 05 · `bean-lifecycle` | P2 | Ca An/Bình giải thích mutable state tốt. Thêm bảng xen kẽ hai lời gọi và log tạo/hủy bean. Dev chỉ ra vì sao đổi scope và bỏ field theo request giải quyết hai câu hỏi khác nhau. |
| 06 · `aop-transaction` | P1 | Điều kiện học đòi SQL transaction trước cụm Data. Dùng ví dụ interceptor đơn giản cho proxy/self-invocation trước. Đặt lab rollback sau JPA nền và kiểm tra dữ liệu bằng lần đọc riêng sau khi giao dịch kết thúc. |
| 07 · `boot-configuration` | P2 | Có điều kiện auto-configuration và override, nhưng tạo project, Lombok và DevTools làm loãng mục tiêu chính. Dùng một cấu hình port xuyên suốt, rồi phân biệt đọc property source với rebuild JAR. Đặt phần công cụ trong mục tra cứu. |
| 08 · `boot-datasource` | P2 | Phân biệt driver/URL/pool/schema tốt. Giữ một schema và tách hai ca lỗi: không lấy được kết nối và lấy được kết nối nhưng sai bảng/cột. Yêu cầu dev trích log hoặc query chứng minh từng ca. |
| 09 · `mvc-request-flow` | P1 | Mở bằng entity/getter trước khi người học nhìn thấy request pipeline. Đưa ví dụ 200/404/400 lên đầu, rồi nối binding → service → repository → JSON. Đưa chi tiết JPA/Jackson access và Lombok xuống phần giải thích kết quả. |
| 10 · `mvc-binding` | P1 | Mục tiêu có path/query/body, lời giải editor chỉ dùng path. Chốt phần editor thật sự đánh giá và thêm ca query/body riêng trong bài. Giữ Criteria/Specification làm liên kết sang Dynamic Query. |
| 11 · `dto-contracts` | P2 | Hợp đồng DTO đã rõ. Nối trực tiếp với binding bằng một payload có field nội bộ, field thiếu, null hoặc rỗng. Yêu cầu dev phân biệt giá trị bind được và quy tắc từ chối, rồi dẫn sang Validation. |
| 12 · `rest-write` | P1 | Đòi JPA cơ bản trước bài 16. Editor đối chiếu POST, mục tiêu có cả PUT. Dạy entity managed/dirty checking trước, sau đó nghiệm thu POST bằng Location và GET, PUT ID thiếu bằng 404 và lần đọc xác minh dữ liệu. |
| 13 · `api-contract-design` | P1 | Điều kiện học có pagination trước bài 22. Demo dùng nhiều thao tác group/account và lấy creator từ principal. Đặt sau các bài nền liên quan rồi biến thành bài tổng hợp, kế thừa cùng hợp đồng cho đồ án. |
| 14 · `bean-validation` | P1 | Có mô phỏng tốt nhưng chuyển sớm sang regex/i18n, demo và editor dùng hai endpoint khác nhau. Giữ username/email cho mạch chính. Hiện JSON, DTO và điểm dừng qua từng bước. Sau đó mới nối mã lỗi của demo và đưa custom constraint/i18n vào phần mở rộng. |
| 15 · `api-errors` | P2 | Tái sử dụng chính hai request 400 của Validation, xem HTTP status, code và field qua advice. Để Spring Data REST ở phần mở rộng, dành xử lý lỗi filter cho phần Security. |
| 16 · `jpa-fundamentals` | P1 | Có chuỗi JDBC → JPA → repository, nhưng khởi đầu JPA chính thức xuất hiện sau các bài phụ thuộc. Chuyển lên trước REST ghi, minh họa thêm managed → flush → commit qua cùng một bản ghi, làm nền cho bulk và rollback. |
| 17 · `jpa-one-to-one` | P2 | SQL và phía sở hữu đã giải thích tốt. Với một seed cố định, yêu cầu dự đoán riêng FK, UNIQUE và NOT NULL chặn được ca nào, rồi đối chiếu annotation với schema thật. |
| 18 · `jpa-relationships` | P2 | Mở bằng “ôn LAZY và EAGER” trước bài fetch plan đầy đủ. Nhắc ngắn khái niệm hoặc trỏ sang phần sau. Trọng tâm là FK/bảng nối, bên sở hữu và SQL phát sinh khi thay liên kết; vòng lặp JSON nối lại bài DTO. |
| 19 · `jpa-query-bulk` | P2 | Mô tả entity cũ sau bulk đã đúng trọng tâm. Bắt dev đối chiếu ba quan sát: tham chiếu đã nạp, kết quả sau clear/đọc lại và trạng thái sau commit. Nối với ranh giới transaction ở bài 06/16. |
| 20 · `jpa-projections` | P2 | Ca JSON giống nhưng SELECT khác là chuẩn tốt cho các bài khác. Yêu cầu dự đoán và trích cột SELECT ở cả hai endpoint. Dùng kết quả làm đầu vào bài fetch plan và thiết kế danh sách. |
| 21 · `dynamic-query` | P2 | Bài có SQL NULL và lọc nhiều trường, editor chỉ thêm minPrice. Giữ snippet ngắn và thêm một ca chuyển giao dùng cùng tập seed để phân biệt vắng tham số, giá trị 0, cận đảo và bộ lọc hợp lệ. |
| 22 · `data-pagination` | P2 | Có seed, offset, count và tie-breaker. Làm rõ PageRequest nhận chỉ số nội bộ nào trong editor, rồi dùng chung data với bài hợp đồng danh sách để kiểm tra trang đầu/cuối/vượt phạm vi. |
| 23 · `jpa-fetch-plan` | P1 | Mục tiêu là N+1 trên danh sách, đáp án editor là fetch join một bản ghi theo ID. Thêm ca danh sách có nhiều quan hệ khác nhau hoặc ghi rõ bài một ID là bước luyện cú pháp. Nghiệm thu bằng số SELECT trước/sau trên cùng seed. |
| 24 · `data-collection-update` | P1 | Bài có hai quy tắc trùng ID có chủ đích, nhưng chuyển sang use case xóa offering giữa mạch thay tập liên kết. Đưa xóa cha sang phần mở rộng; tập trung phép hiệu tập, kiểm tra tất cả ID trước ghi và đọc lại sau 404. |
| 25 · `security-authentication` | P2 | Luồng Basic rõ, editor chỉ kiểm BCrypt. Nối hai phần bằng câu hỏi provider gọi matches ở đâu, sau đó đối chiếu request thiếu/sai/đúng credential với bằng chứng filter và trạng thái. |
| 26 · `security-authorization` | P2 | Chain selection, rule selection và method security đều hữu ích. Dùng cùng một request và identity để giải thích lần lượt từng loại quyết định. Đặt ví dụ method proxy cạnh liên kết về AOP. |
| 27 · `security-session-csrf` | P2 | Session, CSRF và CORS cùng một bài làm tăng tải. Dùng GET/POST, cùng một session và token làm mạch chính; để CORS thành thí nghiệm riêng khi đã xác định rõ origin. Kiểm tra DB sau hai request 403. |
| 28 · `security-lab` | P1 | Phần đầu lặp Authentication/Authorization/CSRF, editor chỉ kiểm một ca reader. Biến bài thành lab tích hợp: tự điền ma trận trước, tái hiện từng ca và giải thích request bị chặn trước hay sau xác thực/quyền. |
| 29 · `security-oauth2` | P2 | Có phân biệt Access Token/ID Token và ghi rõ cần provider thực. Nối với Basic ở đầu vào authentication và điểm chung là SecurityContext/authority. Dùng ma trận tự nghiệm thu với issuer/audience/thời hạn/scope; nêu điều kiện có provider để kiểm chứng. |
| 30 · `testing-deployment` | P2 | Ca trả 400 nhưng vẫn ghi là điểm mạnh. Dùng nó để so unit/slice/HTTP với DB, rồi dùng đúng artifact cho phần triển khai. Đưa vận hành/Actuator sau ma trận test nhằm giữ mạch kiểm chứng. |
| 31 · `logging-observability` | P2 | Có phân biệt log với bằng chứng commit. Cho dev nối một response và log bằng request ID rồi kiểm DB khi cần. Tách bài tập log một dòng khỏi mục tiêu điều tra cả request. |
| 32 · `debugging-request-flow` | P1 | Ôn lại container, SOLID, JPA và security trước khi vào điều tra. Dùng một incident làm trục, yêu cầu khoanh tầng đầu tiên thất bại, sau đó dẫn ngược về các bài để giải thích bằng chứng. |
| 33 · `project-directory` | P2 | Đã nối contract, transaction, FK/UNIQUE và idempotency. Gắn mỗi mốc triển khai với bài nền và một kết quả phải chứng minh. Phân biệt test lặp tuần tự với test cạnh tranh dùng chính sách khóa đã chọn. |
| 34 · `api-list-contract` | P1 | Ví dụ thiết kế account dùng trang 0, demo product dùng trang 1, editor chỉ viết DTO. Giữ bảng kết quả có thứ tự làm tiêu chí chính, ghi rõ chuyển chỉ số và yêu cầu dev thiết kế filter + sort + pagination trong project. |
| 35 · `project-capstone` | P2 | Có invariant, seed và thang nghiệm thu. Lập bảng mốc → bài nền → test bắt buộc để sử dụng lại kỹ năng đã học. Nêu rõ suite nền kiểm phần nào và extension cần test riêng. |

## Mạch học đề xuất

| Khi dev muốn trả lời | Kiến thức chuyển tiếp |
| --- | --- |
| Request đi vào ứng dụng thế nào? | HTTP → DI và bean → cấu hình Boot → MVC/binding. Dùng repository như một ranh giới khi dạy MVC lần đầu, hoặc có bài JPA đọc tối thiểu làm cầu nối. |
| Input sai bị chặn và phản hồi ở đâu? | Binding → DTO → Validation → ProblemDetail. Giữ hai ca cùng HTTP 400 để lần theo lỗi từ payload đến response. |
| Khi nào dữ liệu thay đổi thật? | Datasource → JPA nền → REST ghi → transaction/rollback → quan hệ và thay tập liên kết. Dùng cùng một phép ghi để thấy thay đổi trong Java, SQL và dữ liệu sau commit. |
| Đọc danh sách đúng và đủ nhanh bằng cách nào? | Query → projection → bộ lọc động → pagination → fetch plan. Gom lại ở bài hợp đồng danh sách. |
| Request nào được tới controller? | Authentication → Authorization → session/CSRF → lab tổng hợp. OAuth2/JWT mở rộng cách nhận danh tính sau khi đã hiểu filter và quyền. |
| Làm sao chứng minh hệ thống đúng? | Testing → log → debug theo tầng → thiết kế hợp đồng và đồ án danh bạ. Dùng lại ca 400/403/404, quy tắc không ghi khi lỗi và kết quả đọc lại. |

## Cách nghiệm thu bài sau khi sửa

- Dev nhìn vào dữ liệu đầu vào, dự đoán kết quả và chỉ ra bước quyết định trước khi xem lời giải.
- Dev có thể nói rõ một annotation hoặc cấu hình có tác dụng ở ranh giới nào, điều kiện để nó hoạt động và thất bại biểu hiện ra sao.
- Bài có một bằng chứng thực tế phù hợp, ví dụ HTTP status và body, câu SQL và số query, đối tượng được inject, hoặc dữ liệu đọc lại sau transaction.
- Bài chỉ rõ kiến thức lấy từ bài trước và phần nào được dùng tiếp. Với mô phỏng, mỗi nút phải giúp người học phân biệt được hai trạng thái dễ nhầm. Validation, AOP/transaction, fetch plan và security filter là các ứng viên phù hợp.

Các cơ chế chọn làm mốc đối chiếu trong review dựa trên [Spring MVC 6.2 về RequestBody và Valid](https://docs.spring.io/spring-framework/reference/6.2/web/webmvc/mvc-controller/ann-methods/requestbody.html), [Spring Framework 6.2 về Transactional](https://docs.spring.io/spring-framework/reference/6.2/data-access/transaction/declarative/annotations.html) và [Spring Security 6.5 về kiến trúc Servlet](https://docs.spring.io/spring-security/reference/6.5/servlet/architecture.html).
