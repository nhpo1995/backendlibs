package vn.railway97.security;

import jakarta.persistence.*;

@Entity
@Table(name = "accounts")
public class Account {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;
    @Column(nullable = false, unique = true, length = 40)
    String username;
    @Column(nullable = false, length = 60)
    String passwordHash;
    @Column(nullable = false, length = 80)
    String displayName;

    protected Account() {}
    Account(String username, String passwordHash, String displayName) {
        this.username = username;
        this.passwordHash = passwordHash;
        this.displayName = displayName;
    }
}
