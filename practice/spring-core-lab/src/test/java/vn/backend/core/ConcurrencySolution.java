package vn.backend.core;

import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Future;
import java.util.concurrent.atomic.AtomicInteger;

import vn.backend.core.InvitationConcurrencyTest.Capacity;
import vn.backend.core.InvitationConcurrencyTest.CapacitySnapshot;
import vn.backend.core.InvitationConcurrencyTest.DeliveryCounter;
import vn.backend.core.InvitationConcurrencyTest.DeliveryQueue;

final class ConcurrencySolution {
    static final class Counter implements DeliveryCounter {
        private final AtomicInteger total = new AtomicInteger();

        @Override
        public void recordDelivery() {
            total.incrementAndGet();
        }

        @Override
        public int total() {
            return total.get();
        }
    }

    static final class Seats implements Capacity {
        private final int limit;
        private final Set<String> recipients = new HashSet<>();

        Seats(int limit) {
            this.limit = limit;
        }

        @Override
        public synchronized boolean reserve(String recipient) {
            return recipients.size() < limit && recipients.add(recipient);
        }

        @Override
        public synchronized boolean release(String recipient) {
            return recipients.remove(recipient);
        }

        @Override
        public synchronized CapacitySnapshot snapshot() {
            int reserved = recipients.size();
            return new CapacitySnapshot(reserved, limit - reserved);
        }
    }

    static final class Queue implements DeliveryQueue {
        private final ExecutorService workers;

        Queue(ExecutorService workers) {
            this.workers = workers;
        }

        @Override
        public Future<String> submit(Callable<String> send, Runnable cleanup) {
            return workers.submit(() -> {
                try {
                    return send.call();
                } finally {
                    cleanup.run();
                }
            });
        }
    }

    private ConcurrencySolution() {}
}
