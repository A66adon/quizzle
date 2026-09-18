package org.dev.quizzle.account;

import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Pattern;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import org.dev.quizzle.config.AccountProperties;
import org.dev.quizzle.config.GameSessionProperties;

/**
 * Registration and authentication for {@link Account}s. The allowed-domain check and the
 * {@code verified} flag are intentionally simple placeholders: a later phase can replace
 * "verified defaults to true" with a real email-verification step without touching callers.
 */
@Service
public final class AccountService {

	private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^@\\s]+@([^@\\s]+)$");

	private final AccountStore accountStore;
	private final AccountProperties properties;
	private final GameSessionProperties sessionProperties;
	private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

	public AccountService(AccountStore accountStore, AccountProperties properties, GameSessionProperties sessionProperties) {
		this.accountStore = accountStore;
		this.properties = properties;
		this.sessionProperties = sessionProperties;
	}

	public Account register(String rawEmail, String rawPassword) {
		String email = AccountStore.normalizeEmail(rawEmail);
		validateEmail(email);
		validatePassword(rawPassword);

		if (accountStore.findByEmail(email).isPresent()) {
			throw new AccountRegistrationException("An account with this email already exists");
		}

		Account account = new Account(
				UUID.randomUUID().toString(),
				email,
				passwordEncoder.encode(rawPassword),
				true,
				List.of(),
				Instant.now().toEpochMilli(),
				sessionProperties.allowJoinAfterStart(),
				sessionProperties.autoAdvanceDelayMs());
		return accountStore.create(account);
	}

	public Optional<Account> authenticate(String rawEmail, String rawPassword) {
		String email = AccountStore.normalizeEmail(rawEmail);
		if (rawPassword == null || rawPassword.isEmpty()) {
			return Optional.empty();
		}
		return accountStore.findByEmail(email)
				.filter(account -> passwordEncoder.matches(rawPassword, account.passwordHash()));
	}

	public void changePassword(String accountId, String currentPassword, String newPassword) {
		Account account = accountStore.findById(accountId)
				.orElseThrow(() -> new AccountRegistrationException("Account not found"));
		if (!passwordEncoder.matches(currentPassword == null ? "" : currentPassword, account.passwordHash())) {
			throw new AccountRegistrationException("The current password is incorrect");
		}
		validatePassword(newPassword);
		accountStore.update(account.withPasswordHash(passwordEncoder.encode(newPassword)));
	}

	/** Updates this account's own game defaults (late-join, auto-advance delay). */
	public void updateGameSettings(String accountId, boolean allowLateJoin, long autoAdvanceDelayMs) {
		if (autoAdvanceDelayMs < 0 || autoAdvanceDelayMs > 120_000) {
			throw new AccountRegistrationException("Auto-advance delay must be between 0 and 120000 ms");
		}
		Account account = accountStore.findById(accountId)
				.orElseThrow(() -> new AccountRegistrationException("Account not found"));
		accountStore.update(account.withGameSettings(allowLateJoin, autoAdvanceDelayMs));
	}

	public void deleteAccount(String accountId) {
		accountStore.delete(accountId);
	}

	public Optional<Account> findById(String accountId) {
		return accountStore.findById(accountId);
	}

	private void validateEmail(String email) {
		var matcher = EMAIL_PATTERN.matcher(email);
		if (!matcher.matches()) {
			throw new AccountRegistrationException("Enter a valid email address");
		}
		String domain = matcher.group(1).toLowerCase(Locale.ROOT);
		if (!domain.equals(properties.allowedDomain())) {
			throw new AccountRegistrationException(
					"Only @" + properties.allowedDomain() + " email addresses may register");
		}
	}

	private void validatePassword(String password) {
		if (password == null || password.length() < properties.minPasswordLength()) {
			throw new AccountRegistrationException(
					"Password must be at least " + properties.minPasswordLength() + " characters");
		}
	}
}
