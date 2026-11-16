package vn.railway89.directory;

import org.springframework.context.annotation.*;
import org.springframework.stereotype.Component;

interface Greeting {
    String message();
}

@Component("vietnameseGreeting")
class VietnameseGreeting implements Greeting {
    @Override
    public String message() {
        return "Xin chào";
    }
}

@Configuration(proxyBeanMethods = false)
class GreetingConfig {
    @Bean("englishGreeting")
    @Primary
    @Profile("!ambiguous")
    Greeting primaryEnglishGreeting() {
        return () -> "Hello";
    }

    @Bean("englishGreeting")
    @Profile("ambiguous")
    Greeting englishGreetingWithoutPrimary() {
        return () -> "Hello";
    }
}
