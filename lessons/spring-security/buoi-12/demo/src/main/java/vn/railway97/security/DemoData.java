package vn.railway97.security;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.*;

@Configuration
public class DemoData {
    @Bean
    CommandLineRunner sampleAccount(AccountService service) {
        return args -> service.create("teacher", "Learn123!", "Teacher");
    }
}
