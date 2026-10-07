package org.dev.quizzle.account;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.UUID;
import org.dev.quizzle.config.AuthProperties;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

@Service
public final class AccountTokens {
	private final JdbcTemplate jdbc;
	private final AccountStore store;
	private final AccountService service;
	private final AccountMailer mailer;
	private final AuthProperties properties;
	private final TransactionTemplate transactions;
	private final SecureRandom random = new SecureRandom();
	public AccountTokens(JdbcTemplate jdbc, AccountStore store, AccountService service, AccountMailer mailer,
			AuthProperties properties, org.springframework.transaction.PlatformTransactionManager manager) {
		this.jdbc = jdbc; this.store = store; this.service = service; this.mailer = mailer; this.properties = properties;
		transactions = new TransactionTemplate(manager);
	}
	public boolean verification(Account account) { return issue(account, true); }
	public void resend(String email) {
		service.dummyWork();
		store.findByEmail(email).filter(account -> account.status() == Account.Status.PENDING_VERIFICATION).ifPresent(this::verification);
	}
	public void forgot(String email) {
		service.dummyWork();
		store.findByEmail(email).filter(account -> account.status() == Account.Status.ACTIVE && account.passwordHash() != null)
				.ifPresent(account -> issue(account, false));
	}
	private boolean issue(Account account, boolean verification) {
		byte[] bytes = new byte[32]; random.nextBytes(bytes);
		String raw = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
		String table = table(verification);
		Boolean issued = transactions.execute(status -> {
			Account locked = store.lock(account.id());
			if (verification ? locked.status() != Account.Status.PENDING_VERIFICATION
					: locked.status() != Account.Status.ACTIVE || locked.passwordHash() == null) return false;
			jdbc.update("DELETE FROM " + table + " WHERE account_id=?", UUID.fromString(account.id()));
			jdbc.update("INSERT INTO " + table + "(id,account_id,token_digest,expires_at) VALUES(?,?,?,?)",
					UUID.randomUUID(), UUID.fromString(account.id()), digest(raw),
					Timestamp.from(Instant.now().plusSeconds((verification ? properties.verificationTtlMinutes() : properties.resetTtlMinutes()) * 60L)));
			return true;
		});
		return Boolean.TRUE.equals(issued) && mailer.sendLink(account, verification ? "/verify-email" : "/reset-password", raw);
	}
	public boolean verify(String raw) { return consume(raw, null, true); }
	public boolean reset(String raw, String password) {
		String hash = service.encodePassword(password);
		return consume(raw, hash, false);
	}
	private boolean consume(String raw, String hash, boolean verification) {
		if (raw == null || !raw.matches("[A-Za-z0-9_-]{43}")) return false;
		String table = table(verification);
		Account changed = transactions.execute(status -> {
			var ids = jdbc.queryForList("SELECT account_id FROM " + table + " WHERE token_digest=?", UUID.class, digest(raw));
			if (ids.isEmpty()) return null;
			Account account;
			try { account = store.lock(ids.getFirst().toString()); }
			catch (AccountRegistrationException exception) { return null; }
			if (verification ? account.status() != Account.Status.PENDING_VERIFICATION
					: account.status() != Account.Status.ACTIVE || account.passwordHash() == null) return null;
			int consumed = jdbc.update("UPDATE " + table + " SET used_at=now() WHERE token_digest=? AND used_at IS NULL AND expires_at>now()", digest(raw));
			if (consumed != 1) return null;
			if (verification) jdbc.update("UPDATE accounts SET status='ACTIVE',updated_at=now() WHERE id=?", ids.getFirst());
			else {
				store.update(account.withPasswordHash(hash));
				store.revokeCredentials(account.id());
				invalidate(account.id());
			}
			return account;
		});
		if (changed != null && !verification) mailer.passwordChanged(changed);
		return changed != null;
	}
	public void invalidate(String id) {
		for (String table : new String[] {table(true), table(false)})
			jdbc.update("DELETE FROM " + table + " WHERE account_id=?", UUID.fromString(id));
	}
	@Scheduled(fixedDelay = 3600000)
	public void cleanup() {
		for (String table : new String[] {table(true), table(false)})
			jdbc.update("DELETE FROM " + table + " WHERE id IN (SELECT id FROM " + table + " WHERE expires_at<now() OR used_at IS NOT NULL LIMIT 1000)");
	}
	private static String table(boolean verification) { return verification ? "email_verification_tokens" : "password_reset_tokens"; }
	public static String digest(String raw) {
		try { return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(raw.getBytes(StandardCharsets.UTF_8))); }
		catch (java.security.NoSuchAlgorithmException impossible) { throw new IllegalStateException(impossible); }
	}
}
