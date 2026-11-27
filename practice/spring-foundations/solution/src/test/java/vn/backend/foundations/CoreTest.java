package vn.backend.foundations;

import static org.assertj.core.api.Assertions.assertThat;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class CoreTest {
    @Autowired GreetingService service;
    @Autowired List<Greeting> strategies;

    @Test void selectsVietnameseAndNormalizesInput() {
        assertThat(service.welcome(" An ")).isEqualTo("Xin chào An");
    }

    @Test void collectionContainsBothStrategies() {
        assertThat(strategies).hasSize(2);
        assertThat(strategies.stream().map(x -> x.greet("An"))).containsExactlyInAnyOrder("Hello An", "Xin chào An");
    }
}
