"""Create the initial TODO project once. Never overwrite students' work."""
from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parents[1]
PRACTICE = ROOT / "practice/spring-foundations"


def main():
    target = PRACTICE / "starter"
    if target.exists():
        raise SystemExit("Starter already exists. Refusing to overwrite learner edits.")
    shutil.copytree(PRACTICE / "solution", target, ignore=shutil.ignore_patterns("target", ".idea", "*.iml"))
    java = target / "src/main/java/vn/backend/foundations"
    greeting = java / "GreetingService.java"
    text = greeting.read_text(encoding="utf-8")
    text = text.replace('@Qualifier("vietnamese")', '@Qualifier("english") /* TODO Core: chọn bean tiếng Việt */')
    text = text.replace('return greeting.greet(name.trim());', 'return greeting.greet(name); /* TODO Core: chuẩn hóa khoảng trắng */')
    greeting.write_text(text, encoding="utf-8")
    service = java / "GroupService.java"
    text = service.read_text(encoding="utf-8")
    start = text.index('    @Transactional\n    public Group create(')
    end = text.index('    @Transactional\n    public void createThenFail', start)
    text = text[:start] + '''    // TODO Web/Data: giữ contract ở tests, tự viết SQL bind parameter.
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
''' + text[end:].replace('    @Transactional\n    public void createThenFail', '    public void createThenFail', 1)
    service.write_text(text, encoding="utf-8")
    controller = java / "GroupController.java"
    text = controller.read_text(encoding="utf-8").replace('record GroupRequest(@NotBlank @Size(max = 80) String name)', '/* TODO Validation: tên bắt buộc, tối đa 80 ký tự. */\n    record GroupRequest(String name)')
    controller.write_text(text, encoding="utf-8")
    security = java / "SecurityConfig.java"
    text = security.read_text(encoding="utf-8").replace('.hasRole("ADMIN")', '.authenticated() /* TODO Security: quyền ghi chỉ dành ADMIN */')
    security.write_text(text, encoding="utf-8")
    print("Created TODO starter; tests are byte-identical to solution tests.")


if __name__ == "__main__":
    main()
