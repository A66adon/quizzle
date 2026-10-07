package org.dev.quizzle.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("quiz.auth")
public record AuthProperties(String allowedEmailDomain, int verificationTtlMinutes, int resetTtlMinutes,
		String googleClientId, String googleClientSecret, String mailFrom) {
	public AuthProperties {
		allowedEmailDomain = allowedEmailDomain == null ? "" : allowedEmailDomain.strip().toLowerCase(java.util.Locale.ROOT);
		if (!allowedEmailDomain.isEmpty() && !allowedEmailDomain.matches("[a-z0-9.-]+\\.[a-z]{2,}"))
			throw new IllegalArgumentException("ALLOWED_EMAIL_DOMAIN must be an exact domain");
		if (verificationTtlMinutes < 1 || verificationTtlMinutes > 10080
				|| resetTtlMinutes < 1 || resetTtlMinutes > 1440)
			throw new IllegalArgumentException("Authentication token TTL is out of bounds");
	}
	public boolean googleEnabled() {
		return googleClientId != null && !googleClientId.isBlank()
				&& googleClientSecret != null && !googleClientSecret.isBlank();
	}
}
