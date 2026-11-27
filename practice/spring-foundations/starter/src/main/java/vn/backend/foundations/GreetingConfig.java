package vn.backend.foundations;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration(proxyBeanMethods = false)
class GreetingConfig {
    @Bean Greeting english() { return name -> "Hello " + name; }
    @Bean Greeting vietnamese() { return name -> "Xin chào " + name; }
}
