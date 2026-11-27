package vn.backend.foundations;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class SecurityTest {
    @Autowired MockMvc mvc;
    @Autowired GroupService groups;

    @Test void anonymousAndWrongPasswordAreChallenged() throws Exception {
        mvc.perform(get("/api/groups")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/groups").with(httpBasic("reader", "wrong"))).andExpect(status().isUnauthorized());
    }

    @Test void readerWithValidCsrfStillCannotWrite() throws Exception {
        var before = groups.list();
        mvc.perform(post("/api/groups").with(httpBasic("reader", "demo-pass")).with(csrf())
                .contentType("application/json").content("{\"name\":\"Denied reader\"}"))
            .andExpect(status().isForbidden());
        assertThat(groups.list()).isEqualTo(before);
    }

    @Test void adminWithoutCsrfCannotWrite() throws Exception {
        var before = groups.list();
        mvc.perform(post("/api/groups").with(httpBasic("admin", "demo-pass"))
                .contentType("application/json").content("{\"name\":\"Denied csrf\"}"))
            .andExpect(status().isForbidden());
        assertThat(groups.list()).isEqualTo(before);
    }

    @Test void csrfEndpointProvidesHeaderNameAndToken() throws Exception {
        mvc.perform(get("/api/csrf").with(httpBasic("admin", "demo-pass")))
            .andExpect(status().isOk()).andExpect(jsonPath("$.headerName").value("X-CSRF-TOKEN"))
            .andExpect(jsonPath("$.token").isNotEmpty());
    }
}
