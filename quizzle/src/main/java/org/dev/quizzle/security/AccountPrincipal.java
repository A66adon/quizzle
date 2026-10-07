package org.dev.quizzle.security;

import java.io.Serializable;

public record AccountPrincipal(String accountId, long credentialVersion, long providerAuthenticatedAt)
		implements Serializable {
}
