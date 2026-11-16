package vn.railway89.lab;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@Entity
@Table(name = "lab_members")
class Member {
    @Id Long id;
    @Column(name = "first_name") String firstName;
    int age;
}

interface MemberRepository extends JpaRepository<Member, Long> {
    List<Member> findByFirstNameStartingWithIgnoreCaseOrderById(String prefix);
    List<Member> findByAgeBetweenOrderById(int min, int max);
    List<Member> findByAgeOrderById(int age);
    List<Member> findByFirstNameIgnoreCaseOrderById(String name);

    @Query("select m from Member m where m.age = :age order by m.id")
    List<Member> sameAge(@Param("age") int age);

    @Query(value = "select * from lab_members where lower(first_name) = lower(:name) order by id", nativeQuery = true)
    List<Member> sameName(@Param("name") String name);

    @Query("select m from Member m where lower(m.firstName) like :pattern escape '!' order by m.id")
    List<Member> findJpql(@Param("pattern") String pattern);

    @Query(value = "select * from lab_members where lower(first_name) like :pattern escape '!' order by id", nativeQuery = true)
    List<Member> findSql(@Param("pattern") String pattern);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("update Member m set m.firstName = :name where lower(m.firstName) like :pattern escape '!'")
    int rename(@Param("pattern") String pattern, @Param("name") String name);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("delete from Member m where m.age < :age")
    int purge(@Param("age") int age);
}

final class Like {
    private Like() {}
    static String literal(String input) {
        return input.toLowerCase(Locale.ROOT).replace("!", "!!").replace("%", "!%").replace("_", "!_");
    }
}

@Service
class MemberWrites {
    private final MemberRepository repo;
    MemberWrites(MemberRepository repo) { this.repo = repo; }

    @Transactional
    public int rename(String prefix, String newName) {
        return repo.rename(Like.literal(prefix.trim()) + "%", newName.trim());
    }

    @Transactional
    public int purge(int beforeAge) {
        return repo.purge(beforeAge);
    }
}

@RestController
@RequestMapping("/api/members")
class Members {
    private final MemberRepository repo;
    private final MemberWrites writes;
    Members(MemberRepository repo, MemberWrites writes) { this.repo = repo; this.writes = writes; }

    record View(Long id, String firstName, int age) {}
    record Rename(@NotBlank @Size(max = 60) String prefix, @NotBlank @Size(max = 60) String newName) {}

    @GetMapping("/find")
    List<View> find(@RequestParam String prefix, @RequestParam(defaultValue = "derived") String mode) {
        String pattern = Like.literal(prefix) + "%";
        return views(switch (mode) {
            case "derived" -> repo.findByFirstNameStartingWithIgnoreCaseOrderById(prefix);
            case "jpql" -> repo.findJpql(pattern);
            case "native" -> repo.findSql(pattern);
            default -> throw LabError.badInput("mode must be derived, jpql or native.");
        });
    }

    @GetMapping("/between")
    List<View> between(@RequestParam int min, @RequestParam int max) {
        if (min > max) throw LabError.badInput("min must be <= max.");
        return views(repo.findByAgeBetweenOrderById(min, max));
    }

    @GetMapping("/by-age")
    List<View> byAge(@RequestParam int age) { return views(repo.findByAgeOrderById(age)); }
    @GetMapping("/jpql-by-age")
    List<View> jpqlByAge(@RequestParam int age) { return views(repo.sameAge(age)); }
    @GetMapping("/by-name")
    List<View> byName(@RequestParam String name) { return views(repo.findByFirstNameIgnoreCaseOrderById(name)); }
    @GetMapping("/native-by-name")
    List<View> nativeByName(@RequestParam String name) { return views(repo.sameName(name)); }

    @PatchMapping(value = "/rename", consumes = "application/json")
    Map<String, Integer> rename(@Valid @RequestBody Rename input) {
        return Map.of("affected", writes.rename(input.prefix, input.newName));
    }

    @DeleteMapping("/purge")
    Map<String, Integer> purge(@RequestParam int beforeAge) {
        if (beforeAge < 0 || beforeAge > 150) throw LabError.badInput("beforeAge must be in [0, 150].");
        return Map.of("affected", writes.purge(beforeAge));
    }

    private static List<View> views(List<Member> rows) {
        return rows.stream().map(m -> new View(m.id, m.firstName, m.age)).toList();
    }
}
