export interface SecurityNode {
  name: string;
  kind: string;
  method: string;
  via?: string;
  input: string;
  behavior: string;
  output: string;
  code: string;
  framework?: boolean;
  calls?: readonly SecurityNode[];
}

export interface SecurityGraph {
  title: string;
  context: string;
  steps: readonly SecurityNode[];
}

const chainSelector: SecurityNode = {
  name: "FilterChainProxy", kind: "Class · biên servlet", method: "doFilter(...)",
  input: "HttpServletRequest và các SecurityFilterChain đã đăng ký.",
  behavior: "Duyệt chain theo thứ tự. SecurityFilterChain.matches(request) nhận ra chain đầu tiên áp dụng cho URL.",
  output: "Dùng danh sách filter của chain đã chọn. Chuỗi servlet tiếp tục tới ứng dụng khi các filter cho qua.",
  framework: true,
  code: `for (SecurityFilterChain candidate : filterChains) {
    if (candidate.matches(request)) {
        return candidate.getFilters();
    }
}
return null;`,
};

const authenticationManager: SecurityNode = {
  name: "AuthenticationManager", kind: "Interface · ProviderManager triển khai", method: "authenticate(Authentication)",
  input: "Authentication chứa credential chưa được xác thực.",
  behavior: "ProviderManager chọn AuthenticationProvider có supports(...) phù hợp với kiểu token. Có thể thử nhiều provider theo cấu hình.",
  output: "Trả Authentication đã xác thực khi một provider thành công. Lỗi xác thực được trả về filter gọi manager.",
  framework: true,
  code: `for (AuthenticationProvider provider : providers) {
    if (provider.supports(authentication.getClass())) {
        Authentication result = provider.authenticate(authentication);
        if (result != null) {
            return result;
        }
    }
}
// Đã lược bỏ xử lý lỗi, provider cha và xóa credential.`,
};

const authFailure: SecurityNode = {
  name: "BasicAuthenticationEntryPoint", kind: "Class · AuthenticationEntryPoint", method: "commence(...)",
  via: "Khi filter bắt AuthenticationException",
  input: "Request, response và lỗi xác thực Basic.",
  behavior: "Trong ca Basic mặc định này, entry point yêu cầu client gửi lại credential.",
  output: "HTTP 401 kèm WWW-Authenticate: Basic cho request thông thường.",
  framework: true,
  code: `response.setHeader("WWW-Authenticate", "Basic realm=\\"Realm\\"");
response.sendError(HttpServletResponse.SC_UNAUTHORIZED);`,
};

const requestAuthorization: SecurityNode = {
  name: "AuthorizationFilter", kind: "Class · filter xét quyền HTTP", method: "doFilter(...)",
  via: "Chain API chạy đến filter phân quyền",
  input: "Request và Authentication lấy từ SecurityContext khi rule cần.",
  behavior: "Gọi AuthorizationManager theo request. Với authorizeHttpRequests, matcher khớp đầu tiên chọn quy tắc áp dụng.",
  output: "Cho FilterChain đi tiếp hoặc ném lỗi từ chối truy cập. MVC chỉ nhận request khi các filter cho qua.",
  framework: true,
  code: `AuthorizationResult result =
    authorizationManager.authorize(this::getAuthentication, request);
if (result != null && !result.isGranted()) {
    throw new AuthorizationDeniedException("Access Denied", result);
}
chain.doFilter(request, response);`,
};

const denial: SecurityNode = {
  name: "ExceptionTranslationFilter", kind: "Class · filter bọc phần downstream", method: "doFilter(...)",
  via: "Khi lỗi từ chối truy cập truyền ngược qua filter chain",
  input: "AccessDeniedException từ phần downstream đã được filter này bao quanh.",
  behavior: "Với caller đã xác thực đầy đủ, chuyển lỗi sang AccessDeniedHandler. Với danh tính anonymous hoặc remember-me, có thể bắt đầu xác thực qua entry point.",
  output: "Trong ca reader đã xác thực, AccessDeniedHandler trả 403.",
  framework: true,
  code: `try {
    chain.doFilter(request, response);
} catch (AccessDeniedException denied) {
    if (anonymousOrRememberMe(authentication)) { // điều kiện rút gọn
        authenticationEntryPoint.commence(request, response,
            new InsufficientAuthenticationException("Authentication required"));
    } else {
        accessDeniedHandler.handle(request, response, denied);
    }
}`,
};

export const securityCallGraphs: Readonly<Record<string, SecurityGraph>> = {
  "security-authentication": {
    title: "HTTP Basic qua các lớp Spring Security",
    context: "Theo dấu GET /api/groups trong demo Spring Foundations. Luồng chính dùng tài khoản reader với mật khẩu đúng. Chọn một nút để xem lời gọi Java hoặc tìm nơi hai ca 401 rẽ nhánh.",
    steps: [
      chainSelector,
      {
        name: "BasicAuthenticationFilter", kind: "Class · filter nhận credential", method: "doFilterInternal(...)",
        via: "Chain đã chọn có .httpBasic(...)",
        input: "HTTP request mang Authorization: Basic và context hiện tại.",
        behavior: "Converter đọc Base64 để tách username và password. Khi không có header Basic, filter cho request đi tiếp mà không gọi manager.",
        output: "UsernamePasswordAuthenticationToken được gửi vào AuthenticationManager. Nếu credential sai, filter xóa context rồi gọi entry point trong cấu hình lab.",
        framework: true,
        code: `Authentication attempt = authenticationConverter.convert(request);
if (attempt != null && authenticationIsRequired(attempt.getName())) {
    try {
        Authentication result = authenticationManager.authenticate(attempt);
        SecurityContext context = securityContextHolderStrategy.createEmptyContext();
        context.setAuthentication(result);
        securityContextHolderStrategy.setContext(context);
    } catch (AuthenticationException ex) {
        securityContextHolderStrategy.clearContext();
        authenticationEntryPoint.commence(request, response, ex);
        return;
    }
}
chain.doFilter(request, response);`,
        calls: [authFailure],
      },
      { ...authenticationManager, via: "authenticate(token chưa xác thực)" },
      {
        name: "DaoAuthenticationProvider", kind: "Class · AuthenticationProvider", method: "retrieveUser(...) / additionalAuthenticationChecks(...)",
        via: "ProviderManager chọn provider hỗ trợ username/password",
        input: "UsernamePasswordAuthenticationToken chưa xác thực.",
        behavior: "Lớp cha AbstractUserDetailsAuthenticationProvider điều phối việc đọc user và kiểm tra tài khoản. DaoAuthenticationProvider cung cấp hai thao tác đọc user và đối chiếu mật khẩu.",
        output: "Trả Authentication đã xác thực với authorities của user khi mọi kiểm tra đạt.",
        framework: true,
        code: `UserDetails user = retrieveUser(username, token);
preAuthenticationChecks.check(user);
additionalAuthenticationChecks(user, token);
postAuthenticationChecks.check(user);
return createSuccessAuthentication(user, token, user);`,
        calls: [
          {
            name: "UserDetailsService", kind: "Interface · InMemoryUserDetailsManager trong lab", method: "loadUserByUsername(String)",
            via: "Đọc user để lấy dữ liệu xác thực",
            input: "Username, ví dụ reader.",
            behavior: "Lab dùng dữ liệu in-memory. Ứng dụng thực có thể cung cấp implementation truy vấn kho tài khoản.",
            output: "UserDetails chứa hash, authorities và trạng thái tài khoản. Nếu không có username, ném UsernameNotFoundException.",
            code: `@Bean
UserDetailsService labUsers(PasswordEncoder encoder) {
    return new InMemoryUserDetailsManager(
        User.withUsername("reader")
            .password(encoder.encode("demo-pass"))
            .roles("READER")
            .build());
}`,
          },
          {
            name: "PasswordEncoder", kind: "Interface · BCryptPasswordEncoder trong lab", method: "matches(raw, encoded)",
            via: "Đối chiếu mật khẩu sau khi có UserDetails",
            input: "Mật khẩu nhận từ request và hash lưu trong UserDetails.",
            behavior: "BCrypt dùng thông tin từ hash đã lưu để xác minh mật khẩu. Hai lần encode cùng mật khẩu có thể cho hai hash khác nhau vì salt.",
            output: "Boolean. Provider ném BadCredentialsException khi matches(...) trả false.",
            framework: true,
            code: `String raw = token.getCredentials().toString();
if (!passwordEncoder.matches(raw, userDetails.getPassword())) {
    throw new BadCredentialsException("Bad credentials");
}`,
          },
        ],
      },
      {
        name: "SecurityContextHolder", kind: "Class · giữ context trong luồng xử lý", method: "getContext().getAuthentication()",
        via: "Kết quả trả về filter → filter đặt Authentication vào context",
        input: "Authentication đã xác thực, ví dụ reader và ROLE_READER.",
        behavior: "Context mang danh tính trong request hiện tại để lớp phân quyền đọc. Filter chain có trách nhiệm dọn context sau khi xử lý.",
        output: "AuthorizationFilter có dữ liệu để xét quyền. Xác thực thành công vẫn có thể dẫn đến 403.",
        framework: true,
        code: `Authentication current =
    SecurityContextHolder.getContext().getAuthentication();
String username = current.getName();
Collection<? extends GrantedAuthority> authorities = current.getAuthorities();`,
      },
      {
        ...requestAuthorization,
        via: "Filter chain đi tiếp → áp dụng rule GET /api/groups",
        behavior: "Rule authenticated() chấp nhận danh tính reader. Nếu request thiếu header, danh tính còn anonymous và rule từ chối ở đây.",
        output: "Reader đã xác thực đi tiếp tới MVC. Với request anonymous, ExceptionTranslationFilter bắt lỗi từ chối khi lời gọi filter đi ngược lên.",
        framework: false,
        code: `http.authorizeHttpRequests(rules -> rules
    .requestMatchers(HttpMethod.GET, "/api/csrf", "/api/groups", "/api/groups/**")
    .authenticated()
    .requestMatchers("/api/groups", "/api/groups/**").hasRole("ADMIN")
    .anyRequest().denyAll())
    .httpBasic(Customizer.withDefaults());`,
        calls: [{
          ...denial,
          via: "Thiếu Authorization → rule HTTP từ chối anonymous",
          input: "Lỗi từ chối truy cập của request chưa xác thực.",
          behavior: "ExceptionTranslationFilter thấy anonymous và gọi BasicAuthenticationEntryPoint. Nhánh này chưa qua DaoAuthenticationProvider.",
          output: "401 và WWW-Authenticate: Basic.",
        }],
      },
      {
        name: "GroupController", kind: "Class · Spring MVC", method: "list()",
        via: "Rule HTTP cho qua → DispatcherServlet tới controller",
        input: "GET /api/groups đã qua chuỗi filter.",
        behavior: "Controller gọi GroupService lấy danh sách nhóm.",
        output: "200 với JSON của các nhóm có trong demo.",
        code: `@GetMapping("/api/groups")
List<Group> list() {
    return groups.list();
}`,
      },
    ],
  },
  "security-authorization": {
    title: "Từ quyết định HTTP đến quyền trên nhóm",
    context: "Theo dấu POST /api/groups/42/invitations. Giả định người gọi đã xác thực, CSRF và payload đều hợp lệ.",
    steps: [
      chainSelector,
      { ...requestAuthorization, calls: [denial] },
      {
        name: "DispatcherServlet", kind: "Class · tầng Spring MVC", method: "doDispatch(...)",
        via: "Filter cho qua → servlet nhận request",
        input: "POST lời mời đã qua policy HTTP yêu cầu authenticated().",
        behavior: "Spring MVC chọn controller, bind groupId và body. Controller gọi bean InvitationService qua proxy nếu method security đã bật.",
        output: "Một lời gọi method với groupId và dữ liệu lời mời.",
        code: `@PostMapping("/api/groups/{groupId}/invitations")
void invite(@PathVariable long groupId, @RequestBody InviteRequest request) {
    invitationService.invite(groupId, request);
}`,
      },
      {
        name: "AuthorizationManagerBeforeMethodInterceptor", kind: "Class · interceptor trên proxy", method: "invoke(MethodInvocation)",
        via: "Controller gọi bean proxy, interceptor kiểm @PreAuthorize",
        input: "Lời gọi InvitationService.invite(...) và Authentication.",
        behavior: "Interceptor dùng PreAuthorizeAuthorizationManager để đánh giá biểu thức trước khi thân method chạy. Cần bật @EnableMethodSecurity.",
        output: "Cho vào thân method nếu có groups:invite hoặc ROLE_ADMIN. Reader thiếu quyền nhận lỗi từ chối ở đây.",
        code: `@Configuration
@EnableMethodSecurity
class MethodSecurityConfig {}

// Trên method public của InvitationService:
@PreAuthorize("hasAuthority('groups:invite') or hasRole('ADMIN')")
public void invite(long groupId, InviteRequest request) {
    // Spring xét biểu thức trước khi chạy phần thân.
}`,
      },
      {
        name: "InvitationService", kind: "Class · nghiệp vụ của ứng dụng", method: "invite(long, InviteRequest)",
        via: "Method interceptor cho qua → mới chạy thân service",
        input: "Principal, groupId = 42 và dữ liệu lời mời.",
        behavior: "Kiểm tra caller có sở hữu đúng nhóm hoặc là admin. Authority groups:invite chỉ mở quyền thao tác, còn groupId quyết định phạm vi tài nguyên.",
        output: "Owner nhóm khác nhận lỗi từ chối trước khi ghi. Owner đúng nhóm tiếp tục kiểm tra nghiệp vụ và lưu lời mời.",
        code: `Group group = groupRepository.findById(groupId)
    .orElseThrow(GroupNotFoundException::new);
Authentication caller = SecurityContextHolder.getContext().getAuthentication();
boolean admin = caller.getAuthorities().stream()
    .anyMatch(authority -> authority.getAuthority().equals("ROLE_ADMIN"));
if (!admin && !group.getOwnerUsername().equals(caller.getName())) {
    throw new AccessDeniedException("Group owner required");
}
invitationRepository.save(Invitation.forGroup(group, request));`,
      },
    ],
  },
  "security-session-csrf": {
    title: "Request có cookie đi qua CORS và CSRF thế nào?",
    context: "Theo dấu POST /api/groups với session đã đăng nhập. Ví dụ dùng repository CSRF mặc định và CorsFilter được thêm vào chain qua http.cors(...).",
    steps: [
      {
        name: "SecurityContextHolderFilter", kind: "Class · khôi phục context", method: "doFilter(...)",
        input: "Request với cookie session, ví dụ JSESSIONID.",
        behavior: "SecurityContextRepository cung cấp deferred context. Cấu hình session có thể lấy Authentication đã lưu trong HttpSession khi context được truy cập.",
        output: "Context sẵn cho các bước sau. Cookie session có thể được trình duyệt gửi tự động nên vẫn cần kiểm tra CSRF với thao tác ghi.",
        framework: true,
        code: `Supplier<SecurityContext> deferred = repository.loadDeferredContext(request);
try {
    securityContextHolderStrategy.setDeferredContext(deferred);
    chain.doFilter(request, response);
} finally {
    securityContextHolderStrategy.clearContext();
}`,
      },
      {
        name: "CorsFilter", kind: "Class · xử lý CORS trước CSRF và phân quyền", method: "doFilterInternal(...)",
        via: "Chain chạy tiếp, context vẫn có thể được tải trì hoãn",
        input: "Origin, request thực hoặc OPTIONS preflight.",
        behavior: "CorsProcessor kiểm origin, method và header theo CorsConfiguration. Preflight được xử lý tại đây khi CORS áp dụng.",
        output: "Preflight không cần mang cookie phiên. Request thực hợp lệ tiếp tục xuống các filter; browser dùng header CORS để quyết định có cho JavaScript đọc response.",
        framework: true,
        code: `CorsConfiguration configuration = configSource.getCorsConfiguration(request);
boolean valid = processor.processRequest(configuration, request, response);
if (!valid || CorsUtils.isPreFlightRequest(request)) {
    return;
}
filterChain.doFilter(request, response);`,
      },
      {
        name: "CsrfFilter", kind: "Class · bảo vệ thao tác thay đổi trạng thái", method: "doFilterInternal(...)",
        via: "POST khớp matcher CSRF mặc định",
        input: "Token gửi qua header hoặc form và token kỳ vọng lấy từ repository.",
        behavior: "CsrfTokenRequestHandler đưa token vào request attribute. Với method cần bảo vệ, filter mới lấy token kỳ vọng và giải giá trị client gửi để so khớp.",
        output: "Token hợp lệ thì đi tiếp. Token thiếu hoặc sai thì gọi AccessDeniedHandler ngay tại filter, controller không chạy.",
        framework: true,
        code: `DeferredCsrfToken deferred = tokenRepository.loadDeferredToken(request, response);
requestHandler.handle(request, response, deferred::get);
if (requireCsrfProtectionMatcher.matches(request)) {
    CsrfToken expected = deferred.get();
    String supplied = requestHandler.resolveCsrfTokenValue(request, expected);
    if (!equalsConstantTime(expected.getToken(), supplied)) {
        AccessDeniedException error = deferred.isGenerated()
            ? new MissingCsrfTokenException(supplied)
            : new InvalidCsrfTokenException(expected, supplied);
        accessDeniedHandler.handle(request, response, error);
        return;
    }
}
filterChain.doFilter(request, response);`,
        calls: [
          {
            name: "CsrfTokenRepository", kind: "Interface · HttpSessionCsrfTokenRepository mặc định", method: "loadDeferredToken(...)",
            via: "Đọc token mà server mong đợi",
            input: "HTTP request và session liên kết với request đó.",
            behavior: "Repository quản lý bản token kỳ vọng, độc lập với ID phiên. HttpSessionCsrfTokenRepository lưu nó trong HttpSession.",
            output: "Token để filter kiểm tra khi cần. Token mới có thể được tạo nếu chưa có.",
            code: `http.csrf(csrf -> csrf
    .csrfTokenRepository(new HttpSessionCsrfTokenRepository()));`,
          },
          {
            name: "CsrfTokenRequestHandler", kind: "Interface · xử lý token do client gửi", method: "resolveCsrfTokenValue(...)",
            via: "Đọc token thực tế từ request",
            input: "Request và CsrfToken mang tên header/parameter.",
            behavior: "Handler đọc token từ request. Implementation XOR mặc định còn giải giá trị đã được mask khi ứng dụng xuất token theo cơ chế đó.",
            output: "Giá trị để CsrfFilter so với token kỳ vọng.",
            framework: true,
            code: `String submitted = requestHandler.resolveCsrfTokenValue(request, expected);
boolean matches = equalsConstantTime(expected.getToken(), submitted);`,
          },
        ],
      },
      { ...requestAuthorization, via: "CSRF hợp lệ → tiếp tục xét quyền HTTP" },
    ],
  },
  "security-lab": {
    title: "Theo dấu rule của GET /api/ops",
    context: "Lab có reader mang ROLE_READER và admin mang ROLE_ADMIN. Cả hai đều gửi HTTP Basic hợp lệ. Kiểm tra vì sao cùng URL trả 403 cho reader và 200 cho admin.",
    steps: [
      chainSelector,
      {
        name: "BasicAuthenticationFilter", kind: "Class · xác thực trước khi xét quyền", method: "doFilterInternal(...)",
        via: "Chain lab bật HTTP Basic",
        input: "Username/password hợp lệ trong request Basic.",
        behavior: "Manager xác thực credential. Filter đặt Authentication với role của caller vào SecurityContext.",
        output: "Cả reader và admin đều đến bước xét quyền.",
        code: `http.httpBasic(Customizer.withDefaults());`,
      },
      {
        ...requestAuthorization,
        via: "GET tiếp tục tới policy HTTP",
        behavior: "Matcher /api/ops xuất hiện trước rule GET /api/**. Chỉ rule đầu tiên khớp được áp dụng.",
        output: "Admin tiếp tục tới LabChecks.ops. Reader bị từ chối vì thiếu ROLE_ADMIN.",
        framework: false,
        code: `http.authorizeHttpRequests(rules -> rules
    .requestMatchers("/api/ops", "/api/lab/**").hasRole("ADMIN")
    .requestMatchers(HttpMethod.GET, "/api/**").authenticated()
    .requestMatchers("/api/**").hasRole("ADMIN")
    .anyRequest().denyAll());`,
        calls: [denial],
      },
      {
        name: "LabChecks", kind: "Class · controller của lab", method: "ops(Principal)",
        via: "Nhánh admin có ROLE_ADMIN",
        input: "Principal của admin đã qua kiểm quyền.",
        behavior: "Controller dùng danh tính từ Spring MVC để trả tên user.",
        output: "HTTP 200 và JSON chứa username admin.",
        code: `@GetMapping("/api/ops")
Map<String, String> ops(Principal principal) {
    return Map.of("username", principal.getName());
}`,
      },
    ],
  },
  "security-oauth2": {
    title: "JWT Bearer qua filter, decoder và scope",
    context: "Theo dấu GET /api/groups với access token từ test issuer. Một token cần đúng chữ ký, thời hạn, issuer và audience trước khi xét quyền groups.read.",
    steps: [
      {
        name: "BearerTokenAuthenticationFilter", kind: "Class · filter của Resource Server", method: "doFilterInternal(...)",
        input: "Authorization: Bearer <access-token>.",
        behavior: "BearerTokenResolver lấy token. Filter dùng BearerTokenAuthenticationToken để đưa credential vào AuthenticationManager đã chọn cho request.",
        output: "Gọi manager khi có token. Token bị từ chối dẫn tới luồng phản hồi 401 của Resource Server.",
        framework: true,
        code: `String token = bearerTokenResolver.resolve(request);
if (token == null) {
    filterChain.doFilter(request, response);
    return;
}
Authentication result = authenticationManagerResolver.resolve(request)
    .authenticate(new BearerTokenAuthenticationToken(token));
// Sau thành công, filter đặt result vào SecurityContext.`,
        calls: [{
          name: "BearerTokenAuthenticationEntryPoint", kind: "Class · AuthenticationEntryPoint", method: "commence(...)",
          via: "Bearer token bị từ chối",
          input: "Lỗi xác thực bearer token, ví dụ token hết hạn.",
          behavior: "Failure handler chuyển lỗi đến entry point. Entry point tạo phản hồi theo giao thức Bearer.",
          output: "HTTP 401 và WWW-Authenticate: Bearer với lỗi invalid_token khi token không hợp lệ.",
          framework: true,
          code: `// Tại nhánh lỗi của filter:
securityContextHolderStrategy.clearContext();
authenticationFailureHandler.onAuthenticationFailure(request, response, error);`,
        }],
      },
      { ...authenticationManager, via: "authenticate(BearerTokenAuthenticationToken)" },
      {
        name: "JwtAuthenticationProvider", kind: "Class · AuthenticationProvider cho JWT", method: "authenticate(Authentication)",
        via: "Manager chọn provider JWT theo kiểu token",
        input: "Chuỗi bearer token.",
        behavior: "Gọi JwtDecoder để xác minh và đọc claims. Chỉ sau khi decoder thành công mới chạy converter.",
        output: "Authentication với Jwt làm principal và authorities từ converter.",
        framework: true,
        code: `BearerTokenAuthenticationToken bearer =
    (BearerTokenAuthenticationToken) authentication;
Jwt jwt = jwtDecoder.decode(bearer.getToken());
return jwtAuthenticationConverter.convert(jwt);`,
        calls: [
          {
            name: "JwtDecoder", kind: "Interface · NimbusJwtDecoder thường được dùng", method: "decode(String)",
            via: "Xác minh JWT trước khi tin claims",
            input: "JWT dạng chuỗi và cấu hình khóa, issuer, audience của API.",
            behavior: "Decoder xác minh chữ ký bằng khóa tin cậy và áp dụng validator cho issuer, thời gian và audience đã cấu hình. Lỗi ở đây chặn bước đổi scope.",
            output: "Jwt hợp lệ hoặc JwtException. Ở biên HTTP, JWT không hợp lệ trả 401.",
            framework: true,
            code: `Jwt jwt = jwtDecoder.decode(bearer.getToken());
// Chỉ sau decode thành công mới đọc claims đã xác minh.
String subject = jwt.getSubject();
List<String> audience = jwt.getAudience();`,
          },
          {
            name: "JwtAuthenticationConverter", kind: "Class · đổi claims thành Authentication", method: "convert(Jwt)",
            via: "Sau khi decoder xác minh thành công",
            input: "Jwt đã qua decoder, ví dụ có scope groups.read.",
            behavior: "JwtGrantedAuthoritiesConverter mặc định đọc scope/scp và thêm tiền tố SCOPE_.",
            output: "JwtAuthenticationToken có authority SCOPE_groups.read.",
            framework: true,
            code: `JwtGrantedAuthoritiesConverter scopes = new JwtGrantedAuthoritiesConverter();
Collection<GrantedAuthority> authorities = scopes.convert(jwt);
return new JwtAuthenticationToken(jwt, authorities);`,
          },
        ],
      },
      {
        ...requestAuthorization,
        via: "JWT đã xác minh → filter đặt context → xét scope",
        behavior: "Đọc authority từ Authentication và so với rule của endpoint. JWT có chữ ký đúng vẫn có thể thiếu scope.",
        output: "Có groups.read thì tiếp tục vào MVC. Đã xác thực mà thiếu scope thì trả 403.",
        framework: false,
        code: `http.authorizeHttpRequests(rules -> rules
    .requestMatchers(HttpMethod.GET, "/api/groups")
    .hasAuthority("SCOPE_groups.read")
    .anyRequest().denyAll())
    .oauth2ResourceServer(oauth -> oauth.jwt(Customizer.withDefaults()));`,
        calls: [{
          name: "BearerTokenAccessDeniedHandler", kind: "Class · AccessDeniedHandler", method: "handle(...)",
          via: "Token hợp lệ nhưng không có scope",
          input: "Request đã xác thực và AccessDeniedException từ bước kiểm quyền.",
          behavior: "ExceptionTranslationFilter chuyển lỗi về handler dành cho Resource Server.",
          output: "HTTP 403. Với caller được xác thực bằng OAuth2 token, header Bearer cho biết insufficient_scope.",
          framework: true,
          code: `accessDeniedHandler.handle(request, response, denied);
// HTTP/1.1 403 Forbidden
// WWW-Authenticate: Bearer error="insufficient_scope", ...`,
        }],
      },
    ],
  },
};
