package vn.backend.foundations;

import jakarta.servlet.DispatcherType;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;

@Configuration(proxyBeanMethods = false)
class SecurityConfig {
    @Bean PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(); }

    @Bean UserDetailsService users(PasswordEncoder encoder) {
        return new InMemoryUserDetailsManager(
            User.withUsername("admin").password(encoder.encode("demo-pass")).roles("ADMIN").build(),
            User.withUsername("reader").password(encoder.encode("demo-pass")).roles("READER").build());
    }

    @Bean SecurityFilterChain web(HttpSecurity http) throws Exception {
        http.authorizeHttpRequests(r -> r
            .dispatcherTypeMatchers(DispatcherType.ERROR).permitAll()
            .requestMatchers(HttpMethod.GET, "/api/csrf", "/api/groups", "/api/groups/**").authenticated()
            .requestMatchers("/api/groups", "/api/groups/**").hasRole("ADMIN")
            .anyRequest().denyAll())
            .httpBasic(Customizer.withDefaults());
        // CSRF remains enabled. Local lab is never intended as a production identity store.
        return http.build();
    }
}
