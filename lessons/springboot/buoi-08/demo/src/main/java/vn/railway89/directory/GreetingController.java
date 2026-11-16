package vn.railway89.directory;

import java.util.Map;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/buoi-10/greetings")
class GreetingController {
    private final Greeting fallback;
    private final Greeting vietnamese;

    GreetingController(Greeting fallback, @Qualifier("vietnameseGreeting") Greeting vietnamese) {
        this.fallback = fallback;
        this.vietnamese = vietnamese;
    }

    @GetMapping
    Map<String, String> greetings() {
        return Map.of("default", fallback.message(), "vi", vietnamese.message());
    }
}
