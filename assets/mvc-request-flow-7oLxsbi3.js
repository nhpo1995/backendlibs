var e=`
<section class="chapter" id="mvc-pipeline"><h2>Lần từ 200, 400, 404 về tầng xử lý</h2>
<p>Danh sách nhóm đọc được, nhưng GET chi tiết lúc trả 400, lúc trả 404. Bắt đầu với <a href="../nen-tang-http/index.html">hợp đồng HTTP</a> và vòng đời <a href="../boot-configuration/index.html">ứng dụng Boot</a>. Bài dùng repository như cổng đọc. Phần triển khai JPA được giải thích riêng bên dưới.</p>
<figure class="snippet"><figcaption>Ví dụ · đường đi của GET /api/groups/1</figcaption><pre tabindex="0"><code class="language-java">Servlet filters xác thực reader
  → DispatcherServlet dùng HandlerMapping tìm GET /api/groups/{id}
  → HandlerAdapter phân giải @PathVariable và chuyển id sang long
  → controller gọi GroupService.find(1)
  → service đọc nhóm, controller trả dữ liệu
  → HTTP message converter ghi JSON</code></pre></figure>
<div class="table-wrap"><table><thead><tr><th>Request trong Spring Foundations</th><th>Bước cuối có ý nghĩa</th><th>Dự kiến</th></tr></thead><tbody>
<tr><td>GET <code>/api/groups/1</code>, credential đúng, seed mới</td><td>Ghi JSON từ giá trị trả về</td><td>200, <code>{"id":1,"name":"Backend"}</code></td></tr>
<tr><td>GET <code>/api/groups/abc</code>, credential đúng</td><td>Route khớp, chuyển ID thành số thất bại</td><td>400, handler chưa được gọi</td></tr>
<tr><td>GET <code>/api/groups/999999</code>, credential đúng</td><td>Service không tìm thấy nhóm</td><td>404, handler và service đã được gọi</td></tr>
<tr><td>GET <code>/api/groups/1</code>, credential sai</td><td>Security filter từ chối xác thực</td><td>401, chưa vào MVC</td></tr>
</tbody></table></div>
<p>DispatcherServlet điều phối request. HandlerMapping chọn method. HandlerAdapter lo gọi method, trong đó argument resolver lấy và chuyển tham số, còn bộ xử lý giá trị trả về phối hợp với converter để ghi body. Nếu MVC gặp lỗi, các <code>HandlerExceptionResolver</code> có thể chuyển exception thành response. HTTP 404 cũng có thể đến từ request không có handler nghiệp vụ, nên cần breakpoint hoặc test tương tác để phân biệt.</p>
<p><strong>Tự viết phép đo.</strong> Dùng <code>MockMvc</code> với controller có service mock. Kiểm <code>verifyNoInteractions</code> cho <code>abc</code>, verify <code>find(999999L)</code> cho lỗi service, rồi test JSON ở ca thành công. Nếu giữ security trong context, gửi credential phù hợp hoặc cấu hình danh tính test. Dùng test hiện có để đọc status và chạy đối chứng bằng <code>mvn -f practice/spring-foundations/solution/pom.xml -Dtest=GroupApiTest test</code>. Test tương tác là việc người học bổ sung. Ba bước tiếp theo mở cùng pipeline trong demo sản phẩm.</p>
</section><aside class="callout"><strong>Chạy các ví dụ trên máy</strong><p><a download="" href="../../../practice/spring-demo-bundle/downloads/spring-demo-bundle.zip">Tải bộ demo Maven (.zip)</a>. Giải nén và dùng thư mục <code>spring-demo-bundle</code> chứa <code>lessons</code> và <code>practice</code> làm thư mục gốc cho các lệnh trong bài. Khi bài yêu cầu vào thư mục demo, mở thư mục chứa <code>pom.xml</code> của demo đó.</p></aside>
<section aria-labelledby="entity-heading" class="chapter" id="entity"><header class="chapter-top"><h2 id="entity-heading">Ánh xạ entity</h2></header>
<p>Entity biểu diễn một đối tượng có định danh trong JPA. Hibernate liên kết đối tượng <code>ProductOffering</code> với một dòng của bảng <code>product_offerings</code>. <code>@Entity</code> đánh dấu class, <code>@Table</code> chỉ bảng, <code>@Id</code> chỉ khóa chính và <code>@Column</code> khai báo tên hoặc ràng buộc của cột. </p>
<figure class="snippet"><figcaption>ProductOffering.java · phần ánh xạ</figcaption><pre tabindex="0"><code class="language-java">@Entity
@Table(name = "product_offerings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProductOffering {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private Integer price;
    private String color;
}</code></pre></figure>
<ul>
<li>Demo khai báo <code>IDENTITY</code> để MySQL sinh khóa từ <code>AUTO_INCREMENT</code> khi ghi một entity mới. Khi đọc, Hibernate lấy giá trị ID từ dòng có sẵn.</li>
<li><code>Integer</code> giữ được <code>null</code> nếu cơ sở dữ liệu chưa có giá. <code>int</code> chỉ biểu diễn số nguyên. Tương tự, <code>Long</code> có thể để trống trước lúc lưu entity mới.</li>
<li>Khai báo <code>@Column(name = "tên_cột")</code> khi cần ánh xạ sang tên khác. Ví dụ trường Java <code>displayName</code> có thể ánh xạ tới cột <code>name</code>.</li>
<li>JPA cần constructor không tham số public hoặc protected để tạo entity. Ví dụ dùng <code>@NoArgsConstructor</code>. Các annotation Lombok sinh constructor, getter và setter cần thiết khi biên dịch. </li>
</ul>
<p class="file-links"><a href="../buoi-01/demo/src/main/java/vn/railway89/products/entity/ProductOffering.java">Xem entity đầy đủ</a></p>
<p><code>Serializable</code> đánh dấu kiểu có thể dùng với cơ chế tuần tự hóa đối tượng của Java. Hibernate ánh xạ entity với dữ liệu JDBC, còn Jackson dựng JSON từ các thuộc tính Java. Hai thao tác trong demo không yêu cầu entity khai báo <code>Serializable</code>.</p>
<h3>Vì sao bỏ getter mà vẫn đọc được dữ liệu?</h3>
<p>Demo đặt <code>@Id</code> trực tiếp trên trường <code>id</code> và dùng <em>field access</em>. Hibernate có thể đọc và ghi trường đã ánh xạ để dựng đối tượng. Jackson khám phá thuộc tính JSON theo quy tắc riêng. Ở class này, getter public do Lombok sinh giúp Jackson nhìn thấy các trường private. Vì vậy truy vấn database có thể thành công trong khi response JSON lỗi hoặc thiếu trường.</p>
<p>Dòng có <code>price = NULL</code> là một sản phẩm đã được tìm thấy với giá chưa xác định. Repository trả <code>Optional.empty()</code> khi không có dòng ứng với ID. Thử thêm một dòng bằng tài khoản có quyền ghi rồi lấy ID đã sinh trên cùng kết nối MySQL.</p>
<figure class="snippet"><figcaption>Một dòng có giá chưa xác định</figcaption><pre tabindex="0"><code class="language-sql">INSERT INTO product_offerings (name, price, color)
VALUES ('Product B', NULL, 'blue');
SELECT LAST_INSERT_ID();</code></pre></figure>
<p>Gọi <code>/products/{id}</code> với ID vừa sinh. Kỳ vọng nhận <code>200</code> và <code>"price": null</code>. H2 test trong dự án kiểm tra đúng trường hợp này với một dòng mẫu có cả giá và màu để trống.</p>
<p class="reading"><a href="https://jakarta.ee/specifications/persistence/3.1/jakarta-persistence-spec-3.1#entities">Jakarta Persistence · Entities và access type</a> · <a href="https://docs.oracle.com/cd/E17952_01/mysql-8.4-en/example-auto-increment.html">MySQL · AUTO_INCREMENT</a> · <a href="https://projectlombok.org/features/GetterSetter">Project Lombok · Getter và Setter</a></p>
</section>
<section aria-labelledby="repository-heading" class="chapter" id="repository"><header class="chapter-top"><h2 id="repository-heading">Repository và service</h2></header>
<h3>Repository đọc theo khóa chính</h3>
<p><code>JpaRepository&lt;ProductOffering, Long&gt;</code> khai báo kiểu entity và kiểu ID. Spring Data tạo implementation cho interface lúc chạy, nên có thể gọi ngay <code>findById</code>. Ví dụ truy vấn theo khóa chính tận dụng phương thức có sẵn. </p>
<figure class="snippet"><figcaption>ProductOfferingRepository.java</figcaption><pre tabindex="0"><code class="language-java">public interface ProductOfferingRepository
        extends JpaRepository&lt;ProductOffering, Long&gt; {
}</code></pre></figure>
<h3>Service xử lý kết quả truy vấn</h3>
<p>Khi nhận ID <code>1</code>, controller gọi interface service. Lớp triển khai có <code>@Service</code> được Spring đăng ký để controller có thể nhận qua constructor. Service gọi <code>repository.findById(1L)</code>. Khi repository trả <code>Optional.empty()</code>, service chuyển kết quả đó thành lỗi không tìm thấy sản phẩm. </p>
<figure class="snippet"><figcaption>ProductOfferingServiceImpl.java · tìm theo ID</figcaption><pre tabindex="0"><code class="language-java">@Service
public class ProductOfferingServiceImpl implements ProductOfferingService {
    private final ProductOfferingRepository repository;

    public ProductOfferingServiceImpl(ProductOfferingRepository repository) {
        this.repository = repository;
    }

    @Override
    public ProductOffering getById(Long id) {
        return repository.findById(id)
            .orElseThrow(() -&gt; new ProductOfferingNotFoundException(id));
    }
}</code></pre></figure>
<p><code>orElseThrow</code> trả entity khi có dữ liệu và tạo exception đã chỉ định khi <code>Optional</code> rỗng. Nếu viết bằng <code>isEmpty()</code> và <code>get()</code>, phải kiểm tra nhánh rỗng trước. Service nhận repository qua constructor. Spring tự chọn constructor khi bean chỉ khai báo một constructor. </p>
<p class="file-links"><a href="../buoi-01/demo/src/main/java/vn/railway89/products/repository/ProductOfferingRepository.java">Repository đầy đủ</a> <a href="../buoi-01/demo/src/main/java/vn/railway89/products/service/ProductOfferingServiceImpl.java">Service đầy đủ</a></p>
<h3>Spring cung cấp implementation bằng cách nào?</h3>
<p>Khi khởi động, Spring Data tìm interface repository rồi tạo một bean qua proxy. Spring truyền bean này vào constructor của service. Khi tạo controller, Spring tìm bean phù hợp với kiểu <code>ProductOfferingService</code> và truyền vào constructor của controller. Mỗi kiểu ở demo có một bean phù hợp, và mỗi class chỉ có một constructor nên Spring tự dùng constructor đó.</p>
<p><code>findById</code> là phương thức có sẵn để tra khóa chính. Để tra theo màu, khai báo phương thức dưới đây trong repository. Spring Data suy ra điều kiện từ thuộc tính Java <code>color</code>. Kiểu <code>List</code> phù hợp vì một màu có thể có nhiều sản phẩm. Kết quả là danh sách rỗng khi không có bản ghi phù hợp.</p>
<figure class="snippet"><figcaption>Ví dụ mở rộng · query theo màu</figcaption><pre tabindex="0"><code class="language-java">// Thêm vào ProductOfferingRepository, cùng import java.util.List.
List&lt;ProductOffering&gt; findByColor(String color);

// Ví dụ sử dụng trong service.
List&lt;ProductOffering&gt; redProducts = repository.findByColor("red");</code></pre></figure>
<p>Trong luồng theo ID, repository cung cấp trạng thái có hoặc không có bản ghi. Service quyết định việc thiếu sản phẩm có nghĩa gì với tác vụ hiện tại. Với <code>orElseThrow(() -&gt; ...)</code>, hàm tạo exception chỉ chạy khi <code>Optional</code> rỗng. Controller và Spring MVC quyết định cách thể hiện kết quả đó bằng HTTP.</p>
<p class="reading"><a href="https://docs.spring.io/spring-framework/reference/6.2/core/beans/dependencies/factory-collaborators.html">Spring Framework · Dependency Injection</a> · <a href="https://docs.spring.io/spring-data/jpa/reference/3.5/jpa/query-methods.html">Spring Data JPA · Query methods</a> · <a href="https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/Optional.html">Java 17 · Optional</a></p>
</section>
<section aria-labelledby="rest-heading" class="chapter" id="rest"><header class="chapter-top"><h2 id="rest-heading">Mở API REST</h2></header>
<p>Controller tiếp nhận HTTP request, gọi service và trả về HTTP response. <code>@RestController</code> đánh dấu controller trả dữ liệu trực tiếp. <code>@GetMapping</code> ghép phương thức GET với đường dẫn. <code>ResponseEntity.ok(product)</code> đặt mã <code>200</code> và đưa sản phẩm vào body để Spring chuyển sang JSON.</p>
<p>Đặt ID trong URI để mỗi sản phẩm có địa chỉ riêng. <code>GET /products/1</code> và <code>GET /products/2</code> dùng cùng handler. Spring MVC lấy phần <code>{id}</code> và chuyển sang kiểu <code>Long</code> trước khi gọi service. </p>
<figure class="snippet"><figcaption>ProductOfferingController.java · route theo ID</figcaption><pre tabindex="0"><code class="language-java">@RestController
@RequestMapping("/products")
public class ProductOfferingController {
    private final ProductOfferingService service;

    public ProductOfferingController(ProductOfferingService service) {
        this.service = service;
    }

    @GetMapping("/{id}")
    public ResponseEntity&lt;ProductOffering&gt; getById(@PathVariable("id") Long id) {
        return ResponseEntity.ok(service.getById(id));
    }
}</code></pre></figure>
<p>Với <code>GET /products/1</code>, Spring tách chuỗi <code>1</code> từ URL rồi chuyển thành <code>Long</code>. Nếu service ném <code>ProductOfferingNotFoundException</code>, <code>@ResponseStatus(HttpStatus.NOT_FOUND)</code> trên exception cho Spring biết cần trả về <code>404</code>. Với <code>/products/abc</code>, việc đổi sang <code>Long</code> thất bại và Spring trả <code>400</code> trước khi service chạy.</p>
<h3>Lần theo một request từ URL đến JSON</h3>
<ol class="steps">
<li><strong>HTTP tới ứng dụng.</strong> Trình duyệt gửi <code>GET /products/1</code> đến cổng <code>811</code>. Servlet container nhúng nhận request và chuyển cho <code>DispatcherServlet</code> của Spring MVC.</li>
<li><strong>Chọn handler.</strong> Spring ghép <code>/products</code> trên class với <code>/{id}</code> trên method. Nó chọn method cho GET, lấy đoạn <code>1</code> và chuyển kiểu trước khi gọi Java method.</li>
<li><strong>Đọc dữ liệu.</strong> Controller gọi <code>service.getById(1L)</code>. Repository dùng JPA, Hibernate gửi truy vấn với ID đã gắn vào tham số qua JDBC. SQL bên dưới mô tả điều kiện truy vấn. Alias và danh sách cột sinh ra thực tế có thể khác.</li>
<li><strong>Ghi response.</strong> Hibernate dựng <code>ProductOffering</code> từ dòng MySQL trả về, service lấy entity từ <code>Optional</code>, controller đưa đối tượng vào body của <code>ResponseEntity</code>. Spring MVC chọn bộ chuyển đổi và Jackson ghi JSON với kiểu nội dung <code>application/json</code>.</li>
</ol>
<figure class="snippet"><figcaption>SQL tương đương về ý nghĩa</figcaption><pre tabindex="0"><code class="language-sql">SELECT id, name, price, color
FROM product_offerings
WHERE id = 1;</code></pre></figure>
<p><code>/products/1</code> đặt định danh tài nguyên trong path. Trong ví dụ lọc <code>/products?color=red</code>, <code>color</code> là query parameter và có thể nhận bằng <code>@RequestParam</code>. Demo hiện thực route lấy chi tiết. Route lọc minh họa cách truyền đầu vào cho API danh sách.</p>
<p class="reading"><a href="https://docs.spring.io/spring-framework/reference/6.2/web/webmvc/mvc-servlet.html">Spring MVC · DispatcherServlet</a> · <a href="https://docs.spring.io/spring-framework/reference/6.2/web/webmvc/mvc-controller/ann-requestmapping.html">Spring MVC · Mapping request</a> · <a href="https://docs.spring.io/spring-framework/reference/6.2/web/webmvc/mvc-controller/ann-methods/responseentity.html">Spring MVC · ResponseEntity</a></p>
<h3>HTTP method và status code</h3>
<p>HTTP dùng <code>GET</code> để đọc, <code>POST</code> để gửi dữ liệu cho xử lý hoặc tạo mới, <code>PUT</code> để thay thế biểu diễn tại URL đích và <code>DELETE</code> để xóa. Bài này tập trung vào GET để quan sát từng tầng. </p>
<div class="table-wrap"><table><thead><tr><th scope="col">Mã</th><th scope="col">Khi nào gặp</th></tr></thead><tbody>
<tr><td><code>200 OK</code></td><td>Có sản phẩm, response chứa JSON.</td></tr>
<tr><td><code>400 Bad Request</code></td><td>ID trong URL không chuyển được sang kiểu số.</td></tr>
<tr><td><code>404 Not Found</code></td><td>URL chưa có mapping hoặc ID hợp lệ nhưng không có dữ liệu. Kiểm tra URL và log để phân biệt.</td></tr>
<tr><td><code>500 Internal Server Error</code></td><td>Ứng dụng gặp lỗi khi xử lý request, chẳng hạn lỗi truy vấn hoặc ghi response.</td></tr>
</tbody></table></div>
<p class="file-links"><a href="../buoi-01/demo/src/main/java/vn/railway89/products/controller/ProductOfferingController.java">Controller đầy đủ</a> <a href="../buoi-01/demo/src/main/java/vn/railway89/products/service/ProductOfferingNotFoundException.java">Exception 404</a></p>
<h3>Xem một request trong DevTools</h3>
<p>Để kiểm tra trình duyệt thực sự gửi request nào, mở thẻ Network rồi gọi <code>http://localhost:811/products/1</code>. Chọn dòng request và đối chiếu <strong>Request URL</strong>, <strong>Request Method</strong>, <strong>Status Code</strong> trong Headers, sau đó đọc JSON trong Response. </p>
</section>
<section aria-labelledby="go-loi-heading" class="chapter" id="go-loi"><header class="chapter-top"><h2 id="go-loi-heading">Đọc lỗi và kiểm chứng</h2></header>
<p>Kiểm chứng theo hai giai đoạn. Trước hết xác nhận ứng dụng đã mở cổng HTTP. Sau đó kiểm tra route, dòng dữ liệu và body. Một response <code>200</code> cần được kiểm tra cả nội dung JSON.</p>
<div class="table-wrap"><table><thead><tr><th scope="col">Dấu hiệu</th><th scope="col">Kiểm tra</th></tr></thead><tbody>
<tr><td>Failed to configure a DataSource</td><td>Kiểm tra file cấu hình trong <code>resources</code>, khóa <code>spring.datasource.url</code>, JDBC driver và cấu hình thực tế được nạp. </td></tr>
<tr><td>Access denied hoặc lỗi kết nối MySQL</td><td>Kiểm tra host, port, user, password, quyền trên schema và trạng thái MySQL. So khớp chính xác cổng của MySQL trên máy. </td></tr>
<tr><td>Port 8080 was already in use</td><td>Xem cổng nào đang bị chiếm. Đổi <code>server.port</code> rồi dùng đúng cổng mới trong browser hoặc curl. </td></tr>
<tr><td>Connection refused</td><td>Kiểm tra đúng host và cổng, cùng log khởi động xem có tiến trình lắng nghe không. Lỗi này xảy ra trước khi nhận được HTTP status. </td></tr>
<tr><td>Whitelabel 500 hoặc body <code>{}</code></td><td>Đọc stack trace và kiểm tra ID truyền xuống service. Nếu có dòng dữ liệu nhưng JSON thiếu trường, kiểm tra getter và annotation processing. Thử lại bằng ID <code>1</code> đã có trong dữ liệu mẫu để tách lỗi tìm bản ghi khỏi lỗi chuyển đối tượng sang JSON. </td></tr>
</tbody></table></div>
<h3>Kiểm tra getter Lombok</h3>
<ol><li>Kiểm tra dependency Lombok và cấu hình annotation processor trong <code>pom.xml</code>.</li><li>Khi build từ IntelliJ, mở Settings → Build, Execution, Deployment → Compiler → Annotation Processors và kiểm tra <strong>Enable annotation processing</strong>. </li><li>Build lại và gọi lại API. Có thể dùng getter viết tay để khoanh vùng nguyên nhân. Jackson cần nhận diện thuộc tính JSON, ví dụ qua các getter public như <code>getName()</code>. </li></ol>
<p>Kiểm tra thêm dữ liệu thực tế bằng <code>SELECT id, name, price, color FROM product_offerings WHERE id = 1;</code>. Khi SQL đã trả về đúng dòng, kiểm tra tiếp ánh xạ entity, ID mà service nhận được và dữ liệu trước lúc controller trả response.</p>
<h3>Dừng ở biên đầu tiên bị hỏng</h3>
<ol class="steps">
<li><strong>Chưa có HTTP response.</strong> Kiểm tra log xem Tomcat đã khởi động chưa. Nếu app dừng trước bước đó, tìm nguyên nhân gốc, chẳng hạn lỗi kết nối MySQL hoặc thiếu bảng.</li>
<li><strong>Có status nhưng handler chưa chạy.</strong> Kiểm tra method, URL, cổng, rồi thử breakpoint ngay đầu method controller. <code>/products/abc</code> khớp hình dạng route nhưng lỗi chuyển kiểu trước khi vào method.</li>
<li><strong>Handler chạy nhưng dữ liệu sai.</strong> Kiểm tra <code>id</code> trong service và chạy SQL trên đúng schema. Nếu repository trả đúng bản ghi, chuyển sang kiểm tra mã và body HTTP.</li>
</ol>
<p>Để quan sát truy vấn trên demo cục bộ, đặt biến PowerShell <code>$env:SPRING_JPA_SHOW_SQL = 'true'</code> rồi khởi động lại. Hibernate có thể ghi SQL với ký tự <code>?</code> cho tham số. Dùng ID từ request hoặc debugger để xác định bản ghi được truy vấn.</p>
</section>
<section aria-labelledby="thuc-hanh-heading" class="chapter" id="thuc-hanh"><header class="chapter-top"><h2 id="thuc-hanh-heading">Chạy demo trên máy</h2></header>
<p>Demo dùng Spring Boot 3.5.10, mã nguồn tương thích Java 17 và chạy với Maven. Các câu lệnh dưới đây dùng PowerShell và MySQL cục bộ. Chi tiết tạo tài khoản và dữ liệu có trong README.</p>
<ol>
<li>Tạo database <code>product</code> và tài khoản MySQL có quyền đọc schema đó.</li>
<li>Chạy <code>lessons/springboot/buoi-01/demo/src/main/resources/schema.sql</code> rồi <code>lessons/springboot/buoi-01/demo/src/main/resources/data.sql</code> trong schema <code>product</code> bằng tài khoản có quyền ghi.</li>
<li>Từ thư mục giải nén chứa lessons và practice, chạy demo và gọi API ở cửa sổ PowerShell khác.</li>
</ol>
<figure class="snippet"><figcaption>PowerShell · chạy API</figcaption><pre tabindex="0"><code class="language-powershell">$env:DB_USER = 'railway'
$env:DB_PASSWORD = 'thay-bang-mat-khau-may-ban'
mvn -f lessons/springboot/buoi-01/demo/pom.xml spring-boot:run</code></pre></figure>
<figure class="snippet"><figcaption>PowerShell · gửi request</figcaption><pre tabindex="0"><code class="language-powershell">curl.exe -i http://localhost:811/products/1
curl.exe -i http://localhost:811/products/999
curl.exe -i http://localhost:811/products/abc</code></pre></figure>
<figure class="snippet"><figcaption>GET /products/1 · JSON mong đợi</figcaption><pre tabindex="0"><code class="language-json">{
  "id": 1,
  "name": "Product A",
  "price": 100000,
  "color": "red"
}</code></pre></figure>
<p>Dùng <code>mvn -f lessons/springboot/buoi-01/demo/pom.xml test</code> để chạy bộ kiểm thử với H2 trong bộ nhớ. Bộ kiểm thử xác nhận JSON, ID không tồn tại, ID sai kiểu và trường số hoặc màu có thể rỗng. Khi thực hành MySQL, đối chiếu mã phản hồi và body với ví dụ trên.</p>
<p class="file-links"><a href="../../../README.md">Hướng dẫn chạy demo và GitHub Pages</a></p>
<h3>Tự kiểm tra và giải thích kết quả</h3>
<details><summary>1. Cơ sở dữ liệu có dòng với giá NULL. API trả gì?</summary><p>Kỳ vọng <code>200</code> và <code>"price": null</code>. Dòng tồn tại, <code>Optional</code> chứa entity và trường <code>Integer price</code> nhận được <code>null</code>. Thử thêm dòng rồi gọi đúng ID để kiểm chứng.</p></details>
<details><summary>2. Vì sao <code>/products/abc</code> khác <code>/products/999</code>?</summary><p><code>abc</code> khiến Spring MVC thất bại khi đổi kiểu sang <code>Long</code>. Với <code>999</code>, đổi kiểu thành công. Nếu thiếu dòng, repository trả rỗng và exception trong demo được ánh xạ thành <code>404</code>.</p></details>
<details><summary>3. Đổi cổng HTTP có cần sửa JDBC URL?</summary><p>Chỉ đặt <code>SERVER_PORT=812</code>, khởi động lại và gọi <code>http://localhost:812/products/1</code>. URL JDBC vẫn dùng cổng MySQL. Hai tiến trình mở hai điểm kết nối riêng.</p></details>
<details><summary>4. Vì sao IDE đọc được bảng mà ứng dụng vẫn không kết nối được?</summary><p>IDE và ứng dụng có cấu hình riêng. So sánh <code>DB_URL</code>, user, quyền và schema mà ứng dụng đọc. Nếu log không tìm thấy driver, kiểm tra Maven và classpath của ứng dụng.</p></details>
<details><summary>5. Dữ liệu có trong debugger mà JSON thiếu trường thì xem ở đâu?</summary><p>Kiểm tra getter public của entity và annotation processing. Thử viết <code>getName()</code> bằng tay trong một bản thử, build lại rồi quan sát trường <code>name</code>. Hibernate dùng field access nên vẫn có thể đọc dữ liệu ở bước trước đó.</p></details>
</section>
<p><a href="#top">Về đầu trang ↑</a></p>`,t=`<div class="callout intro"><strong>Mục tiêu và điều kiện học</strong><p>Tự viết endpoint GET /products/{id}; tách lỗi ID sai kiểu khỏi trường hợp không có dữ liệu.</p><p><strong>Cần biết trước:</strong> HTTP, Maven và cấu hình Spring Boot. Các bài ứng dụng có thể cần đọc trước phần dữ liệu tương ứng; dùng <a href="../index.html">lộ trình</a> để chọn kiến thức còn thiếu.</p><p class="version-note">Baseline: Java 17 · Spring Boot 3.5.10 · Framework 6.2 · Security 6.5. Mỗi demo có hướng dẫn riêng; ví dụ H2 không chứng minh hành vi trên DB khác.</p></div>`,n=`<section id="nguon-chinh-thuc"><h2>Nguồn chính thức và tài liệu đối chiếu</h2><ul><li><a href="https://jakarta.ee/specifications/persistence/3.1/jakarta-persistence-spec-3.1#entities">Jakarta Persistence · Entities và access type</a></li><li><a href="https://docs.oracle.com/cd/E17952_01/mysql-8.4-en/example-auto-increment.html">MySQL · AUTO_INCREMENT</a></li><li><a href="https://projectlombok.org/features/GetterSetter">Project Lombok · Getter và Setter</a></li><li><a href="https://docs.spring.io/spring-framework/reference/6.2/core/beans/dependencies/factory-collaborators.html">Spring Framework · Dependency Injection</a></li><li><a href="https://docs.spring.io/spring-data/jpa/reference/3.5/jpa/query-methods.html">Spring Data JPA · Query methods</a></li><li><a href="https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/Optional.html">Java 17 · Optional</a></li><li><a href="https://docs.spring.io/spring-framework/reference/6.2/web/webmvc/mvc-servlet.html">Spring Framework 6.2 · DispatcherServlet và các bean MVC</a></li><li><a href="https://docs.spring.io/spring-framework/reference/6.2/web/webmvc/mvc-controller/ann-requestmapping.html">Spring MVC · Mapping request</a></li><li><a href="https://docs.spring.io/spring-framework/reference/6.2/web/webmvc/mvc-controller/ann-methods/responseentity.html">Spring MVC · ResponseEntity</a></li><li><a href="https://docs.spring.io/spring-boot/3.5/reference/data/sql.html">Spring Boot · SQL Databases</a></li><li><a href="https://docs.spring.io/spring-data/jpa/reference/3.5/repositories/core-concepts.html">Spring Data JPA · Core concepts</a></li><li><a href="https://www.rfc-editor.org/rfc/rfc9110.html">RFC 9110 · HTTP Semantics</a></li><li><a href="https://projectlombok.org/setup/maven">Project Lombok · Cấu hình Maven</a></li></ul></section>`,r=`<section class="chapter" id="moc-video"><details class="video-reference"><summary>Nguồn video gốc · xem lại tùy chọn</summary><ul><li><a href="https://drive.google.com/file/d/1cW61-1ARRNIeKo2WMezMz3IkfXkAJGsi/view?t=1093">18:13 ↗</a></li><li><a href="https://drive.google.com/file/d/1cW61-1ARRNIeKo2WMezMz3IkfXkAJGsi/view?t=2436">40:36 ↗</a></li><li><a href="https://drive.google.com/file/d/1cW61-1ARRNIeKo2WMezMz3IkfXkAJGsi/view?t=2811">46:51 ↗</a></li><li><a href="https://drive.google.com/file/d/1cW61-1ARRNIeKo2WMezMz3IkfXkAJGsi/view?t=3254">54:14 ↗</a></li><li><a href="https://drive.google.com/file/d/1cW61-1ARRNIeKo2WMezMz3IkfXkAJGsi/view?t=2858">47:38 ↗</a></li><li><a href="https://drive.google.com/file/d/1cW61-1ARRNIeKo2WMezMz3IkfXkAJGsi/view?t=4396">1:13:16 ↗</a></li><li><a href="https://drive.google.com/file/d/1cW61-1ARRNIeKo2WMezMz3IkfXkAJGsi/view?t=4215">1:10:15 ↗</a></li><li><a href="https://drive.google.com/file/d/1cW61-1ARRNIeKo2WMezMz3IkfXkAJGsi/view?t=5775">1:36:15 ↗</a></li><li><a href="https://drive.google.com/file/d/1cW61-1ARRNIeKo2WMezMz3IkfXkAJGsi/view?t=6113">1:41:53 ↗</a></li><li><a href="https://drive.google.com/file/d/1cW61-1ARRNIeKo2WMezMz3IkfXkAJGsi/view?t=6304">1:45:04 ↗</a></li><li><a href="https://drive.google.com/file/d/1cW61-1ARRNIeKo2WMezMz3IkfXkAJGsi/view?t=7059">1:57:39 ↗</a></li><li><a href="https://drive.google.com/file/d/1cW61-1ARRNIeKo2WMezMz3IkfXkAJGsi/view?t=7113">1:58:33 ↗</a></li><li><a href="https://drive.google.com/file/d/1cW61-1ARRNIeKo2WMezMz3IkfXkAJGsi/view?t=7692">2:08:12 ↗</a></li><li><a href="https://drive.google.com/file/d/1cW61-1ARRNIeKo2WMezMz3IkfXkAJGsi/view?t=7882">2:11:22 ↗</a></li><li><a href="https://drive.google.com/file/d/1cW61-1ARRNIeKo2WMezMz3IkfXkAJGsi/view?t=8923">2:28:43 ↗</a></li><li><a href="https://drive.google.com/file/d/1cW61-1ARRNIeKo2WMezMz3IkfXkAJGsi/view?t=9618">2:40:18 ↗</a></li><li><a href="https://drive.google.com/file/d/1cW61-1ARRNIeKo2WMezMz3IkfXkAJGsi/view?t=9276">2:34:36 ↗</a></li><li><a href="https://drive.google.com/file/d/1cW61-1ARRNIeKo2WMezMz3IkfXkAJGsi/view?t=9428">2:37:08 ↗</a></li><li><a href="https://drive.google.com/file/d/1cW61-1ARRNIeKo2WMezMz3IkfXkAJGsi/view?t=9771">2:42:51 ↗</a></li><li><a href="https://drive.google.com/file/d/1cW61-1ARRNIeKo2WMezMz3IkfXkAJGsi/view?t=2817">46:57 ↗</a></li><li><a href="https://drive.google.com/file/d/1cW61-1ARRNIeKo2WMezMz3IkfXkAJGsi/view?t=4976">1:22:56 ↗</a></li><li><a href="https://drive.google.com/file/d/1cW61-1ARRNIeKo2WMezMz3IkfXkAJGsi/view?t=4477">1:14:37 ↗</a></li><li><a href="https://drive.google.com/file/d/1cW61-1ARRNIeKo2WMezMz3IkfXkAJGsi/view?t=9793">2:43:13 ↗</a></li><li><a href="https://drive.google.com/file/d/1cW61-1ARRNIeKo2WMezMz3IkfXkAJGsi/view?t=12091">3:21:31 ↗</a></li><li><a href="https://drive.google.com/file/d/1cW61-1ARRNIeKo2WMezMz3IkfXkAJGsi/view?t=10957">3:02:37 ↗</a></li></ul><ul><li><a href="https://drive.google.com/file/d/1cW61-1ARRNIeKo2WMezMz3IkfXkAJGsi/view" rel="noopener" target="_blank">Railway 89 · Theo dấu API từ HTTP đến cơ sở dữ liệu · Video và Transcript trên Google Drive</a></li></ul></details></section>`,i=[{id:`mvc-pipeline`,title:`Lần từ 200, 400, 404 về tầng xử lý`},{id:`entity`,title:`Ánh xạ entity`},{id:`repository`,title:`Repository và service`},{id:`rest`,title:`Mở API REST`},{id:`go-loi`,title:`Đọc lỗi và kiểm chứng`},{id:`thuc-hanh`,title:`Chạy demo trên máy`},{id:`bai-tap-code`,title:`Bài tập lập trình`},{id:`kiem-tra-nang-luc`,title:`Kiểm tra cách hiểu`},{id:`nguon-chinh-thuc`,title:`Nguồn chính thức`}],a={title:`Theo request từ MVC đến repository`,setup:`Route đọc sản phẩm nhận long id. DB chỉ có hàng ID 5 và price của hàng là NULL.`,steps:[{label:`Chọn handler`,result:`MVC khớp route rồi chuyển path variable sang long. ID abc dừng ở bước đổi kiểu.`},{label:`Đọc dữ liệu`,result:`ID 5 tìm được hàng, repository trả entity tồn tại. ID 6 trả rỗng theo điều kiện seed.`},{label:`Gửi response`,result:`ID 5 trả 200 với price null theo demo. ID 6 trả 404; một field null không có nghĩa thiếu tài nguyên.`}]},o={bodyHtml:e,introHtml:t,referencesHtml:n,videoHtml:r,toc:i,simulation:a};export{e as bodyHtml,o as default,t as introHtml,n as referencesHtml,a as simulation,i as toc,r as videoHtml};