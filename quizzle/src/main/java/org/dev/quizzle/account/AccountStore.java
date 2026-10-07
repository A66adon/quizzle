package org.dev.quizzle.account;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.Arrays;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public final class AccountStore {
	private final JdbcTemplate jdbc;

	public AccountStore(JdbcTemplate jdbc) {
		this.jdbc = jdbc;
	}

	public Optional<Account> findByEmail(String email) {
		return jdbc.query("SELECT * FROM accounts WHERE normalized_email = ?",
				this::map, normalizeEmail(email)).stream().findFirst();
	}

	public Optional<Account> findById(String id) {
		return jdbc.query("SELECT * FROM accounts WHERE id = ?", this::map, UUID.fromString(id))
				.stream().findFirst();
	}

	public Account create(Account account) {
		jdbc.update("""
				INSERT INTO accounts(id,email,normalized_email,password_hash,status,roles,
				    allow_late_join,auto_advance_delay_ms,created_at)
				VALUES (?,?,?,?,?,?::text[],?,?,?)
				""", UUID.fromString(account.id()), account.email(), normalizeEmail(account.email()),
				account.passwordHash(), account.status().name(), account.roles().toArray(String[]::new),
				account.allowLateJoin(), account.autoAdvanceDelayMs(),
				Timestamp.from(Instant.ofEpochMilli(account.createdAtEpochMs())));
		return account;
	}

	public void updateGameSettings(String id, boolean allowLateJoin, long autoAdvanceDelayMs) {
		int changed = jdbc.update("""
				UPDATE accounts SET allow_late_join=?,auto_advance_delay_ms=?,updated_at=now() WHERE id=?
				""", allowLateJoin, autoAdvanceDelayMs, UUID.fromString(id));
		if (changed != 1) throw new AccountRegistrationException("Account not found");
	}

	public long updatePassword(String id, String passwordHash) {
		return jdbc.queryForObject("""
				UPDATE accounts SET password_hash=?,credential_version=credential_version+1,updated_at=now()
				WHERE id=? RETURNING credential_version
				""", Long.class, passwordHash, UUID.fromString(id));
	}

	public void activatePending(String id) {
		int changed=jdbc.update("""
				UPDATE accounts SET status='ACTIVE',updated_at=now()
				WHERE id=? AND status='PENDING_VERIFICATION'
				""",UUID.fromString(id));
		if(changed!=1) throw new AccountRegistrationException("Account cannot be activated");
	}

	public void delete(String id) {
		jdbc.update("DELETE FROM accounts WHERE id = ?", UUID.fromString(id));
	}

	public Account lock(String id) {
		return jdbc.query("SELECT * FROM accounts WHERE id=? FOR UPDATE", this::map, UUID.fromString(id))
				.stream().findFirst().orElseThrow(() -> new AccountRegistrationException("Account not found"));
	}

	public void lockEmail(String email) {
		jdbc.queryForObject("SELECT pg_advisory_xact_lock(hashtextextended(?,0))", Object.class, "email:" + normalizeEmail(email));
	}

	public long credentialVersion(String id) {
		return jdbc.queryForObject("SELECT credential_version FROM accounts WHERE id=?", Long.class, UUID.fromString(id));
	}

	public boolean isCurrentActive(String id, long version) {
		return Boolean.TRUE.equals(jdbc.queryForObject(
				"SELECT EXISTS(SELECT 1 FROM accounts WHERE id=? AND status='ACTIVE' AND credential_version=?)",
				Boolean.class, UUID.fromString(id), version));
	}

	public void revokeCredentials(String id) {
		jdbc.update("UPDATE accounts SET credential_version=credential_version+1,updated_at=now() WHERE id=?", UUID.fromString(id));
	}

	public void invalidateTokens(String id) {
		jdbc.update("DELETE FROM email_verification_tokens WHERE account_id=?",UUID.fromString(id));
		jdbc.update("DELETE FROM password_reset_tokens WHERE account_id=?",UUID.fromString(id));
	}

	public static String normalizeEmail(String email) {
		return email == null ? "" : email.strip().toLowerCase(Locale.ROOT);
	}

	private Account map(ResultSet row, int index) throws SQLException {
		Account.Status status = Account.Status.valueOf(row.getString("status"));
		return new Account(row.getString("id"), row.getString("email"), row.getString("password_hash"),
				status == Account.Status.ACTIVE,
				Arrays.asList((String[]) row.getArray("roles").getArray()),
				row.getTimestamp("created_at").toInstant().toEpochMilli(),
				row.getBoolean("allow_late_join"), row.getLong("auto_advance_delay_ms"), status);
	}
}
