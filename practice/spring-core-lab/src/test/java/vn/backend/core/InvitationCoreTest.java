package vn.backend.core;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import java.lang.annotation.Retention;
import java.lang.annotation.Target;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.NoSuchBeanDefinitionException;
import org.springframework.beans.factory.NoUniqueBeanDefinitionException;
import org.springframework.beans.factory.UnsatisfiedDependencyException;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Scope;
import org.springframework.core.annotation.AnnotatedElementUtils;
import org.springframework.stereotype.Component;

import static java.lang.annotation.ElementType.PARAMETER;
import static java.lang.annotation.ElementType.METHOD;
import static java.lang.annotation.ElementType.TYPE;
import static java.lang.annotation.RetentionPolicy.RUNTIME;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class InvitationCoreTest {
    interface Channel {
        String send(String recipient);
    }

    static class InvitationService {
        private final Channel channel;

        InvitationService(Channel channel) {
            this.channel = channel;
        }

        String invite(String recipient) {
            return channel.send(recipient);
        }
    }

    @Target({TYPE, METHOD, PARAMETER})
    @Retention(RUNTIME)
    @Qualifier
    @interface EmailChannel {}

    @Configuration(proxyBeanMethods = false)
    static class Channels {
        @Bean
        @EmailChannel
        Channel email() {
            return recipient -> "email:" + recipient;
        }

        @Bean
        Channel audit() {
            return recipient -> "audit:" + recipient;
        }
    }

    @Configuration(proxyBeanMethods = false)
    static class Invitations {
        @Bean
        InvitationService invitationService(@EmailChannel Channel selected) {
            return new InvitationService(selected);
        }
    }

    @Test
    void constructorInjectionWorksWithoutSpring() {
        var sent = new ArrayList<String>();
        var service = new InvitationService(recipient -> {
            sent.add(recipient);
            return "fake:" + recipient;
        });

        assertThat(service.invite("an")).isEqualTo("fake:an");
        assertThat(sent).containsExactly("an");
    }

    @Test
    void containerRejectsMissingAndAmbiguousDependencies() {
        try (var missing = new AnnotationConfigApplicationContext()) {
            missing.register(InvitationService.class);
            assertThatThrownBy(missing::refresh)
                    .isInstanceOf(UnsatisfiedDependencyException.class)
                    .hasRootCauseInstanceOf(NoSuchBeanDefinitionException.class);
        }
        try (var single = new AnnotationConfigApplicationContext()) {
            single.registerBean(Channel.class, () -> recipient -> "email:" + recipient);
            single.register(InvitationService.class);
            single.refresh();
            assertThat(single.getBean(InvitationService.class).invite("an")).isEqualTo("email:an");
        }
        try (var ambiguous = new AnnotationConfigApplicationContext()) {
            ambiguous.register(Channels.class, InvitationService.class);
            assertThatThrownBy(ambiguous::refresh)
                    .isInstanceOf(UnsatisfiedDependencyException.class)
                    .hasRootCauseInstanceOf(NoUniqueBeanDefinitionException.class);
        }
    }

    @Test
    void qualifierSelectsEmailWithoutRemovingOtherBeans() {
        try (var context = new AnnotationConfigApplicationContext(Invitations.class, Channels.class)) {
            assertThat(context.getBean(InvitationService.class).invite("an")).isEqualTo("email:an");
            assertThat(context.getBeansOfType(Channel.class)).containsOnlyKeys("email", "audit");
        }
    }

    @Target(TYPE)
    @Retention(RUNTIME)
    @Component
    @interface InvitationComponent {}

    @InvitationComponent
    static class AnnotatedChannel {}

    @Test
    void metadataIsDiscoverableButDoesNotRegisterAnObjectOnItsOwn() {
        assertThat(AnnotatedElementUtils.hasAnnotation(AnnotatedChannel.class, Component.class)).isTrue();
        try (var context = new AnnotationConfigApplicationContext()) {
            context.refresh();
            new AnnotatedChannel();
            assertThat(context.getBeansOfType(AnnotatedChannel.class)).isEmpty();
        }
        try (var context = new AnnotationConfigApplicationContext(AnnotatedChannel.class)) {
            assertThat(context.getBean(AnnotatedChannel.class)).isNotNull();
        }
    }

    record Events(List<String> values) {}

    static class Probe {
        private final List<String> events;

        Probe(List<String> events) {
            this.events = events;
            events.add("construct");
        }

        @PostConstruct void init() { events.add("init"); }
        @PreDestroy void destroy() { events.add("destroy"); }
    }

    @Configuration(proxyBeanMethods = false)
    static class Lifecycle {
        @Bean Probe singletonProbe(Events events) { return new Probe(events.values()); }
        @Bean @Scope("prototype") Probe freshProbe(Events events) { return new Probe(events.values()); }
    }

    @Test
    void singletonAndPrototypeHaveDifferentOwnership() {
        var events = new ArrayList<String>();
        try (var context = new AnnotationConfigApplicationContext()) {
            context.registerBean(Events.class, () -> new Events(events));
            context.register(Lifecycle.class);
            context.refresh();
            assertThat(context.getBean("singletonProbe")).isSameAs(context.getBean("singletonProbe"));
            assertThat(context.getBean("freshProbe")).isNotSameAs(context.getBean("freshProbe"));
            assertThat(events).containsExactly("construct", "init", "construct", "init", "construct", "init");
        }
        assertThat(events).endsWith("destroy");
        assertThat(events.stream().filter("destroy"::equals).count()).isEqualTo(1);
    }

    static class SharedRecipient {
        private String recipient;

        String invite(String value, Runnable checkpoint) {
            recipient = value;
            checkpoint.run();
            return recipient;
        }
    }

    @Test
    void sharedFieldMixesRecipientsButMethodArgumentsDoNot() throws Exception {
        var shared = new SharedRecipient();
        var written = new CountDownLatch(1);
        var resume = new CountDownLatch(1);
        var executor = Executors.newSingleThreadExecutor();
        try {
            var first = executor.submit(() -> shared.invite("an", () -> {
                written.countDown();
                try {
                    if (!resume.await(5, TimeUnit.SECONDS)) throw new AssertionError("Checkpoint timed out");
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    throw new AssertionError(e);
                }
            }));
            assertThat(written.await(5, TimeUnit.SECONDS)).isTrue();
            assertThat(shared.invite("binh", () -> {})).isEqualTo("binh");
            resume.countDown();
            assertThat(first.get(5, TimeUnit.SECONDS)).isEqualTo("binh");

            var service = new InvitationService(recipient -> "email:" + recipient);
            var an = executor.submit(() -> service.invite("an"));
            assertThat(service.invite("binh")).isEqualTo("email:binh");
            assertThat(an.get(5, TimeUnit.SECONDS)).isEqualTo("email:an");
        } finally {
            resume.countDown();
            executor.shutdownNow();
        }
    }
}
