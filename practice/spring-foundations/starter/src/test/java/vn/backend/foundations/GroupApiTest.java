package vn.backend.foundations;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class GroupApiTest {
    @Autowired MockMvc mvc;
    @Autowired JdbcTemplate db;
    @Autowired GroupService groups;

    @BeforeEach void reset() {
        db.update("DELETE FROM study_groups");
        db.update("INSERT INTO study_groups(name) VALUES ('Backend'), ('Ops')");
    }

    @Test void readerCanListWithoutLeakingCredentials() throws Exception {
        mvc.perform(get("/api/groups").with(httpBasic("reader", "demo-pass")))
            .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(2))
            .andExpect(jsonPath("$[0].name").value("Backend"))
            .andExpect(jsonPath("$[0].password").doesNotExist());
    }

    @Test void createsWithLocationAndCanReadBack() throws Exception {
        var result = mvc.perform(post("/api/groups").with(httpBasic("admin", "demo-pass")).with(csrf())
                .contentType("application/json").content("{\"name\":\" Study \"}"))
            .andExpect(status().isCreated()).andExpect(header().exists("Location"))
            .andExpect(jsonPath("$.name").value("Study")).andReturn();
        mvc.perform(get(result.getResponse().getHeader("Location")).with(httpBasic("reader", "demo-pass")))
            .andExpect(status().isOk()).andExpect(jsonPath("$.name").value("Study"));
        assertThat(groups.list()).hasSize(3);
    }

    @Test void rejectsBlankNameWithoutWriting() throws Exception {
        var before = groups.list();
        mvc.perform(post("/api/groups").with(user("admin").roles("ADMIN")).with(csrf())
                .contentType("application/json").content("{\"name\":\"  \"}"))
            .andExpect(status().isBadRequest());
        assertThat(groups.list()).isEqualTo(before);
    }

    @Test void rejectsTooLongNameWithoutWriting() throws Exception {
        var before = groups.list();
        mvc.perform(post("/api/groups").with(user("admin").roles("ADMIN")).with(csrf())
                .contentType("application/json").content("{\"name\":\"" + "x".repeat(81) + "\"}"))
            .andExpect(status().isBadRequest());
        assertThat(groups.list()).isEqualTo(before);
    }

    @Test void duplicateNameReturnsProblemAndKeepsData() throws Exception {
        var before = groups.list();
        mvc.perform(post("/api/groups").with(user("admin").roles("ADMIN")).with(csrf())
                .contentType("application/json").content("{\"name\":\"Backend\"}"))
            .andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("GROUP_EXISTS"));
        assertThat(groups.list()).isEqualTo(before);
    }

    @Test void updateAndDeleteUseIdFromUrl() throws Exception {
        long id = groups.list().get(0).id();
        mvc.perform(put("/api/groups/" + id).with(user("admin").roles("ADMIN")).with(csrf())
                .contentType("application/json").content("{\"name\":\"Renamed\"}"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.id").value(id)).andExpect(jsonPath("$.name").value("Renamed"));
        mvc.perform(delete("/api/groups/" + id).with(user("admin").roles("ADMIN")).with(csrf()))
            .andExpect(status().isNoContent());
        mvc.perform(get("/api/groups/" + id).with(user("reader").roles("READER"))).andExpect(status().isNotFound());
    }

    @Test void missingAndMalformedIdAreDifferent() throws Exception {
        mvc.perform(get("/api/groups/999999").with(user("reader").roles("READER"))).andExpect(status().isNotFound());
        mvc.perform(get("/api/groups/abc").with(user("reader").roles("READER"))).andExpect(status().isBadRequest());
    }
}
