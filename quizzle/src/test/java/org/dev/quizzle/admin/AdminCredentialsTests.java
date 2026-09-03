package org.dev.quizzle.admin;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

import org.dev.quizzle.config.AdminProperties;

class AdminCredentialsTests {

	@Test
	void failsClosedWhenThePasswordIsMissing() {
		assertThrows(IllegalStateException.class, () -> new AdminCredentials(new AdminProperties(null)));
		assertThrows(IllegalStateException.class, () -> new AdminCredentials(new AdminProperties("  ")));
	}

	@Test
	void comparesTheServerOnlyPassword() {
		AdminCredentials credentials = new AdminCredentials(new AdminProperties("correct horse battery staple"));

		assertTrue(credentials.matches("correct horse battery staple"));
		assertFalse(credentials.matches("correct horse battery staplE"));
		assertFalse(credentials.matches(null));
	}
}
