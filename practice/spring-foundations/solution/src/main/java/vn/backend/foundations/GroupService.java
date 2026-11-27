package vn.backend.foundations;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class GroupService {
    private final JdbcTemplate db;
    public GroupService(JdbcTemplate db) { this.db = db; }

    public List<Group> list() {
        return db.query("SELECT id, name FROM study_groups ORDER BY id",
            (row, number) -> new Group(row.getLong("id"), row.getString("name")));
    }

    public Group find(long id) {
        return db.query("SELECT id, name FROM study_groups WHERE id = ?",
            (row, number) -> new Group(row.getLong("id"), row.getString("name")), id)
            .stream().findFirst().orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Group not found"));
    }

    @Transactional
    public Group create(String name) {
        String normalized = name.trim();
        db.update("INSERT INTO study_groups(name) VALUES (?)", normalized);
        long id = db.queryForObject("SELECT id FROM study_groups WHERE name = ?", Long.class, normalized);
        return find(id);
    }

    @Transactional
    public Group update(long id, String name) {
        if (db.update("UPDATE study_groups SET name = ? WHERE id = ?", name.trim(), id) == 0)
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Group not found");
        return find(id);
    }

    @Transactional
    public void delete(long id) {
        if (db.update("DELETE FROM study_groups WHERE id = ?", id) == 0)
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Group not found");
    }

    @Transactional
    public void createThenFail(String name) {
        db.update("INSERT INTO study_groups(name) VALUES (?)", name);
        throw new IllegalStateException("Lab rollback");
    }
}
