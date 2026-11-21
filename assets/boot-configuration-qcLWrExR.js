var e=`<section class="chapter" id="distinction"><h2>Spring Framework và Spring Boot</h2>
<p>Cùng một JAR danh bạ phải chạy trên hai port khác nhau và kênh gửi lời mời cần giới hạn riêng từng nơi. Ai chọn cấu hình có hiệu lực và làm sao chứng minh giá trị cuối? Dùng lại cách đăng ký bean ở <a href="../bean-registration/index.html">bài chọn bean</a> và Maven ở <a href="../nen-tang-http/index.html">bài HTTP</a>.</p>
<p>Spring Framework cung cấp container, DI, transaction và Web MVC cùng nhiều thành phần khác. Spring Boot tổ chức ứng dụng, quản lý phiên bản dependency và cung cấp auto-configuration theo điều kiện. Boot không thay thế cơ chế bean; nó thêm cấu hình mặc định khi điều kiện phù hợp.</p>
<p>Starter là nhóm dependency thuận tiện cho một nhu cầu như web hoặc security. Parent/BOM quản lý phiên bản; việc dependency được tải không có nghĩa mọi tính năng đều được bật hoặc đã có policy đúng. Ví dụ starter-security không mặc định bật annotation method security.</p>
<p>Giáo trình giữ <code>Spring Boot 3.5.10</code> để đồng bộ demo có sẵn, không gọi đó là bản mới nhất. Các liên kết tài liệu theo nhánh 3.5 có thể hiển thị patch mới hơn; khi hành vi khác nhau, kiểm tra dependency tree và chạy test trên chính artifact đang học.</p></section><aside class="callout"><strong>Chạy các ví dụ trên máy</strong><p><a download="" href="../../../practice/spring-demo-bundle/downloads/spring-demo-bundle.zip">Tải bộ demo Maven (.zip)</a>. Giải nén và dùng thư mục <code>spring-demo-bundle</code> chứa <code>lessons</code> và <code>practice</code> làm thư mục gốc cho các lệnh trong bài. Khi bài yêu cầu vào thư mục demo, mở thư mục chứa <code>pom.xml</code> của demo đó.</p></aside>
<section class="chapter" id="auto"><h2>Auto-configuration là cấu hình có điều kiện</h2>
<p>Khi chạy <code>SpringApplication</code>, Boot xây environment và context. Auto-configuration xét các điều kiện như class có trên classpath, thuộc tính được đặt, hoặc đã có bean do ứng dụng cung cấp. Nhiều cấu hình mặc định rút lui khi bạn khai báo bean phù hợp; không nên khái quát mọi bean đều được override cùng cách.</p>
<figure class="snippet"><figcaption>PowerShell · quan sát quyết định cấu hình</figcaption><pre tabindex="0"><code class="language-powershell"># Từ thư mục practice/spring-foundations/solution:
mvn package
java -jar target/spring-foundations-1.0.0.jar --debug --server.port=8182</code></pre></figure>
<p>Đọc condition evaluation report để tìm cấu hình đã match hoặc không match. Chỉ bật debug trong môi trường phù hợp; không chép toàn bộ log có cấu hình nhạy cảm vào nơi công khai. Khi datasource lỗi, phân biệt thiếu driver, sai URL, không xác thực được và schema thiếu.</p></section>
<section class="chapter" id="properties"><h2>Một artifact, nhiều nguồn cấu hình</h2>
<p>Ví dụ file cấu hình đặt port 8181, biến môi trường đặt 8182, argument dòng lệnh đặt 8183. Trong các nguồn thông thường này, argument có thể ghi đè biến môi trường và file. Đây là một lát cắt của thứ tự property sources, không phải toàn bộ quy tắc khi có test properties, import và vị trí file khác nhau.</p>
<figure class="snippet"><figcaption>YAML · cấu hình lab</figcaption><pre tabindex="0"><code class="language-yaml">server:
  port: 8181
spring:
  datasource:
    url: jdbc:h2:mem:foundations;DB_CLOSE_DELAY=-1
  sql:
    init:
      mode: always
app:
  greeting: Xin chào</code></pre></figure>
<p>Dữ liệu H2 trong bộ nhớ phục vụ lab và có thể mất khi tiến trình dừng. <code>DB_CLOSE_DELAY=-1</code> giữ DB trong thời gian JVM sống khi connection cuối đóng; không biến nó thành cơ sở dữ liệu lưu bền sau restart.</p>
<p>Nhóm cấu hình có cấu trúc phù hợp với <code>@ConfigurationProperties</code>; cần đăng ký qua scanning hoặc <code>@EnableConfigurationProperties</code> theo thiết kế. Thêm validation khi giá trị thiếu/sai phải làm startup thất bại rõ ràng. Tránh rải chuỗi property giống nhau trên nhiều class.</p></section>
<section class="chapter" id="profiles"><h2>Profiles và bí mật cấu hình</h2>
<p>Profile chọn nhóm cấu hình hoặc bean theo môi trường. <code>application-local.yaml</code> chỉ tham gia khi profile local được bật theo quy tắc nạp cấu hình. Profile không phải cơ chế phân quyền, cũng không tự che bí mật đã commit vào Git.</p>
<figure class="snippet"><figcaption>PowerShell · override cho một lần chạy</figcaption><pre tabindex="0"><code class="language-powershell">$env:SERVER_PORT = '8182'
java -jar target/spring-foundations-1.0.0.jar --server.port=8183
# Log phải báo cổng 8183.
# Kết thúc thử nghiệm rồi xóa biến trong phiên:
Remove-Item Env:SERVER_PORT</code></pre></figure>
<p>Khi học bằng <code>spring-boot:run</code>, kiểm tra cách plugin truyền argument; đừng giả định argument của Maven được truyền nguyên vẹn sang app. Lệnh chạy JAR ở trên làm rõ tầng nào nhận giá trị.</p></section>
<section class="chapter" id="practice"><h2>Tự kiểm chứng cấu hình hiệu lực</h2>
<p>Khởi động cùng JAR theo ba ca dưới đây, mỗi lần dùng một tiến trình. Đọc dòng log báo port rồi gửi <code>curl.exe -i -u reader:demo-pass http://127.0.0.1:PORT/api/groups</code> tới port vừa quan sát.</p>
<div class="table-wrap"><table><thead><tr><th>File trong JAR</th><th>Biến môi trường</th><th>Argument</th><th>Port dự kiến</th></tr></thead><tbody>
<tr><td>8181</td><td>Vắng</td><td>Vắng</td><td>8181</td></tr>
<tr><td>8181</td><td><code>SERVER_PORT=8182</code></td><td>Vắng</td><td>8182</td></tr>
<tr><td>8181</td><td><code>SERVER_PORT=8182</code></td><td><code>--server.port=8183</code></td><td>8183</td></tr>
</tbody></table></div>
<p><strong>Tự viết cấu hình.</strong> Trong bản sao starter, đăng ký <code>@ConfigurationProperties("invitations")</code> với một record có <code>@Min(1)</code> trên <code>maxRecipients</code> và <code>@Validated</code> trên kiểu. Viết test tạo context với <code>invitations.max-recipients=5</code> và <code>=0</code>. Kiểm bean chứa 5, rồi kiểm nguyên nhân bind/validation ở ca 0. Thêm ca ghi đè thành 8 từ nguồn ưu tiên cao hơn. Bài <a href="../boot-auto-configuration/index.html">auto-configuration cho module</a> chuyển sang kiểm tra điều kiện tạo bean mặc định.</p>
<ol><li>Build solution, chạy port mặc định và gọi API.</li><li>Đổi port bằng argument; thử cả cổng cũ và mới để phân biệt tiến trình cũ còn chạy.</li><li>Bật <code>--debug</code>, tìm một auto-configuration có điều kiện và giải thích kết quả bằng classpath/bean hiện có.</li><li>Trong bản sao, đặt datasource URL sai, đọc nguyên nhân gốc và sửa. Chạy test lại thay vì chỉ nhìn log startup.</li></ol>
<details class="question"><summary>Có nên dùng ddl-auto=update làm chiến lược migration production?</summary><p>Không coi nó là thay thế cho migration được kiểm soát. Production cần lịch sử thay đổi schema, khả năng review và quy trình triển khai phù hợp. Demo dùng schema/init rõ ràng trong DB học tập riêng.</p></details></section>
<section class="chapter" id="tooling"><h2>Lombok và DevTools hoạt động ở đâu?</h2>
<p>Lombok sinh mã lúc biên dịch, ví dụ <code>@Getter</code> sinh getter; <code>@RequiredArgsConstructor</code> sinh constructor cho field final chưa khởi tạo và các field đánh dấu <code>@NonNull</code> tương ứng. Spring chỉ thấy bytecode sau khi compile. Nếu IDE đỏ mà Maven qua, kiểm tra IDE biết annotation processing. Nếu Maven báo thiếu getter, kiểm tra dependency, annotation processor path và chạy compile sạch. Plugin IDE không thay thế processor của Maven; JDK mới có thể cần khai báo processor tường minh. Demo giữ constructor viết tay để dễ lần theo DI.</p><p>DevTools restart khi classpath được cập nhật, không phải cứ lưu file Java là bytecode đổi. Dùng trong project chạy từ IDE hoặc <code>mvn spring-boot:run</code>; build project rồi quan sát log restart. JAR production thường không chứa DevTools. Hai classloader tách phần thư viện và phần class của app; nếu sửa mã không thấy kết quả, kiểm tra IDE đã build, đúng port và đúng tiến trình rồi thử restart tay. LiveReload để làm mới phía trình duyệt là tính năng khác.</p><h3>Thử thay một dòng mã để thấy sự khác nhau</h3><ol><li><strong>Lombok:</strong> làm trong bản sao. Thêm dependency <code>org.projectlombok:lombok</code> với scope <code>provided</code> (dùng bản do Spring Boot quản lý) và khai báo processor của nó. Tạo <code>ToolingExample.java</code> cùng package với <code>Products.java</code>. Sau <code>mvn clean compile</code>, xem <code>javap -classpath target/classes vn.railway89.lab.ToolingExample</code>. Sẽ thấy <code>ToolingExample(String)</code> và <code>getLabel()</code>; xóa annotation, thêm constructor Java nếu cần compile và so bytecode trước/sau.</li><li><strong>DevTools:</strong> trong một bản sao khác, thêm dependency <code>org.springframework.boot:spring-boot-devtools</code> với <code>&lt;optional&gt;true&lt;/optional&gt;</code>. Chạy <code>mvn spring-boot:run</code>. Đổi giá trị username trong handler <code>whoami</code> thành chuỗi <code>"restarted"</code>, rồi từ cửa sổ khác chạy <code>mvn compile</code>. Kiểm tra log restart và GET <code>/api/whoami</code> có credential demo. Trên bản gốc username là <code>admin</code>; sau restart trả <code>restarted</code>. Nếu chỉ lưu file mà chưa compile, kết quả vẫn là <code>admin</code>.</li></ol><figure class="snippet"><figcaption>Thử Lombok trong bản sao</figcaption><pre tabindex="0"><code class="language-java">package vn.railway89.lab;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter @RequiredArgsConstructor
class ToolingExample {
    private final String label;
}</code></pre></figure>
</section><section aria-labelledby="khoi-tao-heading" class="chapter" id="khoi-tao"><header class="chapter-top"><h2 id="khoi-tao-heading">Khởi tạo Spring Boot</h2></header>
<p>Một REST backend nhận request từ client, xử lý use case và trả response. Starter đưa các dependency liên quan vào classpath; auto-configuration cung cấp bean mặc định khi các điều kiện phù hợp. Cần kiểm tra cấu hình hiệu lực thay vì suy ra chỉ từ tên dependency.</p>
<h3>Tạo project Maven</h3>
<ol><li>Tạo dự án Spring Boot từ Spring Initializr trên web hoặc trong IDE. Chọn Maven, Java và cách đóng gói JAR.</li><li>Điền <code>groupId</code> của nhóm và <code>artifactId</code> của ứng dụng. Ví dụ dùng <code>vn.railway89</code> và <code>product-offerings-demo</code>.</li><li>Chọn các thư viện dưới đây, mở <code>pom.xml</code> và đợi Maven tải xong dependencies. Starter parent quản lý phiên bản cho các dependency phổ biến.</li></ol>
<dl class="definitions">
<div><dt>Spring Web</dt><dd>Điều phối request qua Spring MVC và ghi response JSON.</dd></div>
<div><dt>Spring Data JPA</dt><dd>Khai báo repository bằng interface. Hibernate ánh xạ entity và truy vấn cơ sở dữ liệu.</dd></div>
<div><dt>MySQL Connector/J</dt><dd>JDBC driver để tiến trình Java kết nối được với MySQL.</dd></div>
<div><dt>Lombok</dt><dd>Sinh getter, setter và constructor lúc biên dịch. Ví dụ, <code>@Getter</code> sinh phương thức <code>getName()</code> để mã Java và Jackson có thể đọc thuộc tính.</dd></div>
<div><dt>Spring Boot Starter Test</dt><dd>Hỗ trợ kiểm thử ứng dụng. Demo dùng JUnit và MockMvc.</dd></div>
</dl>
<p>Đặt class khởi động ở package gốc, bên trên các package con chứa controller, service, repository và entity để Spring tìm thấy chúng. <code>@SpringBootApplication</code> kích hoạt cấu hình tự động và quét các component. Hàm <code>main</code> gọi <code>SpringApplication.run</code> để tạo application context và khởi động ứng dụng. </p>
<figure class="snippet"><figcaption>ProductApplication.java</figcaption><pre tabindex="0"><code class="language-java">@SpringBootApplication
public class ProductApplication {
    public static void main(String[] args) {
        SpringApplication.run(ProductApplication.class, args);
    }
}</code></pre></figure>
<p class="file-links"><a href="../buoi-01/demo/pom.xml">Xem pom.xml đầy đủ</a> <a href="../buoi-01/demo/src/main/java/vn/railway89/products/ProductApplication.java">Xem class khởi động</a></p>
<h3>Từ Maven đến application context</h3>
<p>Maven đọc <code>pom.xml</code>, giải quyết các dependency trực tiếp và gián tiếp rồi đưa thư viện cần thiết vào classpath. Starter Web kéo theo Spring MVC, servlet container nhúng và thư viện chuyển đổi JSON. <em>Starter</em> cung cấp thư viện. <em>Auto-configuration</em> chọn cấu hình phù hợp dựa trên classpath, thuộc tính và bean hiện có.</p>
<p><code>@SpringBootApplication</code> gộp ba vai trò. <code>@SpringBootConfiguration</code> đánh dấu cấu hình chính. <code>@EnableAutoConfiguration</code> kích hoạt các cấu hình có điều kiện. <code>@ComponentScan</code> tìm component từ package của class chạy xuống các package con. Nếu đặt <code>ProductApplication</code> trong <code>vn.railway89.products.bootstrap</code>, package <code>vn.railway89.products.controller</code> nằm ngang hàng và không tự được quét. Giữ class chạy ở <code>vn.railway89.products</code> để bao hết các package của demo.</p>
<figure class="snippet"><figcaption>Cấu trúc package của demo</figcaption><pre tabindex="0"><code class="language-none">vn.railway89.products
├── ProductApplication.java
├── controller  → HTTP
├── service     → điều phối và xử lý trường hợp thiếu dữ liệu
├── repository  → truy vấn dữ liệu
└── entity      → ánh xạ đối tượng với bảng</code></pre></figure>
<p class="reading"><a href="https://docs.spring.io/spring-boot/3.5/reference/using/auto-configuration.html">Spring Boot · Auto-configuration</a> · <a href="https://docs.spring.io/spring-boot/3.5/reference/using/structuring-your-code.html">Spring Boot · Cấu trúc package</a></p>
</section><p><a href="#top">Về đầu trang ↑</a></p>`,t=`<div class="callout intro"><strong>Mục tiêu và điều kiện học</strong><p>Viết cấu hình port mặc định và override qua biến môi trường/lệnh chạy.</p><p><strong>Cần biết trước:</strong> Bean definition và classpath Maven. Các bài ứng dụng có thể cần đọc trước phần dữ liệu tương ứng; dùng <a href="../index.html">lộ trình</a> để chọn kiến thức còn thiếu.</p><p class="version-note">Baseline: Java 17 · Spring Boot 3.5.10 · Framework 6.2 · Security 6.5. Mỗi demo có hướng dẫn riêng; ví dụ H2 không chứng minh hành vi trên DB khác.</p></div>`,n=`<section class="chapter" id="nguon-chinh-thuc"><h2>Nguồn chính thức</h2><ul><li><a href="https://docs.spring.io/spring-boot/3.5/reference/using/auto-configuration.html">Spring Boot 3.5 · Auto-configuration</a></li><li><a href="https://docs.spring.io/spring-boot/3.5/reference/features/external-config.html">Spring Boot 3.5 · Externalized configuration và thứ tự sources</a></li><li><a href="https://docs.spring.io/spring-boot/3.5/reference/features/profiles.html">Spring Boot 3.5 · Profiles</a></li><li><a href="https://docs.spring.io/spring-boot/3.5/reference/using/build-systems.html">Spring Boot 3.5 · Starters và dependency management</a></li></ul></section>`,r=``,i=[{id:`distinction`,title:`Spring Framework và Spring Boot`},{id:`auto`,title:`Auto-configuration là cấu hình có điều kiện`},{id:`properties`,title:`Một artifact, nhiều nguồn cấu hình`},{id:`profiles`,title:`Profiles và bí mật cấu hình`},{id:`practice`,title:`Tự kiểm chứng cấu hình hiệu lực`},{id:`tooling`,title:`Lombok và DevTools hoạt động ở đâu?`},{id:`khoi-tao`,title:`Khởi tạo Spring Boot`},{id:`bai-tap-code`,title:`Bài tập lập trình`},{id:`kiem-tra-nang-luc`,title:`Kiểm tra cách hiểu`},{id:`nguon-chinh-thuc`,title:`Nguồn chính thức`}],a={title:`Port hiệu lực từ nhiều nguồn`,setup:`Cùng một JAR: file đặt 8080, SERVER_PORT=8182 và tham số --server.port=8183.`,steps:[{label:`Có đủ ba nguồn`,result:`Tham số dòng lệnh đang có ưu tiên trong ba nguồn này. Server nghe cổng 8183.`},{label:`Bỏ tham số`,result:`Biến môi trường vẫn còn. Server nghe cổng 8182 dù file vẫn ghi 8080.`},{label:`Bỏ biến môi trường`,result:`Với giả định không có nguồn cạnh tranh khác, server dùng file và lắng nghe 8080. Xác minh bằng log startup.`}]},o={bodyHtml:e,introHtml:t,referencesHtml:n,videoHtml:``,toc:i,simulation:a};export{e as bodyHtml,o as default,t as introHtml,n as referencesHtml,a as simulation,i as toc,r as videoHtml};