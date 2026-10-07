package org.dev.quizzle.security;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import java.time.Instant;
import java.util.Map;
import java.util.List;
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
	@Test void frameworkValidatorRejectsWrongIssuerAndAudience() {
		var registration=GoogleLogin.registrations(new AuthProperties("",1440,30,"client","secret","from@example.test"))
				.findByRegistrationId("google");
		var validator=new org.springframework.security.oauth2.client.oidc.authentication.OidcIdTokenValidator(registration);
		java.util.function.BiFunction<String,String,org.springframework.security.oauth2.jwt.Jwt> token=(issuer,audience)->
				org.springframework.security.oauth2.jwt.Jwt.withTokenValue("test-only").header("alg","RS256")
						.issuer(issuer).subject("immutable").audience(List.of(audience))
						.issuedAt(Instant.now()).expiresAt(Instant.now().plusSeconds(60)).build();
		assertFalse(validator.validate(token.apply("https://accounts.google.com","client")).hasErrors());
		assertTrue(validator.validate(token.apply("https://evil.test","client")).hasErrors());
		assertTrue(validator.validate(token.apply("https://accounts.google.com","other-client")).hasErrors());
	}
	@Test void recentReauthenticationRejectsAccountSwitchOldOrMissingProviderAuthenticationTime() {
		Instant now=Instant.now();
		var expected=new GoogleLogin.Reauth("same-account","/settings",now.getEpochSecond());
		java.util.function.Function<Instant,OidcIdToken> token=time->new OidcIdToken("test-only",now,now.plusSeconds(60),
				Map.of("sub","immutable","auth_time",time));
		assertTrue(GoogleLogin.validReauthentication(expected,new AccountPrincipal("same-account",0,now.getEpochSecond()),token.apply(now),now));
		assertFalse(GoogleLogin.validReauthentication(expected,new AccountPrincipal("other-account",0,now.getEpochSecond()),token.apply(now),now));
		assertFalse(GoogleLogin.validReauthentication(expected,new AccountPrincipal("same-account",0,now.getEpochSecond()),token.apply(now.minusSeconds(61)),now));
		assertFalse(GoogleLogin.validReauthentication(expected,new AccountPrincipal("same-account",0,now.getEpochSecond()),user(true,"user@example.test").getIdToken(),now));
	}
	@Test void googleActivationDiscardsAnUnverifiedPasswordButKeepsVerifiedLocalCredentials() {
		for(Account.Status status:List.of(Account.Status.PENDING_VERIFICATION,Account.Status.ACTIVE)) {
			var store=mock(AccountStore.class);
			var account=new Account(java.util.UUID.randomUUID().toString(),"user@example.test","existing-hash",
					status==Account.Status.ACTIVE,List.of(),1,false,5000,status);
			when(store.findByEmail(account.email())).thenReturn(java.util.Optional.of(account));
			when(store.lock(account.id())).thenReturn(account);
			var google=new GoogleIdentityService(store,mock(AccountService.class),
					mock(org.springframework.jdbc.core.JdbcTemplate.class),mock(GameSessionProperties.class),
					mock(org.springframework.transaction.PlatformTransactionManager.class));
			google.resolve(user(true,account.email()));
			if(status==Account.Status.PENDING_VERIFICATION) {
				var order=inOrder(store);
				order.verify(store).updatePassword(account.id(),null);
				order.verify(store).activatePending(account.id());
				verify(store).invalidateTokens(account.id());
			} else {
				verify(store,never()).updatePassword(anyString(),any());
				verify(store,never()).invalidateTokens(anyString());
			}
		}
	}
}
