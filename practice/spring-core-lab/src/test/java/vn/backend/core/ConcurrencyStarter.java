package vn.backend.core;

import java.util.concurrent.Callable;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Future;

import vn.backend.core.InvitationConcurrencyTest.Capacity;
import vn.backend.core.InvitationConcurrencyTest.CapacitySnapshot;
import vn.backend.core.InvitationConcurrencyTest.DeliveryCounter;
import vn.backend.core.InvitationConcurrencyTest.DeliveryQueue;

final class ConcurrencyStarter {
    static final class Counter implements DeliveryCounter {
        @Override
        public void recordDelivery() {
            // TODO C3: record exactly one delivered invitation.
        }

        @Override
        public int total() {
            return 0; // TODO C3: read the shared total.
        }
    }

    static final class Seats implements Capacity {
        private final int limit;

        Seats(int limit) {
            this.limit = limit;
        }

        @Override
        public boolean reserve(String recipient) {
            return false; // TODO C4: reserve one place if allowed.
        }

        @Override
        public boolean release(String recipient) {
            return false; // TODO C4: release only an existing reservation.
        }

        @Override
        public CapacitySnapshot snapshot() {
            return new CapacitySnapshot(0, limit); // TODO C4: return a consistent view.
        }
    }

    static final class Queue implements DeliveryQueue {
        private final ExecutorService workers;

        Queue(ExecutorService workers) {
            this.workers = workers;
        }

        @Override
        public Future<String> submit(Callable<String> send, Runnable cleanup) {
            // TODO C5: return the eventual receipt or failure and always clean up a started task.
            throw new UnsupportedOperationException("C5");
        }
    }

    private ConcurrencyStarter() {}
}
