package vn.railway89.directory;

import jakarta.persistence.*;

@Entity
@Table(name = "user_groups")
class Membership {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private DirectoryUser user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "group_id", nullable = false)
    private DirectoryGroup group;

    protected Membership() {}

    Membership(DirectoryUser user, DirectoryGroup group) {
        this.user = user;
        this.group = group;
    }
}
