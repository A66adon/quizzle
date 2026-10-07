package org.dev.quizzle.account;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import java.util.*;
import java.net.URI;
import org.dev.quizzle.config.*;
import org.junit.jupiter.api.Test;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.MailSendException;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;

class AccountMailerTests {
	private final JavaMailSender sender=mock(JavaMailSender.class);
	private AccountMailer mailer() {
		var factory=new org.springframework.beans.factory.support.StaticListableBeanFactory(Map.of("sender",sender));
		return new AccountMailer(factory.getBeanProvider(JavaMailSender.class),
				new AuthProperties("",1440,30,"","","from@example.test"),
				new GameSessionProperties(URI.create("https://quiz.example.test"),10,5000,false),"smtp.example.test");
	}
	private Account account() {return new Account(UUID.randomUUID().toString(),"private@example.test","hash",false,List.of(),1,false,5000);}
	@Test void sendsMultipartTextAndEscapedHtmlWithoutThirdPartyAssets() throws Exception {
		var message=new MimeMessage(Session.getInstance(new Properties()));
		when(sender.createMimeMessage()).thenReturn(message);
		var mailer=mailer();
		try {
			assertTrue(mailer.sendLink(account(),"/verify-email","safe-token"));
			verify(sender).send(message);
			assertEquals("from@example.test",message.getFrom()[0].toString());
			var bytes=new java.io.ByteArrayOutputStream();message.writeTo(bytes);
			String rendered=bytes.toString(java.nio.charset.StandardCharsets.UTF_8);
			assertTrue(rendered.contains("text/plain"));assertTrue(rendered.contains("text/html"));
			assertFalse(rendered.contains("<script"));assertFalse(rendered.contains("<img"));
			assertEquals("&lt;&amp;&quot;&#39;&gt;",AccountMailer.escape("<&\"'>"));
		} finally {mailer.stop();}
	}
	@Test void sendFailureReturnsActionableFailureWithoutThrowingPrivateDiagnostics() {
		when(sender.createMimeMessage()).thenReturn(new MimeMessage(Session.getInstance(new Properties())));
		doThrow(new MailSendException("private recipient and SMTP credentials")).when(sender).send(any(MimeMessage.class));
		var mailer=mailer();
		var logger=(ch.qos.logback.classic.Logger)org.slf4j.LoggerFactory.getLogger(AccountMailer.class);
		var events=new ch.qos.logback.core.read.ListAppender<ch.qos.logback.classic.spi.ILoggingEvent>();
		events.start();logger.addAppender(events);
		try {
			assertFalse(mailer.sendLink(account(),"/verify-email","private-token"));
			assertEquals(List.of("ACCOUNT_MAIL_DELIVERY_FAILED"),events.list.stream().map(event->event.getFormattedMessage()).toList());
			assertTrue(events.list.stream().allMatch(event->event.getThrowableProxy()==null));
		} finally {mailer.stop();logger.detachAppender(events);events.stop();}
	}
	@Test void configuredStartTlsCannotDowngradeAndImplicitTlsRemainsOptional() throws Exception {
		var properties=new Properties();
		try(var input=AccountMailerTests.class.getResourceAsStream("/application.properties")) {
			assertNotNull(input);
			properties.load(input);
		}
		assertEquals("${SMTP_STARTTLS:true}",properties.getProperty("spring.mail.properties.mail.smtp.starttls.enable"));
		assertEquals(properties.getProperty("spring.mail.properties.mail.smtp.starttls.enable"),
				properties.getProperty("spring.mail.properties.mail.smtp.starttls.required"));
		assertEquals("${SMTP_SSL:false}",properties.getProperty("spring.mail.properties.mail.smtp.ssl.enable"));
		assertEquals("true",properties.getProperty("spring.mail.properties.mail.smtp.ssl.checkserveridentity"));
		assertEquals("${SMTP_PORT:587}",properties.getProperty("spring.mail.port"));
		for(String timeout:List.of("connectiontimeout","timeout","writetimeout")) {
			int milliseconds=Integer.parseInt(properties.getProperty("spring.mail.properties.mail.smtp."+timeout));
			assertTrue(milliseconds>0 && milliseconds<=10000);
		}
	}
	@Test void aFullFiniteMailQueueFailsClosedWithOnlyASanitizedOperatorEvent() throws Exception {
		when(sender.createMimeMessage()).thenAnswer(call->new MimeMessage(Session.getInstance(new Properties())));
		var firstStarted=new java.util.concurrent.CountDownLatch(1);
		var bothStarted=new java.util.concurrent.CountDownLatch(2);
		var release=new java.util.concurrent.CountDownLatch(1);
		var finished=new java.util.concurrent.CountDownLatch(102);
		doAnswer(call->{
			firstStarted.countDown();bothStarted.countDown();
			if(!release.await(10,java.util.concurrent.TimeUnit.SECONDS)) throw new AssertionError("SMTP test gate was not released");
			finished.countDown();return null;
		}).when(sender).send(any(MimeMessage.class));
		var mailer=mailer();
		var logger=(ch.qos.logback.classic.Logger)org.slf4j.LoggerFactory.getLogger(AccountMailer.class);
		var events=new ch.qos.logback.core.read.ListAppender<ch.qos.logback.classic.spi.ILoggingEvent>();
		events.start();logger.addAppender(events);
		try {
			assertTrue(mailer.sendLinkLater(account(),"/verify-email","private-token"));
			assertTrue(firstStarted.await(3,java.util.concurrent.TimeUnit.SECONDS));
			for(int i=0;i<101;i++) assertTrue(mailer.sendLinkLater(account(),"/verify-email","private-token"));
			assertTrue(bothStarted.await(3,java.util.concurrent.TimeUnit.SECONDS));
			assertFalse(mailer.sendLinkLater(account(),"/verify-email","private-token"));
			assertEquals(List.of("ACCOUNT_MAIL_QUEUE_REJECTED"),events.list.stream().map(event->event.getFormattedMessage()).toList());
			assertTrue(events.list.stream().allMatch(event->event.getThrowableProxy()==null));
		} finally {
			release.countDown();mailer.stop();
			boolean drained=finished.await(5,java.util.concurrent.TimeUnit.SECONDS);
			logger.detachAppender(events);events.stop();
			assertTrue(drained);
		}
	}
}
