# Lab Spring nâng cao · gửi lời mời vào nhóm

Giải nén gói tải từ trang bài học. Mở terminal tại thư mục chứa `pom.xml`, dùng JDK 17 trở lên và Maven:

```powershell
mvn test
```

Lab dùng Spring Boot 3.5.10, DB H2 trong bộ nhớ và HTTP stub local. Ở lần chạy đầu Maven có thể cần tải dependency. Mỗi nhóm test đi kèm ca đối chứng để người học nhìn thấy biến nào làm thay đổi kết quả.

| Nhóm test | Tự thay đổi một điều kiện | Kết quả cần chứng minh |
| --- | --- | --- |
| InvitationConfigurationTest | Bật/tắt thuộc tính, thay bean mặc định. Gọi method từ ngoài proxy, từ this và từ object tự new. | Bean ứng dụng thắng theo điều kiện back off. Advice quan sát đúng lời gọi và giữ exception gốc. |
| InvitationTransactionTest | Tạo ca thành công, rollback và publish ngoài transaction. Bắt lỗi inner ở outer. Tạm dừng trước khi đánh dấu outbox. | Đọc lại DB ngoài giao dịch. Kiểm listener đếm đúng phase, outer báo rollback-only, outbox còn việc và giao lặp được đối soát. |
| InvitationTransactionTest · cache | Xóa cache trong transaction, lần đầu rollback và lần sau commit. | Trong rollback vẫn đọc mục cache cũ. Sau commit mục đã được evict. |
| InvitationWorkerTest | Stub ghi lời mời rồi giữ response. Gửi lại với cùng key. Tách ca executor 2 worker, queue 4. | 2 request tới stub tạo 1 hiệu ứng theo key. Task thứ 7 bị từ chối khi worker và queue đều đầy. |
| InvitationAuthorizationTest | Gọi service qua Spring proxy với reader, owner khác nhóm, owner đúng nhóm và admin. | Reader không tới policy nhóm. Owner khác nhóm tới policy nhưng không ghi. Owner đúng nhóm và admin tới thao tác ghi mẫu. |

Tự làm bằng cách viết test khác trong `src/test/java`. Đổi một điều kiện mỗi lần, ghi dự đoán rồi so với bằng chứng. Test tham khảo dùng JDBC để làm rõ ranh giới giao dịch, và dùng stub để mô phỏng đối soát với bên nhận. Bài thực hành mở rộng về JPA, PostgreSQL, nhiều instance, circuit breaker, shutdown và rollout có ca nghiệm thu riêng trên web.
