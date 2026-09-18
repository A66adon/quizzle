package org.dev.quizzle.account;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Pattern;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import org.dev.quizzle.config.AccountProperties;
import org.dev.quizzle.config.GameSessionProperties;

/**
 * Registration and authentication for {@link Account}s. Accounts are identified by a unique
 * username (stored in the {@code email} field of the account record for storage compatibility).
 */
@Service
public final class AccountService {

	private static final Pattern USERNAME_PATTERN = Pattern.compile("^[A-Za-z0-9._-]{3,40}$");

	private final AccountStore accountStore;
	private final AccountProperties properties;
	private final GameSessionProperties sessionProperties;
	private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

	public AccountService(AccountStore accountStore, AccountProperties properties, GameSessionProperties sessionProperties) {
		this.accountStore = accountStore;
		this.properties = properties;
		this.sessionProperties = sessionProperties;
	}

	public Account register(String rawUsername, String rawPassword) {
		String username = AccountStore.normalizeEmail(rawUsername);
		validateUsername(username);
		validatePassword(rawPassword);

		if (accountStore.findByEmail(username).isPresent()) {
			throw new AccountRegistrationException("This username is already taken");
		}

		Account account = new Account(
				UUID.randomUUID().toString(),
				username,
				passwordEncoder.encode(rawPassword),
				true,
				List.of(),
				Instant.now().toEpochMilli(),
				sessionProperties.allowJoinAfterStart(),
				sessionProperties.autoAdvanceDelayMs());
		return accountStore.create(account);
	}

	public Optional<Account> authenticate(String rawUsername, String rawPassword) {
		String username = AccountStore.normalizeEmail(rawUsername);
		if (rawPassword == null || rawPassword.isEmpty()) {
			return Optional.empty();
		}
		return accountStore.findByEmail(username)
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

	private void validateUsername(String username) {
		if (!USERNAME_PATTERN.matcher(username).matches()) {
			throw new AccountRegistrationException(
					"Usernames must be 3-40 characters of letters, digits, dots, dashes, or underscores");
		}
	}

	private void validatePassword(String password) {
		if (password == null || password.length() < properties.minPasswordLength()) {
			throw new AccountRegistrationException(
					"Password must be at least " + properties.minPasswordLength() + " characters");
		}
	}
}
