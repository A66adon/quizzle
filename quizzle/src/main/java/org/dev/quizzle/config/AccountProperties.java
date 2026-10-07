package org.dev.quizzle.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("quiz.account")
public record AccountProperties(int minPasswordLength) {

	public AccountProperties {
		if (minPasswordLength <= 0) {
			minPasswordLength = 8;
		}
	}
}
