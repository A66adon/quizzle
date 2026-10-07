package org.dev.quizzle.account;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.dev.quizzle.config.AccountProperties;
import org.dev.quizzle.config.AuthProperties;
import org.dev.quizzle.config.GameSessionProperties;
import org.dev.quizzle.security.AccountPrincipal;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

@Service
public class AccountService {
	private final AccountStore store;
	private final AccountProperties properties;
	private final AuthProperties auth;
	private final GameSessionProperties sessions;
	private final TransactionTemplate transactions;
	private final TransactionTemplate deletionTransactions;
	private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
	private final String dummy = encoder.encode(UUID.randomUUID().toString());
	public AccountService(AccountStore store, AccountProperties properties, AuthProperties auth,
			GameSessionProperties sessions, org.springframework.transaction.PlatformTransactionManager manager) {
		this.store = store; this.properties = properties; this.auth = auth; this.sessions = sessions;
		this.transactions = new TransactionTemplate(manager);
		this.deletionTransactions = new TransactionTemplate(manager);
		this.deletionTransactions.setPropagationBehavior(org.springframework.transaction.TransactionDefinition.PROPAGATION_REQUIRES_NEW);
	}
	public Account register(String email, String password) {
		validateEmail(email); validatePassword(password);
		Account account = new Account(UUID.randomUUID().toString(), email.strip(), encoder.encode(password),
				false, List.of(), Instant.now().toEpochMilli(), sessions.allowJoinAfterStart(), sessions.autoAdvanceDelayMs());
		try { return transactions.execute(status -> { store.lockEmail(email); return store.create(account); }); }
		catch (DuplicateKeyException exception) { throw new AccountRegistrationException("Registration unavailable. Try signing in or resending verification."); }
	}
	public Optional<AccountPrincipal> authenticatePrincipal(String email, String password) {
		if (password == null || password.getBytes(StandardCharsets.UTF_8).length > 72) {
			encoder.matches("", dummy); return Optional.empty();
		}
		return transactions.execute(status -> {
			var found = store.findByEmail(email);
			if (found.isEmpty()) { encoder.matches(password, dummy); return Optional.empty(); }
			Account account;
			try {account=store.lock(found.get().id());}
			catch(AccountRegistrationException deleted) {encoder.matches(password,dummy);return Optional.empty();}
			boolean valid = encoder.matches(password, account.passwordHash() == null ? dummy : account.passwordHash());
			return valid && account.status() == Account.Status.ACTIVE && account.passwordHash() != null
					? Optional.of(new AccountPrincipal(account.id(), store.credentialVersion(account.id()), 0)) : Optional.empty();
		});
	}
	public Optional<Account> authenticate(String email, String password) {
		return authenticatePrincipal(email, password).flatMap(principal -> store.findById(principal.accountId()));
	}
	public long changePassword(String id, String currentPassword, String newPassword) {
		validatePassword(newPassword);
		return transactions.execute(status -> {
			Account account = store.lock(id);
			requirePassword(account, currentPassword);
			long version=store.updatePassword(id,encoder.encode(newPassword));
			store.invalidateTokens(id);
			return version;
		});
	}
	public void requirePassword(Account account, String password) {
		if (password == null || password.getBytes(StandardCharsets.UTF_8).length > 72
				|| account.passwordHash() == null || !encoder.matches(password, account.passwordHash()))
			throw new AccountRegistrationException("The current password is incorrect");
	}
	public void updateGameSettings(String id, boolean allowLateJoin, long delay) {
		if (delay < 0 || delay > 120000) throw new AccountRegistrationException("Auto-advance delay must be between 0 and 120000 ms");
		transactions.executeWithoutResult(status -> {
			store.lock(id);
			store.updateGameSettings(id,allowLateJoin,delay);
		});
	}
	public void deleteAccount(String id,String password,long providerAuthenticatedAt,Runnable afterCommitCleanup) {
		deletionTransactions.executeWithoutResult(status -> {
			Account account=store.lock(id);
			if(account.passwordHash()!=null) requirePassword(account,password);
			else if(providerAuthenticatedAt<=0 || Instant.now().getEpochSecond()-providerAuthenticatedAt>300
					|| providerAuthenticatedAt>Instant.now().getEpochSecond()+60)
				throw new AccountRegistrationException("Recent Google reauthentication is required");
			store.delete(id);
		});
		afterCommitCleanup.run();
	}
	public Optional<Account> findById(String id) { return store.findById(id); }
	public void validateEmail(String email) {
		String normalized = AccountStore.normalizeEmail(email);
		if (normalized.length() > 254 || !normalized.matches("^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?\\.[a-z]{2,}$")
				|| normalized.startsWith(".") || normalized.contains("..") || normalized.contains(".@")
				|| normalized.indexOf('@')>64
				|| !normalized.substring(normalized.indexOf('@')+1).matches("[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+")
				|| (!auth.allowedEmailDomain().isEmpty() && !normalized.substring(normalized.lastIndexOf('@') + 1).equals(auth.allowedEmailDomain())))
			throw new AccountRegistrationException("Enter a valid email address" + (auth.allowedEmailDomain().isEmpty() ? "" : " in the allowed domain"));
	}
	public void validatePassword(String password) {
		if (password == null || password.length() < properties.minPasswordLength())
			throw new AccountRegistrationException("Password must be at least " + properties.minPasswordLength() + " characters");
		if (password.getBytes(StandardCharsets.UTF_8).length > 72)
			throw new AccountRegistrationException("Password must not exceed 72 UTF-8 bytes");
	}
	public String encodePassword(String password) { validatePassword(password); return encoder.encode(password); }
	public void dummyWork() { encoder.matches("unrecognized-account", dummy); }
}
