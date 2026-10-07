package org.dev.quizzle.account;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import java.util.List;
import java.util.UUID;
import org.dev.quizzle.config.*;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

class AccountLifecycleTests {
	private final AccountStore store=mock(AccountStore.class);
	private final AccountService service=new AccountService(store,new AccountProperties(8),
			new AuthProperties("",1440,30,"","","from@example.test"),mock(GameSessionProperties.class),
			mock(org.springframework.transaction.PlatformTransactionManager.class));
	private Account account(String hash) {
		var account=new Account(UUID.randomUUID().toString(),"user@example.test",hash,true,List.of(),1,false,5000);
		when(store.lock(account.id())).thenReturn(account);return account;
	}
	@Test void localDeleteRequiresCurrentPasswordAndOnlyTouchesOwnId() {
		var account=account(new BCryptPasswordEncoder().encode("current-password"));var close=mock(Runnable.class);
		assertThrows(AccountRegistrationException.class,()->service.deleteAccount(account.id(),null,0,close));
		verify(close,never()).run();verify(store,never()).delete(anyString());
		service.deleteAccount(account.id(),"current-password",0,close);
		verify(close).run();verify(store).delete(account.id());
	}
	@Test void oauthDeleteRequiresRecentProviderAuthentication() {
		var account=account(null);var close=mock(Runnable.class);
		assertThrows(AccountRegistrationException.class,()->service.deleteAccount(account.id(),null,0,close));
		assertThrows(AccountRegistrationException.class,()->service.deleteAccount(account.id(),null,
				java.time.Instant.now().getEpochSecond()-301,close));
		service.deleteAccount(account.id(),null,java.time.Instant.now().getEpochSecond(),close);
		verify(store).delete(account.id());
	}
	@Test void changingLocalPasswordRevokesCredentialsAndOutstandingTokensAtomically() {
		var account=account(new BCryptPasswordEncoder().encode("current-password"));
		when(store.credentialVersion(account.id())).thenReturn(9L);
		assertThrows(AccountRegistrationException.class,()->service.changePassword(account.id(),"wrong","replacement-password"));
		assertEquals(9L,service.changePassword(account.id(),"current-password","replacement-password"));
		verify(store).revokeCredentials(account.id());verify(store).invalidateTokens(account.id());
	}
	@Test void validatesPersistedGameDefaultsBeforeMutating() {
		var account=account(null);
		assertThrows(AccountRegistrationException.class,()->service.updateGameSettings(account.id(),true,-1));
		assertThrows(AccountRegistrationException.class,()->service.updateGameSettings(account.id(),true,120001));
		service.updateGameSettings(account.id(),true,120000);
		verify(store).update(account.withGameSettings(true,120000));
	}
	@Test void failedMailerConfigurationDoesNotPretendRegistrationCanWork() {
		var providers=new org.springframework.beans.factory.support.StaticListableBeanFactory()
				.getBeanProvider(org.springframework.mail.javamail.JavaMailSender.class);
		assertThrows(IllegalArgumentException.class,()->new AccountMailer(providers,
				new AuthProperties("",1440,30,"","",""),mock(GameSessionProperties.class),""));
	}
}
