# Thực hành Spring Core với lời mời vào nhóm

Dùng JDK 17 trở lên và Maven. Lab chạy với Spring Boot 3.5.10 và dùng kênh mẫu trả chuỗi. Giải nén gói tải từ bài học, rồi mở terminal tại thư mục `spring-core-lab` chứa `pom.xml`.

```powershell
mvn test
```

Sáu test tham khảo nằm trong [InvitationCoreTest.java](src/test/java/vn/backend/core/InvitationCoreTest.java). Hai cảnh báo khi refresh context là kết quả dự kiến của ca thiếu và mơ hồ dependency. Để tự làm, tạo lớp `YourInvitationTest` trong cùng thư mục, xây các fixture và assertion riêng rồi chạy với `"-Dtest=YourInvitationTest"`. Mở test tham khảo sau khi đã dự đoán và thực hiện các ca bên dưới.

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
