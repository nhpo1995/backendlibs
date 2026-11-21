package vn.railway89.directory;

import jakarta.persistence.*;

@Entity
@Table(name = "app_users")
class DirectoryUser {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @Column(nullable = false, length = 40)
    String username;

    @Column(name = "first_name", nullable = false, length = 80)
    String firstName;

    @Column(name = "last_name", nullable = false, length = 80)
    String lastName;

    @Column(nullable = false)
    Integer age;

    protected DirectoryUser() {}

    void update(String username, String firstName, String lastName, int age) {
        this.username = username;
        this.firstName = firstName;
        this.lastName = lastName;
        this.age = age;
    }
}
