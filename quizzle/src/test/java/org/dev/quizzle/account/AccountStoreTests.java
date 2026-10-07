package org.dev.quizzle.account;

import static org.junit.jupiter.api.Assertions.*;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class AccountStoreTests {
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
