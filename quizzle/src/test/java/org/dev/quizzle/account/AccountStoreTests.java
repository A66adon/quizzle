package org.dev.quizzle.account;

import static org.junit.jupiter.api.Assertions.*;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class AccountStoreTests {
	@Test
	void settingsWritesNeverContainCredentialsStatusOrIdentityFromAnAccountSnapshot() {
		var jdbc=org.mockito.Mockito.mock(org.springframework.jdbc.core.JdbcTemplate.class);
		org.mockito.Mockito.when(jdbc.update(org.mockito.ArgumentMatchers.anyString(),
				org.mockito.ArgumentMatchers.any(Object[].class))).thenReturn(1);
		var store=new AccountStore(jdbc);
		var stale=new Account(UUID.randomUUID().toString(),"original@example.test","old-hash",true,List.of(),1,false,5000);
		store.updateGameSettings(stale.id(),true,1234);
		var sql=org.mockito.ArgumentCaptor.forClass(String.class);
		org.mockito.Mockito.verify(jdbc).update(sql.capture(),org.mockito.ArgumentMatchers.any(Object[].class));
		assertFalse(sql.getValue().contains("password_hash"));
		assertFalse(sql.getValue().contains("status"));
		assertFalse(sql.getValue().contains("email"));
		assertFalse(sql.getValue().contains("credential_version"));
	}

	@Test
	void passwordReplacementChangesOnlyPasswordAndVersionInOneWrite() {
		var jdbc=org.mockito.Mockito.mock(org.springframework.jdbc.core.JdbcTemplate.class);
		String id=UUID.randomUUID().toString();
		org.mockito.Mockito.when(jdbc.queryForObject(org.mockito.ArgumentMatchers.anyString(),
				org.mockito.ArgumentMatchers.eq(Long.class),org.mockito.ArgumentMatchers.eq("new-hash"),
				org.mockito.ArgumentMatchers.eq(UUID.fromString(id)))).thenReturn(9L);
		assertEquals(9,new AccountStore(jdbc).updatePassword(id,"new-hash"));
		var sql=org.mockito.ArgumentCaptor.forClass(String.class);
		org.mockito.Mockito.verify(jdbc).queryForObject(sql.capture(),org.mockito.ArgumentMatchers.eq(Long.class),
				org.mockito.ArgumentMatchers.eq("new-hash"),org.mockito.ArgumentMatchers.eq(UUID.fromString(id)));
		assertTrue(sql.getValue().contains("credential_version=credential_version+1"));
		assertFalse(sql.getValue().contains("status"));
		assertFalse(sql.getValue().contains("allow_late_join"));
		assertFalse(sql.getValue().contains("email"));
	}

	@Test
	void normalizesWhitespaceAndUsesRootLocale() {
		Locale original = Locale.getDefault();
		try {
			Locale.setDefault(Locale.forLanguageTag("tr"));
			assertEquals("identity@example.com", AccountStore.normalizeEmail(" \u2003IDENTITY@Example.COM\u2003 "));
			assertEquals("", AccountStore.normalizeEmail(null));
		} finally {
			Locale.setDefault(original);
		}
	}

	@Test
	void supportsOauthOnlyAndDisabledAccountsWithoutLosingStatusOnUpdate() {
		Account oauth = new Account(UUID.randomUUID().toString(), "Original@Example.com", null,
				false, List.of(), 1, false, 5000, Account.Status.DISABLED);
		assertFalse(oauth.verified());
		assertNull(oauth.passwordHash());
		assertEquals(Account.Status.DISABLED, oauth.withGameSettings(true, 100).status());
		assertEquals(Account.Status.DISABLED, oauth.withPasswordHash("hash").status());
		assertEquals("Original@Example.com", oauth.email());
	}
}
