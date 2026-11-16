package vn.railway89.directory;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.net.URI;
import java.util.List;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
class DirectoryController {
    private final DirectoryService service;

    DirectoryController(DirectoryService service) {
        this.service = service;
    }

    @GetMapping("/users")
    List<DirectoryService.UserView> users(@RequestParam(required = false) String username,
                                          @RequestParam(required = false) String firstName,
                                          @RequestParam(required = false) String lastName,
                                          @RequestParam(required = false) @Min(0) @Max(150) Integer age) {
        return service.listUsers(username, firstName, lastName, age);
    }

    @GetMapping("/users/{id}")
    DirectoryService.UserView user(@PathVariable long id) {
        return service.getUser(id);
    }

    @PostMapping("/users")
    ResponseEntity<DirectoryService.UserView> createUser(@Valid @RequestBody UserInput input) {
        var created = service.createUser(input.username(), input.firstName(), input.lastName(), input.age());
        return ResponseEntity.created(URI.create("/api/v1/users/" + created.id())).body(created);
    }

    @PutMapping("/users/{id}")
    DirectoryService.UserView updateUser(@PathVariable long id, @Valid @RequestBody UserInput input) {
        return service.updateUser(id, input.username(), input.firstName(), input.lastName(), input.age());
    }

    @DeleteMapping("/users/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void deleteUser(@PathVariable long id) {
        service.deleteUser(id);
    }

    @GetMapping("/groups")
    List<DirectoryService.GroupView> groups() {
        return service.listGroups();
    }

    @GetMapping("/groups/{id}")
    DirectoryService.GroupView group(@PathVariable long id) {
        return service.getGroup(id);
    }

    @PostMapping("/groups")
    ResponseEntity<DirectoryService.GroupView> createGroup(@Valid @RequestBody GroupInput input) {
        var created = service.createGroup(input.name());
        return ResponseEntity.created(URI.create("/api/v1/groups/" + created.id())).body(created);
    }

    @PutMapping("/groups/{id}")
    DirectoryService.GroupView updateGroup(@PathVariable long id, @Valid @RequestBody GroupInput input) {
        return service.updateGroup(id, input.name());
    }

    @DeleteMapping("/groups/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void deleteGroup(@PathVariable long id) {
        service.deleteGroup(id);
    }

    @GetMapping("/groups/{groupId}/members")
    List<DirectoryService.UserView> members(@PathVariable long groupId) {
        return service.listMembers(groupId);
    }

    @PutMapping("/groups/{groupId}/members/{userId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void addMember(@PathVariable long groupId, @PathVariable long userId) {
        service.addMember(groupId, userId);
    }

    @DeleteMapping("/groups/{groupId}/members/{userId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void removeMember(@PathVariable long groupId, @PathVariable long userId) {
        service.removeMember(groupId, userId);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    ProblemDetail conflict() {
        return ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, "Thay đổi vi phạm ràng buộc dữ liệu");
    }

    record UserInput(@NotBlank @Size(max = 40) String username,
                     @NotBlank @Size(max = 80) String firstName,
                     @NotBlank @Size(max = 80) String lastName,
                     @NotNull @Min(0) @Max(150) Integer age) {}

    record GroupInput(@NotBlank @Size(max = 80) String name) {}
}
