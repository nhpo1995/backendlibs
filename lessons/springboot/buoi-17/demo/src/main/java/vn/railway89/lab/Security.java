package vn.railway89.lab;

import java.security.Principal;
import java.util.Map;
import org.springframework.context.annotation.*;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.userdetails.*;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.*;

@Configuration(proxyBeanMethods = false)
class Security {
    @Bean PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(); }

    @Bean UserDetailsService labUsers(PasswordEncoder encoder) {
        return new InMemoryUserDetailsManager(
            User.withUsername("admin").password(encoder.encode("demo-pass")).roles("ADMIN").build(),
            User.withUsername("reader").password(encoder.encode("demo-pass")).roles("READER").build());
    }

    @Bean SecurityFilterChain web(HttpSecurity http) throws Exception {
        http.authorizeHttpRequests(rules -> rules
            .requestMatchers(HttpMethod.GET, "/ui.html", "/lab-ui.js").permitAll()
            .requestMatchers("/api/ops", "/api/lab/**").hasRole("ADMIN")
            .requestMatchers(HttpMethod.GET, "/api/**").authenticated()
            .requestMatchers("/api/**").hasRole("ADMIN")
            .anyRequest().denyAll())
            .httpBasic(Customizer.withDefaults())
            .exceptionHandling(errors ->
                errors.accessDeniedHandler((request, response, ex) -> response.setStatus(403)));
        // Default CSRF protection stays enabled, including for HTTP Basic.
        return http.build();
    }
}

@RestController
class LabChecks {
    @GetMapping("/api/whoami")
    Map<String, String> whoami(Principal principal) { return Map.of("username", principal.getName()); }

    @GetMapping("/api/ops")
    Map<String, String> ops(Principal principal) { return whoami(principal); }

    @GetMapping("/api/csrf")
    Map<String, String> csrf(CsrfToken token) {
        return Map.of("headerName", token.getHeaderName(), "token", token.getToken());
    }

    @GetMapping("/api/lab/failure")
    void fail() { throw new IllegalStateException("synthetic details for the local lab"); }
}
