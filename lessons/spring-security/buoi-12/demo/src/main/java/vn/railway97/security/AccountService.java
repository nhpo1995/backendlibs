package vn.railway97.security;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@Service
public class AccountService {
    private final AccountRepository accounts;
    private final PasswordEncoder encoder;
    public AccountService(AccountRepository accounts, PasswordEncoder encoder) {
        this.accounts = accounts;
        this.encoder = encoder;
    }
    @Transactional
    public Account create(String username, String password, String displayName) {
        return accounts.saveAndFlush(new Account(username, encoder.encode(password), displayName));
    }
    @Transactional
    public void renameAtomically(long id, String displayName) {
        saveNameThenFail(id, displayName);
    }
    public void renameWithoutServiceTransaction(long id, String displayName) {
        saveNameThenFail(id, displayName);
    }
    private void saveNameThenFail(long id, String displayName) {
        var account = accounts.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        account.displayName = displayName;
        accounts.saveAndFlush(account);
        throw new IllegalStateException("Lỗi mô phỏng sau khi lưu tên");
    }
}
