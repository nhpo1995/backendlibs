package vn.railway97.security;

import java.net.URI;
import java.security.Principal;
import java.util.List;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@RestController
@RequestMapping("/api")
public class AccountController {
    record CreateAccount(@NotBlank @Pattern(regexp = "[a-zA-Z0-9._-]{3,40}") String username,
                         @NotBlank @Size(min = 8, max = 64) @Pattern(regexp = "[\\x21-\\x7E]+") String password,
                         @NotBlank @Size(max = 80) String displayName) {}
    record Rename(@NotBlank @Size(max = 80) String displayName) {}
    record AccountView(long id, String username, String displayName) {
        static AccountView from(Account a) { return new AccountView(a.id, a.username, a.displayName); }
    }
    record TokenView(String headerName, String token) {}
    private final AccountService service;
    private final AccountRepository accounts;
    public AccountController(AccountService service, AccountRepository accounts) {
        this.service = service;
        this.accounts = accounts;
    }
    @GetMapping("/me")
    AccountView me(Principal principal) {
        return AccountView.from(accounts.findByUsername(principal.getName()).orElseThrow());
    }
    @GetMapping("/csrf")
    TokenView csrf(CsrfToken token) {
        return new TokenView(token.getHeaderName(), token.getToken());
    }
    @GetMapping("/accounts")
    List<AccountView> list() {
        return accounts.findAll().stream().map(AccountView::from).toList();
    }
    @GetMapping("/accounts/{id}")
    AccountView detail(@PathVariable long id) {
        return AccountView.from(accounts.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND)));
    }
    @PostMapping("/accounts")
    ResponseEntity<AccountView> create(@Valid @RequestBody CreateAccount form) {
        var created = service.create(form.username(), form.password(), form.displayName());
        return ResponseEntity.created(URI.create("/api/accounts/" + created.id)).body(AccountView.from(created));
    }
    @PostMapping("/lab/accounts/{id}/rename")
    void rename(@PathVariable long id, @RequestParam boolean atomic, @Valid @RequestBody Rename form) {
        if (atomic) service.renameAtomically(id, form.displayName());
        else service.renameWithoutServiceTransaction(id, form.displayName());
    }
}
