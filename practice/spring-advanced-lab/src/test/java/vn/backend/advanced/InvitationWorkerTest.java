package vn.backend.advanced;

import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.net.InetSocketAddress;
import java.time.Duration;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.Test;
import org.springframework.core.task.TaskRejectedException;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class InvitationWorkerTest {
    @Test
    void retryUsesSameKeyWhenResponseIsLostAfterRecording() throws IOException {
        var server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        var workers = Executors.newFixedThreadPool(2);
        var releaseFirstResponse = new CountDownLatch(1);
        var attempts = new AtomicInteger();
        Set<String> invitations = ConcurrentHashMap.newKeySet();
        server.setExecutor(workers);
        server.createContext("/invitations", exchange -> {
            try (exchange) {
                exchange.getRequestBody().readAllBytes();
                invitations.add(exchange.getRequestHeaders().getFirst("Idempotency-Key"));
                if (attempts.incrementAndGet() == 1) await(releaseFirstResponse);
                exchange.sendResponseHeaders(204, -1);
            } catch (IOException ignored) {
                // The first client may close the socket after its timeout.
            }
        });
        server.start();
        try {
            var factory = new SimpleClientHttpRequestFactory();
            factory.setConnectTimeout(Duration.ofSeconds(1));
            factory.setReadTimeout(Duration.ofMillis(500));
            var client = RestClient.builder()
                    .requestFactory(factory)
                    .baseUrl("http://127.0.0.1:" + server.getAddress().getPort())
                    .build();
            Runnable send = () -> client.post().uri("/invitations")
                    .header("Idempotency-Key", "invite-42")
                    .body("recipient=an")
                    .retrieve().toBodilessEntity();
            assertThatThrownBy(send::run).isInstanceOf(ResourceAccessException.class);
            assertThat(invitations).containsExactly("invite-42");
            releaseFirstResponse.countDown();
            send.run();
            assertThat(attempts.get()).isEqualTo(2);
            assertThat(invitations).containsExactly("invite-42");
        } finally {
            releaseFirstResponse.countDown();
            server.stop(0);
            workers.shutdownNow();
        }
    }

    @Test
    void boundedExecutorRejectsSeventhTaskWhileWorkersAndQueueAreFull() {
        var executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(2);
        executor.setMaxPoolSize(2);
        executor.setQueueCapacity(4);
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(5);
        executor.initialize();
        var release = new CountDownLatch(1);
        var active = new CountDownLatch(2);
        try {
            for (int i = 0; i < 2; i++) executor.execute(() -> {
                active.countDown();
                await(release);
            });
            await(active);
            for (int i = 0; i < 4; i++) executor.execute(() -> {});
            assertThat(executor.getThreadPoolExecutor().getQueue()).hasSize(4);
            assertThatThrownBy(() -> executor.execute(() -> {})).isInstanceOf(TaskRejectedException.class);
        } finally {
            release.countDown();
            executor.shutdown();
        }
    }

    private static void await(CountDownLatch signal) {
        try {
            if (!signal.await(5, TimeUnit.SECONDS)) throw new AssertionError("Lab checkpoint timed out");
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new AssertionError(e);
        }
    }
}
