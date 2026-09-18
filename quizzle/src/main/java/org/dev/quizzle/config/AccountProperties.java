package org.dev.quizzle.config;

import java.nio.file.Path;
import java.util.Objects;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("quiz.account")
public record AccountProperties(String allowedDomain, Path file, int minPasswordLength) {

	public AccountProperties {
		Objects.requireNonNull(file, "quiz.account.file must be configured");
		if (allowedDomain == null || allowedDomain.isBlank()) {
			throw new IllegalStateException("ALLOWED_EMAIL_DOMAIN must be set in .env or the process environment");
		}
		allowedDomain = allowedDomain.strip().toLowerCase(java.util.Locale.ROOT);
		if (minPasswordLength <= 0) {
			minPasswordLength = 8;
		}
	}
}
