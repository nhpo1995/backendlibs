package vn.backend.core;

import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.Callable;
import java.util.concurrent.CancellationException;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.CyclicBarrier;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeoutException;
import java.util.concurrent.atomic.AtomicInteger;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import static java.util.Collections.synchronizedSet;
import static java.util.concurrent.TimeUnit.MILLISECONDS;
import static java.util.concurrent.TimeUnit.SECONDS;
import static org.junit.jupiter.api.Assertions.*;

class InvitationConcurrencyTest {
    interface DeliveryCounter {
        void recordDelivery();
        int total();
    }

    interface Capacity {
        boolean reserve(String recipient);
        boolean release(String recipient);
        CapacitySnapshot snapshot();
    }

    record CapacitySnapshot(int reserved, int available) {}

    interface DeliveryQueue {
        Future<String> submit(Callable<String> send, Runnable cleanup);
    }

    private static final int WAIT_SECONDS = 5;
    private final ExecutorService workers = Executors.newFixedThreadPool(2);
    private final boolean starter = Boolean.getBoolean("concurrency.starter");

    @AfterEach
    void stopWorkers() throws InterruptedException {
        workers.shutdownNow();
        assertTrue(workers.awaitTermination(WAIT_SECONDS, SECONDS), "Workers did not exit");
    }

    @Test
    void volatileStillLosesAnUpdateWhenBothWorkersReadBeforeEitherWrites() throws Exception {
        var counter = new SplitVolatileCounter();
        var bothRead = new CyclicBarrier(2);

        Callable<Void> increment = () -> {
            int previous = counter.total;
            bothRead.await(WAIT_SECONDS, SECONDS);
            counter.total = previous + 1;
            return null;
        };

        var first = workers.submit(increment);
        var second = workers.submit(increment);
        result(first);
        result(second);

        assertEquals(1, counter.total, "Both jobs read 0 and both write 1");
    }

    @Test
    void countsEveryDeliveryFromBothWorkers() throws Exception {
        DeliveryCounter counter = starter ? new ConcurrencyStarter.Counter() : new ConcurrencySolution.Counter();
        assertEquals(0, counter.total());
        counter.recordDelivery();
        assertEquals(1, counter.total());

        int expected = 1;
        for (int batchSize : new int[] { 17, 10_000 }) {
            var bothReady = new CyclicBarrier(2);
            Callable<Void> deliverBatch = () -> {
                bothReady.await(WAIT_SECONDS, SECONDS);
                for (int i = 0; i < batchSize; i++) {
                    counter.recordDelivery();
                }
                return null;
            };

            var first = workers.submit(deliverBatch);
            var second = workers.submit(deliverBatch);
            result(first);
            result(second);

            expected += 2 * batchSize;
            assertEquals(expected, counter.total());
        }
    }

    @Test
    void individuallySynchronizedOperationsCanStillOverbook() throws Exception {
        var recipients = synchronizedSet(new HashSet<String>());
        var bothChecked = new CyclicBarrier(2);
        var first = workers.submit(() -> reserveWithSplitCheck(recipients, bothChecked, "an"));
        var second = workers.submit(() -> reserveWithSplitCheck(recipients, bothChecked, "binh"));

        assertTrue(result(first));
        assertTrue(result(second));
        assertEquals(2, recipients.size(), "Both workers saw the same last slot");
    }

    private static boolean reserveWithSplitCheck(Set<String> recipients, CyclicBarrier bothChecked,
                                                 String recipient) throws Exception {
        boolean hasRoom = recipients.size() < 1;
        bothChecked.await(WAIT_SECONDS, SECONDS);
        return hasRoom && recipients.add(recipient);
    }

    @Test
    void onlyOneRecipientGetsTheLastSlot() throws Exception {
        Capacity capacity = starter ? new ConcurrencyStarter.Seats(1) : new ConcurrencySolution.Seats(1);
        var bothReady = new CyclicBarrier(2);

        var first = workers.submit(() -> {
            bothReady.await(WAIT_SECONDS, SECONDS);
            return capacity.reserve("an");
        });
        var second = workers.submit(() -> {
            bothReady.await(WAIT_SECONDS, SECONDS);
            return capacity.reserve("binh");
        });

        assertNotEquals(result(first), result(second), "Exactly one reservation should succeed");
        assertEquals(new CapacitySnapshot(1, 0), capacity.snapshot());
    }

    @Test
    void duplicateReserveAndReleaseDoNotChangeQuota() {
        Capacity capacity = starter ? new ConcurrencyStarter.Seats(2) : new ConcurrencySolution.Seats(2);

        assertTrue(capacity.reserve("an"));
        assertFalse(capacity.reserve("an"));
        assertFalse(capacity.release("binh"));
        assertEquals(new CapacitySnapshot(1, 1), capacity.snapshot());

        assertTrue(capacity.release("an"));
        assertFalse(capacity.release("an"));
        assertEquals(new CapacitySnapshot(0, 2), capacity.snapshot());
    }

    @Test
    void getMakesTheWorkersWriteVisibleToTheCaller() throws Exception {
        var receipt = new String[1];
        var delivery = workers.submit(() -> {
            receipt[0] = "receipt-42";
        });

        result(delivery);

        assertEquals("receipt-42", receipt[0]);
    }

    @Test
    void returnsTheDeliveryReceiptAndCleansUpOnSuccess() throws Exception {
        var cleanupCount = new AtomicInteger();
        var queue = queue();
        String caller = Thread.currentThread().getName();
        var delivery = queue.submit(() -> {
            assertNotEquals(caller, Thread.currentThread().getName());
            return "receipt-42";
        }, cleanupCount::incrementAndGet);

        assertEquals("receipt-42", result(delivery));
        assertEquals(1, cleanupCount.get());
    }

    @Test
    void exposesTheOriginalDeliveryFailureAndCleansUp() {
        var cleanupCount = new AtomicInteger();
        var failure = new IllegalStateException("provider unavailable");
        var delivery = queue().submit(() -> { throw failure; }, cleanupCount::incrementAndGet);

        var thrown = assertThrows(ExecutionException.class, () -> result(delivery));
        assertSame(failure, thrown.getCause());
        assertEquals(1, cleanupCount.get());
    }

    @Test
    void waitingCanTimeOutBeforeCancellationInterruptsAStartedTask() throws Exception {
        var entered = new CountDownLatch(1);
        var permitSend = new CountDownLatch(1);
        var cleaned = new CountDownLatch(1);
        var effects = new AtomicInteger();
        var interrupted = new CountDownLatch(1);
        var cleanupCount = new AtomicInteger();
        var delivery = queue().submit(() -> {
            entered.countDown();
            try {
                permitSend.await();
                effects.incrementAndGet();
                return "receipt-42";
            } catch (InterruptedException ex) {
                interrupted.countDown();
                throw ex;
            }
        }, () -> {
            cleanupCount.incrementAndGet();
            cleaned.countDown();
        });

        try {
            assertTrue(entered.await(WAIT_SECONDS, SECONDS));
            assertThrows(TimeoutException.class, () -> delivery.get(25, MILLISECONDS));
            assertFalse(delivery.isDone(), "A wait timeout does not cancel the job");

            assertTrue(delivery.cancel(true));
            assertThrows(CancellationException.class, () -> result(delivery));
            assertTrue(interrupted.await(WAIT_SECONDS, SECONDS), "The running task must see the interrupt");
            assertTrue(cleaned.await(WAIT_SECONDS, SECONDS), "Wait separately for task cleanup");
            workers.shutdown();
            assertTrue(workers.awaitTermination(WAIT_SECONDS, SECONDS), "Wait for all cleanup to finish");
            assertEquals(1, cleanupCount.get());
            assertEquals(0, effects.get());
        } finally {
            permitSend.countDown();
        }
    }

    private DeliveryQueue queue() {
        return starter ? new ConcurrencyStarter.Queue(workers) : new ConcurrencySolution.Queue(workers);
    }

    private static <T> T result(Future<T> task) throws Exception {
        return task.get(WAIT_SECONDS, SECONDS);
    }

    private static class SplitVolatileCounter {
        private volatile int total;
    }
}
