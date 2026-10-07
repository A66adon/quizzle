package org.dev.quizzle.security;

import static org.junit.jupiter.api.Assertions.*;
import java.util.UUID;
import java.util.List;
import java.time.Instant;
import java.util.Map;
import org.dev.quizzle.account.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.oauth2.core.oidc.OidcIdToken;
import org.springframework.security.oauth2.core.oidc.user.DefaultOidcUser;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;

@SpringBootTest(properties={"quiz.snapshot.interval-ms=3600000"})
class GoogleIdentityIntegrationTests extends org.dev.quizzle.persistence.PostgresIntegrationSupport {
	@Autowired GoogleIdentityService google;
	@Autowired AccountService accounts;
	@Autowired AccountStore store;
	@Autowired JdbcTemplate jdbc;
	private DefaultOidcUser user(String sub,String email) {
		return new DefaultOidcUser(List.of(),new OidcIdToken("test-only",Instant.now(),Instant.now().plusSeconds(60),
				Map.of("sub",sub,"email",email,"email_verified",true,"iss","https://accounts.google.com","aud","client")));
	}
	@Test void linksOnlyExactEmailAndActivatesPendingThenReusesImmutableSubject() {
		String email=UUID.randomUUID()+"@example.test";String sub=UUID.randomUUID().toString();
		Account pending=accounts.register(email,"original-password");
		var linked=google.resolve(user(sub,email.toUpperCase(java.util.Locale.ROOT)));
		assertEquals(pending.id(),linked.accountId());assertTrue(store.findById(pending.id()).orElseThrow().verified());
		assertEquals(linked.accountId(),google.resolve(user(sub,email)).accountId());
		assertThrows(OAuth2AuthenticationException.class,()->google.resolve(user(sub,"different@example.test")));
		assertEquals(1,jdbc.queryForObject("SELECT count(*) FROM external_identities WHERE account_id=?",Integer.class,UUID.fromString(pending.id())));
	}
	@Test void disabledIdentityNeverAuthenticatesAndOauthOnlyCannotReset() {
		String email=UUID.randomUUID()+"@example.test";String sub=UUID.randomUUID().toString();
		var created=google.resolve(user(sub,email));assertNull(store.findById(created.accountId()).orElseThrow().passwordHash());
		jdbc.update("UPDATE accounts SET status='DISABLED' WHERE id=?",UUID.fromString(created.accountId()));
		assertThrows(OAuth2AuthenticationException.class,()->google.resolve(user(sub,email)));
	}
	@Test void concurrentLinkingMaintainsProviderSubjectUniqueness() throws Exception {
		String email=UUID.randomUUID()+"@example.test";String sub=UUID.randomUUID().toString();
		var pool=java.util.concurrent.Executors.newFixedThreadPool(2);
		try {
			var gate=new java.util.concurrent.CountDownLatch(1);
			java.util.concurrent.Callable<AccountPrincipal> login=()->{gate.await();return google.resolve(user(sub,email));};
			var a=pool.submit(login);var b=pool.submit(login);gate.countDown();
			assertEquals(a.get(10,java.util.concurrent.TimeUnit.SECONDS).accountId(),b.get(10,java.util.concurrent.TimeUnit.SECONDS).accountId());
			assertEquals(1,jdbc.queryForObject("SELECT count(*) FROM external_identities WHERE provider_subject=?",Integer.class,sub));
		}finally{pool.shutdownNow();}
	}
}
