package vn.backend.foundations;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

@Service
public class GreetingService {
    private final Greeting greeting;

    public GreetingService(@Qualifier("vietnamese") Greeting greeting) { this.greeting = greeting; }

    public String welcome(String name) { return greeting.greet(name.trim()); }
}
