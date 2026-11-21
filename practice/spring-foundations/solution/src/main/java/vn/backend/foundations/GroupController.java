package vn.backend.foundations;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.net.URI;
import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.*;

@RestController
class GroupController {
    private final GroupService groups;
    GroupController(GroupService groups) { this.groups = groups; }

    record GroupRequest(@NotBlank @Size(max = 80) String name) {}

    @GetMapping("/api/groups") List<Group> list() { return groups.list(); }
    @GetMapping("/api/groups/{id}") Group find(@PathVariable long id) { return groups.find(id); }

    @PostMapping("/api/groups")
    ResponseEntity<Group> create(@Valid @RequestBody GroupRequest request) {
        Group group = groups.create(request.name());
        return ResponseEntity.created(URI.create("/api/groups/" + group.id())).body(group);
    }

    @PutMapping("/api/groups/{id}")
    Group update(@PathVariable long id, @Valid @RequestBody GroupRequest request) {
        return groups.update(id, request.name());
    }

    @DeleteMapping("/api/groups/{id}")
    ResponseEntity<Void> delete(@PathVariable long id) {
        groups.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/api/csrf")
    Map<String, String> csrf(CsrfToken token) {
        return Map.of("headerName", token.getHeaderName(), "token", token.getToken());
    }
}
