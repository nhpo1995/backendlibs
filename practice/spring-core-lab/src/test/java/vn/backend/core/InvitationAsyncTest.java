package vn.backend.core;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;

import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import static java.util.concurrent.TimeUnit.SECONDS;
import static org.junit.jupiter.api.Assertions.*;

class InvitationAsyncTest {
    @Test
    void externalCallUsesTheNamedExecutorButSelfInvocationUsesTheCallerThread() throws Exception {
        try (var context = new AnnotationConfigApplicationContext(Config.class)) {
            var sender = context.getBean(Probe.class);
            String caller = Thread.currentThread().getName();

            assertTrue(sender.threadName().get(5, SECONDS).startsWith("invite-lab-"));
            assertEquals(caller, sender.threadNameFromSameBean().get(5, SECONDS));
        }
    }

    @Test
    void failureIsReportedByTheFutureReturnedToTheCaller() {
        try (var context = new AnnotationConfigApplicationContext(Config.class)) {
            var sender = context.getBean(Probe.class);
            var failure = new IllegalStateException("provider unavailable");

            var future = sender.sendWithFailure(failure);
            var thrown = assertThrows(ExecutionException.class, () -> future.get(5, SECONDS));
            assertSame(failure, thrown.getCause());
        }
    }

    @Test
    void coordinatorCallsTheAsyncProbeThroughItsProxy() throws Exception {
        try (var context = new AnnotationConfigApplicationContext(Config.class)) {
            var coordinator = context.getBean(Coordinator.class);

            assertTrue(coordinator.send().get(5, SECONDS).startsWith("invite-lab-"),
                    "The coordinator must call the async method on the injected probe");
        }
    }

    @Configuration(proxyBeanMethods = false)
    @EnableAsync
    static class Config {
        @Bean
        ThreadPoolTaskExecutor invitationExecutor() {
            var executor = new ThreadPoolTaskExecutor();
            executor.setCorePoolSize(1);
            executor.setMaxPoolSize(1);
            executor.setQueueCapacity(2);
            executor.setThreadNamePrefix("invite-lab-");
            return executor;
        }

        @Bean
        Coordinator coordinator(Probe probe) {
            return Boolean.getBoolean("async.starter")
                    ? new AsyncCoordinatorStarter(probe) : probe::threadName;
        }

        @Bean
        Probe probe() {
            return new Probe();
        }
    }

    interface Coordinator {
        CompletableFuture<String> send();
    }

    static class Probe {
        @Async("invitationExecutor")
        public CompletableFuture<String> threadName() {
            return CompletableFuture.completedFuture(Thread.currentThread().getName());
        }

        public CompletableFuture<String> threadNameFromSameBean() {
            return this.threadName();
        }

        @Async("invitationExecutor")
        public CompletableFuture<String> sendWithFailure(RuntimeException failure) {
            throw failure;
        }
    }
}
