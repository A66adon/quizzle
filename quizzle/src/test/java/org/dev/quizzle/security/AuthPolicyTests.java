package org.dev.quizzle.security;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import org.dev.quizzle.account.*;
import org.dev.quizzle.config.*;
import org.junit.jupiter.api.Test;

class AuthPolicyTests {
	@Test void enforcesExactDomainAndBcryptByteBoundary() {
		var service = new AccountService(mock(AccountStore.class), new AccountProperties(8),
				new AuthProperties("example.test",1440,30,"","","from@example.test"), mock(GameSessionProperties.class),
				mock(org.springframework.transaction.PlatformTransactionManager.class));
		assertDoesNotThrow(() -> service.validateEmail(" User@EXAMPLE.TEST "));
		for (String email : new String[]{"user@sub.example.test","user@badexample.test","user@example.test.evil","not-an-email"})
			assertThrows(AccountRegistrationException.class, () -> service.validateEmail(email));
		assertDoesNotThrow(() -> service.validatePassword("é".repeat(36)));
		assertThrows(AccountRegistrationException.class, () -> service.validatePassword("é".repeat(37)));
	}
	@Test void rateLimitsAndBoundsMemory() {
		var limiter = new AuthRateLimiter();
		for (int i=0;i<10;i++) assertTrue(limiter.allow("login","same","a@example.test"));
		assertFalse(limiter.allow("login","same","a@example.test"));
		for(int i=0;i<20000;i++) limiter.allow("forgot","ip"+i,"email"+i);
		assertTrue(limiter.size() <= 10000);
	}
	@Test void permitsOnlyNarrowReturnPaths() {
		for(String value : new String[]{"https://evil.test","//evil.test","/admin/../bad","/editor?x=%0d%0aLocation","/admin\\evil"})
			assertEquals("/admin", SecurityConfiguration.safeReturnTo(value));
		assertEquals("/editor?id=abc", SecurityConfiguration.safeReturnTo("/editor?id=abc"));
	}
	@Test void hashesTokensWithoutStoringRawValues() {
		assertEquals(64, AccountTokens.digest("private").length());
		assertNotEquals("private", AccountTokens.digest("private"));
		assertEquals(AccountTokens.digest("private"), AccountTokens.digest("private"));
	}
}
