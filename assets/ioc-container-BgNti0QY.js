var e=`<section class="chapter" id="problem"><h2>Ai quyết định gửi lời mời qua đâu?</h2>
<p>Khi mời An vào nhóm, ứng dụng gọi một <code>Channel</code>. Production có thể dùng email, còn unit test cần một kênh giả trả kết quả ngay. Quyết định chọn kênh nằm ở nơi lắp ghép ứng dụng. <code>InvitationService</code> nhận dependency bắt buộc qua constructor và dùng nó để thực hiện use case.</p>
<figure class="snippet"><figcaption>Ví dụ · tiêm dependency bằng Java thuần</figcaption><pre tabindex="0"><code class="language-java">interface Channel {
    String send(String recipient);
}

class InvitationService {
    private final Channel channel;
    InvitationService(Channel channel) { this.channel = channel; }
    String invite(String recipient) { return channel.send(recipient); }
}

// Trong test:
var service = new InvitationService(recipient -&gt; "fake:" + recipient);
assertThat(service.invite("an")).isEqualTo("fake:an");</code></pre></figure>
<p id="di">Đây là DI vì caller truyền dependency vào service. Với Spring, container đảm nhiệm việc lắp ghép này. Service vẫn giữ được khả năng chạy bằng Java thuần.</p></section>
<section class="chapter" id="container"><h2>Từ định nghĩa đến đối tượng đang chạy</h2>
<ol aria-label="Thứ tự lắp ghép bean" class="core-flow"><li><strong>Đăng ký</strong><span>Container có BeanDefinition cho service và kênh gửi.</span></li><li><strong>Giải dependency</strong><span>Tham số Channel cần một ứng viên phù hợp.</span></li><li><strong>Tạo instance</strong><span>Container gọi factory/constructor, khởi tạo bean và cấp reference cho bên dùng.</span></li></ol>
<figure class="snippet"><figcaption>Ví dụ · cấu hình tường minh bằng @Bean</figcaption><pre tabindex="0"><code class="language-java">@Configuration(proxyBeanMethods = false)
class InvitationConfig {
    @Bean Channel email() { return recipient -&gt; "email:" + recipient; }

    @Bean InvitationService invitationService(Channel selected) {
        return new InvitationService(selected);
    }
}
// context.getBean(InvitationService.class).invite("an") -&gt; "email:an"</code></pre></figure>
<p><code>BeanDefinition</code> là mô tả để tạo và quản lý bean. Đối tượng <code>InvitationService</code> sau khi tạo là instance. Trong cấu hình trên, Spring giải tham số <code>selected</code> trước khi gọi factory method. Một dependency vòng qua constructor là tín hiệu để xem lại ranh giới trách nhiệm và chiều phụ thuộc.</p></section>
<section class="chapter" id="resolution"><h2>Đọc lỗi như một lỗi dựng đồ thị</h2>
<table><thead><tr><th scope="col">Ứng viên Channel</th><th scope="col">Kết quả trong lab</th><th scope="col">Kiểm tra đầu tiên</th></tr></thead><tbody>
<tr><td>0</td><td>Context báo thiếu dependency.</td><td>Bean có được đăng ký, scan hoặc import vào context này không?</td></tr>
<tr><td>1</td><td>Container truyền bean đó vào tham số.</td><td>Đối chiếu kiểu và kết quả của use case.</td></tr>
<tr><td>2, không có quy tắc chọn</td><td>Context báo nhiều ứng viên.</td><td>Đọc tham số bị lỗi và tên những bean được liệt kê.</td></tr></tbody></table>
<p>Điều kiện ở hàng cuối giả định hai ứng viên tương đương, tên điểm inject không chọn được một bean và không có qualifier hoặc primary. <a href="../bean-registration/index.html">Bài Đăng ký và lựa chọn bean</a> sẽ cho phép chọn email mà vẫn giữ audit trong context.</p></section>
<section class="chapter" id="practice"><h2>Quan sát và tự kiểm tra</h2>
<p>Với constructor <code>InvitationService(Channel channel)</code>, hãy dự đoán Spring sẽ truyền gì khi context có 0, 1 hoặc 2 bean <code>Channel</code>. Mở từng ca để đối chiếu kết quả đã kiểm chứng trên Spring.</p>
<details class="question"><summary>0 bean · Chỉ đăng ký InvitationService</summary><p>Spring dừng lúc khởi tạo context. Log chỉ ra <code>constructor parameter 0</code> và <code>No qualifying bean of type … Channel</code>. Tham số số 0 là <code>Channel channel</code>. Việc đầu tiên cần kiểm tra là bean Channel đã được đăng ký vào context này chưa.</p></details>
<details class="question"><summary>1 bean · Đăng ký thêm email</summary><p>Spring truyền bean duy nhất vào constructor. Gọi <code>invite("an")</code> trả <code>email:an</code> trong lab.</p></details>
<details class="question"><summary>2 bean · Đăng ký thêm audit</summary><p>Spring tìm thấy <code>email</code> và <code>audit</code> nhưng cấu hình này chưa có quy tắc để chọn một. Log báo <code>expected single matching bean but found 2: email,audit</code>. Hãy chỉ rõ ứng viên muốn inject ở bài tiếp theo.</p></details>
<p>Muốn tự chạy lại trên máy? <a download="" href="../../../practice/spring-core-lab/downloads/spring-core-lab.zip">Tải lab Maven (.zip)</a>, giải nén và mở terminal tại thư mục <code>spring-core-lab</code> chứa <code>pom.xml</code>. Với JDK 17 trở lên và Maven, chạy <code>mvn test</code>. Hai cảnh báo khởi tạo là ca lỗi được tạo có chủ đích. Test đạt khi Spring báo đúng lỗi dự kiến.</p>
<details class="question"><summary>Giữ nguyên service, thay email bằng fake thì cần sửa ở đâu?</summary><p>Thay ở nơi tạo service hoặc cấu hình bean. Kết quả của use case vẫn đi qua hợp đồng Channel.</p></details>
<details class="question"><summary>Spring có quản lý mọi object mà factory tự new bên trong method không?</summary><p>Đối tượng factory trả về trở thành bean. Các đối tượng phụ được tạo bên trong factory chỉ chịu quản lý riêng nếu chúng cũng được đăng ký.</p></details>
<details class="question"><summary>Đã có class triển khai Channel nhưng ứng dụng báo thiếu bean. Kiểm tra gì trước?</summary><p>Kiểm tra đăng ký, package scan hoặc import trước. Class tồn tại trên classpath chỉ cho biết kiểu có mặt, chưa chứng minh container có bean ứng viên.</p></details>
</section>
<p><a href="#top">Về đầu trang ↑</a></p>`,t=`<div class="callout intro"><strong>Mục tiêu và điều kiện học</strong><p>Tiêm kênh gửi lời mời qua constructor để use case chạy được với fake.</p><p><strong>Cần biết trước:</strong> Java constructor và interface. Các bài ứng dụng có thể cần đọc trước phần dữ liệu tương ứng; dùng <a href="../index.html">lộ trình</a> để chọn kiến thức còn thiếu.</p><p class="version-note">Baseline: Java 17 · Spring Boot 3.5.10 · Framework 6.2 · Security 6.5. Mỗi demo có hướng dẫn riêng; ví dụ H2 không chứng minh hành vi trên DB khác.</p></div>`,n=`<section class="chapter" id="nguon-chinh-thuc"><h2>Nguồn chính thức</h2><ul><li><a href="https://docs.spring.io/spring-framework/reference/6.2/core/beans/factory-nature.html">Spring Framework 6.2 · Bean lifecycle</a></li><li><a href="https://docs.spring.io/spring-framework/reference/6.2/core/beans/dependencies/factory-collaborators.html">Spring Framework 6.2 · DI và đồ thị dependency</a></li></ul></section>`,r=``,i=[{id:`problem`,title:`Ai quyết định gửi lời mời qua đâu?`},{id:`container`,title:`Từ định nghĩa đến đối tượng đang chạy`},{id:`resolution`,title:`Đọc lỗi như một lỗi dựng đồ thị`},{id:`practice`,title:`Quan sát và tự kiểm tra`},{id:`bai-tap-code`,title:`Bài tập lập trình`},{id:`kiem-tra-nang-luc`,title:`Kiểm tra cách hiểu`},{id:`nguon-chinh-thuc`,title:`Nguồn chính thức`}],a={title:`Spring tìm dependency Channel`,setup:`InvitationService nhận một Channel trong constructor. Mỗi bước là một lần dựng context riêng.`,steps:[{label:`0 bean`,result:`Tập ứng viên rỗng, Spring không thể tạo service.`},{label:`1 bean`,result:`Chỉ có email. Container truyền email vào constructor, invite("an") trả email:an trong lab.`},{label:`2 bean`,result:`Có email và audit cùng kiểu. Không có tiêu chí chọn, context báo mơ hồ. Dùng qualifier ở bài tiếp theo.`}]},o={bodyHtml:e,introHtml:t,referencesHtml:n,videoHtml:``,toc:i,simulation:a};export{e as bodyHtml,o as default,t as introHtml,n as referencesHtml,a as simulation,i as toc,r as videoHtml};