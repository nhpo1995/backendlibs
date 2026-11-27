# Spring Foundations — đề thực hành coding

Website đề chi tiết: mở `index.html` trong thư mục này. Starter và solution là hai project Maven độc lập; không copy solution đè lên bài đang làm.

## Môi trường

JDK 17+, Maven, Spring Boot 3.5.10. H2 trong bộ nhớ; không cần MySQL. Lần đầu Maven cần mạng. Các lệnh dưới chạy trong thư mục starter hoặc solution, nơi có pom.xml.

```powershell
mvn -DskipTests package
mvn -Dtest=CoreTest test
mvn -Dtest=GroupApiTest test
mvn -Dtest=TransactionTest test
mvn -Dtest=SecurityTest test
mvn verify
mvn spring-boot:run
```

## Các mốc

1. Core: GreetingService dùng bean vietnamese qua constructor và trim tên. Collection vẫn có cả hai strategy.
2. Web/Data: viết create/update/delete ở GroupService; bind SQL parameter; DTO tên bắt buộc và dài tối đa 80. POST 201 + Location, ID thiếu 404, trùng tên 409 với GROUP_EXISTS, không ghi khi request sai.
3. Transaction: createThenFail INSERT rồi ném IllegalStateException, dữ liệu sau lỗi phải như trước. Test không có transaction bao ngoài.
4. Security: GET groups/csrf cần authentication; ghi groups chỉ ADMIN; còn lại deny. Giữ CSRF. Reader đủ CSRF vẫn 403; admin thiếu CSRF cũng 403, không ghi dữ liệu.

Starter biên dịch được nhưng test chưa đạt do TODO. Một số test pass vì kiểm scaffold có sẵn. Làm theo từng mốc, không sửa test để né yêu cầu. Solution có cùng 17 test, phải pass toàn bộ.

## Chạy thật

App chỉ bind 127.0.0.1:8181. Seed Backend/Ops; restart reset dữ liệu. Hai user in-memory admin và reader cùng password mẫu demo-pass, chỉ cho localhost. Các record group không phải tài khoản đăng nhập.

```powershell
curl.exe -i -u reader:demo-pass http://127.0.0.1:8181/api/groups
```

POST/PUT/DELETE cần token CSRF và cookie cùng session, không chỉ Basic header. Xem bài Session/CSRF hoặc chạy `python ../verify_http.py` khi dùng repo (không có trong project ZIP).

## Phạm vi

JDBC/H2 trong lab minh họa boundary, không thay các bài JPA. Suite không chấm account/membership hoặc OAuth2/OIDC. H2 pass không chứng minh MySQL/Oracle pass. Editor web không chạy Maven/Java. Không có chức năng đăng nhập bảo vệ bài đọc trong giai đoạn này.
