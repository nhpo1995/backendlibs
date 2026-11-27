package vn.backend.foundations;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

@Service
public class GreetingService {
    private final Greeting greeting;

    public GreetingService(@Qualifier("english") /* TODO Core: chọn bean tiếng Việt */ Greeting greeting) { this.greeting = greeting; }

    public String welcome(String name) { return greeting.greet(name); /* TODO Core: chuẩn hóa khoảng trắng */ }
}
