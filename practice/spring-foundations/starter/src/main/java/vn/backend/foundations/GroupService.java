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

    // TODO Web/Data: giữ contract ở tests, tự viết SQL bind parameter.
    public Group create(String name) {
        throw new UnsupportedOperationException("TODO: create group, trim name and return generated identity");
    }

    public Group update(long id, String name) {
        throw new UnsupportedOperationException("TODO: update existing group or report 404");
    }

    public void delete(long id) {
        throw new UnsupportedOperationException("TODO: delete existing group or report 404");
    }

    // TODO Transaction: lỗi dưới đây phải rollback INSERT khi gọi qua bean.
    public void createThenFail(String name) {
        db.update("INSERT INTO study_groups(name) VALUES (?)", name);
        throw new IllegalStateException("Lab rollback");
    }
}
