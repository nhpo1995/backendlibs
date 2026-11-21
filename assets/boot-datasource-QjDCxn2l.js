var e=`<section class="chapter" id="boi-canh"><h2>Phân biệt lỗi kết nối và lỗi schema</h2>
<p>Web server có thể sẵn sàng nhận HTTP nhưng truy vấn danh bạ vẫn thất bại vì thiếu bảng. Dựa vào <a href="../boot-configuration/index.html">cấu hình có hiệu lực</a>, lần từ URL JDBC và credential tới driver, pool, rồi schema. Chọn DB học tập riêng cho các ca đổi cấu hình.</p>
<figure class="snippet"><figcaption>Ví dụ · các bước dẫn tới lần đọc nhóm đầu tiên</figcaption><pre tabindex="0"><code class="language-none">spring.datasource.url + driver
  → DataSource / pool mở kết nối JDBC tới đúng DB
  → schema.sql tạo study_groups, data.sql nạp Backend và Ops
  → JdbcTemplate mượn connection và chạy SELECT</code></pre></figure>
<p>Với solution Spring Foundations dùng H2, <code>schema.sql</code> và <code>data.sql</code> được thực thi khi Boot khởi tạo DB. Khi tắt init bằng <code>--spring.sql.init.mode=never</code> trên một lần chạy mới, app có thể khởi động nhưng đọc nhóm báo lỗi vì schema rỗng. Nếu URL dùng giao thức không có driver tương ứng, lỗi xảy ra trước khi chạy câu SELECT.</p>
<div class="table-wrap"><table><thead><tr><th>Dấu hiệu</th><th>Kiểm ở đâu</th><th>Đối chứng sau sửa</th></tr></thead><tbody>
<tr><td>Thiếu driver / URL JDBC sai giao thức</td><td>Classpath và URL có hiệu lực</td><td>Driver nhận đúng URL và lấy được một connection</td></tr>
<tr><td>Connection refused hoặc credential bị DB từ chối</td><td>Host:port, tiến trình DB, user của app</td><td>Dùng cùng cấu hình của app chạy một câu SQL nhỏ</td></tr>
<tr><td>Thiếu bảng hoặc schema đích</td><td>Tên DB đang dùng, migration/init</td><td>Đọc được bảng và seed mong muốn</td></tr>
<tr><td>Connection pool timeout</td><td>Số connection đang mượn, thời gian giữ, lỗi mở connection</td><td>Đo thời gian mượn/trả khi tái hiện cùng tải</td></tr>
</tbody></table></div>
<p><strong>Tự kiểm trên web.</strong> Chọn dòng ứng với ca tắt SQL init. Dự đoán cấu hình nào cần đổi rồi đối chiếu với sơ đồ. Sai schema và cạn pool có thể cùng thành lỗi 5xx nhưng cần bằng chứng khác nhau.</p>
<p><strong>Thực hành cục bộ.</strong> Từ thư mục giải nén, chạy <code>mvn -f practice/spring-foundations/solution/pom.xml package</code>. So ba lần khởi động riêng của <code>practice/spring-foundations/solution/target/spring-foundations-1.0.0.jar</code>: mặc định, thêm <code>--spring.sql.init.mode=never</code>, rồi quay lại mặc định. Gọi <code>curl.exe -i -u reader:demo-pass http://127.0.0.1:8181/api/groups</code> sau mỗi lần. Ghi có kết nối được hay không, status, nguyên nhân JDBC sâu nhất ở ca lỗi và JSON Backend/Ops ở lần cuối. Sau đó viết test smoke gọi <code>JdbcTemplate</code> và đọc nhóm từ đúng DB trước khi viết test controller. Phần MySQL dưới đây là mô hình product riêng.</p>
</section><aside class="callout"><strong>Chạy các ví dụ trên máy</strong><p><a download="" href="../../../practice/spring-demo-bundle/downloads/spring-demo-bundle.zip">Tải bộ demo Maven (.zip)</a>. Giải nén và dùng thư mục <code>spring-demo-bundle</code> chứa <code>lessons</code> và <code>practice</code> làm thư mục gốc cho các lệnh trong bài. Khi bài yêu cầu vào thư mục demo, mở thư mục chứa <code>pom.xml</code> của demo đó.</p></aside><section aria-labelledby="mysql-heading" class="chapter" id="mysql"><header class="chapter-top"><h2 id="mysql-heading">Kết nối MySQL</h2></header>
<p>Khi ứng dụng có JPA và cần dùng MySQL, Spring Boot phải tạo <code>DataSource</code> để Hibernate lấy kết nối. Nếu thiếu JDBC URL và không có CSDL nhúng phù hợp trên classpath, bạn có thể gặp <code>Failed to configure a DataSource</code> ngay lúc khởi động. Để kết nối MySQL, cần MySQL Connector/J, JDBC URL chỉ tới schema đích và tài khoản được cấp quyền.</p>
<h3>Tạo schema và bảng</h3>
<p>Dùng IntelliJ Database, MySQL CLI hoặc Workbench để chạy SQL tạo bảng và kiểm tra dữ liệu. Kết nối thử thành công trong IDE chỉ xác nhận thông số của IDE. Spring Boot dùng cấu hình <code>spring.datasource</code> riêng, nên cần kiểm tra hai bên cùng trỏ tới đúng schema. </p>
<p>Schema của ví dụ là <code>product</code>. Bảng <code>product_offerings</code> dùng <code>id</code> làm khóa chính tự tăng, <code>name</code> bắt buộc, <code>price</code> lưu số nguyên VNĐ và <code>color</code> lưu tên màu. Demo dùng <code>BIGINT</code> để khớp <code>Long</code> trong entity.</p>
<figure class="snippet"><figcaption>MySQL · cấu trúc và một dòng mẫu</figcaption><pre tabindex="0"><code class="language-sql">CREATE DATABASE IF NOT EXISTS product CHARACTER SET utf8mb4;
USE product;

CREATE TABLE IF NOT EXISTS product_offerings (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price INT,
    color VARCHAR(255)
);

INSERT INTO product_offerings (id, name, price, color)
VALUES (1, 'Product A', 100000, 'red');</code></pre></figure>
<h3>Cấu hình datasource và cổng HTTP</h3>
<p>Spring Boot đọc <code>application.yaml</code> hoặc <code>application.properties</code> từ <code>src/main/resources</code>. Hai định dạng biểu diễn cùng bộ thuộc tính. YAML nhóm theo cấp, còn Properties dùng khóa như <code>spring.datasource.url</code>. Căn lề YAML bằng dấu cách. </p>
<figure class="snippet"><figcaption>application.yaml</figcaption><pre tabindex="0"><code class="language-yaml">spring:
  datasource:
    url: \${DB_URL:jdbc:mysql://localhost:3306/product}
    username: \${DB_USER:railway}
    password: \${DB_PASSWORD:}
  jpa:
    hibernate:
      ddl-auto: validate
    open-in-view: false
  sql:
    init:
      mode: never
server:
  port: \${SERVER_PORT:811}</code></pre></figure>
<p><code>localhost:3306</code> là địa chỉ MySQL trong URL JDBC. <code>localhost:811</code> là địa chỉ HTTP của demo. Spring Boot thường dùng <code>8080</code> khi để cổng mặc định. Nếu <code>8080</code> đang bị chiếm, đặt <code>server.port: 811</code> và đổi URL gọi API sang cổng mới. Khi chạy MySQL cổng khác, sửa <code>DB_URL</code> theo đúng cổng. </p>
<p>Demo dùng <code>ddl-auto: validate</code> để kiểm tra bảng đã chuẩn bị sẵn. Chạy SQL khởi tạo trước khi khởi động ứng dụng.</p>
<p>Nếu log báo không nạp được driver class, mở <code>pom.xml</code> và kiểm tra MySQL Connector/J đã có trong classpath sau khi Maven tải dependencies. Với URL <code>jdbc:mysql:</code>, Spring Boot có thể suy ra driver từ URL khi connector đã có sẵn. </p>
<p class="file-links"><a href="../buoi-01/demo/src/main/resources/schema.sql">SQL tạo bảng</a> <a href="../buoi-01/demo/src/main/resources/data.sql">SQL tạo dữ liệu mẫu</a> <a href="../buoi-01/demo/src/main/resources/application.yaml">Cấu hình YAML đầy đủ</a></p>
<h3>JDBC URL, driver và connection pool</h3>
<p>Đọc <code>jdbc:mysql://localhost:3306/product</code> từ trái sang phải. <code>jdbc:mysql:</code> cho biết JDBC driver MySQL có thể xử lý URL này. <code>localhost:3306</code> là nơi driver mở kết nối. <code>product</code> là database được chọn mặc định. Username và password đến từ hai thuộc tính riêng.</p>
<p><code>DataSource</code> cung cấp kết nối cho hạ tầng truy cập dữ liệu. Trong demo, HikariCP quản lý nhóm kết nối có thể tái sử dụng. Khi Hibernate truy vấn, nó lấy kết nối từ datasource, thực hiện công việc qua JDBC rồi trả kết nối về pool. Mỗi HTTP request có thể dùng lại kết nối đang có.</p>
<p>Biểu thức <code>\${DB_URL:jdbc:mysql://localhost:3306/product}</code> dùng giá trị <code>DB_URL</code> khi biến đã có, hoặc dùng URL sau dấu hai chấm làm mặc định. Ví dụ dưới đây giả sử MySQL dùng <code>3310</code>, còn web server dùng <code>812</code>. Khởi động lại ứng dụng sau khi đổi biến.</p>
<figure class="snippet"><figcaption>PowerShell · đổi hai cổng độc lập</figcaption><pre tabindex="0"><code class="language-powershell">$env:DB_URL = 'jdbc:mysql://localhost:3310/product'
$env:SERVER_PORT = '812'
# Sau khi chạy lại ứng dụng
curl.exe -i http://localhost:812/products/1</code></pre></figure>
<p>Với <code>ddl-auto: validate</code>, schema thực tế cần khớp với mapping Hibernate. Nếu thiếu bảng hoặc kiểu cột sai, ứng dụng có thể dừng khi khởi động. <code>update</code> cho phép Hibernate thử sửa schema. <code>create</code> có thể xóa dữ liệu khi tạo lại schema. Demo dùng script SQL làm nguồn tạo bảng và dùng Hibernate để kiểm tra.</p>
<p class="reading"><a href="https://docs.spring.io/spring-boot/3.5/reference/data/sql.html">Spring Boot · SQL và DataSource</a> · <a href="https://docs.spring.io/spring-boot/3.5/reference/features/external-config.html">Spring Boot · Cấu hình bên ngoài</a> · <a href="https://docs.spring.io/spring-boot/3.5/how-to/data-initialization.html">Spring Boot · Khởi tạo schema</a></p>
</section><p><a href="#top">Về đầu trang ↑</a></p>`,t=`<div class="callout intro"><strong>Mục tiêu và điều kiện học</strong><p>Cấu hình datasource bằng biến môi trường và kiểm tra sai URL/sai schema riêng.</p><p><strong>Cần biết trước:</strong> HTTP, Maven và cấu hình Spring Boot. Các bài ứng dụng có thể cần đọc trước phần dữ liệu tương ứng; dùng <a href="../index.html">lộ trình</a> để chọn kiến thức còn thiếu.</p><p class="version-note">Baseline: Java 17 · Spring Boot 3.5.10 · Framework 6.2 · Security 6.5. Mỗi demo có hướng dẫn riêng; ví dụ H2 không chứng minh hành vi trên DB khác.</p></div>`,n=`<section class="chapter" id="nguon-chinh-thuc"><h2>Nguồn chính thức</h2><ul><li><a href="https://docs.spring.io/spring-boot/3.5/reference/data/sql.html">Spring Boot 3.5 · DataSource và JDBC</a></li><li><a href="https://docs.spring.io/spring-boot/3.5/how-to/data-initialization.html">Spring Boot 3.5 · Thứ tự khởi tạo cơ sở dữ liệu và migration</a></li></ul></section>`,r=``,i=[{id:`boi-canh`,title:`Phân biệt lỗi kết nối và lỗi schema`},{id:`mysql`,title:`Kết nối MySQL`},{id:`bai-tap-code`,title:`Bài tập lập trình`},{id:`kiem-tra-nang-luc`,title:`Kiểm tra cách hiểu`},{id:`nguon-chinh-thuc`,title:`Nguồn chính thức`}],a={title:`Từ cổng HTTP đến bảng trong DB`,setup:`Ứng dụng nghe HTTP 811, JDBC phải tới MySQL 3306 ở schema product.`,steps:[{label:`Nhận HTTP`,result:`Cổng 811 chỉ là điểm vào web, chưa chứng minh datasource mở được kết nối.`},{label:`Mở kết nối`,result:`Sai port JDBC làm kết nối thất bại. Đổi đúng port, giữ schema để cô lập lỗi.`},{label:`Truy vấn`,result:`Kết nối thành công nhưng trỏ schema thiếu bảng vẫn lỗi SQL. So URL/schema từ ứng dụng với IDE.`}]},o={bodyHtml:e,introHtml:t,referencesHtml:n,videoHtml:``,toc:i,simulation:a};export{e as bodyHtml,o as default,t as introHtml,n as referencesHtml,a as simulation,i as toc,r as videoHtml};