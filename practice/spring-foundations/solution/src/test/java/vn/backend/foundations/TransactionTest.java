package vn.backend.foundations;

import static org.assertj.core.api.Assertions.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class TransactionTest {
    @Autowired GroupService service;

    // No test transaction: observe the service boundary, not automatic test cleanup.
    @Test void runtimeFailureRollsBackTheInsert() {
        var before = service.list();
        assertThatThrownBy(() -> service.createThenFail("Rollback Test"))
            .isInstanceOf(IllegalStateException.class).hasMessage("Lab rollback");
        assertThat(service.list()).isEqualTo(before);
    }
}
