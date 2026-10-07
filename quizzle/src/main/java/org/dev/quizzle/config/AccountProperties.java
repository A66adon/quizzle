package org.dev.quizzle.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("quiz.account")
public record AccountProperties(int minPasswordLength) {

	public AccountProperties {
		if (minPasswordLength < 8 || minPasswordLength > 72)
			throw new IllegalArgumentException("ACCOUNT_MIN_PASSWORD_LENGTH must be between 8 and 72");
	}
}
