package org.dev.quizzle.account;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.redirectedUrl;
import java.net.URI;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Properties;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.dev.quizzle.config.*;
import org.dev.quizzle.security.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.support.StaticListableBeanFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.PlatformTransactionManager;

class GenericMailAcknowledgementTests {
	@Test void knownAndUnknownForgotAndResendAcknowledgeWithoutWaitingForBlockedSmtp() throws Exception {
		var sender=mock(JavaMailSender.class);
		when(sender.createMimeMessage()).thenAnswer(call->new MimeMessage(Session.getInstance(new Properties())));
		var started=new CountDownLatch(1);
		var release=new CountDownLatch(1);
		var committed=new AtomicBoolean();
		var sentBeforeCommit=new AtomicBoolean();
		doAnswer(call-> {
			if(!committed.get()) sentBeforeCommit.set(true);
			started.countDown();
			if(!release.await(10,TimeUnit.SECONDS)) throw new AssertionError("SMTP test gate was not released");
			return null;
		}).when(sender).send(any(MimeMessage.class));
		var auth=new AuthProperties("",1440,30,"","","from@example.test");
		var factory=new StaticListableBeanFactory(Map.of("sender",sender));
		var mailer=spy(new AccountMailer(factory.getBeanProvider(JavaMailSender.class),auth,
				new GameSessionProperties(URI.create("https://quiz.example.test"),10,5000,false),"smtp.example.test"));
		var store=mock(AccountStore.class);
		Account active=new Account(UUID.randomUUID().toString(),"active@example.test","hash",true,List.of(),1,false,5000);
		Account pending=new Account(UUID.randomUUID().toString(),"pending@example.test","hash",false,List.of(),1,false,5000);
		when(store.findByEmail(active.email())).thenReturn(Optional.of(active));
		when(store.findByEmail(pending.email())).thenReturn(Optional.of(pending));
		when(store.lock(active.id())).thenReturn(active);when(store.lock(pending.id())).thenReturn(pending);
		var service=mock(AccountService.class);
		var manager=mock(PlatformTransactionManager.class);
		doAnswer(call->{committed.set(true);return null;}).when(manager).commit(any());
		var tokens=new AccountTokens(mock(JdbcTemplate.class),store,service,mailer,auth,manager,new AccountSessions());
		var mvc=MockMvcBuilders.standaloneSetup(new AccountAuthController(service,tokens,new AuthRateLimiter(),auth,new AccountProperties(8))).build();
		try {
			assertTimeoutPreemptively(Duration.ofSeconds(3),()->mvc.perform(post("/forgot-password").param("email",active.email()))
					.andExpect(redirectedUrl("/forgot-password?sent")));
			assertTrue(started.await(3,TimeUnit.SECONDS),"SMTP delivery should be running behind its closed gate");
			assertEquals(1,release.getCount());
			for(var request:Map.of("/forgot-password","missing@example.test","/resend-verification",pending.email()).entrySet())
				assertTimeoutPreemptively(Duration.ofSeconds(3),()->mvc.perform(post(request.getKey()).param("email",request.getValue()))
						.andExpect(redirectedUrl(request.getKey()+"?sent")));
			assertTimeoutPreemptively(Duration.ofSeconds(3),()->mvc.perform(post("/resend-verification").param("email","missing@example.test"))
					.andExpect(redirectedUrl("/resend-verification?sent")));
			assertEquals(1,release.getCount(),"All generic acknowledgements must precede SMTP release");
			assertFalse(sentBeforeCommit.get());
			verify(service,times(4)).dummyWork();
			var order=inOrder(manager,mailer);
			order.verify(manager).commit(any());
			order.verify(mailer).sendLinkLater(eq(active),eq("/reset-password"),anyString());
			order.verify(manager).commit(any());
			order.verify(mailer).sendLinkLater(eq(pending),eq("/verify-email"),anyString());
		} finally {release.countDown();mailer.stop();}
	}
}
