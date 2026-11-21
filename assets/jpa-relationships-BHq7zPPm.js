var e=`
<section aria-labelledby="chieu-nguoc-heading" class="chapter" id="chieu-nguoc">
<header class="chapter-top"><h2 id="chieu-nguoc-heading">Bên sở hữu và vòng lặp JSON</h2></header>
<p>Sau khi ôn LAZY và EAGER, lớp đi từ offering sang detail rồi thử đi ngược lại. Phía sở hữu khai báo <code>@JoinColumn</code> tại FK. Phía ngược dùng <code>mappedBy</code> trỏ tới tên field của phía sở hữu. Khi thay đổi quan hệ hai chiều trong bộ nhớ, đồng bộ cả hai đầu để code đọc nhất quán. Phía sở hữu quyết định giá trị FK khi flush.</p>
<p>Nếu Jackson duyệt cả hai chiều, cây JSON có thể lặp offering → detail → offering. Có thể dùng <code>@JsonIgnore</code> trên thuộc tính ngược để Jackson chỉ serialize một chiều. Với Lombok, kiểm tra thêm <code>toString</code> và <code>equals/hashCode</code> vì các hàm này cũng có thể lần theo quan hệ vòng. Demo trả DTO với ID, tên, giá, màu và trạng thái, giúp API kiểm soát dữ liệu trả ra.  </p>
</section><aside class="callout"><strong>Chạy các ví dụ trên máy</strong><p><a download="" href="../../../practice/spring-demo-bundle/downloads/spring-demo-bundle.zip">Tải bộ demo Maven (.zip)</a>. Giải nén và dùng thư mục <code>spring-demo-bundle</code> chứa <code>lessons</code> và <code>practice</code> làm thư mục gốc cho các lệnh trong bài. Khi bài yêu cầu vào thư mục demo, mở thư mục chứa <code>pom.xml</code> của demo đó.</p></aside>
<section aria-labelledby="one-many-heading" class="chapter" id="one-many">
<header class="chapter-top"><h2 id="one-many-heading">Từ một–một sang một–nhiều</h2></header>
<p>Nếu một offering có nhiều detail và mỗi detail thuộc một offering, đặt FK <code>offering_id</code> ở các dòng detail. Nhiều dòng được dùng chung giá trị FK, nên FK này bỏ UNIQUE. Dùng NOT NULL nếu detail bắt buộc thuộc một offering.</p>
<figure class="snippet"><figcaption>Hai đầu mapping một–nhiều, minh họa bước chuyển tiếp</figcaption><pre tabindex="0"><code class="language-java">// Trong ProductDetail
@ManyToOne(fetch = FetchType.LAZY, optional = false)
@JoinColumn(name = "offering_id", nullable = false)
ProductOffering offering;

// Trong ProductOffering
@OneToMany(mappedBy = "offering")
List&lt;ProductDetail&gt; details = new ArrayList&lt;&gt;();</code></pre></figure>
<p>Nếu detail B đồng thời thuộc offering 1 và 2, một FK không đủ để biểu diễn các quan hệ. Thêm một dòng cho mỗi cặp trong bảng nối.</p>
</section>
<section aria-labelledby="many-many-heading" class="chapter" id="many-many">
<header class="chapter-top"><h2 id="many-many-heading">Entity bảng nối với hai khóa ngoại</h2></header>
<p>Ánh xạ mỗi hàng nối thành <code>ProductOfferingDetail</code> có ID riêng và hai <code>@ManyToOne</code> trỏ tới offering và detail. Phía offering có collection link với <code>@OneToMany(mappedBy = "offering")</code>. Nếu cần đi ngược từ detail, thêm collection với <code>mappedBy = "detail"</code>. Hai field trên entity nối là những field sở hữu FK.</p>
<figure class="snippet"><figcaption>ProductOfferingDetail.java · trích hai quan hệ</figcaption><pre tabindex="0"><code class="language-java">@ManyToOne(fetch = FetchType.LAZY, optional = false)
@JoinColumn(name = "product_offering_id", nullable = false)
private ProductOffering offering;

@ManyToOne(fetch = FetchType.LAZY, optional = false)
@JoinColumn(name = "product_detail_id", nullable = false)
private ProductDetail detail;</code></pre></figure>
<p><code>UNIQUE(product_offering_id, product_detail_id)</code> cấm lặp đúng một cặp. UNIQUE riêng trên từng FK sẽ cản việc dùng chung. Có thể dùng cặp FK làm khóa chính ghép. Với bảng nối thuần, JPA còn có <code>@ManyToMany</code> và <code>@JoinTable</code>. Entity nối tiện khi cần thêm thuộc tính riêng như thời điểm gán. Seed gồm <code>(1,1), (1,2), (2,2)</code>; detail 2 được dùng ở hai offering.  </p>
<p><a href="../buoi-06/demo/src/main/java/vn/railway89/catalog/ProductOfferingDetail.java">Xem entity nối</a> · <a href="../buoi-06/demo/src/main/java/vn/railway89/catalog/ProductOffering.java">Xem phía mappedBy</a>.</p>
</section>
<section aria-labelledby="jpql-heading" class="chapter" id="jpql">
<header class="chapter-top"><h2 id="jpql-heading">JPQL theo entity và thuộc tính</h2></header>
<p>Nếu khai báo <code>findByDetailId</code> trên repository của offering, Spring Data sẽ cố phân giải đường dẫn thuộc tính từ <code>ProductOffering</code>. Entity này có collection <code>links</code> và không có thuộc tính <code>detailId</code>. Hãy JOIN qua collection hoặc lấy tập ID offering từ entity bảng nối rồi dùng <code>IN</code>. JPQL dùng tên entity và thuộc tính Java. HQL của Hibernate hỗ trợ thêm cú pháp ngoài JPQL.</p>
<figure class="snippet"><figcaption>Truy vấn con IN · dựng lại theo đoạn chữa bài 3:05:08</figcaption><pre tabindex="0"><code class="language-sql">select o from ProductOffering o
where o.id in (
    select link.offering.id from ProductOfferingDetail link
    where link.detail.id = :detailId
)
order by o.id</code></pre></figure>
<p>Truy vấn trong lấy các ID offering có liên kết với detail đã chọn. Truy vấn ngoài lấy các offering thuộc tập ID đó. Bản chạy mặc định dùng JPQL JOIN qua thuộc tính <code>links</code> và trả cùng tập kết quả cho bài này. </p>
<figure class="snippet"><figcaption>OfferingRepository.java</figcaption><pre tabindex="0"><code class="language-java">@Query("""
        select distinct o from ProductOffering o
        join o.links link
        where link.detail.id = :detailId
        order by o.id
        """)
List&lt;ProductOffering&gt; findByLinkedDetail(@Param("detailId") Long detailId);</code></pre></figure>
<p>Đường dẫn <code>o.links</code> dẫn đến entity nối, còn <code>link.detail.id</code> dẫn đến ID của detail. Hibernate có thể lọc trực tiếp bằng FK có sẵn. <code>distinct o</code> giữ mỗi offering một lần nếu truy vấn mở rộng khớp nhiều link. <code>:detailId</code> được bind từ tham số Java. Khi dùng <code>nativeQuery = true</code>, viết SQL theo schema và kiểm tra dialect của DB đích.</p>
<figure class="snippet"><figcaption>SQL tương đương về kết quả</figcaption><pre tabindex="0"><code class="language-sql">SELECT DISTINCT o.*
FROM product_offerings o
JOIN product_offering_detail link ON link.product_offering_id = o.id
WHERE link.product_detail_id = 2
ORDER BY o.id;</code></pre></figure>
<p> <a href="../buoi-06/demo/src/main/java/vn/railway89/catalog/OfferingRepository.java">Xem repository</a>.</p>
</section>
<section class="chapter" id="kiem-ownership"><h2>Tự viết đường đọc qua bảng nối</h2>
<p>Tập liên kết ban đầu là <code>(1,1), (1,2), (2,2)</code> theo thứ tự offering và detail. Bài toán mới cần liệt kê ID offering có ít nhất một detail trong tập truyền vào, lấy ID tăng dần. Viết một phương thức repository trả <code>List&lt;Long&gt;</code> và một test gọi qua repository thực. Dùng <code>join o.links</code>, bind tập ID, chọn <code>o.id</code> và dùng <code>distinct</code> để loại trùng. Service xử lý tập ID rỗng thành danh sách rỗng trước lời gọi repository để giữ hành vi rõ ràng giữa các dialect.</p>
<table><thead><tr><th>Đầu vào</th><th>Cặp link khớp</th><th>ID offering trả về</th></tr></thead><tbody><tr><td><code>[2]</code></td><td><code>(1,2), (2,2)</code></td><td><code>[1,2]</code></td></tr><tr><td><code>[1,2]</code></td><td>Cả ba cặp</td><td><code>[1,2]</code></td></tr><tr><td><code>[3]</code></td><td>Không có</td><td><code>[]</code></td></tr></tbody></table>
<p>Gây lỗi bằng cách bỏ <code>distinct</code> ở truy vấn scalar. Ca <code>[1,2]</code> có thể trả <code>[1,1,2]</code> do một offering xuất hiện qua hai link. Đọc SQL và đếm các dòng thỏa điều kiện trước khi thực hiện DISTINCT. Khi sửa, dùng lại cùng seed để chứng minh thay đổi chỉ ảnh hưởng trường hợp nhiều link khớp.</p>
<details><summary>Đối chiếu cách viết truy vấn</summary><pre tabindex="0"><code class="language-sql">select distinct o.id from ProductOffering o
join o.links link
where link.detail.id in :detailIds
order by o.id</code></pre><p>Thực hiện đoạn truy vấn bằng JPQL trong repository nhận <code>@Param("detailIds") Collection&lt;Long&gt; detailIds</code>. Dòng nối là đơn vị được lọc, còn ID offering là đơn vị được trả về.</p></details>
</section>
<section aria-labelledby="thuc-hanh-heading" class="chapter" id="thuc-hanh">
<header class="chapter-top"><h2 id="thuc-hanh-heading">Thực hành</h2></header>
<p>Chuẩn bị JDK 17 trở lên và Maven. Chạy lệnh dưới đây từ thư mục giải nén chứa <code>lessons</code> và <code>practice</code>. Demo dùng H2 trong bộ nhớ và nạp lại bộ dữ liệu ban đầu mỗi lần khởi động. Dừng bằng Ctrl+C khi thực hành xong.</p>
<figure class="snippet"><figcaption>PowerShell · khởi động trước khi gọi API</figcaption><pre tabindex="0"><code class="language-powershell">mvn -f lessons/springboot/buoi-06/demo/pom.xml spring-boot:run</code></pre></figure>
<p class="file-links"><a href="../buoi-06/demo/pom.xml">Maven</a> <a href="../buoi-06/demo/src/main/resources/schema.sql">Schema</a> <a href="../buoi-06/demo/src/main/resources/data.sql">Dữ liệu mẫu</a> <a href="../buoi-06/demo/src/main/resources/application.yaml">Cấu hình</a></p>
<figure class="snippet"><figcaption>Tìm theo detail 1, 2 và 3</figcaption><pre tabindex="0"><code class="language-powershell">$api = 'http://localhost:812/buoi-05/offerings'
(Invoke-RestMethod "\${api}?detailId=1").id
(Invoke-RestMethod "\${api}?detailId=2").id
curl.exe -i "\${api}?detailId=3"
curl.exe -i "\${api}?detailId=abc"</code></pre></figure>
<p>Detail 1 trả offering <code>[1]</code>, detail 2 trả <code>[1,2]</code>, detail 3 trả <code>200 []</code> vì chưa có liên kết. <code>abc</code> cho 400 vì chuyển sang <code>Long</code> thất bại. Quan sát log SQL và tìm điều kiện <code>product_detail_id</code>.</p>
<p>Trong bản sao demo, thay nội dung chuỗi <code>@Query</code> của <code>findByLinkedDetail</code> bằng truy vấn con <code>IN</code> ở trên. Giữ tên tham số <code>detailId</code>. Khởi động lại, chạy ba ca detail 1, 2 và 3 rồi đối chiếu kết quả và SQL với truy vấn JOIN.</p>
<p>Trong bản sao, thêm <code>List&lt;ProductOffering&gt; findByDetailId(Long id);</code> vào <a href="../buoi-06/demo/src/main/java/vn/railway89/catalog/OfferingRepository.java">OfferingRepository</a> rồi khởi động. Tìm lỗi thiếu thuộc tính <code>detailId</code>. Bỏ phương thức sai và chạy lại với <code>findByLinkedDetail</code>. Thử thêm lần nữa bằng cách đổi <code>link.detail.id</code> thành tên cột <code>link.product_detail_id</code> trong JPQL để thấy lỗi Hibernate kiểm tra thuộc tính của entity nối.</p>
</section>
<section aria-labelledby="tu-kiem-tra-heading" class="chapter" id="tu-kiem-tra">
<header class="chapter-top"><h2 id="tu-kiem-tra-heading">Tự kiểm tra</h2></header>
<details><summary>1. FK nằm ở đâu khi một offering có nhiều detail độc quyền?</summary><p>Ở mỗi dòng detail. Nhiều detail có thể giữ cùng một offering_id.</p></details>
<details><summary>2. Vì sao UNIQUE trên cặp khác UNIQUE trên từng FK?</summary><p>UNIQUE trên cặp chỉ cấm trùng toàn bộ quan hệ. UNIQUE trên một FK còn cấm ID đó xuất hiện trong nhiều cặp.</p></details>
<details><summary>3. mappedBy = offering chỉ tới đâu?</summary><p>Thuộc tính offering của entity ProductOfferingDetail, nơi giữ mapping FK.</p></details>
<details><summary>4. Vì sao JPQL dùng link.detail.id?</summary><p>JPQL truy vấn mô hình entity. Hibernate dùng metadata để dịch đường dẫn sang SQL tương ứng.</p></details>
<details><summary>5. DTO ngăn vòng lặp JSON bằng cách nào?</summary><p>Phản hồi chỉ có các field DTO định nghĩa. Mapper lấy dữ liệu cần từ entity và không đưa cả đồ thị quan hệ cho Jackson.</p></details>
<details><summary>6. Detail 3 tồn tại, vì sao kết quả vẫn là []?</summary><p>API tìm offering có liên kết với detail. Bộ seed chưa có liên kết nào với detail 3.</p></details>
</section>
<p><a href="#top">Về đầu trang ↑</a></p>`,t=`<div class="callout intro"><strong>Mục tiêu và điều kiện học</strong><p>Chọn entity bảng nối khi quan hệ có dữ liệu riêng; viết truy vấn đúng đường dẫn thuộc tính.</p><p><strong>Cần biết trước:</strong> Khóa ngoại, join và entity. Các bài ứng dụng có thể cần đọc trước phần dữ liệu tương ứng; dùng <a href="../index.html">lộ trình</a> để chọn kiến thức còn thiếu.</p><p class="version-note">Baseline: Java 17 · Spring Boot 3.5.10 · Framework 6.2 · Security 6.5. Mỗi demo có hướng dẫn riêng; ví dụ H2 không chứng minh hành vi trên DB khác.</p></div>`,n=`<section id="nguon-chinh-thuc"><h2>Nguồn chính thức và tài liệu đối chiếu</h2><ul><li><a href="https://jakarta.ee/specifications/persistence/3.1/jakarta-persistence-spec-3.1">Jakarta Persistence 3.1 · Quan hệ và JPQL</a></li><li><a href="https://docs.hibernate.org/orm/6.6/userguide/html_single/">Hibernate ORM 6.6 · Mapping và HQL</a></li><li><a href="https://docs.spring.io/spring-data/jpa/reference/3.5/jpa/query-methods.html">Spring Data JPA 3.5 · @Query và tham số</a></li></ul></section>`,r=`<section aria-labelledby="moc-video-heading" class="chapter" id="moc-video"><details class="video-reference"><summary>Nguồn video · xem lại tùy chọn</summary>
<header class="chapter-top"><h2 id="moc-video-heading">Mốc xem lại</h2></header>
<ul>
<li><a aria-label="Xem video tại 19:20" class="time" href="https://drive.google.com/file/d/1j6FnHakgEx10OFEh-1Tj7JH9TZ73DiSS/view?t=1160" rel="noopener" target="_blank">19:20 <span aria-hidden="true">↗</span></a> Ôn SQL khi nạp quan hệ.</li>
<li><a aria-label="Xem video tại 36:11" class="time" href="https://drive.google.com/file/d/1j6FnHakgEx10OFEh-1Tj7JH9TZ73DiSS/view?t=2171" rel="noopener" target="_blank">36:11 <span aria-hidden="true">↗</span></a> Thử đi ngược từ detail đến offering.</li>
<li><a aria-label="Xem video tại 47:08" class="time" href="https://drive.google.com/file/d/1j6FnHakgEx10OFEh-1Tj7JH9TZ73DiSS/view?t=2828" rel="noopener" target="_blank">47:08 <span aria-hidden="true">↗</span></a> Cắt vòng lặp JSON.</li>
<li><a aria-label="Xem video tại 56:23" class="time" href="https://drive.google.com/file/d/1j6FnHakgEx10OFEh-1Tj7JH9TZ73DiSS/view?t=3383" rel="noopener" target="_blank">56:23 <span aria-hidden="true">↗</span></a> Đổi mô hình thành một–nhiều.</li>
<li><a aria-label="Xem video tại 1:32:09" class="time" href="https://drive.google.com/file/d/1j6FnHakgEx10OFEh-1Tj7JH9TZ73DiSS/view?t=5529" rel="noopener" target="_blank">1:32:09 <span aria-hidden="true">↗</span></a> Thêm bảng nối nhiều–nhiều.</li>
<li><a aria-label="Xem video tại 1:51:54" class="time" href="https://drive.google.com/file/d/1j6FnHakgEx10OFEh-1Tj7JH9TZ73DiSS/view?t=6714" rel="noopener" target="_blank">1:51:54 <span aria-hidden="true">↗</span></a> Đọc các cặp ID.</li>
<li><a aria-label="Xem video tại 1:59:18" class="time" href="https://drive.google.com/file/d/1j6FnHakgEx10OFEh-1Tj7JH9TZ73DiSS/view?t=7158" rel="noopener" target="_blank">1:59:18 <span aria-hidden="true">↗</span></a> Hai JoinColumn và mappedBy.</li>
<li><a aria-label="Xem video tại 2:02:27" class="time" href="https://drive.google.com/file/d/1j6FnHakgEx10OFEh-1Tj7JH9TZ73DiSS/view?t=7347" rel="noopener" target="_blank">2:02:27 <span aria-hidden="true">↗</span></a> Đề cập DTO phản hồi.</li>
<li><a aria-label="Xem video tại 2:53:44" class="time" href="https://drive.google.com/file/d/1j6FnHakgEx10OFEh-1Tj7JH9TZ73DiSS/view?t=10424" rel="noopener" target="_blank">2:53:44 <span aria-hidden="true">↗</span></a> Lỗi suy truy vấn theo detailId.</li>
<li><a aria-label="Xem video tại 3:04:00" class="time" href="https://drive.google.com/file/d/1j6FnHakgEx10OFEh-1Tj7JH9TZ73DiSS/view?t=11040" rel="noopener" target="_blank">3:04:00 <span aria-hidden="true">↗</span></a> Viết @Query.</li>
<li><a aria-label="Xem video tại 3:08:48" class="time" href="https://drive.google.com/file/d/1j6FnHakgEx10OFEh-1Tj7JH9TZ73DiSS/view?t=11328" rel="noopener" target="_blank">3:08:48 <span aria-hidden="true">↗</span></a> So sánh native query.</li>
<li><a aria-label="Xem video tại 3:11:38" class="time" href="https://drive.google.com/file/d/1j6FnHakgEx10OFEh-1Tj7JH9TZ73DiSS/view?t=11498" rel="noopener" target="_blank">3:11:38 <span aria-hidden="true">↗</span></a> Bài tập gọi truy vấn qua API.</li>
</ul>
<ul><li><a href="https://drive.google.com/file/d/1j6FnHakgEx10OFEh-1Tj7JH9TZ73DiSS/view?t=11108">3:05:08 ↗</a></li><li><a href="https://drive.google.com/file/d/1j6FnHakgEx10OFEh-1Tj7JH9TZ73DiSS/view?t=10780">2:59:40 ↗</a></li><li><a href="https://drive.google.com/file/d/1j6FnHakgEx10OFEh-1Tj7JH9TZ73DiSS/view?t=10232">2:50:32 ↗</a></li></ul><ul><li><a href="https://drive.google.com/file/d/1j6FnHakgEx10OFEh-1Tj7JH9TZ73DiSS/view" rel="noopener" target="_blank">Railway 89 · Quan hệ nhiều–nhiều và JPQL qua bảng nối · Video và transcript trên Google Drive</a></li></ul></details></section>`,i=[{id:`chieu-nguoc`,title:`Bên sở hữu và vòng lặp JSON`},{id:`one-many`,title:`Từ một–một sang một–nhiều`},{id:`many-many`,title:`Entity bảng nối với hai khóa ngoại`},{id:`jpql`,title:`JPQL theo entity và thuộc tính`},{id:`kiem-ownership`,title:`Tự viết đường đọc qua bảng nối`},{id:`thuc-hanh`,title:`Thực hành`},{id:`tu-kiem-tra`,title:`Tự kiểm tra`},{id:`bai-tap-code`,title:`Bài tập lập trình`},{id:`kiem-tra-nang-luc`,title:`Kiểm tra cách hiểu`},{id:`nguon-chinh-thuc`,title:`Nguồn chính thức`}],a={title:`Mỗi hàng nối là một quan hệ có dữ liệu`,setup:`An vào nhóm Backend với role MEMBER và thời điểm tham gia. Hai lần ghi cùng cặp user 1, group 42.`,steps:[{label:`Mô hình`,result:`Membership là entity có FK tới user và group, chứa role cùng addedAt.`},{label:`Ghi lần đầu`,result:`DB chấp nhận nếu hai FK hợp lệ và cặp chưa có.`},{label:`Ghi trùng`,result:`Ràng buộc unique trên cặp giữ invariant. Thiết kế xử lý conflict theo hợp đồng của use case.`}]},o={bodyHtml:e,introHtml:t,referencesHtml:n,videoHtml:r,toc:i,simulation:a};export{e as bodyHtml,o as default,t as introHtml,n as referencesHtml,a as simulation,i as toc,r as videoHtml};