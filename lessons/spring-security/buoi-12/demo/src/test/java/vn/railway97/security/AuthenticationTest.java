package vn.railway97.security;

import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class AuthenticationTest {
    @Autowired TestRestTemplate http;
    @Autowired JdbcTemplate jdbc;

    private HttpHeaders auth(String username, String password) {
        var h = new HttpHeaders();
        h.setBasicAuth(username, password);
        h.setAccept(List.of(MediaType.APPLICATION_JSON));
        h.setContentType(MediaType.APPLICATION_JSON);
        return h;
    }
    private ResponseEntity<String> getMe(String username, String password) {
        return http.exchange("/api/me", HttpMethod.GET,
                new HttpEntity<>(auth(username, password)), String.class);
    }
    private HttpHeaders writeHeaders() {
        var h = auth("teacher", "Learn123!");
        var token = http.exchange("/api/csrf", HttpMethod.GET, new HttpEntity<>(h), Map.class);
        assertThat(token.getStatusCode()).isEqualTo(HttpStatus.OK);
        h.set((String) token.getBody().get("headerName"), (String) token.getBody().get("token"));
        h.set(HttpHeaders.COOKIE, token.getHeaders().getFirst(HttpHeaders.SET_COOKIE).split(";", 2)[0]);
        return h;
    }
    private ResponseEntity<String> post(String url, String body, HttpHeaders headers) {
        return http.exchange(url, HttpMethod.POST, new HttpEntity<>(body, headers), String.class);
    }

    @Test void authenticatesAnExistingDatabaseAccount() {
        var response = getMe("teacher", "Learn123!");
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).contains("teacher").doesNotContain("password", "$2a$");
    }
    @Test void rejectsMissingCredentialsWrongPasswordAndUnknownUsername() {
        var h = new HttpHeaders();
        h.setAccept(List.of(MediaType.APPLICATION_JSON));
        var missing = http.exchange("/api/me", HttpMethod.GET, new HttpEntity<>(h), String.class);
        assertThat(missing.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(missing.getHeaders().getFirst(HttpHeaders.WWW_AUTHENTICATE)).startsWith("Basic");
        assertThat(getMe("teacher", "wrong").getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(getMe("unknown", "Learn123!").getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }
    @Test void createsAccountStoresHashAndAuthenticatesTheNewAccount() {
        var response = post("/api/accounts", """
                {"username":"linh","password":"Study123!","displayName":"Linh"}
                """, writeHeaders());
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getHeaders().getFirst(HttpHeaders.LOCATION)).startsWith("/api/accounts/");
        assertThat(response.getBody()).contains("linh").doesNotContain("password", "Study123!", "$2a$");
        String hash = jdbc.queryForObject("select password_hash from accounts where username='linh'", String.class);
        assertThat(hash).isNotEqualTo("Study123!").hasSize(60);
        var encoder = new BCryptPasswordEncoder();
        assertThat(encoder.matches("Study123!", hash)).isTrue();
        assertThat(encoder.matches("wrong", hash)).isFalse();
        assertThat(getMe("linh", "Study123!").getBody()).contains("linh");
        assertThat(getMe("linh", "wrong").getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }
    @Test void refusesWritesWithoutCsrfAndLeavesDatabaseUnchanged() {
        var response = post("/api/accounts", """
                {"username":"blocked","password":"Study123!","displayName":"Blocked"}
                """, auth("teacher", "Learn123!"));
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(jdbc.queryForObject("select count(*) from accounts where username='blocked'", Integer.class)).isZero();
    }
    @Test void validatesInputAndReturnsConflictForDuplicateUsername() {
        var headers = writeHeaders();
        assertThat(post("/api/accounts", """
                {"username":"teacher","password":"Study123!","displayName":"Duplicate"}
                """, headers).getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(post("/api/accounts", """
                {"username":"","password":"short","displayName":""}
                """, headers).getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(post("/api/accounts", """
                {"username":"too-long","password":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","displayName":"Long"}
                """, headers).getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }
    @Test void rollsBackRenameWhenTheServiceTransactionFails() {
        checkRename(true, "Teacher");
    }
    @Test void demonstratesRepositoryCommitBeforeAnUnwrappedServiceFails() {
        checkRename(false, "Changed");
    }
    private void checkRename(boolean atomic, String expected) {
        long id = jdbc.queryForObject("select id from accounts where username='teacher'", Long.class);
        jdbc.update("update accounts set display_name='Teacher' where id=?", id);
        var response = post("/api/lab/accounts/" + id + "/rename?atomic=" + atomic,
                "{\"displayName\":\"Changed\"}", writeHeaders());
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(jdbc.queryForObject("select display_name from accounts where id=?", String.class, id)).isEqualTo(expected);
        jdbc.update("update accounts set display_name='Teacher' where id=?", id);
    }
}
