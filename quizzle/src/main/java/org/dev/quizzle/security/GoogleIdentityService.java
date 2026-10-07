package org.dev.quizzle.security;

import java.util.List;
import java.util.UUID;
import java.time.Instant;
import org.dev.quizzle.account.*;
import org.dev.quizzle.config.GameSessionProperties;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;

@Service
public final class GoogleIdentityService {
	private final AccountStore store;
	private final AccountService accounts;
	private final JdbcTemplate jdbc;
	private final GameSessionProperties settings;
	private final TransactionTemplate transactions;
	public GoogleIdentityService(AccountStore store, AccountService accounts, JdbcTemplate jdbc,
			GameSessionProperties settings, org.springframework.transaction.PlatformTransactionManager manager) {
		this.store=store; this.accounts=accounts; this.jdbc=jdbc; this.settings=settings;
		transactions=new TransactionTemplate(manager);
	}
	public AccountPrincipal resolve(OidcUser user) {
		String email = user.getEmail();
		if (!Boolean.TRUE.equals(user.getEmailVerified()) || user.getSubject() == null || user.getSubject().isBlank())
			throw rejected();
		try { accounts.validateEmail(email); }
		catch (AccountRegistrationException exception) { throw rejected(); }
		try {return transactions.execute(status -> {
			String normalized = AccountStore.normalizeEmail(email);
			jdbc.queryForObject("SELECT pg_advisory_xact_lock(hashtextextended(?,0))", Object.class, "google:" + user.getSubject());
			store.lockEmail(normalized);
			var identities = jdbc.queryForList("SELECT account_id,provider_email FROM external_identities WHERE provider='google' AND provider_subject=?",
					user.getSubject());
			Account account;
			if (!identities.isEmpty()) {
				var identity=identities.getFirst();
				if (!normalized.equals(AccountStore.normalizeEmail((String)identity.get("provider_email")))) throw rejected();
				account=store.lock(identity.get("account_id").toString());
				if (!normalized.equals(AccountStore.normalizeEmail(account.email()))) throw rejected();
			} else {
				var existing = store.findByEmail(normalized);
				account = existing.isPresent() ? store.lock(existing.get().id())
						: store.create(new Account(UUID.randomUUID().toString(),email.strip(),null,true,List.of(),
								System.currentTimeMillis(),settings.allowJoinAfterStart(),settings.autoAdvanceDelayMs()));
				if (account.status()==Account.Status.DISABLED) throw rejected();
				jdbc.update("INSERT INTO external_identities(id,account_id,provider,provider_subject,provider_email) VALUES(?,?,'google',?,?)",
						UUID.randomUUID(),UUID.fromString(account.id()),user.getSubject(),email.strip());
			}
			if(account.status()==Account.Status.DISABLED) throw rejected();
			if(account.status()==Account.Status.PENDING_VERIFICATION) {
				jdbc.update("UPDATE accounts SET status='ACTIVE',updated_at=now() WHERE id=?",UUID.fromString(account.id()));
				jdbc.update("DELETE FROM email_verification_tokens WHERE account_id=?",UUID.fromString(account.id()));
			}
			Instant authenticationTime=user.getIdToken().getAuthenticatedAt();
			return new AccountPrincipal(account.id(),store.credentialVersion(account.id()),
					authenticationTime==null ? 0 : authenticationTime.getEpochSecond());
		});} catch(AccountRegistrationException | org.springframework.dao.DuplicateKeyException concurrentIdentityChange) {throw rejected();}
	}
	private static OAuth2AuthenticationException rejected() {
		return new OAuth2AuthenticationException(new OAuth2Error("invalid_identity"), "Google sign-in could not be completed");
	}
}
