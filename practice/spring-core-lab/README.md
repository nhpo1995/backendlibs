# Thực hành Spring Core với lời mời vào nhóm

Dùng JDK 17 trở lên và Maven. Lab chạy với Spring Boot 3.5.10 và dùng kênh mẫu trả chuỗi. Giải nén gói tải từ bài học, rồi mở terminal tại thư mục `spring-core-lab` chứa `pom.xml`.

```powershell
mvn test
```

Các test C1–C2 nằm trong [InvitationCoreTest.java](src/test/java/vn/backend/core/InvitationCoreTest.java). Hai cảnh báo khi refresh context là kết quả dự kiến của ca thiếu và mơ hồ dependency. Để tự làm, tạo lớp `YourInvitationTest` trong cùng thư mục, xây các fixture và assertion riêng rồi chạy với `"-Dtest=YourInvitationTest"`. Mở test tham khảo sau khi đã dự đoán và thực hiện các ca bên dưới.

<a id="c1-chon-kenh-gui"></a>

## C1. Chọn kênh gửi lời mời

Một ứng dụng có hai kênh cùng hợp đồng `Channel.send(String recipient)`. Email trả `email:an` cho người nhận An, audit trả `audit:an`. Service lời mời phải dùng email, còn ca kiểm toán cần nhìn thấy cả hai kênh.

1. Tạo `InvitationService` nhận một Channel trong constructor. Dùng fake ghi người nhận vào danh sách để test logic Java thuần.
2. Tạo context với 0, 1 và 2 ứng viên. Với 2 ứng viên, dùng tham số tên `selected` và bỏ mọi qualifier/primary để tái hiện sự mơ hồ.
3. Tự khai báo qualifier `@EmailChannel`, gắn vào bean email và tham số factory tạo service. Giữ cả hai bean trong context.

| Ca | Bằng chứng cần có |
| --- | --- |
| Java thuần | Fake nhận đúng `an`, kết quả là `fake:an`. |
| Không có Channel | Refresh thất bại và nguyên nhân gốc chỉ ra kiểu còn thiếu. |
| Có đúng một Channel | Service nhận kênh đó. |
| Có hai Channel chưa phân loại | Refresh thất bại và liệt kê hai ứng viên. |
| Hai Channel và qualifier | Service trả `email:an`, tra cứu theo kiểu vẫn thấy cả hai bean. |

Giải thích ai đọc qualifier, và điều gì thay đổi nếu gắn nó ở tham số nhưng bỏ khỏi bean email.

<a id="c2-khong-tron-nguoi-nhan"></a>

## C2. Không trộn người nhận khi hai lời gọi chạy chung

Hai request cùng gọi một instance service. Bản lỗi giữ người nhận trong field mutable. Cần tái hiện lỗi bằng checkpoint có kiểm soát, rồi sửa bằng dữ liệu theo từng lời gọi.

1. Tạo bản lỗi có field `recipient`. Dùng hai latch để giữ lời gọi An sau khi ghi field, cho lời gọi Bình hoàn tất rồi thả An.
2. Đổi service để truyền người nhận như tham số trực tiếp vào Channel. Dùng hai lời gọi để xác nhận từng địa chỉ.
3. Tạo probe đếm constructor, `@PostConstruct` và `@PreDestroy`. Lấy singleton hai lần, prototype hai lần rồi đóng context.

| Ca | Bằng chứng cần có |
| --- | --- |
| Bản lỗi | Lời gọi An thấy người nhận Bình theo đúng lịch xen kẽ. |
| Bản sửa | Kết quả từng lời gọi tiếp tục gắn đúng người nhận. |
| Scope | Hai lần lấy singleton cùng identity, hai lần lấy prototype khác identity. Có 3 init và 1 destroy. |

Giải thích vì sao đổi scope không đảm bảo sửa được nếu caller vẫn dùng chung một instance. Chỉ ra kênh gửi hoặc dependency nào còn cần test khi dùng đồng thời.

## C3–C5. Đa luồng Java với lời mời

Mở `src/test/java/vn/backend/core/ConcurrencyStarter.java` trong IDE. Chỉ sửa starter. Dùng case theo tên trong `InvitationConcurrencyTest.java` để xem dữ liệu và assertion. Các interface trong bài là hợp đồng của fixture, code C3–C5 dùng Java thuần.

```powershell
mvn "-Dtest=InvitationConcurrencyTest" "-Dconcurrency.starter=true" test
mvn "-Dtest=InvitationConcurrencyTest" test
mvn "-Dtest=InvitationAsyncTest" test
mvn "-Dtest=InvitationAsyncTest" "-Dasync.starter=true" test
```

Hai lệnh đầu chạy 9 ca Java thuần. Starter có 6 ca chưa đạt do TODO và 3 ca minh họa đạt ngay. Chế độ mặc định dùng `ConcurrencySolution.java`. Hai lệnh sau chạy 3 ca Spring. Chế độ starter có 1 ca chưa đạt trước khi sửa `AsyncCoordinatorStarter.java`. `mvn test` chạy 18 ca tham khảo.

| Bài | Tự viết | Cách tự kiểm |
| --- | --- | --- |
| **C3 · Đếm lượt gửi** | Hoàn thành `Counter`. Mỗi lần xác nhận gửi tăng đúng một đơn vị. | Ca đối chứng giữ cả hai worker sau khi đọc `volatile`, rồi thả để thấy kết quả 1. Với bản sửa, kiểm tổng ban đầu và sau một lượt. Hai worker chạy 17 lượt mỗi người, rồi 10.000 lượt mỗi người. Tổng sau hai mốc là 35 và 20.035. |
| **C4 · Giữ chỗ lời mời** | Hoàn thành `Seats`. Giữ chỗ khi còn quota, chỉ thả chỗ đã giữ, tạo snapshot nhất quán. | Ca đối chứng cố định điểm dừng sau khi kiểm chỗ và tái hiện hai lượt giữ thành công dù hạn mức là một. Starter phải giữ đúng một chỗ qua hai worker. Kiểm thêm yêu cầu giữ trùng, thả nhầm và thả trùng. |
| **C5 · Gửi qua executor** | Hoàn thành `Queue.submit`. Chuyển callable vào executor được cấp, giữ giá trị/lỗi và chạy cleanup khi công việc đã bắt đầu rồi kết thúc. Callback cleanup của lab kết thúc bình thường. | Kiểm receipt, lỗi gốc, timeout lúc chờ và hủy tác vụ đang chặn ở latch. Kiểm worker nhận interrupt, chờ executor kết thúc, xác nhận đúng một cleanup và không có hiệu ứng sau khi hủy. |
| **Chuyển sang Spring** | Sửa `AsyncCoordinatorStarter.send()` để gọi method async qua probe được inject. | Chạy với `-Dasync.starter=true`. Ca điều phối chuyển từ thread caller sang executor. Giữ nguyên hai ca đối chứng. |

Có thể chạy từng ca với cú pháp phương thức của Surefire, ví dụ:

```powershell
mvn "-Dtest=InvitationConcurrencyTest#countsEveryDeliveryFromBothWorkers" "-Dconcurrency.starter=true" test
```

Tự thêm một ca quota 2 với ba người và thử lại sau khi thả chỗ. Với executor, thử hủy một task đang chờ trong queue và kiểm task chưa bắt đầu. Ghi lịch chạy dự kiến trước, dùng latch thay vì chờ theo thời gian cố định.
