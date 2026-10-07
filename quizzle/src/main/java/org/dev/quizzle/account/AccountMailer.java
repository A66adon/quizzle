package org.dev.quizzle.account;

import org.dev.quizzle.config.AuthProperties;
import org.dev.quizzle.config.GameSessionProperties;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;

@Component
public final class AccountMailer {
	private final JavaMailSender sender;
	private final String from;
	private final String baseUrl;
	private final java.util.concurrent.ThreadPoolExecutor background=new java.util.concurrent.ThreadPoolExecutor(
			1,2,30,java.util.concurrent.TimeUnit.SECONDS,new java.util.concurrent.ArrayBlockingQueue<>(100),
			runnable -> {Thread thread=new Thread(runnable,"account-mail");thread.setDaemon(true);return thread;},
			new java.util.concurrent.ThreadPoolExecutor.AbortPolicy());
	public AccountMailer(ObjectProvider<JavaMailSender> sender, AuthProperties properties,
			GameSessionProperties sessions, @Value("${spring.mail.host:}") String host) {
		if (host.isBlank() || properties.mailFrom() == null || !properties.mailFrom().matches("^[^\\s@<>]+@[^\\s@<>]+\\.[^\\s@<>]+$"))
			throw new IllegalArgumentException("SMTP_HOST and a valid SMTP_FROM are required for account email");
		this.sender = sender.getIfAvailable();
		if (this.sender == null) throw new IllegalArgumentException("SMTP mail sender is not configured");
		from = properties.mailFrom();
		baseUrl = sessions.publicBaseUrl().toString().replaceAll("/+$", "");
		if (!baseUrl.matches("https?://[^\\s?#]+")) throw new IllegalArgumentException("PUBLIC_BASE_URL must be an HTTP(S) URL");
	}
	public boolean sendLink(Account account, String path, String token) {
		String link = baseUrl + path + "?token=" + token;
		return send(account.email(), "Quizzle account action",
				"Open this link to complete your Quizzle account action:\n" + link + "\nIf you did not request this, ignore this message.",
				"<p>Complete your Quizzle account action:</p><p><a href=\"" + escape(link)
						+ "\">Continue</a></p><p>If you did not request this, ignore this message.</p>");
	}
	public void passwordChanged(Account account) {
		enqueue(()->send(account.email(), "Quizzle password changed", "Your Quizzle password was changed. If this was not you, contact your operator.",
				"<p>Your Quizzle password was changed. If this was not you, contact your operator.</p>"));
	}
	public boolean sendLinkLater(Account account,String path,String token) {
		return enqueue(()->sendLink(account,path,token));
	}
	private boolean enqueue(Runnable work) {
		try {background.execute(work);return true;}
		catch(java.util.concurrent.RejectedExecutionException full) {return false;}
	}
	@jakarta.annotation.PreDestroy
	public void stop() {background.shutdown();}
	private boolean send(String to, String subject, String text, String html) {
		try {
			var message = sender.createMimeMessage();
			var helper = new MimeMessageHelper(message, true, "UTF-8");
			helper.setFrom(from); helper.setTo(to); helper.setSubject(subject); helper.setText(text, html);
			sender.send(message);
			return true;
		} catch (MailException | jakarta.mail.MessagingException exception) {
			// Deliberately do not log exceptions: SMTP diagnostics may contain recipients or credentials.
			return false;
		}
	}
	static String escape(String value) {
		return value.replace("&", "&amp;").replace("\"", "&quot;").replace("<", "&lt;").replace(">", "&gt;").replace("'", "&#39;");
	}
}
