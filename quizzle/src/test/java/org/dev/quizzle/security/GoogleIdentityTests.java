package org.dev.quizzle.security;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import java.time.Instant;
import java.util.Map;
import org.dev.quizzle.account.*;
import org.dev.quizzle.config.*;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.core.oidc.OidcIdToken;
import org.springframework.security.oauth2.core.oidc.user.DefaultOidcUser;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;

class GoogleIdentityTests {
	@Test void enablesOnlyCompleteNonblankConfigurationWithoutDiscoveryNetworkCalls() {
		assertFalse(new AuthProperties("",1440,30," ","secret","from@example.test").googleEnabled());
		assertFalse(new AuthProperties("",1440,30,"id","","from@example.test").googleEnabled());
		var properties=new AuthProperties("",1440,30,"id","secret","from@example.test");
		assertTrue(properties.googleEnabled());
		var google=GoogleLogin.registrations(properties).findByRegistrationId("google");
		assertEquals("https://accounts.google.com",google.getProviderDetails().getIssuerUri());
		assertTrue(google.getScopes().contains("openid"));
	}
	@Test void rejectsUnverifiedMissingSubjectAndDomainFailuresBeforePersistence() {
		var jdbc=mock(org.springframework.jdbc.core.JdbcTemplate.class);
		var service=mock(AccountService.class);
		var identities=new GoogleIdentityService(mock(AccountStore.class),service,jdbc,mock(GameSessionProperties.class),
				mock(org.springframework.transaction.PlatformTransactionManager.class));
		assertThrows(OAuth2AuthenticationException.class,()->identities.resolve(user(false,"user@example.test")));
		doThrow(new AccountRegistrationException("domain")).when(service).validateEmail("user@evil.test");
		assertThrows(OAuth2AuthenticationException.class,()->identities.resolve(user(true,"user@evil.test")));
		verifyNoInteractions(jdbc);
	}
	static DefaultOidcUser user(boolean verified,String email) {
		return new DefaultOidcUser(java.util.List.of(),new OidcIdToken("not-a-real-token",Instant.now(),Instant.now().plusSeconds(60),
				Map.of("sub","immutable-sub","email",email,"email_verified",verified,"iss","https://accounts.google.com","aud","id")));
	}
}
