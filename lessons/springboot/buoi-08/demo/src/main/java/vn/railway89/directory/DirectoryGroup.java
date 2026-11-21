package vn.railway89.directory;

import jakarta.persistence.*;

@Entity
@Table(name = "app_groups")
class DirectoryGroup {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @Column(nullable = false, length = 80)
    String name;

    protected DirectoryGroup() {}
}
