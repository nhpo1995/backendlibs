package vn.railway89.lab;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.net.URI;
import java.security.Principal;
import java.time.OffsetDateTime;
import java.util.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@Service
class DirectoryService {
    private static final Logger log = LoggerFactory.getLogger(DirectoryService.class);
    private final JdbcTemplate db;
    DirectoryService(JdbcTemplate db) { this.db = db; }

    record Group(long id, String name, long memberCount, String creator, String createdAt) {}
    record Account(long id, String username, String email, List<Long> groupIds) {}

    private static final String GROUPS = """
        SELECT g.id, g.name, COUNT(m.account_id) AS member_count, g.creator, g.created_at
        FROM lab_groups g LEFT JOIN lab_membership m ON m.group_id = g.id
        WHERE %s
        GROUP BY g.id, g.name, g.creator, g.created_at
        ORDER BY g.id
        """;
    List<Group> groups(String q) {
        return groupQuery("lower(g.name) LIKE ? ESCAPE '!'", "%" + Like.literal(q.trim()) + "%");
    }
    Group group(long id) { return one(groupQuery("g.id = ?", id), "group", id); }

    private List<Group> groupQuery(String where, Object arg) {
        // "where" comes exclusively from the two constant clauses above.
        return db.query(GROUPS.formatted(where),
            (r,i) -> new Group(r.getLong("id"), r.getString("name"), r.getLong("member_count"),
                r.getString("creator"), r.getObject("created_at", OffsetDateTime.class).toInstant().toString()), arg);
    }

    @Transactional
    public Group createGroup(String name, String creator) {
        db.update("INSERT INTO lab_groups (name, creator, created_at) VALUES (?, ?, ?)", name.trim(), creator, OffsetDateTime.now());
        long id = db.queryForObject("SELECT id FROM lab_groups WHERE name = ?", Long.class, name.trim());
        log.debug("Created group id={}", id);
        return group(id);
    }

    @Transactional
    public Group updateGroup(long id, String name) {
        if (db.update("UPDATE lab_groups SET name = ? WHERE id = ?", name.trim(), id) == 0) throw LabError.missing("group", id);
        return group(id);
    }

    @Transactional
    public void deleteGroup(long id) {
        if (db.queryForList("SELECT id FROM lab_groups WHERE id = ? FOR UPDATE", Long.class, id).isEmpty())
            throw LabError.missing("group", id);
        db.update("DELETE FROM lab_membership WHERE group_id = ?", id);
        db.update("DELETE FROM lab_groups WHERE id = ?", id);
    }

    private static final String ACCOUNTS = """
        SELECT a.id, a.username, a.email, m.group_id
        FROM lab_accounts a LEFT JOIN lab_membership m ON m.account_id = a.id
        WHERE %s ORDER BY a.id, m.group_id
        """;

    List<Account> accounts(String q) {
        String pattern = "%" + Like.literal(q.trim()) + "%";
        return accountQuery("(lower(a.username) LIKE ? ESCAPE '!' OR lower(a.email) LIKE ? ESCAPE '!')", pattern, pattern);
    }
    Account account(long id) { return one(accountQuery("a.id = ?", id), "account", id); }

    private List<Account> accountQuery(String where, Object... args) {
        return db.query(ACCOUNTS.formatted(where), rs -> {
            Map<Long, Account> rows = new LinkedHashMap<>();
            while (rs.next()) {
                long id = rs.getLong("id");
                var a = rows.get(id);
                if (a == null) {
                    a = new Account(id, rs.getString("username"), rs.getString("email"), new ArrayList<>());
                    rows.put(id, a);
                }
                Long group = rs.getObject("group_id", Long.class);
                if (group != null) a.groupIds().add(group);
            }
            return rows.values().stream()
                .map(a -> new Account(a.id(), a.username(), a.email(), List.copyOf(a.groupIds())))
                .toList();
        }, args);
    }

    private Set<Long> checkedGroups(List<Long> input) {
        // Lock group rows in the same order so deletion and membership writes cannot interleave silently.
        Set<Long> desired = new TreeSet<>(input);
        for (Long g : desired) {
            if (db.queryForList("SELECT id FROM lab_groups WHERE id = ? FOR UPDATE", Long.class, g).isEmpty())
                throw LabError.missing("group", g);
        }
        return desired;
    }

    @Transactional
    public Account createAccount(String username, String email, List<Long> groupIds) {
        Set<Long> groups = checkedGroups(groupIds);
        db.update("INSERT INTO lab_accounts (username, email) VALUES (?, ?)", username, email);
        long id = db.queryForObject("SELECT id FROM lab_accounts WHERE username = ?", Long.class, username);
        replaceGroups(id, groups);
        log.debug("Created account id={} groupCount={}", id, groups.size());
        return account(id);
    }

    @Transactional
    public Account updateAccount(long id, String username, String email, List<Long> groupIds) {
        Set<Long> groups = checkedGroups(groupIds);
        if (db.update("UPDATE lab_accounts SET username = ?, email = ? WHERE id = ?", username, email, id) == 0)
            throw LabError.missing("account", id);
        replaceGroups(id, groups);
        return account(id);
    }

    private void replaceGroups(long id, Set<Long> desired) {
        Set<Long> existing = new HashSet<>(db.queryForList(
            "SELECT group_id FROM lab_membership WHERE account_id = ?", Long.class, id));
        for (Long group : existing) {
            if (!desired.contains(group)) db.update("DELETE FROM lab_membership WHERE account_id = ? AND group_id = ?", id, group);
        }
        for (Long group : desired) {
            if (!existing.contains(group)) db.update("INSERT INTO lab_membership VALUES (?, ?)", id, group);
        }
    }

    @Transactional
    public void deleteAccount(long id) {
        // Serialize with updates for this account before removing child rows.
        if (db.queryForList("SELECT id FROM lab_accounts WHERE id = ? FOR UPDATE", Long.class, id).isEmpty())
            throw LabError.missing("account", id);
        db.update("DELETE FROM lab_membership WHERE account_id = ?", id);
        db.update("DELETE FROM lab_accounts WHERE id = ?", id);
    }

    private static <T> T one(List<T> rows, String kind, long id) {
        if (rows.isEmpty()) throw LabError.missing(kind, id);
        return rows.get(0);
    }
}

@RestController
@RequestMapping("/api")
class Directory {
    private final DirectoryService service;
    Directory(DirectoryService service) { this.service = service; }

    record GroupInput(@NotBlank(message = "{name.required}") @Size(min=3, max=40, message = "{name.size}") String name) {
        GroupInput { if (name != null) name = name.trim(); }
    }
    record AccountInput(@NotBlank @Pattern(regexp="[a-zA-Z0-9_]{3,40}") String username,
                        @NotBlank @Email @Size(max=100) String email,
                        @NotNull @Size(max=20) List<@NotNull @Positive Long> groupIds) {}

    @GetMapping("/groups")
    List<DirectoryService.Group> groups(@RequestParam(defaultValue = "") String q) { return service.groups(q); }
    @GetMapping("/groups/{id}")
    DirectoryService.Group group(@PathVariable long id) { return service.group(id); }

    @PostMapping(value = "/groups", consumes = "application/json")
    ResponseEntity<DirectoryService.Group> addGroup(@Valid @RequestBody GroupInput in, Principal principal) {
        var g = service.createGroup(in.name, principal.getName());
        return ResponseEntity.created(URI.create("/api/groups/" + g.id())).body(g);
    }

    @PutMapping(value = "/groups/{id}", consumes = "application/json")
    DirectoryService.Group updateGroup(@PathVariable long id, @Valid @RequestBody GroupInput in) {
        return service.updateGroup(id, in.name);
    }

    @DeleteMapping("/groups/{id}")
    ResponseEntity<Void> deleteGroup(@PathVariable long id) {
        service.deleteGroup(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/accounts")
    List<DirectoryService.Account> accounts(@RequestParam(defaultValue = "") String q) { return service.accounts(q); }
    @GetMapping("/accounts/{id}")
    DirectoryService.Account account(@PathVariable long id) { return service.account(id); }

    @PostMapping(value = "/accounts", consumes = "application/json")
    ResponseEntity<DirectoryService.Account> addAccount(@Valid @RequestBody AccountInput in) {
        var a = service.createAccount(in.username, in.email, in.groupIds);
        return ResponseEntity.created(URI.create("/api/accounts/" + a.id())).body(a);
    }

    @PutMapping(value = "/accounts/{id}", consumes = "application/json")
    DirectoryService.Account updateAccount(@PathVariable long id, @Valid @RequestBody AccountInput in) {
        return service.updateAccount(id, in.username, in.email, in.groupIds);
    }

    @DeleteMapping("/accounts/{id}")
    ResponseEntity<Void> deleteAccount(@PathVariable long id) {
        service.deleteAccount(id);
        return ResponseEntity.noContent().build();
    }
}
