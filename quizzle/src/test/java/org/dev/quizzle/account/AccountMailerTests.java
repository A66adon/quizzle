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
		try {assertFalse(mailer.sendLink(account(),"/verify-email","private-token"));}
		finally{mailer.stop();}
	}
}
