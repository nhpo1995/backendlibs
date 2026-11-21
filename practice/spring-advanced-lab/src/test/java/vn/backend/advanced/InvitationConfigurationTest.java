package vn.backend.advanced;

import java.util.concurrent.atomic.AtomicInteger;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.junit.jupiter.api.Test;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.AutoConfigurations;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.EnableAspectJAutoProxy;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class InvitationConfigurationTest {
    interface InvitationChannel {
        String send();
    }

    @AutoConfiguration
    @ConditionalOnProperty(prefix = "invites", name = "enabled", havingValue = "true")
    static class InvitationAutoConfiguration {
        @Bean
        @ConditionalOnMissingBean(InvitationChannel.class)
        InvitationChannel defaultChannel() {
            return () -> "default";
        }
    }

    private final ApplicationContextRunner runner = new ApplicationContextRunner()
            .withConfiguration(AutoConfigurations.of(InvitationAutoConfiguration.class));

    @Test
    void propertyEnablesDefaultOnlyWhenUserBeanIsMissing() {
        runner.run(context -> assertThat(context).doesNotHaveBean(InvitationChannel.class));
        runner.withPropertyValues("invites.enabled=false")
                .run(context -> assertThat(context).doesNotHaveBean(InvitationChannel.class));
        var enabled = runner.withPropertyValues("invites.enabled=true");
        enabled.run(context -> assertThat(context.getBean(InvitationChannel.class).send()).isEqualTo("default"));
        enabled.withBean("customChannel", InvitationChannel.class, () -> () -> "custom")
                .run(context -> {
                    assertThat(context).hasSingleBean(InvitationChannel.class);
                    assertThat(context.getBean(InvitationChannel.class).send()).isEqualTo("custom");
                    assertThat(context).doesNotHaveBean("defaultChannel");
                });
    }

    static class InvitationService {
        public String invite(boolean reject) {
            if (reject) throw new IllegalArgumentException("invalid recipient");
            return "sent";
        }

        public String inviteInternally() {
            return this.invite(false);
        }
    }

    @Aspect
    static class Observation {
        private final AtomicInteger finishedCalls = new AtomicInteger();

        @Around("bean(invitationService) && execution(public * invite(..))")
        public Object observe(ProceedingJoinPoint call) throws Throwable {
            try {
                return call.proceed();
            } finally {
                finishedCalls.incrementAndGet();
            }
        }

        int finishedCalls() {
            return finishedCalls.get();
        }
    }

    @Configuration(proxyBeanMethods = false)
    @EnableAspectJAutoProxy(proxyTargetClass = true)
    static class Proxies {
        @Bean InvitationService invitationService() { return new InvitationService(); }
        @Bean Observation observation() { return new Observation(); }
    }

    @Test
    void aspectObservesExternalCallsAndKeepsOriginalException() {
        try (var context = new AnnotationConfigApplicationContext(Proxies.class)) {
            var service = context.getBean(InvitationService.class);
            var observation = context.getBean(Observation.class);
            assertThat(service.invite(false)).isEqualTo("sent");
            assertThatThrownBy(() -> service.invite(true))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage("invalid recipient");
            assertThat(service.inviteInternally()).isEqualTo("sent");
            assertThat(new InvitationService().invite(false)).isEqualTo("sent");
            assertThat(observation.finishedCalls()).isEqualTo(2);
        }
    }
}
