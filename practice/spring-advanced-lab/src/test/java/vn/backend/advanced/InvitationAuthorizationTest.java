package vn.backend.advanced;

import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.context.SecurityContextHolder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class InvitationAuthorizationTest {
    static class GroupPolicy {
        final AtomicInteger checks = new AtomicInteger();

        void requireCanInvite(long groupId) {
            checks.incrementAndGet();
            var caller = SecurityContextHolder.getContext().getAuthentication();
            boolean admin = caller.getAuthorities().stream()
                    .anyMatch(authority -> authority.getAuthority().equals("ROLE_ADMIN"));
            if (groupId != 42L || (!admin && !caller.getName().equals("owner-backend"))) {
                throw new AccessDeniedException("Caller cannot invite to this group");
            }
        }
    }

    static class InvitationService {
        private final GroupPolicy policy;
        private final AtomicInteger writes;

        InvitationService(GroupPolicy policy, AtomicInteger writes) {
            this.policy = policy;
            this.writes = writes;
        }

        @PreAuthorize("hasAuthority('groups:invite') or hasRole('ADMIN')")
        public void invite(long groupId) {
            policy.requireCanInvite(groupId);
            writes.incrementAndGet();
        }
    }

    @Configuration(proxyBeanMethods = false)
    @EnableMethodSecurity
    static class Config {
        @Bean GroupPolicy groupPolicy() { return new GroupPolicy(); }
        @Bean AtomicInteger writes() { return new AtomicInteger(); }
        @Bean InvitationService invitationService(GroupPolicy policy, AtomicInteger writes) {
            return new InvitationService(policy, writes);
        }
    }

    @ParameterizedTest
    @CsvSource({
        "reader, groups:read, 0, 0",
        "owner-ops, groups:invite, 1, 0",
        "owner-backend, groups:invite, 1, 1",
        "admin, ROLE_ADMIN, 1, 1"
    })
    void checksActionBeforeEnteringResourcePolicy(String name, String authority, int expectedChecks, int expectedWrites) {
        var caller = UsernamePasswordAuthenticationToken.authenticated(
                name, null, AuthorityUtils.createAuthorityList(authority));
        var securityContext = SecurityContextHolder.createEmptyContext();
        securityContext.setAuthentication(caller);
        SecurityContextHolder.setContext(securityContext);
        try (var context = new AnnotationConfigApplicationContext(Config.class)) {
            var service = context.getBean(InvitationService.class);
            if (expectedWrites == 0) {
                assertThatThrownBy(() -> service.invite(42L)).isInstanceOf(AccessDeniedException.class);
            } else {
                service.invite(42L);
            }
            assertThat(context.getBean(GroupPolicy.class).checks.get()).isEqualTo(expectedChecks);
            assertThat(context.getBean(AtomicInteger.class).get()).isEqualTo(expectedWrites);
        } finally {
            SecurityContextHolder.clearContext();
        }
    }
}
