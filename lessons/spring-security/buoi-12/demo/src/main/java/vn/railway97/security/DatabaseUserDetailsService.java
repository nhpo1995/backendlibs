package vn.railway97.security;

import java.util.List;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DatabaseUserDetailsService implements UserDetailsService {
    private final AccountRepository accounts;
    public DatabaseUserDetailsService(AccountRepository accounts) {
        this.accounts = accounts;
    }
    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String username) {
        Account account = accounts.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy tài khoản"));
        return new User(account.username, account.passwordHash, List.of());
    }
}
