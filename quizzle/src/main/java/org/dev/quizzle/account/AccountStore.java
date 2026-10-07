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

	public void update(Account account) {
		int changed = jdbc.update("""
				UPDATE accounts SET email=?,normalized_email=?,password_hash=?,status=?,roles=?::text[],
				    allow_late_join=?,auto_advance_delay_ms=?,updated_at=now() WHERE id=?
				""", account.email(), normalizeEmail(account.email()), account.passwordHash(),
				account.status().name(), account.roles().toArray(String[]::new), account.allowLateJoin(),
				account.autoAdvanceDelayMs(), UUID.fromString(account.id()));
		if (changed != 1) throw new IllegalArgumentException("Account not found");
	}

	public void delete(String id) {
		jdbc.update("DELETE FROM accounts WHERE id = ?", UUID.fromString(id));
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
