package vn.backend.core;

import java.util.concurrent.CompletableFuture;

import vn.backend.core.InvitationAsyncTest.Coordinator;
import vn.backend.core.InvitationAsyncTest.Probe;

final class AsyncCoordinatorStarter implements Coordinator {
    private final Probe probe;

    AsyncCoordinatorStarter(Probe probe) {
        this.probe = probe;
    }

    @Override
    public CompletableFuture<String> send() {
        // TODO: route the call through the injected proxy to the async method.
        return probe.threadNameFromSameBean();
    }
}
