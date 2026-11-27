package vn.backend.advanced;

import java.util.concurrent.atomic.AtomicInteger;
import java.util.HashSet;
import javax.sql.DataSource;
import org.junit.jupiter.api.Test;
import org.springframework.cache.concurrent.ConcurrentMapCache;
import org.springframework.cache.transaction.TransactionAwareCacheDecorator;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.jdbc.datasource.embedded.EmbeddedDatabase;
import org.springframework.jdbc.datasource.embedded.EmbeddedDatabaseBuilder;
import org.springframework.jdbc.datasource.embedded.EmbeddedDatabaseType;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.UnexpectedRollbackException;
import org.springframework.transaction.annotation.EnableTransactionManagement;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.transaction.support.TransactionTemplate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class InvitationTransactionTest {
    record InvitationCreated(long id) {}

    static class Listeners {
        final AtomicInteger normal = new AtomicInteger();
        final AtomicInteger afterCommit = new AtomicInteger();

        @EventListener
        public void normal(InvitationCreated event) { normal.incrementAndGet(); }

        @TransactionalEventListener
        public void afterCommit(InvitationCreated event) { afterCommit.incrementAndGet(); }
    }

    static class Writer {
        private final JdbcTemplate db;
        private final ApplicationEventPublisher publisher;

        Writer(JdbcTemplate db, ApplicationEventPublisher publisher) {
            this.db = db;
            this.publisher = publisher;
        }

        @Transactional
        public void write(long id, boolean abort) {
            db.update("insert into invitation(id) values (?)", id);
            publisher.publishEvent(new InvitationCreated(id));
            if (abort) throw new IllegalStateException("aborted");
        }
    }

    static class Outer {
        private final Writer writer;

        Outer(Writer writer) { this.writer = writer; }

        @Transactional
        public void swallowInnerFailure() {
            try {
                writer.write(9, true);
            } catch (IllegalStateException ignored) {
                // The shared transaction is still marked rollback-only.
            }
        }
    }

    @Configuration(proxyBeanMethods = false)
    @EnableTransactionManagement
    static class Config {
        @Bean(destroyMethod = "shutdown")
        EmbeddedDatabase database() {
            return new EmbeddedDatabaseBuilder().setType(EmbeddedDatabaseType.H2).generateUniqueName(true).build();
        }

        @Bean PlatformTransactionManager transactionManager(DataSource db) {
            return new DataSourceTransactionManager(db);
        }

        @Bean JdbcTemplate jdbc(DataSource db) {
            var template = new JdbcTemplate(db);
            template.execute("create table invitation(id bigint primary key)");
            template.execute("create table outbox(id bigint primary key, sent boolean not null)");
            return template;
        }

        @Bean Writer writer(JdbcTemplate jdbc, ApplicationEventPublisher publisher) {
            return new Writer(jdbc, publisher);
        }

        @Bean Outer outer(Writer writer) { return new Outer(writer); }
        @Bean Listeners listeners() { return new Listeners(); }
    }

    @Test
    void sqlRollbackAndListenerPhaseAreObservable() {
        try (var context = new AnnotationConfigApplicationContext(Config.class)) {
            var writer = context.getBean(Writer.class);
            var listeners = context.getBean(Listeners.class);
            var db = context.getBean(JdbcTemplate.class);

            writer.write(1, false);
            assertThatThrownBy(() -> writer.write(2, true)).isInstanceOf(IllegalStateException.class);
            context.publishEvent(new InvitationCreated(3));

            assertThat(db.queryForList("select id from invitation", Long.class)).containsExactly(1L);
            assertThat(listeners.normal.get()).isEqualTo(3);
            assertThat(listeners.afterCommit.get()).isEqualTo(1);
        }
    }

    @Test
    void outerCannotCommitSharedTransactionAfterInnerFailure() {
        try (var context = new AnnotationConfigApplicationContext(Config.class)) {
            assertThatThrownBy(() -> context.getBean(Outer.class).swallowInnerFailure())
                    .isInstanceOf(UnexpectedRollbackException.class);
            var db = context.getBean(JdbcTemplate.class);
            assertThat(db.queryForList("select id from invitation", Long.class)).isEmpty();
        }
    }

    @Test
    void transactionAwareEvictionRunsOnlyAfterCommit() {
        try (var context = new AnnotationConfigApplicationContext(Config.class)) {
            var cache = new TransactionAwareCacheDecorator(new ConcurrentMapCache("members"));
            var transactions = new TransactionTemplate(context.getBean(PlatformTransactionManager.class));
            cache.put(42L, "old");
            transactions.executeWithoutResult(status -> {
                cache.evict(42L);
                assertThat(cache.get(42L, String.class)).isEqualTo("old");
                status.setRollbackOnly();
            });
            assertThat(cache.get(42L, String.class)).isEqualTo("old");
            transactions.executeWithoutResult(status -> cache.evict(42L));
            assertThat(cache.get(42L)).isNull();
        }
    }

    @Test
    void outboxSurvivesWorkerReplacementAndSupportsRedelivery() {
        try (var context = new AnnotationConfigApplicationContext(Config.class)) {
            var db = context.getBean(JdbcTemplate.class);
            var transactions = new TransactionTemplate(context.getBean(PlatformTransactionManager.class));
            transactions.executeWithoutResult(status -> {
                db.update("insert into invitation(id) values (?)", 42L);
                db.update("insert into outbox(id, sent) values (?, false)", 42L);
            });
            transactions.executeWithoutResult(status -> {
                db.update("insert into invitation(id) values (?)", 43L);
                db.update("insert into outbox(id, sent) values (?, false)", 43L);
                status.setRollbackOnly();
            });

            var effects = new HashSet<Long>();
            long first = db.queryForObject("select id from outbox where not sent", Long.class);
            assertThat(effects.add(first)).isTrue();
            // The first worker stops before acknowledging delivery.
            long next = db.queryForObject("select id from outbox where not sent", Long.class);
            assertThat(effects.add(next)).isFalse();
            assertThat(db.update("update outbox set sent = true where id = ? and not sent", next)).isEqualTo(1);
            assertThat(db.queryForList("select id from invitation", Long.class)).containsExactly(42L);
            assertThat(db.queryForList("select id from outbox where not sent", Long.class)).isEmpty();
            assertThat(effects).containsExactly(42L);
        }
    }
}
