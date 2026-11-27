package vn.backend.foundations;

import static org.assertj.core.api.Assertions.assertThat;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.CookieManager;
import java.net.CookiePolicy;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
    properties = "spring.datasource.url=jdbc:h2:mem:http-boundary;DB_CLOSE_DELAY=-1")
class HttpBoundaryTest {
    @LocalServerPort int port;
    @Autowired GroupService groups;
    @Autowired ObjectMapper json;
    final HttpClient client = HttpClient.newBuilder()
        .cookieHandler(new CookieManager(null, CookiePolicy.ACCEPT_ALL)).build();

    HttpResponse<String> request(String method, String path, String user, String body, JsonNode csrf) throws Exception {
        var builder = HttpRequest.newBuilder(URI.create("http://127.0.0.1:" + port + path))
            .header("Accept", "application/json")
            .header("Authorization", "Basic " + Base64.getEncoder().encodeToString(user.getBytes(StandardCharsets.UTF_8)));
        if (csrf != null) builder.header(csrf.get("headerName").asText(), csrf.get("token").asText());
        if (body != null) builder.header("Content-Type", "application/json");
        builder.method(method, body == null ? HttpRequest.BodyPublishers.noBody() : HttpRequest.BodyPublishers.ofString(body));
        return client.send(builder.build(), HttpResponse.BodyHandlers.ofString());
    }

    @Test void csrfDenialStays403AcrossServletErrorDispatch() throws Exception {
        var before = groups.list();
        var response = request("POST", "/api/groups", "admin:demo-pass", "{\"name\":\"Denied HTTP\"}", null);
        assertThat(response.statusCode()).isEqualTo(403);
        assertThat(groups.list()).isEqualTo(before);
    }

    @Test void readerWithRealTokenStillCannotWrite() throws Exception {
        var token = json.readTree(request("GET", "/api/csrf", "reader:demo-pass", null, null).body());
        var before = groups.list();
        var response = request("POST", "/api/groups", "reader:demo-pass", "{\"name\":\"Denied reader HTTP\"}", token);
        assertThat(response.statusCode()).isEqualTo(403);
        assertThat(groups.list()).isEqualTo(before);
    }

    @Test void realSessionAndCsrfAllowAdminCreation() throws Exception {
        var token = json.readTree(request("GET", "/api/csrf", "admin:demo-pass", null, null).body());
        String name = "HTTP-" + UUID.randomUUID();
        var response = request("POST", "/api/groups", "admin:demo-pass", "{\"name\":\"" + name + "\"}", token);
        try {
            assertThat(response.statusCode()).isEqualTo(201);
            String location = response.headers().firstValue("Location").orElseThrow();
            assertThat(json.readTree(request("GET", location, "reader:demo-pass", null, null).body()).get("name").asText()).isEqualTo(name);
        } finally {
            groups.list().stream().filter(group -> group.name().equals(name)).forEach(group -> groups.delete(group.id()));
        }
    }
}
